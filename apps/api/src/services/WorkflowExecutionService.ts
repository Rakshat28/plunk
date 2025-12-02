import type {
  Contact,
  Prisma,
  WorkflowExecution,
  WorkflowStep,
  WorkflowStepExecution,
  Template,
  Workflow,
} from '@plunk/db';
import {StepExecutionStatus, WorkflowExecutionStatus} from '@plunk/db';
import {WorkflowStepConfigSchemas} from '@plunk/shared';

import {prisma} from '../database/prisma.js';
import {HttpException} from '../exceptions/index.js';

import {EmailService} from './EmailService.js';
import {QueueService} from './QueueService.js';

// Type aliases for workflow execution context
type StepConfig = Prisma.JsonValue;
type StepResult = Record<string, unknown>;
type WorkflowExecutionWithRelations = WorkflowExecution & {contact: Contact; workflow: Workflow};
type WorkflowStepWithTemplate = WorkflowStep & {template?: Template | null};
type WorkflowStepWithTransitions = WorkflowStep & {
  outgoingTransitions?: Array<{
    id: string;
    condition: Prisma.JsonValue;
    priority: number;
    toStep: WorkflowStep;
  }>;
};

/**
 * Core Workflow Execution Engine
 * Handles the execution of workflows step by step
 */
export class WorkflowExecutionService {
  /**
   * Process a single step execution
   * This is the main entry point for executing workflow steps
   */
  public static async processStepExecution(executionId: string, stepId: string): Promise<void> {
    const execution = await prisma.workflowExecution.findUnique({
      where: {id: executionId},
      include: {
        workflow: {
          include: {
            steps: {
              include: {
                template: true,
                outgoingTransitions: {
                  orderBy: {priority: 'asc'},
                  include: {toStep: true},
                },
              },
            },
            project: {
              select: {disabled: true, id: true, name: true},
            },
          },
        },
        contact: true,
      },
    });

    if (!execution) {
      throw new HttpException(404, 'Workflow execution not found');
    }

    if (execution.status !== WorkflowExecutionStatus.RUNNING) {
      return; // Already completed or cancelled
    }

    // Check if project is disabled
    if (execution.workflow.project.disabled) {
      console.warn(
        `[WORKFLOW] Project ${execution.workflow.projectId} (${execution.workflow.project.name}) is disabled, cancelling workflow execution ${executionId}`,
      );
      await prisma.workflowExecution.update({
        where: {id: executionId},
        data: {
          status: WorkflowExecutionStatus.CANCELLED,
          completedAt: new Date(),
          exitReason: 'Project disabled',
        },
      });
      return;
    }

    // Check if workflow is disabled
    // Note: We allow running executions to complete even if workflow is disabled
    // This prevents disruption to contacts who are already in the workflow
    // Only NEW executions are prevented when workflow is disabled (see startExecution in WorkflowService)
    if (!execution.workflow.enabled) {
      console.info(
        `[WORKFLOW] Workflow ${execution.workflow.id} (${execution.workflow.name}) is disabled, but allowing execution ${executionId} to continue`,
      );
      // Allow execution to continue - no action needed
    }

    const step = execution.workflow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new HttpException(404, 'Step not found in workflow');
    }

    // Create or get step execution record
    let stepExecution = await prisma.workflowStepExecution.findFirst({
      where: {
        executionId,
        stepId,
        status: {in: [StepExecutionStatus.PENDING, StepExecutionStatus.RUNNING]},
      },
    });

    if (!stepExecution) {
      stepExecution = await prisma.workflowStepExecution.create({
        data: {
          executionId,
          stepId,
          status: StepExecutionStatus.RUNNING,
          startedAt: new Date(),
        },
      });
    } else {
      stepExecution = await prisma.workflowStepExecution.update({
        where: {id: stepExecution.id},
        data: {
          status: StepExecutionStatus.RUNNING,
          startedAt: stepExecution.startedAt || new Date(),
        },
      });
    }

    try {
      // Execute the step based on its type
      const result = await this.executeStep(step, execution, stepExecution);

      // Check if step is in a waiting state (WAIT_FOR_EVENT steps only)
      // DELAY steps now mark themselves as COMPLETED and queue the next step
      const updatedStepExecution = await prisma.workflowStepExecution.findUnique({
        where: {id: stepExecution.id},
      });

      if (updatedStepExecution?.status === StepExecutionStatus.WAITING) {
        // Don't mark as completed or process next steps - the step will be resumed later
        return;
      }

      // Check if the workflow execution is now in WAITING state (DELAY steps do this)
      // If so, the step has already been handled and queued - don't process next steps
      const updatedExecution = await prisma.workflowExecution.findUnique({
        where: {id: execution.id},
      });

      if (updatedExecution?.status === WorkflowExecutionStatus.WAITING) {
        // Workflow is waiting (DELAY step has queued the next step) - don't process next steps now
        return;
      }

      // Mark step as completed (for normal steps that complete immediately)
      await prisma.workflowStepExecution.update({
        where: {id: stepExecution.id},
        data: {
          status: StepExecutionStatus.COMPLETED,
          completedAt: new Date(),
          output: result ? (result as Prisma.InputJsonValue) : undefined,
        },
      });

      // Determine next step(s) based on transitions and conditions
      await this.processNextSteps(execution, step, result);
    } catch (error) {
      console.error(`[WORKFLOW] Error executing step ${step.id}:`, error);
      // Mark step as failed
      await prisma.workflowStepExecution.update({
        where: {id: stepExecution.id},
        data: {
          status: StepExecutionStatus.FAILED,
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Mark workflow execution as failed
      await prisma.workflowExecution.update({
        where: {id: executionId},
        data: {
          status: WorkflowExecutionStatus.FAILED,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Process timeout for a WAIT_FOR_EVENT step
   * Called by BullMQ worker when timeout job executes
   */
  public static async processTimeout(executionId: string, stepId: string, stepExecutionId: string): Promise<void> {
    // Fetch the step execution
    const stepExecution = await prisma.workflowStepExecution.findUnique({
      where: {id: stepExecutionId},
      include: {
        execution: true,
        step: {
          include: {
            outgoingTransitions: {
              include: {toStep: true},
              orderBy: {priority: 'asc'},
            },
          },
        },
      },
    });

    if (!stepExecution) {
      return;
    }

    // Only process if step is still waiting (event might have arrived before timeout)
    if (stepExecution.status !== StepExecutionStatus.WAITING) {
      return;
    }

    // Mark step as completed with timeout
    await prisma.workflowStepExecution.update({
      where: {id: stepExecution.id},
      data: {
        status: StepExecutionStatus.COMPLETED,
        completedAt: new Date(),
        output: {
          timedOut: true,
          eventName:
            stepExecution.step.config &&
            typeof stepExecution.step.config === 'object' &&
            'eventName' in stepExecution.step.config
              ? stepExecution.step.config.eventName
              : undefined,
        },
      },
    });

    // Continue workflow - find transitions with timeout/fallback logic
    const transitions = stepExecution.step.outgoingTransitions || [];
    const fallbackTransition = transitions.find(
      t =>
        (t.condition &&
          typeof t.condition === 'object' &&
          'branch' in t.condition &&
          t.condition.branch === 'timeout') ||
        (t.condition && typeof t.condition === 'object' && 'fallback' in t.condition && t.condition.fallback === true),
    );

    if (fallbackTransition) {
      // Follow timeout branch
      await prisma.workflowExecution.update({
        where: {id: stepExecution.executionId},
        data: {
          status: WorkflowExecutionStatus.RUNNING,
          currentStepId: fallbackTransition.toStep.id,
        },
      });

      await this.processStepExecution(stepExecution.executionId, fallbackTransition.toStep.id);
    } else if (transitions.length > 0) {
      // No timeout branch, follow first transition
      const firstTransition = transitions[0];
      if (firstTransition?.toStep) {
        const nextStep = firstTransition.toStep;
        await prisma.workflowExecution.update({
          where: {id: stepExecution.executionId},
          data: {
            status: WorkflowExecutionStatus.RUNNING,
            currentStepId: nextStep.id,
          },
        });

        await this.processStepExecution(stepExecution.executionId, nextStep.id);
      }
    } else {
      // No transitions, complete workflow
      await prisma.workflowExecution.update({
        where: {id: stepExecution.executionId},
        data: {
          status: WorkflowExecutionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }
  }

  /**
   * Handle event occurrence and resume waiting workflows
   */
  public static async handleEvent(
    projectId: string,
    eventName: string,
    contactId?: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    // Find workflows waiting for this event
    const waitingExecutions = await prisma.workflowStepExecution.findMany({
      where: {
        status: StepExecutionStatus.WAITING,
        execution: {
          workflow: {projectId},
          ...(contactId ? {contactId} : {}),
        },
        step: {
          type: 'WAIT_FOR_EVENT',
        },
      },
      include: {
        execution: {
          include: {
            contact: true,
            workflow: true,
          },
        },
        step: {
          include: {
            outgoingTransitions: {
              orderBy: {priority: 'asc'},
              include: {toStep: true},
            },
          },
        },
      },
    });

    for (const stepExecution of waitingExecutions) {
      const config = stepExecution.step.config;

      if (config && typeof config === 'object' && 'eventName' in config && config.eventName === eventName) {
        // Event matches, resume execution
        await prisma.workflowStepExecution.update({
          where: {id: stepExecution.id},
          data: {
            status: StepExecutionStatus.COMPLETED,
            completedAt: new Date(),
            output: {
              eventName,
              eventData: data ? (data as Prisma.InputJsonValue) : undefined,
              receivedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        // Cancel any pending timeout job
        await QueueService.cancelWorkflowTimeout(stepExecution.id);

        // Continue workflow
        await this.processNextSteps(stepExecution.execution, stepExecution.step, {eventReceived: true});
      }
    }
  }

  /**
   * Execute a specific step based on its type
   */
  private static async executeStep(
    step: WorkflowStepWithTemplate,
    execution: WorkflowExecutionWithRelations,
    stepExecution: WorkflowStepExecution,
  ): Promise<StepResult> {
    const config = step.config;

    switch (step.type) {
      case 'TRIGGER':
        return await this.executeTrigger(step, execution, stepExecution, config);

      case 'SEND_EMAIL':
        return await this.executeSendEmail(step, execution, stepExecution, config);

      case 'DELAY':
        return await this.executeDelay(step, execution, stepExecution, config);

      case 'WAIT_FOR_EVENT':
        return await this.executeWaitForEvent(step, execution, stepExecution, config);

      case 'CONDITION':
        return await this.executeCondition(step, execution, stepExecution, config);

      case 'EXIT':
        return await this.executeExit(step, execution, stepExecution, config);

      case 'WEBHOOK':
        return await this.executeWebhook(step, execution, stepExecution, config);

      case 'UPDATE_CONTACT':
        return await this.executeUpdateContact(step, execution, stepExecution, config);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * TRIGGER step - Entry point of workflow
   */
  private static async executeTrigger(
    _step: WorkflowStep,
    _execution: WorkflowExecutionWithRelations,
    _stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    // Trigger step is just the entry point, it doesn't do anything
    // But we can log or track that the workflow started
    const eventName = config && typeof config === 'object' && 'eventName' in config ? config.eventName : 'manual';
    return {
      triggered: true,
      eventName,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * SEND_EMAIL step - Send an email to the contact
   */
  private static async executeSendEmail(
    step: WorkflowStepWithTemplate,
    execution: WorkflowExecutionWithRelations,
    stepExecution: WorkflowStepExecution,
    _config: StepConfig,
  ): Promise<StepResult> {
    if (!step.template) {
      throw new Error('No template configured for SEND_EMAIL step');
    }

    // Get contact data for variable substitution
    const contact = execution.contact;
    const contactData =
      contact.data && typeof contact.data === 'object' && !Array.isArray(contact.data)
        ? (contact.data as Record<string, unknown>)
        : {};

    // Render template with contact data
    const executionContext =
      execution.context && typeof execution.context === 'object' && !Array.isArray(execution.context)
        ? (execution.context as Record<string, unknown>)
        : {};

    const variables = {
      email: contact.email,
      ...contactData,
      ...executionContext,
    };

    const renderedSubject = this.renderTemplate(step.template.subject, variables);
    const renderedBody = this.renderTemplate(step.template.body, variables);

    // Send email via EmailService
    const email = await EmailService.sendWorkflowEmail({
      projectId: execution.workflow.projectId,
      contactId: contact.id,
      workflowExecutionId: execution.id,
      workflowStepExecutionId: stepExecution.id, // Use stepExecution.id, not step.id
      templateId: step.template.id,
      subject: renderedSubject,
      body: renderedBody,
      from: step.template.from,
      fromName: step.template.fromName || undefined,
      replyTo: step.template.replyTo || undefined,
    });

    return {
      emailId: email.id,
      sentAt: email.createdAt,
    };
  }

  /**
   * DELAY step - Wait for a specified duration
   */
  private static async executeDelay(
    _step: WorkflowStep,
    _execution: WorkflowExecutionWithRelations,
    stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const {amount, unit} = WorkflowStepConfigSchemas.delay.parse(config);

    // Calculate delay in milliseconds
    let delayMs = 0;

    switch (unit) {
      case 'minutes':
        delayMs = amount * 60 * 1000;
        break;
      case 'hours':
        delayMs = amount * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = amount * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown delay unit: ${unit}`);
    }

    const resumeAt = new Date(Date.now() + delayMs);

    // Mark step as completed immediately (BullMQ handles the delay)
    await prisma.workflowStepExecution.update({
      where: {id: stepExecution.id},
      data: {
        status: StepExecutionStatus.COMPLETED,
        completedAt: new Date(),
        output: {
          delayAmount: amount,
          delayUnit: unit,
          resumeAt: resumeAt.toISOString(),
        },
      },
    });

    // Update workflow execution to waiting
    await prisma.workflowExecution.update({
      where: {id: _execution.id},
      data: {
        status: WorkflowExecutionStatus.WAITING,
      },
    });

    // Find next steps to queue
    const transitions = await prisma.workflowTransition.findMany({
      where: {fromStepId: _step.id},
      include: {toStep: true},
      orderBy: {priority: 'asc'},
    });

    if (transitions.length > 0) {
      const firstTransition = transitions[0];
      if (firstTransition?.toStep) {
        const nextStep = firstTransition.toStep;
        await QueueService.queueWorkflowStep(_execution.id, nextStep.id, Math.max(0, delayMs));
      }
    }

    return {
      delayAmount: amount,
      delayUnit: unit,
      resumeAt: resumeAt.toISOString(),
      queued: true,
    };
  }

  /**
   * WAIT_FOR_EVENT step - Wait for a specific event to occur
   */
  private static async executeWaitForEvent(
    _step: WorkflowStep,
    _execution: WorkflowExecutionWithRelations,
    stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const {eventName, timeout} = WorkflowStepConfigSchemas.waitForEvent.parse(config);

    // Calculate timeout
    const timeoutDate = timeout ? new Date(Date.now() + timeout * 1000) : null;

    // Update step execution to waiting
    await prisma.workflowStepExecution.update({
      where: {id: stepExecution.id},
      data: {
        status: StepExecutionStatus.WAITING,
        executeAfter: timeoutDate,
      },
    });

    // Update workflow execution to waiting
    await prisma.workflowExecution.update({
      where: {id: _execution.id},
      data: {
        status: WorkflowExecutionStatus.WAITING,
      },
    });

    // Queue timeout handler if timeout is specified
    if (timeout && timeout > 0) {
      const timeoutMs = timeout * 1000;
      await QueueService.queueWorkflowTimeout(_execution.id, _step.id, stepExecution.id, timeoutMs);
    }

    return {
      eventName,
      timeout: timeout || null,
      waitingUntil: timeoutDate?.toISOString() || 'indefinite',
    };
  }

  /**
   * CONDITION step - Evaluate a condition and determine branching
   */
  private static async executeCondition(
    _step: WorkflowStep,
    execution: WorkflowExecutionWithRelations,
    _stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const {field, operator, value} = WorkflowStepConfigSchemas.condition.parse(config);

    // Get the value to evaluate
    const contact = execution.contact;
    const contactData =
      contact.data && typeof contact.data === 'object' && !Array.isArray(contact.data)
        ? (contact.data as Record<string, unknown>)
        : {};
    const context = execution.context || {};

    // Resolve the field value (support dot notation)
    // Structure allows access to:
    // - contact.email, contact.subscribed
    // - data.firstName, data.lastName, etc.
    // - workflow.* (execution context - alias for event data)
    // - event.* (event data that triggered the workflow)
    const actualValue = this.resolveField(field, {
      contact: {
        email: contact.email,
        subscribed: contact.subscribed,
      },
      data: contactData,
      workflow: context,
      event: context, // Alias for easier access to event data
    });

    // Evaluate the condition
    const result = this.evaluateCondition(actualValue, operator, value);

    return {
      field,
      operator,
      expectedValue: value,
      actualValue,
      result,
      branch: result ? 'yes' : 'no',
    };
  }

  /**
   * EXIT step - Terminate the workflow
   */
  private static async executeExit(
    _step: WorkflowStep,
    execution: WorkflowExecutionWithRelations,
    _stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const reason =
      config &&
      typeof config === 'object' &&
      !Array.isArray(config) &&
      'reason' in config &&
      typeof config.reason === 'string'
        ? config.reason
        : 'exit_step';

    // Mark workflow as exited
    await prisma.workflowExecution.update({
      where: {id: execution.id},
      data: {
        status: WorkflowExecutionStatus.EXITED,
        exitReason: reason || undefined,
        completedAt: new Date(),
      },
    });

    return {
      exited: true,
      reason,
    };
  }

  /**
   * WEBHOOK step - Call an external webhook
   */
  private static async executeWebhook(
    _step: WorkflowStep,
    execution: WorkflowExecutionWithRelations,
    _stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const {url, method, headers, body} = WorkflowStepConfigSchemas.webhook.parse(config);

    // Prepare webhook payload
    const contact = execution.contact;
    const contactData =
      contact.data && typeof contact.data === 'object' && !Array.isArray(contact.data)
        ? (contact.data as Record<string, unknown>)
        : {};
    const context = execution.context || {};

    const payload = body || {
      contact: {
        email: contact.email,
        subscribed: contact.subscribed,
        data: contactData,
      },
      workflow: {
        id: execution.workflow.id,
        name: execution.workflow.name,
      },
      execution: {
        id: execution.id,
        startedAt: execution.startedAt,
      },
      event: context, // Include event data that triggered the workflow
    };

    // Make HTTP request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
    });

    const responseData = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      parsedResponse = responseData;
    }

    return {
      url,
      method,
      statusCode: response.status,
      success: response.ok,
      response: parsedResponse,
    };
  }

  /**
   * UPDATE_CONTACT step - Update contact data
   */
  private static async executeUpdateContact(
    _step: WorkflowStep,
    execution: WorkflowExecutionWithRelations,
    _stepExecution: WorkflowStepExecution,
    config: StepConfig,
  ): Promise<StepResult> {
    const {updates} = WorkflowStepConfigSchemas.updateContact.parse(config);

    const contact = execution.contact;
    const currentData =
      contact.data && typeof contact.data === 'object' && !Array.isArray(contact.data)
        ? (contact.data as Record<string, unknown>)
        : {};

    // Merge updates with current data
    const newData = {
      ...currentData,
      ...updates,
    };

    // Update contact in database
    await prisma.contact.update({
      where: {id: contact.id},
      data: {
        data: newData ? (newData as Prisma.InputJsonValue) : undefined,
      },
    });

    return {
      updated: true,
      updates,
      newData,
    };
  }

  /**
   * Process next steps based on transitions
   */
  private static async processNextSteps(
    execution: WorkflowExecutionWithRelations,
    currentStep: WorkflowStepWithTransitions,
    stepResult: StepResult,
  ): Promise<void> {
    const transitions = currentStep.outgoingTransitions || [];

    if (transitions.length === 0) {
      // No more steps, complete the workflow
      await prisma.workflowExecution.update({
        where: {id: execution.id},
        data: {
          status: WorkflowExecutionStatus.COMPLETED,
          completedAt: new Date(),
          currentStepId: null,
        },
      });
      return;
    }

    // Find the appropriate transition based on conditions
    let nextStep = null;

    for (const transition of transitions) {
      const condition = transition.condition;

      // If no condition, always follow
      if (!condition) {
        nextStep = transition.toStep;
        break;
      }

      // If condition exists, evaluate it
      // For CONDITION steps, check the branch
      if (
        stepResult.branch &&
        typeof condition === 'object' &&
        condition !== null &&
        !Array.isArray(condition) &&
        'branch' in condition &&
        condition.branch === stepResult.branch
      ) {
        nextStep = transition.toStep;
        break;
      }

      // For other conditional logic
      if (this.evaluateTransitionCondition(condition, stepResult, execution)) {
        nextStep = transition.toStep;
        break;
      }
    }

    if (!nextStep) {
      // No valid transition found, complete workflow
      await prisma.workflowExecution.update({
        where: {id: execution.id},
        data: {
          status: WorkflowExecutionStatus.COMPLETED,
          completedAt: new Date(),
          currentStepId: null,
        },
      });
      return;
    }

    // Update current step and continue execution
    await prisma.workflowExecution.update({
      where: {id: execution.id},
      data: {
        currentStepId: nextStep.id,
        status: WorkflowExecutionStatus.RUNNING,
      },
    });

    // Process the next step
    // All steps are processed immediately - DELAY and WAIT_FOR_EVENT will pause the workflow internally
    await this.processStepExecution(execution.id, nextStep.id);
  }

  /**
   * Helper: Render template with variables
   */
  private static renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    return rendered;
  }

  /**
   * Helper: Resolve field value from object using dot notation
   */
  private static resolveField(field: string, data: Record<string, unknown>): unknown {
    const parts = field.split('.');
    let value: unknown = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Helper: Evaluate condition
   */
  private static evaluateCondition(actualValue: unknown, operator: string, expectedValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        // equals can match null/undefined if expectedValue is also null/undefined
        return actualValue === expectedValue;
      case 'notEquals':
        // Match SegmentService behavior: only match when field exists and is not equal
        // Missing fields (undefined/null) do NOT match
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return actualValue !== expectedValue;
      case 'contains':
        // Return false if the value doesn't exist (undefined/null)
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return String(actualValue).includes(String(expectedValue));
      case 'notContains':
        // Match SegmentService behavior: only match when field exists and doesn't contain substring
        // Missing fields (undefined/null) do NOT match
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return !String(actualValue).includes(String(expectedValue));
      case 'greaterThan':
        // Numeric comparisons require field to exist
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return Number(actualValue) > Number(expectedValue);
      case 'lessThan':
        // Numeric comparisons require field to exist
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return Number(actualValue) < Number(expectedValue);
      case 'greaterThanOrEqual':
        // Numeric comparisons require field to exist
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return Number(actualValue) >= Number(expectedValue);
      case 'lessThanOrEqual':
        // Numeric comparisons require field to exist
        if (actualValue === undefined || actualValue === null) {
          return false;
        }
        return Number(actualValue) <= Number(expectedValue);
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      case 'notExists':
        return actualValue === undefined || actualValue === null;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Helper: Evaluate transition condition
   */
  private static evaluateTransitionCondition(
    _condition: Prisma.JsonValue,
    _stepResult: StepResult,
    _execution: WorkflowExecutionWithRelations,
  ): boolean {
    // Implement custom transition condition logic here
    // For now, return false as default
    return false;
  }
}
