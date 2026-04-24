/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectItemWithDescription,
  SelectTrigger,
  SelectValue,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  IconSpinner,
  Switch,
} from '@plunk/ui';
import type {Template, Workflow, WorkflowExecution, WorkflowStep, WorkflowTransition} from '@plunk/db';
import type {PaginatedResponse} from '@plunk/types';
import {DashboardLayout} from '../../components/DashboardLayout';
import {EmptyState} from '../../components/EmptyState';
import {network} from '../../lib/network';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Clock,
  GitBranch,
  Info,
  LogOut,
  Mail,
  Plus,
  Power,
  PowerOff,
  Settings,
  Trash2,
  UserCog,
  Users,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import {WorkflowBuilder} from '../../components/WorkflowBuilder';
import {KeyValueEditor} from '../../components/KeyValueEditor';
import {TemplateSearchPicker} from '../../components/TemplateSearchPicker';
import {ReactFlowProvider} from '@xyflow/react';
import {WorkflowSchemas} from '@plunk/shared';
import dayjs from 'dayjs';
import {WIKI_URI} from '../../lib/constants';

interface WorkflowWithDetails extends Workflow {
  steps: (WorkflowStep & {
    template?: {id: string; name: string} | null;
    outgoingTransitions: WorkflowTransition[];
    incomingTransitions: WorkflowTransition[];
  })[];
}

interface PaginatedExecutions {
  executions: (WorkflowExecution & {
    contact: {id: string; email: string};
    currentStep?: {id: string; name: string; type: string} | null;
  })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Step type styling (matching WorkflowBuilder)
const STEP_TYPE_LABELS: Record<string, string> = {
  TRIGGER: 'Trigger',
  SEND_EMAIL: 'Send Email',
  DELAY: 'Delay',
  WAIT_FOR_EVENT: 'Wait for Event',
  CONDITION: 'Condition',
  EXIT: 'Exit',
  WEBHOOK: 'Webhook',
  UPDATE_CONTACT: 'Update Contact',
};

const STEP_TYPE_DESCRIPTIONS: Record<string, string> = {
  TRIGGER: 'Starts the workflow when a specific event is received.',
  SEND_EMAIL: 'Sends an email to the contact using a template you choose.',
  DELAY: 'Pauses the workflow for a set amount of time before continuing.',
  WAIT_FOR_EVENT: 'Waits until the contact triggers a specific event, then continues.',
  CONDITION: 'Splits the flow based on contact data — each path leads to different steps.',
  EXIT: 'Ends the workflow for the contact.',
  WEBHOOK: 'Makes an HTTP request to an external URL with the contact\'s data.',
  UPDATE_CONTACT: 'Sets or updates fields on the contact\'s profile.',
};

const STEP_TYPE_ICONS = {
  TRIGGER: GitBranch,
  SEND_EMAIL: Mail,
  DELAY: Clock,
  WAIT_FOR_EVENT: Clock,
  CONDITION: GitBranch,
  EXIT: LogOut,
  WEBHOOK: Webhook,
  UPDATE_CONTACT: UserCog,
};

const STEP_TYPE_COLORS = {
  TRIGGER: '#9333ea',
  SEND_EMAIL: '#2563eb',
  DELAY: '#ea580c',
  WAIT_FOR_EVENT: '#ca8a04',
  CONDITION: '#9333ea',
  EXIT: '#dc2626',
  WEBHOOK: '#16a34a',
  UPDATE_CONTACT: '#4f46e5',
};

const STEP_TYPE_BG = {
  TRIGGER: '#f3e8ff',
  SEND_EMAIL: '#dbeafe',
  DELAY: '#ffedd5',
  WAIT_FOR_EVENT: '#fef3c7',
  CONDITION: '#f3e8ff',
  EXIT: '#fee2e2',
  WEBHOOK: '#dcfce7',
  UPDATE_CONTACT: '#e0e7ff',
};

export default function WorkflowEditorPage() {
  const router = useRouter();
  const {id} = router.query;
  const [activeTab, setActiveTab] = useState<'builder' | 'executions'>('builder');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [showCancelAllDialog, setShowCancelAllDialog] = useState(false);
  const [executionToCancel, setExecutionToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {data: workflow, mutate} = useSWR<WorkflowWithDetails>(id ? `/workflows/${id}` : null, {
    revalidateOnFocus: false,
  });

  const {data: executionsData} = useSWR<PaginatedExecutions>(
    id && activeTab === 'executions' ? `/workflows/${id}/executions?page=1&pageSize=10` : null,
    {revalidateOnFocus: false},
  );

  // Always fetch a summary of active executions to show warnings (regardless of enabled status)
  const {data: activeExecutionsData} = useSWR<PaginatedExecutions>(
    id ? `/workflows/${id}/executions?page=1&pageSize=1&status=RUNNING` : null,
    {revalidateOnFocus: false, refreshInterval: 10000},
  );

  const {data: waitingExecutionsData} = useSWR<PaginatedExecutions>(
    id ? `/workflows/${id}/executions?page=1&pageSize=1&status=WAITING` : null,
    {revalidateOnFocus: false, refreshInterval: 10000},
  );

  // Check for active executions
  const activeExecutionsCount = (activeExecutionsData?.total || 0) + (waitingExecutionsData?.total || 0);

  // Handler for cancelling a single execution
  const handleCancelExecution = async (executionId: string) => {
    setIsCancelling(true);
    try {
      await network.fetch('DELETE', `/workflows/${id}/executions/${executionId}`);
      toast.success('Execution cancelled successfully');
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel execution');
    } finally {
      setIsCancelling(false);
      setExecutionToCancel(null);
    }
  };

  // Handler for cancelling all executions
  const handleCancelAllExecutions = async () => {
    setIsCancelling(true);
    try {
      const result = await network.fetch<{cancelled: number}>('POST', `/workflows/${id}/executions/cancel-all`);
      toast.success(`Successfully cancelled ${result.cancelled} execution(s)`);
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel executions');
    } finally {
      setIsCancelling(false);
      setShowCancelAllDialog(false);
    }
  };

  // Validate workflow configuration
  const validateWorkflow = (workflow: WorkflowWithDetails): {valid: boolean; errors: string[]} => {
    const errors: string[] = [];

    // Check if there are any steps
    if (workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
      return {valid: false, errors};
    }

    // Validate each step
    workflow.steps.forEach(step => {
      const config = step.config && typeof step.config === 'object' && !Array.isArray(step.config) ? step.config : {};

      switch (step.type) {
        case 'SEND_EMAIL':
          if (!step.templateId) {
            errors.push(`"${step.name}" step is missing an email template`);
          }
          break;

        case 'DELAY':
          if (!config.amount || !config.unit) {
            errors.push(`"${step.name}" step is missing delay configuration (amount or unit)`);
          }
          break;

        case 'CONDITION':
          if (config.mode === 'multi') {
            // Multi-branch validation
            if (!config.field) {
              errors.push(`"${step.name}" step is missing condition field`);
            }
            if (!Array.isArray(config.branches) || config.branches.length === 0) {
              errors.push(`"${step.name}" step needs at least one branch`);
            }
          } else {
            // Extract field name from both legacy format (object) and new format (string)
            let fieldValue = '';
            if (config.field) {
              if (typeof config.field === 'object' && config.field !== null && 'field' in config.field) {
                fieldValue = String(config.field.field || '');
              } else {
                fieldValue = String(config.field);
              }
            }

            if (!fieldValue || !config.operator) {
              errors.push(`"${step.name}" step is missing condition configuration (field or operator)`);
            }
            // Check if value is required for this operator
            const operatorNeedsValue = !['exists', 'notExists'].includes(String(config.operator || ''));
            if (operatorNeedsValue && (config.value === undefined || config.value === null || config.value === '')) {
              errors.push(`"${step.name}" step is missing a value for the condition`);
            }
          }
          break;

        case 'WAIT_FOR_EVENT':
          if (!config.eventName) {
            errors.push(`"${step.name}" step is missing event name`);
          }
          break;

        case 'WEBHOOK':
          if (!config.url) {
            errors.push(`"${step.name}" step is missing webhook URL`);
          }
          break;

        case 'UPDATE_CONTACT':
          if (!config.updates || (typeof config.updates === 'object' && Object.keys(config.updates).length === 0)) {
            errors.push(`"${step.name}" step is missing contact updates`);
          }
          break;
      }
    });

    // Check for orphaned steps (steps with no incoming or outgoing transitions, except TRIGGER and EXIT)
    const triggerSteps = workflow.steps.filter(s => s.type === 'TRIGGER');

    workflow.steps.forEach(step => {
      if (step.type !== 'TRIGGER' && step.type !== 'EXIT') {
        const hasIncoming = step.incomingTransitions && step.incomingTransitions.length > 0;
        const hasOutgoing = step.outgoingTransitions && step.outgoingTransitions.length > 0;

        if (!hasIncoming && !hasOutgoing) {
          errors.push(`"${step.name}" step is not connected to the workflow`);
        }
      }
    });

    // Check if there's a TRIGGER step
    if (triggerSteps.length === 0) {
      errors.push('Workflow must have a trigger step');
    }

    // Check for CONDITION steps that don't have all required branches connected
    workflow.steps.forEach(step => {
      if (step.type === 'CONDITION' && step.outgoingTransitions) {
        const config = step.config && typeof step.config === 'object' && !Array.isArray(step.config) ? step.config : {};

        // Determine expected branches based on mode
        let expectedBranches: string[];
        if ((config as any).mode === 'multi' && Array.isArray((config as any).branches)) {
          expectedBranches = [...(config as any).branches.map((b: any) => b.id), 'default'];
        } else {
          expectedBranches = ['yes', 'no'];
        }

        const missingBranches = expectedBranches.filter(branchId => {
          return !step.outgoingTransitions.some(t => {
            const condition = t.condition;
            return condition && typeof condition === 'object' && 'branch' in condition && condition.branch === branchId;
          });
        });

        if (missingBranches.length > 0) {
          if ((config as any).mode === 'multi') {
            const branchNames = missingBranches.map(id => {
              if (id === 'default') return 'Default';
              const branch = (config as any).branches?.find((b: any) => b.id === id);
              return branch?.name || id;
            });
            errors.push(`"${step.name}" condition step is missing connections for: ${branchNames.join(', ')}`);
          } else {
            errors.push(`"${step.name}" condition step must have both YES and NO branches connected`);
          }
        }
      }
    });

    return {valid: errors.length === 0, errors};
  };

  const handleToggleEnabled = async () => {
    if (!workflow) return;

    // If trying to enable, validate first
    if (!workflow.enabled) {
      const validation = validateWorkflow(workflow);
      if (!validation.valid) {
        toast.error(
          <div>
            <div className="font-semibold mb-1">Cannot enable workflow</div>
            <ul className="list-disc list-inside text-sm">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>,
          {duration: 8000},
        );
        return;
      }
    }

    try {
      await network.fetch<Workflow, typeof WorkflowSchemas.update>('PATCH', `/workflows/${id}`, {
        enabled: !workflow.enabled,
      });
      toast.success(`Workflow ${!workflow.enabled ? 'enabled' : 'disabled'} successfully`);
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle workflow');
    }
  };

  const handleUpdateSettings = async (data: {
    name: string;
    description?: string;
    allowReentry?: boolean;
    triggerConfig?: {eventName: string};
  }) => {
    try {
      await network.fetch<Workflow, typeof WorkflowSchemas.update>('PATCH', `/workflows/${id}`, data);
      toast.success('Workflow updated successfully');
      void mutate();
      setShowSettingsDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update workflow');
    }
  };

  const handleDelete = async () => {
    try {
      await network.fetch('DELETE', `/workflows/${id}`);
      toast.success('Workflow deleted successfully');
      void router.push('/workflows');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete workflow');
    }
  };

  // Listen for edit step events from the WorkflowBuilder
  useEffect(() => {
    const handleEditStepEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{stepId?: string}>;
      const stepId = customEvent.detail?.stepId;
      if (stepId && workflow) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (step) {
          setEditingStep(step);
        }
      }
    };

    const handleOpenSettingsEvent = () => {
      setShowSettingsDialog(true);
    };

    window.addEventListener('workflow-edit-step', handleEditStepEvent);
    window.addEventListener('workflow-open-settings', handleOpenSettingsEvent);
    return () => {
      window.removeEventListener('workflow-edit-step', handleEditStepEvent);
      window.removeEventListener('workflow-open-settings', handleOpenSettingsEvent);
    };
  }, [workflow]);

  if (!workflow) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <IconSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/workflows">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 truncate">{workflow.name}</h1>
                <span
                  className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    workflow.enabled ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {workflow.enabled ? (
                    <>
                      <Power className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Active</span>
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Disabled</span>
                    </>
                  )}
                </span>
              </div>
              {workflow.description && (
                <p className="text-neutral-500 mt-1 text-sm sm:text-base">{workflow.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettingsDialog(true)} className="flex-1 sm:flex-none">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
            <Button onClick={handleToggleEnabled} className="flex-1 sm:flex-none">
              {workflow.enabled ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Disable</span>
                  <span className="sm:hidden">Off</span>
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  <span className="hidden sm:inline">Enable</span>
                  <span className="sm:hidden">On</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Executions Warning Banner */}
        {activeExecutionsCount > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              {workflow.enabled ? 'Workflow is active with running executions' : 'Workflow has active executions'}
            </AlertTitle>
            <AlertDescription>
              <p>
                This workflow has <strong>{activeExecutionsCount}</strong> active execution
                {activeExecutionsCount !== 1 ? 's' : ''}.{' '}
                {!workflow.enabled && 'Even though the workflow is disabled, existing executions will continue. '}
                To protect running workflows, you cannot:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Delete steps or transitions</li>
                <li>Modify step configurations (email templates, conditions, etc.)</li>
                <li>Change the workflow trigger</li>
              </ul>
              <p className="mt-2">
                You can still rename steps and adjust their position. To make configuration changes, wait for executions
                to complete or cancel them from the Executions tab.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warning Banner */}
        {!workflow.enabled &&
          (() => {
            const validation = validateWorkflow(workflow);
            if (!validation.valid) {
              return (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Workflow has validation errors</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Fix the following issues before enabling this workflow:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()}

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('builder')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'builder'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Workflow Builder
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executions'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Executions
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'builder' ? (
          <Card>
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
              <CardDescription>
                Click the <strong>+</strong> buttons to add and connect steps to your workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ReactFlowProvider>
                <WorkflowBuilder workflowId={id as string} steps={workflow.steps} onUpdate={() => mutate()} />
              </ReactFlowProvider>
            </CardContent>
          </Card>
        ) : activeTab === 'executions' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow Executions</CardTitle>
                  <CardDescription>View and manage all executions of this workflow</CardDescription>
                </div>
                {activeExecutionsCount > 0 && (
                  <Button variant="outline" onClick={() => setShowCancelAllDialog(true)}>
                    Cancel All Active ({activeExecutionsCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!executionsData?.executions.length ? (
                <EmptyState
                  icon={Users}
                  title="No executions yet"
                  description="This workflow hasn't been executed yet. Enable it to start processing contacts."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Current Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Started
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {executionsData.executions.map(execution => (
                        <tr key={execution.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {execution.contact.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                execution.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : execution.status === 'RUNNING'
                                    ? 'bg-blue-100 text-blue-800'
                                    : execution.status === 'WAITING'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : execution.status === 'FAILED'
                                        ? 'bg-red-100 text-red-800'
                                        : execution.status === 'CANCELLED'
                                          ? 'bg-neutral-100 text-neutral-800'
                                          : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {execution.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {execution.currentStep?.name ?? '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            <div className="group relative inline-block cursor-help">
                              {dayjs(execution.startedAt).fromNow()}
                              <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-neutral-900 text-white text-xs rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap">
                                {dayjs(execution.startedAt).format('DD MMMM YYYY, hh:mm')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {(execution.status === 'RUNNING' || execution.status === 'WAITING') && (
                              <button
                                onClick={() => setExecutionToCancel(execution.id)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                disabled={isCancelling}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Dialogs */}
      {workflow && (
        <>
          <SettingsDialog
            workflow={workflow}
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            onSave={handleUpdateSettings}
          />
          {editingStep && (
            <EditStepDialog
              step={editingStep}
              workflowId={id as string}
              open={!!editingStep}
              onOpenChange={open => !open && setEditingStep(null)}
              onSuccess={() => mutate()}
            />
          )}

          {/* Cancel Single Execution Confirmation */}
          <ConfirmDialog
            open={!!executionToCancel}
            onOpenChange={open => !open && setExecutionToCancel(null)}
            onConfirm={() => {
              if (executionToCancel) {
                return handleCancelExecution(executionToCancel);
              }
            }}
            title="Cancel Execution"
            description={
              executionToCancel && executionsData?.executions ? (
                <div className="space-y-2">
                  <p>
                    Are you sure you want to cancel the workflow execution for{' '}
                    <strong>
                      {executionsData.executions.find(e => e.id === executionToCancel)?.contact.email || 'this contact'}
                    </strong>
                    ?
                  </p>
                  <p className="text-sm text-neutral-600">
                    The contact will not receive any remaining emails or actions from this workflow. This action cannot
                    be undone.
                  </p>
                </div>
              ) : (
                'Are you sure you want to cancel this execution?'
              )
            }
            confirmText="Cancel Execution"
            cancelText="Keep Running"
            variant="destructive"
            isLoading={isCancelling}
          />

          {/* Cancel All Executions Confirmation */}
          <ConfirmDialog
            open={showCancelAllDialog}
            onOpenChange={setShowCancelAllDialog}
            onConfirm={handleCancelAllExecutions}
            title="Cancel All Active Executions"
            description={
              <div className="space-y-2">
                <p>
                  Are you sure you want to cancel all <strong>{activeExecutionsCount}</strong> active execution
                  {activeExecutionsCount !== 1 ? 's' : ''}?
                </p>
                <p className="text-sm text-neutral-600">
                  All contacts currently in this workflow will be stopped and won&apos;t receive any remaining emails or
                  actions. This action cannot be undone.
                </p>
              </div>
            }
            confirmText={`Cancel ${activeExecutionsCount} Execution${activeExecutionsCount !== 1 ? 's' : ''}`}
            cancelText="Keep Running"
            variant="destructive"
            isLoading={isCancelling}
          />

          {/* Delete Workflow Confirmation */}
          <ConfirmDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={handleDelete}
            title="Delete Workflow"
            description="Are you sure you want to delete this workflow? This action cannot be undone."
            confirmText="Delete Workflow"
            variant="destructive"
          />
        </>
      )}
    </DashboardLayout>
  );
}

// Settings Dialog Component
interface SettingsDialogProps {
  workflow: Workflow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    allowReentry?: boolean;
    triggerConfig?: {eventName: string};
  }) => Promise<void>;
}

function SettingsDialog({workflow, open, onOpenChange, onSave}: SettingsDialogProps) {
  const triggerConfig = workflow.triggerConfig as {eventName?: string} | null;
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description ?? '');
  const [allowReentry, setAllowReentry] = useState(workflow.allowReentry ?? false);
  const [eventName, setEventName] = useState(triggerConfig?.eventName ?? '');
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when workflow changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(workflow.name);
      setDescription(workflow.description ?? '');
      setAllowReentry(workflow.allowReentry ?? false);
      const config = workflow.triggerConfig as {eventName?: string} | null;
      setEventName(config?.eventName ?? '');
    }
  }, [open, workflow]);

  // Fetch available event names
  const {data: eventNamesData} = useSWR<{eventNames: string[]}>(open ? '/events/names' : null, {
    revalidateOnFocus: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({
        name,
        description: description || undefined,
        allowReentry,
        triggerConfig: eventName.trim() ? {eventName: eventName.trim()} : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workflow Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="eventName">Trigger Event *</Label>
            <div className="relative">
              <Input
                id="eventName"
                type="text"
                value={eventName}
                onChange={e => {
                  setEventName(e.target.value);
                  setEventPopoverOpen(true);
                }}
                onFocus={() => setEventPopoverOpen(true)}
                onBlur={() => {
                  setTimeout(() => setEventPopoverOpen(false), 150);
                }}
                placeholder="e.g., contact.created, email.opened"
                required
                autoComplete="off"
              />
              {eventPopoverOpen && ((eventNamesData?.eventNames?.length ?? 0) > 0 || eventName?.trim()) && (
                <div className="absolute z-50 w-full mt-1 rounded-md border border-neutral-200 bg-white shadow-md">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {eventNamesData?.eventNames
                          ?.filter(n => !eventName || n.toLowerCase().includes(eventName.toLowerCase()))
                          .map(n => (
                            <CommandItem key={n} value={n} onSelect={() => { setEventName(n); setEventPopoverOpen(false); }}>
                              {n}
                            </CommandItem>
                          ))}
                        {eventName?.trim() && !eventNamesData?.eventNames?.some(n => n === eventName.trim()) && (
                          <CommandItem
                            key="__custom__"
                            value={eventName.trim()}
                            onSelect={() => { setEventName(eventName.trim()); setEventPopoverOpen(false); }}
                          >
                            Use &ldquo;{eventName.trim()}&rdquo;
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              The event that triggers this workflow to start for a contact
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <Switch id="allowReentry" checked={allowReentry} onCheckedChange={setAllowReentry} />
            <div className="flex-1">
              <Label htmlFor="allowReentry" className="font-medium cursor-pointer">
                Allow Re-entry
              </Label>
              <p className="text-xs text-neutral-500 mt-1">
                When enabled, contacts can enter this workflow multiple times. When disabled, contacts can only enter
                once, ever.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Step Dialog Component
interface AddStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onSuccess: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AddStepDialog({open, onOpenChange, workflowId, onSuccess}: AddStepDialogProps) {
  const [type, setType] = useState<WorkflowStep['type']>('SEND_EMAIL');
  const [name, setName] = useState('');

  // SEND_EMAIL fields
  const [templateId, setTemplateId] = useState('');
  const [recipientType, setRecipientType] = useState<'CONTACT' | 'CUSTOM'>('CONTACT');
  const [customEmail, setCustomEmail] = useState('');

  // DELAY fields
  const [delayAmount, setDelayAmount] = useState('24');
  const [delayUnit, setDelayUnit] = useState<'hours' | 'days' | 'minutes'>('hours');

  // CONDITION fields
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [availableFields, setAvailableFields] = useState<Array<{field: string; type: string; category: string}>>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Get current field type for smart operator filtering
  const currentFieldType = availableFields.find(f => f.field === conditionField)?.type || 'string';

  // Get valid operators based on field type
  const getOperatorsForType = (fieldType: string) => {
    const allOperators = [
      {value: 'equals', label: 'Equals', types: ['string', 'number', 'boolean', 'date']},
      {value: 'notEquals', label: 'Not Equals', types: ['string', 'number', 'boolean', 'date']},
      {value: 'contains', label: 'Contains', types: ['string']},
      {value: 'notContains', label: 'Does not contain', types: ['string']},
      {value: 'greaterThan', label: 'Greater than', types: ['number', 'date']},
      {value: 'lessThan', label: 'Less than', types: ['number', 'date']},
      {value: 'greaterThanOrEqual', label: 'Greater than or equal', types: ['number', 'date']},
      {value: 'lessThanOrEqual', label: 'Less than or equal', types: ['number', 'date']},
      {value: 'exists', label: 'Exists', types: ['string', 'number', 'boolean', 'date']},
      {value: 'notExists', label: 'Does not exist', types: ['string', 'number', 'boolean', 'date']},
    ];
    return allOperators.filter(op => op.types.includes(fieldType));
  };

  const validOperators = getOperatorsForType(currentFieldType);
  const needsValue = !['exists', 'notExists'].includes(conditionOperator);

  // WAIT_FOR_EVENT fields
  const [eventName, setEventName] = useState('');
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventTimeoutAmount, setEventTimeoutAmount] = useState('1');
  const [eventTimeoutUnit, setEventTimeoutUnit] = useState<'minutes' | 'hours' | 'days'>('days');

  // WEBHOOK fields
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMethod, setWebhookMethod] = useState('POST');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  // UPDATE_CONTACT fields
  const [contactUpdateData, setContactUpdateData] = useState<Record<string, string | number | boolean> | null>(null);

  // EXIT fields
  const [exitReason, setExitReason] = useState('completed');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // templates fetched on-demand by TemplateSearchPicker
  const {data: workflow} = useSWR<WorkflowWithDetails>(workflowId ? `/workflows/${workflowId}` : null);

  // Fetch available event names when dialog opens
  const {data: eventNamesData} = useSWR<{eventNames: string[]}>(open ? '/events/names' : null, {
    revalidateOnFocus: false,
  });

  // Fetch available fields when dialog opens and type is CONDITION
  useEffect(() => {
    const fetchAvailableFields = async () => {
      if (type === 'CONDITION' && open && workflow) {
        setLoadingFields(true);
        try {
          // Get event name from workflow trigger config
          const triggerConfig = workflow.triggerConfig as {eventName?: string} | null;
          const eventName = triggerConfig?.eventName;

          // Pass eventName as query param to filter event fields
          const url = eventName ? `/workflows/fields?eventName=${encodeURIComponent(eventName)}` : '/workflows/fields';
          const response = await network.fetch<{
            fields: string[];
            typedFields: Array<{field: string; type: string; category: string}>;
          }>('GET', url);
          setAvailableFields(
            response.typedFields || response.fields.map(f => ({field: f, type: 'string', category: 'Unknown'})),
          );

          // Set default field if available
          if (response.typedFields && response.typedFields.length > 0 && !conditionField) {
            setConditionField(response.typedFields[0]!.field);
          }
        } catch (error) {
          console.error('Failed to fetch available fields:', error);
          setAvailableFields([]);
        } finally {
          setLoadingFields(false);
        }
      }
    };

    void fetchAvailableFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, open, workflow]);

  // Handle condition field change - reset operator if not valid for new type
  const handleConditionFieldChange = (newField: string) => {
    const newFieldType = availableFields.find(f => f.field === newField)?.type || 'string';
    const newValidOperators = getOperatorsForType(newFieldType);

    setConditionField(newField);

    // Reset operator if current one is not valid for new field type
    if (!newValidOperators.some(op => op.value === conditionOperator)) {
      setConditionOperator('equals');
    }

    // Reset value when switching to boolean
    if (newFieldType === 'boolean') {
      setConditionValue('true');
    } else if (currentFieldType === 'boolean' && newFieldType !== 'boolean') {
      setConditionValue('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build step config based on type
      let config: Record<string, unknown> = {};

      if (type === 'SEND_EMAIL') {
        if (!templateId) {
          toast.error('Please select a template');
          setIsSubmitting(false);
          return;
        }

        // Validate custom email if recipient type is CUSTOM
        if (recipientType === 'CUSTOM') {
          if (!customEmail || !customEmail.trim()) {
            toast.error('Please enter a custom email address');
            setIsSubmitting(false);
            return;
          }
          // Basic email validation
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) {
            toast.error('Please enter a valid email address');
            setIsSubmitting(false);
            return;
          }
        }

        config = {
          templateId,
          recipient: {
            type: recipientType,
            ...(recipientType === 'CUSTOM' && {customEmail: customEmail.trim()}),
          },
        };
      } else if (type === 'DELAY') {
        const amount = parseInt(delayAmount);
        // Validate max 365 days
        const maxValues = {minutes: 525600, hours: 8760, days: 365};
        if (amount > maxValues[delayUnit]) {
          toast.error(`Delay cannot exceed 365 days (${maxValues[delayUnit]} ${delayUnit})`);
          setIsSubmitting(false);
          return;
        }
        config = {amount, unit: delayUnit};
      } else if (type === 'CONDITION') {
        // Parse the value based on type
        let parsedValue: string | number | boolean = conditionValue;
        if (conditionValue === 'true') parsedValue = true;
        else if (conditionValue === 'false') parsedValue = false;
        else if (!isNaN(Number(conditionValue))) parsedValue = Number(conditionValue);

        config = {
          field: conditionField,
          operator: conditionOperator,
          value: parsedValue,
        };
      } else if (type === 'EXIT') {
        config = {reason: exitReason};
      } else if (type === 'WEBHOOK') {
        if (!webhookUrl) {
          toast.error('Webhook URL is required');
          setIsSubmitting(false);
          return;
        }

        let headers = {};
        if (webhookHeaders.trim()) {
          try {
            headers = JSON.parse(webhookHeaders);
          } catch {
            toast.error('Invalid JSON in webhook headers');
            setIsSubmitting(false);
            return;
          }
        }

        config = {
          url: webhookUrl,
          method: webhookMethod,
          headers,
        };
      } else if (type === 'UPDATE_CONTACT') {
        if (!contactUpdateData || Object.keys(contactUpdateData).length === 0) {
          toast.error('At least one field to update is required');
          setIsSubmitting(false);
          return;
        }

        config = {updates: contactUpdateData};
      } else if (type === 'WAIT_FOR_EVENT') {
        if (!eventName) {
          toast.error('Event name is required');
          setIsSubmitting(false);
          return;
        }
        // Convert amount + unit to seconds
        const amount = parseInt(eventTimeoutAmount);
        // Validate max 365 days
        const maxValues = {minutes: 525600, hours: 8760, days: 365};
        if (amount > maxValues[eventTimeoutUnit]) {
          toast.error(`Timeout cannot exceed 365 days (${maxValues[eventTimeoutUnit]} ${eventTimeoutUnit})`);
          setIsSubmitting(false);
          return;
        }
        let timeoutSeconds = 0;
        if (amount > 0) {
          switch (eventTimeoutUnit) {
            case 'minutes':
              timeoutSeconds = amount * 60;
              break;
            case 'hours':
              timeoutSeconds = amount * 60 * 60;
              break;
            case 'days':
              timeoutSeconds = amount * 60 * 60 * 24;
              break;
          }
        }
        config = {
          eventName,
          timeout: timeoutSeconds,
        };
      }

      await network.fetch<WorkflowStep, typeof WorkflowSchemas.addStep>('POST', `/workflows/${workflowId}/steps`, {
        type,
        name,

        position: {x: 100, y: 100},
        config: config as any,
        templateId: type === 'SEND_EMAIL' ? templateId : undefined,
      });

      toast.success('Step added successfully');

      // Reset all fields
      setName('');
      setType('SEND_EMAIL');
      setTemplateId('');
      setRecipientType('CONTACT');
      setCustomEmail('');
      setDelayAmount('24');
      setDelayUnit('hours');
      setConditionField('');
      setConditionOperator('equals');
      setConditionValue('');
      setAvailableFields([]);
      setEventName('');
      setEventTimeoutAmount('1');
      setEventTimeoutUnit('days');
      setWebhookUrl('');
      setWebhookMethod('POST');
      setWebhookHeaders('');
      setContactUpdateData(null);
      setExitReason('completed');

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add step');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
          {STEP_TYPE_DESCRIPTIONS[type] && (
            <p className="text-sm text-neutral-500 mt-1">{STEP_TYPE_DESCRIPTIONS[type]}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={value => setType(value as WorkflowStep['type'])}>
                <SelectTrigger id="type" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItemWithDescription
                    value="SEND_EMAIL"
                    title="Send Email"
                    description="Send an email using a template"
                  />
                  <SelectItemWithDescription
                    value="DELAY"
                    title="Delay"
                    description="Wait for a specified amount of time"
                  />
                  <SelectItemWithDescription
                    value="WAIT_FOR_EVENT"
                    title="Wait for Event"
                    description="Pause until a specific event occurs"
                  />
                  <SelectItemWithDescription
                    value="CONDITION"
                    title="Condition"
                    description="If/else branching based on contact data"
                  />
                  <SelectItemWithDescription
                    value="WEBHOOK"
                    title="Webhook"
                    description="Call an external API endpoint"
                  />
                  <SelectItemWithDescription
                    value="UPDATE_CONTACT"
                    title="Update Contact"
                    description="Modify contact data fields"
                  />
                  <SelectItemWithDescription
                    value="EXIT"
                    title="Exit"
                    description="End the workflow for this contact"
                  />
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Step Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g., Send Welcome Email"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* SEND_EMAIL Configuration */}
          {type === 'SEND_EMAIL' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Email Template</Label>
                <TemplateSearchPicker value={templateId} onChange={setTemplateId} />
              </div>

              <div>
                <Label htmlFor="recipientType">Send To</Label>
                <Select
                  value={recipientType}
                  onValueChange={value => setRecipientType(value as 'CONTACT' | 'CUSTOM')}
                >
                  <SelectTrigger id="recipientType" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItemWithDescription
                      value="CONTACT"
                      title="Contact"
                      description="Send to the contact that triggered the workflow"
                    />
                    <SelectItemWithDescription
                      value="CUSTOM"
                      title="Custom Email"
                      description="Send to a specific email address"
                    />
                  </SelectContent>
                </Select>
              </div>

              {recipientType === 'CUSTOM' && (
                <div>
                  <Label htmlFor="customEmail">Email Address</Label>
                  <Input
                    id="customEmail"
                    type="email"
                    value={customEmail}
                    onChange={e => setCustomEmail(e.target.value)}
                    required
                    placeholder="e.g., admin@example.com"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>
          )}

          {/* DELAY Configuration */}
          {type === 'DELAY' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="delayAmount">Amount</Label>
                  <Input
                    id="delayAmount"
                    type="number"
                    value={delayAmount}
                    onChange={e => setDelayAmount(e.target.value)}
                    required
                    min="1"
                    max={
                      delayUnit === 'minutes'
                        ? 525600
                        : delayUnit === 'hours'
                          ? 8760
                          : delayUnit === 'days'
                            ? 365
                            : undefined
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="delayUnit" className="text-sm font-medium">
                    Unit *
                  </Label>
                  <Select
                    value={delayUnit}
                    onValueChange={value => setDelayUnit(value as 'hours' | 'days' | 'minutes')}
                  >
                    <SelectTrigger id="delayUnit" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
          )}

          {/* CONDITION Configuration */}
          {type === 'CONDITION' && (
            <div className="space-y-4">
              <div>
                  <Label htmlFor="conditionField">Field to Check</Label>
                  {loadingFields ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-500 mt-1.5">
                      <IconSpinner size="sm" />
                      Loading fields...
                    </div>
                  ) : availableFields.length > 0 ? (
                    <>
                      <Select value={conditionField} onValueChange={handleConditionFieldChange} required>
                        <SelectTrigger id="conditionField" className="mt-1.5">
                          <SelectValue placeholder="Select a field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Group fields by category */}
                          {Object.entries(
                            availableFields.reduce<Record<string, typeof availableFields>>((acc, field) => {
                              if (!acc[field.category]) acc[field.category] = [];
                              acc[field.category]!.push(field);
                              return acc;
                            }, {}),
                          ).map(([category, fields]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500">{category}</div>
                              {fields.map(field => (
                                <SelectItem key={field.field} value={field.field}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.field.replace('contact.', '').replace('data.', '')}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 font-mono">
                                      {field.type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Input
                      id="conditionField"
                      type="text"
                      value={conditionField}
                      onChange={e => setConditionField(e.target.value)}
                      required
                      placeholder="e.g., contact.subscribed or contact.data.plan"
                      className="mt-1.5"
                    />
                  )}
              </div>

              <div>
                  <Label htmlFor="conditionOperator">Operator</Label>
                  <Select value={conditionOperator} onValueChange={setConditionOperator}>
                    <SelectTrigger id="conditionOperator" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {validOperators.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              {needsValue && (
                <div>
                    <Label htmlFor="conditionValue">Value</Label>
                    {currentFieldType === 'boolean' ? (
                      <Select value={conditionValue || 'true'} onValueChange={setConditionValue}>
                        <SelectTrigger id="conditionValue" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : currentFieldType === 'number' ? (
                      <Input
                        id="conditionValue"
                        type="number"
                        value={conditionValue}
                        onChange={e => setConditionValue(e.target.value)}
                        required
                        placeholder="e.g., 100"
                        className="mt-1.5"
                      />
                    ) : currentFieldType === 'date' ? (
                      <Input
                        id="conditionValue"
                        type="datetime-local"
                        value={conditionValue}
                        onChange={e => setConditionValue(e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    ) : (
                      <Input
                        id="conditionValue"
                        type="text"
                        value={conditionValue}
                        onChange={e => setConditionValue(e.target.value)}
                        required
                        placeholder="e.g., premium, active"
                        className="mt-1.5"
                      />
                    )}
                </div>
              )}
            </div>
          )}

          {/* WAIT_FOR_EVENT Configuration */}
          {type === 'WAIT_FOR_EVENT' && (
            <div className="space-y-4">
              <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <div className="relative">
                    <Input
                      id="eventName"
                      type="text"
                      value={eventName}
                      onChange={e => {
                        setEventName(e.target.value);
                        setEventPopoverOpen(true);
                      }}
                      onFocus={() => setEventPopoverOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setEventPopoverOpen(false), 150);
                      }}
                      required
                      placeholder="e.g., email.clicked, user.upgraded"
                      className="mt-1.5"
                      autoComplete="off"
                    />
                    {eventPopoverOpen && ((eventNamesData?.eventNames?.length ?? 0) > 0 || eventName?.trim()) && (
                      <div className="absolute z-50 w-full mt-1 rounded-md border border-neutral-200 bg-white shadow-md">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {eventNamesData?.eventNames
                                ?.filter(n => !eventName || n.toLowerCase().includes(eventName.toLowerCase()))
                                .map(n => (
                                  <CommandItem key={n} value={n} onSelect={() => { setEventName(n); setEventPopoverOpen(false); }}>
                                    {n}
                                  </CommandItem>
                                ))}
                              {eventName?.trim() && !eventNamesData?.eventNames?.some(n => n === eventName.trim()) && (
                                <CommandItem
                                  key="__custom__"
                                  value={eventName.trim()}
                                  onSelect={() => { setEventName(eventName.trim()); setEventPopoverOpen(false); }}
                                >
                                  Use &ldquo;{eventName.trim()}&rdquo;
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
              </div>

              <div>
                  <Label htmlFor="eventTimeoutAmount">Timeout (optional)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="eventTimeoutAmount"
                      type="number"
                      value={eventTimeoutAmount}
                      onChange={e => setEventTimeoutAmount(e.target.value)}
                      placeholder="1"
                      min="0"
                      max={
                        eventTimeoutUnit === 'minutes'
                          ? 525600
                          : eventTimeoutUnit === 'hours'
                            ? 8760
                            : eventTimeoutUnit === 'days'
                              ? 365
                              : undefined
                      }
                      className="flex-1"
                    />
                    <Select
                      value={eventTimeoutUnit}
                      onValueChange={value => setEventTimeoutUnit(value as 'minutes' | 'hours' | 'days')}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    If not received, the workflow continues after this time
                  </p>
              </div>
            </div>
          )}

          {/* WEBHOOK Configuration */}
          {type === 'WEBHOOK' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhookUrl">URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                  placeholder="https://api.example.com/webhook"
                  className="font-mono mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="webhookMethod">Method</Label>
                <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                  <SelectTrigger id="webhookMethod" className="font-mono mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="webhookHeaders">Headers (optional)</Label>
                <textarea
                  id="webhookHeaders"
                  value={webhookHeaders}
                  onChange={e => setWebhookHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* UPDATE_CONTACT Configuration */}
          {type === 'UPDATE_CONTACT' && (
            <KeyValueEditor
              key={open ? 'add-open' : 'add-closed'}
              initialData={null}
              onChange={setContactUpdateData}
            />
          )}

          {/* EXIT Configuration */}
          {type === 'EXIT' && (
            <div>
              <Label htmlFor="exitReason">Exit Reason</Label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger id="exitReason" className="mt-1.5">
                  <SelectValue placeholder="Select exit reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItemWithDescription value="completed" title="Completed" description="Contact finished the workflow successfully" />
                  <SelectItemWithDescription value="unsubscribed" title="Unsubscribed" description="Contact unsubscribed from communications" />
                  <SelectItemWithDescription value="not_eligible" title="Not Eligible" description="Contact doesn't meet the required criteria" />
                  <SelectItemWithDescription value="opted_out" title="Opted Out" description="Contact opted out of this workflow" />
                  <SelectItemWithDescription value="goal_achieved" title="Goal Achieved" description="Workflow goal was met before completion" />
                  <SelectItemWithDescription value="duplicate" title="Duplicate" description="Contact was already in this workflow" />
                  <SelectItemWithDescription value="error" title="Error" description="A technical issue occurred" />
                  <SelectItemWithDescription value="other" title="Other" description="Custom or unlisted reason" />
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Step'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Step Dialog Component
interface EditStepDialogProps {
  step: WorkflowStep & {template?: {id: string; name: string} | null};
  workflowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditStepDialog({step, workflowId, open, onOpenChange, onSuccess}: EditStepDialogProps) {
  const config = step.config && typeof step.config === 'object' && !Array.isArray(step.config) ? step.config : {};

  const [name, setName] = useState(step.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SEND_EMAIL fields
  const [templateId, setTemplateId] = useState(step.template?.id || '');
  const [recipientType, setRecipientType] = useState<'CONTACT' | 'CUSTOM'>(() => {
    const recipient = config?.recipient as {type?: string; customEmail?: string} | undefined;
    return (recipient?.type === 'CUSTOM' ? 'CUSTOM' : 'CONTACT') as 'CONTACT' | 'CUSTOM';
  });
  const [customEmail, setCustomEmail] = useState(() => {
    const recipient = config?.recipient as {type?: string; customEmail?: string} | undefined;
    return recipient?.customEmail || '';
  });

  // DELAY fields
  const [delayAmount, setDelayAmount] = useState(String(config?.amount || '24'));
  const [delayUnit, setDelayUnit] = useState<'hours' | 'days' | 'minutes'>(
    (config?.unit === 'hours' || config?.unit === 'days' || config?.unit === 'minutes' ? config.unit : 'hours') as
      | 'hours'
      | 'days'
      | 'minutes',
  );

  // CONDITION fields - handle both old format (object) and new format (string)
  const [conditionMode, setConditionMode] = useState<'binary' | 'multi'>(() => {
    return config?.mode === 'multi' ? 'multi' : 'binary';
  });

  // Helper to check if switching from multi to binary is safe
  const hasMultiBranchConnections = () => {
    if (step.type !== 'CONDITION') return false;
    if (config?.mode !== 'multi') return false;

    const transitions = (step as any).outgoingTransitions || [];
    // Check if any transition has a branch that's not 'yes' or 'no' (multi-branch specific)
    return transitions.some((t: any) => {
      const condition = t.condition;
      if (condition && typeof condition === 'object' && 'branch' in condition) {
        const branch = condition.branch as string;
        // Multi-branch specific branches (not the simple if/else branches)
        return branch !== 'yes' && branch !== 'no';
      }
      return false;
    });
  };

  // Helper to check if switching from binary to multi is safe
  const hasBinaryConnections = () => {
    if (step.type !== 'CONDITION') return false;
    if (config?.mode === 'multi') return false;

    const transitions = (step as any).outgoingTransitions || [];
    // Check if any transition has 'yes' or 'no' branches (binary-specific)
    return transitions.some((t: any) => {
      const condition = t.condition;
      if (condition && typeof condition === 'object' && 'branch' in condition) {
        const branch = condition.branch as string;
        return branch === 'yes' || branch === 'no';
      }
      return false;
    });
  };

  // Safe mode change handler
  const handleModeChange = (newMode: 'binary' | 'multi') => {
    // If switching from multi to binary, check for multi-branch connections
    if (conditionMode === 'multi' && newMode === 'binary' && hasMultiBranchConnections()) {
      // Don't allow the switch - user needs to disconnect branches first
      return;
    }
    // If switching from binary to multi, check for binary connections
    if (conditionMode === 'binary' && newMode === 'multi' && hasBinaryConnections()) {
      // Don't allow the switch - user needs to disconnect branches first
      return;
    }
    setConditionMode(newMode);
  };
  const [conditionField, setConditionField] = useState(() => {
    if (!config?.field) return '';
    // Handle case where field is an object like {field: 'email', type: 'string'} (legacy format)
    if (typeof config.field === 'object' && config.field !== null && 'field' in config.field) {
      return String(config.field.field || '');
    }
    // Handle new format where field is just a string
    return String(config.field);
  });
  const [conditionOperator, setConditionOperator] = useState(String(config?.operator || 'equals'));
  const [conditionValue, setConditionValue] = useState(String(config?.value ?? ''));
  const [conditionBranches, setConditionBranches] = useState<
    Array<{id: string; name: string; operator: string; value: string}>
  >(() => {
    if (config?.mode === 'multi' && Array.isArray(config.branches)) {
      return config.branches.map((b: any) => ({
        id: String(b.id || crypto.randomUUID().slice(0, 8)),
        name: String(b.name || ''),
        operator: String(b.operator || 'equals'),
        value: String(b.value ?? ''),
      }));
    }
    return [{id: crypto.randomUUID().slice(0, 8), name: '', operator: 'equals', value: ''}];
  });
  const [availableFields, setAvailableFields] = useState<Array<{field: string; type: string; category: string}>>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Get current field type for smart operator filtering
  const currentFieldType = availableFields.find(f => f.field === conditionField)?.type || 'string';

  // Get valid operators based on field type
  const getOperatorsForType = (fieldType: string) => {
    const allOperators = [
      {value: 'equals', label: 'Equals', types: ['string', 'number', 'boolean', 'date']},
      {value: 'notEquals', label: 'Not Equals', types: ['string', 'number', 'boolean', 'date']},
      {value: 'contains', label: 'Contains', types: ['string']},
      {value: 'notContains', label: 'Does not contain', types: ['string']},
      {value: 'greaterThan', label: 'Greater than', types: ['number', 'date']},
      {value: 'lessThan', label: 'Less than', types: ['number', 'date']},
      {value: 'greaterThanOrEqual', label: 'Greater than or equal', types: ['number', 'date']},
      {value: 'lessThanOrEqual', label: 'Less than or equal', types: ['number', 'date']},
      {value: 'exists', label: 'Exists', types: ['string', 'number', 'boolean', 'date']},
      {value: 'notExists', label: 'Does not exist', types: ['string', 'number', 'boolean', 'date']},
    ];
    return allOperators.filter(op => op.types.includes(fieldType));
  };

  const validOperators = getOperatorsForType(currentFieldType);
  const needsValue = !['exists', 'notExists'].includes(conditionOperator);

  // Handle condition field change - reset operator if not valid for new type
  const handleConditionFieldChange = (newField: string) => {
    const newFieldType = availableFields.find(f => f.field === newField)?.type || 'string';
    const newValidOperators = getOperatorsForType(newFieldType);

    setConditionField(newField);

    // Reset operator if current one is not valid for new field type
    if (!newValidOperators.some(op => op.value === conditionOperator)) {
      setConditionOperator('equals');
    }

    // Reset value when switching to boolean
    if (newFieldType === 'boolean') {
      setConditionValue('true');
    } else if (currentFieldType === 'boolean' && newFieldType !== 'boolean') {
      setConditionValue('');
    }
  };

  // WAIT_FOR_EVENT fields
  const [eventName, setEventName] = useState(String(config?.eventName || ''));
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventTimeoutAmount, setEventTimeoutAmount] = useState<string>(() => {
    const timeoutSeconds = Number(config?.timeout) || 86400;
    // Convert seconds to most appropriate unit
    if (timeoutSeconds === 0) return '0';
    if (timeoutSeconds % (60 * 60 * 24) === 0) return String(timeoutSeconds / (60 * 60 * 24));
    if (timeoutSeconds % (60 * 60) === 0) return String(timeoutSeconds / (60 * 60));
    if (timeoutSeconds % 60 === 0) return String(timeoutSeconds / 60);
    // Default to hours if not evenly divisible
    return String(Math.round(timeoutSeconds / (60 * 60)));
  });
  const [eventTimeoutUnit, setEventTimeoutUnit] = useState<'minutes' | 'hours' | 'days'>(() => {
    const timeoutSeconds = Number(config?.timeout) || 86400;
    if (timeoutSeconds === 0) return 'days';
    if (timeoutSeconds % (60 * 60 * 24) === 0) return 'days';
    if (timeoutSeconds % (60 * 60) === 0) return 'hours';
    return 'minutes';
  });

  // WEBHOOK fields
  const [webhookUrl, setWebhookUrl] = useState(String(config?.url || ''));
  const [webhookMethod, setWebhookMethod] = useState(String(config?.method || 'POST'));
  const [webhookHeaders, setWebhookHeaders] = useState<{key: string; value: string}[]>(() => {
    if (config?.headers && typeof config.headers === 'object') {
      return Object.entries(config.headers).map(([key, value]) => ({key, value: String(value)}));
    }
    return [];
  });
  const [showWebhookInfo, setShowWebhookInfo] = useState(false);

  // UPDATE_CONTACT fields
  const [contactUpdateData, setContactUpdateData] = useState<Record<string, string | number | boolean> | null>(
    config?.updates && typeof config.updates === 'object' ? (config.updates as Record<string, string | number | boolean>) : null,
  );

  // EXIT fields
  const [exitReason, setExitReason] = useState(String(config?.reason || 'completed'));

  // templates fetched on-demand by TemplateSearchPicker
  const {data: workflow} = useSWR<WorkflowWithDetails>(workflowId ? `/workflows/${workflowId}` : null);

  // Fetch available event names when dialog opens
  const {data: eventNamesData} = useSWR<{eventNames: string[]}>(open ? '/events/names' : null, {
    revalidateOnFocus: false,
  });

  // Fetch available contact fields when dialog opens and type is CONDITION
  useEffect(() => {
    const fetchAvailableFields = async () => {
      if (step.type === 'CONDITION' && open && workflow) {
        setLoadingFields(true);
        try {
          // Get event name from workflow trigger config
          const triggerConfig = workflow.triggerConfig as {eventName?: string} | null;
          const eventName = triggerConfig?.eventName;

          // Pass eventName as query param to filter event fields
          const url = eventName ? `/workflows/fields?eventName=${encodeURIComponent(eventName)}` : '/workflows/fields';
          const response = await network.fetch<{
            fields: string[];
            typedFields: Array<{field: string; type: string; category: string}>;
          }>('GET', url);
          setAvailableFields(
            response.typedFields || response.fields.map(f => ({field: f, type: 'string', category: 'Unknown'})),
          );
        } catch (error) {
          console.error('Failed to fetch available fields:', error);
          setAvailableFields([]);
        } finally {
          setLoadingFields(false);
        }
      }
    };

    void fetchAvailableFields();
  }, [step.type, open, workflow, workflowId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build step config based on type
      let newConfig: Record<string, unknown> = {};

      if (step.type === 'SEND_EMAIL') {
        if (!templateId) {
          toast.error('Please select a template');
          setIsSubmitting(false);
          return;
        }

        // Validate custom email if recipient type is CUSTOM
        if (recipientType === 'CUSTOM') {
          if (!customEmail || !customEmail.trim()) {
            toast.error('Please enter a custom email address');
            setIsSubmitting(false);
            return;
          }
          // Basic email validation
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) {
            toast.error('Please enter a valid email address');
            setIsSubmitting(false);
            return;
          }
        }

        newConfig = {
          templateId,
          recipient: {
            type: recipientType,
            ...(recipientType === 'CUSTOM' && {customEmail: customEmail.trim()}),
          },
        };
      } else if (step.type === 'DELAY') {
        const amount = parseInt(delayAmount);
        // Validate max 365 days
        const maxValues = {minutes: 525600, hours: 8760, days: 365};
        if (amount > maxValues[delayUnit]) {
          toast.error(`Delay cannot exceed 365 days (${maxValues[delayUnit]} ${delayUnit})`);
          setIsSubmitting(false);
          return;
        }
        newConfig = {amount, unit: delayUnit};
      } else if (step.type === 'CONDITION') {
        if (conditionMode === 'multi') {
          // Validate branches
          const validBranches = conditionBranches.filter(b => b.name.trim());
          if (validBranches.length === 0) {
            toast.error('At least one branch with a name is required');
            setIsSubmitting(false);
            return;
          }
          if (!conditionField) {
            toast.error('Please select a field');
            setIsSubmitting(false);
            return;
          }

          newConfig = {
            mode: 'multi' as const,
            field: conditionField,
            branches: validBranches.map(b => {
              let parsedValue: string | number | boolean = b.value;
              if (b.value === 'true') parsedValue = true;
              else if (b.value === 'false') parsedValue = false;
              else if (b.value !== '' && !isNaN(Number(b.value))) parsedValue = Number(b.value);

              return {
                id: b.id,
                name: b.name.trim(),
                operator: b.operator,
                value: parsedValue,
              };
            }),
          };
        } else {
          // Parse the value based on type
          let parsedValue: string | number | boolean = conditionValue;
          if (conditionValue === 'true') parsedValue = true;
          else if (conditionValue === 'false') parsedValue = false;
          else if (!isNaN(Number(conditionValue))) parsedValue = Number(conditionValue);

          newConfig = {
            field: conditionField,
            operator: conditionOperator,
            value: parsedValue,
          };
        }
      } else if (step.type === 'EXIT') {
        newConfig = {reason: exitReason};
      } else if (step.type === 'WEBHOOK') {
        if (!webhookUrl) {
          toast.error('Webhook URL is required');
          setIsSubmitting(false);
          return;
        }

        // Convert headers array to object, filtering out empty entries
        const headers: Record<string, string> = {};
        webhookHeaders.forEach(header => {
          if (header.key.trim() && header.value.trim()) {
            headers[header.key.trim()] = header.value.trim();
          }
        });

        newConfig = {
          url: webhookUrl,
          method: webhookMethod,
          headers,
        };
      } else if (step.type === 'UPDATE_CONTACT') {
        if (!contactUpdateData || Object.keys(contactUpdateData).length === 0) {
          toast.error('At least one field to update is required');
          setIsSubmitting(false);
          return;
        }

        newConfig = {updates: contactUpdateData};
      } else if (step.type === 'WAIT_FOR_EVENT') {
        if (!eventName) {
          toast.error('Event name is required');
          setIsSubmitting(false);
          return;
        }
        // Convert amount + unit to seconds
        const amount = parseInt(eventTimeoutAmount);
        // Validate max 365 days
        const maxValues = {minutes: 525600, hours: 8760, days: 365};
        if (amount > maxValues[eventTimeoutUnit]) {
          toast.error(`Timeout cannot exceed 365 days (${maxValues[eventTimeoutUnit]} ${eventTimeoutUnit})`);
          setIsSubmitting(false);
          return;
        }
        let timeoutSeconds = 0;
        if (amount > 0) {
          switch (eventTimeoutUnit) {
            case 'minutes':
              timeoutSeconds = amount * 60;
              break;
            case 'hours':
              timeoutSeconds = amount * 60 * 60;
              break;
            case 'days':
              timeoutSeconds = amount * 60 * 60 * 24;
              break;
          }
        }
        newConfig = {
          eventName,
          timeout: timeoutSeconds,
        };
      }

      await network.fetch<WorkflowStep, typeof WorkflowSchemas.updateStep>(
        'PATCH',
        `/workflows/${workflowId}/steps/${step.id}`,

        {
          name,
          config: newConfig as any,
          templateId: step.type === 'SEND_EMAIL' ? templateId : undefined,
        },
      );

      toast.success('Step updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update step');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {STEP_TYPE_LABELS[step.type] ?? step.type}</DialogTitle>
          {STEP_TYPE_DESCRIPTIONS[step.type] && (
            <p className="text-sm text-neutral-500 mt-1">{STEP_TYPE_DESCRIPTIONS[step.type]}</p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="editStepName">Step Name</Label>
            <Input
              id="editStepName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., Send Welcome Email"
              className="mt-1.5"
            />
          </div>

          {/* SEND_EMAIL Configuration */}
          {step.type === 'SEND_EMAIL' && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editTemplate">Email Template</Label>
                  <TemplateSearchPicker value={templateId} initialName={step.template?.name} onChange={setTemplateId} />
                </div>

                <div>
                  <Label htmlFor="editRecipientType">Send To</Label>
                  <Select
                    value={recipientType}
                    onValueChange={value => setRecipientType(value as 'CONTACT' | 'CUSTOM')}
                  >
                    <SelectTrigger id="editRecipientType" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItemWithDescription
                        value="CONTACT"
                        title="Contact"
                        description="Send to the contact that triggered the workflow"
                      />
                      <SelectItemWithDescription
                        value="CUSTOM"
                        title="Custom Email"
                        description="Send to a specific email address"
                      />
                    </SelectContent>
                  </Select>
                </div>

                {recipientType === 'CUSTOM' && (
                  <div>
                    <Label htmlFor="editCustomEmail">Email Address</Label>
                    <Input
                      id="editCustomEmail"
                      type="email"
                      value={customEmail}
                      onChange={e => setCustomEmail(e.target.value)}
                      required
                      placeholder="e.g., admin@example.com"
                      className="mt-1.5"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DELAY Configuration */}
          {step.type === 'DELAY' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDelayAmount">Amount</Label>
                <Input
                  id="editDelayAmount"
                  type="number"
                  value={delayAmount}
                  onChange={e => setDelayAmount(e.target.value)}
                  required
                  min="1"
                  max={
                    delayUnit === 'minutes'
                      ? 525600
                      : delayUnit === 'hours'
                        ? 8760
                        : delayUnit === 'days'
                          ? 365
                          : undefined
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="editDelayUnit">Unit</Label>
                <Select
                  value={delayUnit}
                  onValueChange={value => setDelayUnit(value as 'hours' | 'days' | 'minutes')}
                >
                  <SelectTrigger id="editDelayUnit" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* CONDITION Configuration */}
          {step.type === 'CONDITION' && (
            <div className="space-y-6">

              <div className="space-y-4">
                {/* Mode toggle */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Condition Mode</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleModeChange('binary')}
                      disabled={conditionMode === 'multi' && hasMultiBranchConnections()}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        conditionMode === 'binary'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : conditionMode === 'multi' && hasMultiBranchConnections()
                            ? 'border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed opacity-50'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      Simple (If/Else)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeChange('multi')}
                      disabled={conditionMode === 'binary' && hasBinaryConnections()}
                      className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        conditionMode === 'multi'
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : conditionMode === 'binary' && hasBinaryConnections()
                            ? 'border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed opacity-50'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      Multi-branch (Switch)
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    {conditionMode === 'binary'
                      ? 'Evaluates a single condition with Yes/No paths'
                      : 'Match a field against multiple values, each routing to its own branch'}
                  </p>
                  {hasMultiBranchConnections() && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Cannot switch to simple mode: branches have connected nodes. Disconnect all branch connections
                      first.
                    </div>
                  )}
                  {hasBinaryConnections() && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Cannot switch to multi-branch mode: Yes/No branches have connected nodes. Disconnect all branch
                      connections first.
                    </div>
                  )}
                  {conditionMode !== (config?.mode === 'multi' ? 'multi' : 'binary') &&
                    !hasMultiBranchConnections() &&
                    !hasBinaryConnections() &&
                    (step as any).outgoingTransitions &&
                    (step as any).outgoingTransitions.length > 0 && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Changing mode will disconnect existing branches. You will need to rewire them.
                      </div>
                    )}
                </div>

                {/* Field selector (shared between modes) */}
                <div>
                  <Label htmlFor="editConditionField">Field to Check *</Label>
                  {loadingFields ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-500 mt-1.5">
                      <IconSpinner size="sm" />
                      Loading fields...
                    </div>
                  ) : availableFields.length > 0 ? (
                    <>
                      <Select value={conditionField} onValueChange={handleConditionFieldChange} required>
                        <SelectTrigger id="editConditionField" className="mt-1.5">
                          <SelectValue placeholder="Select a field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Group fields by category */}
                          {Object.entries(
                            availableFields.reduce<Record<string, typeof availableFields>>((acc, field) => {
                              if (!acc[field.category]) acc[field.category] = [];
                              acc[field.category]!.push(field);
                              return acc;
                            }, {}),
                          ).map(([category, fields]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500">{category}</div>
                              {fields.map(field => (
                                <SelectItem key={field.field} value={field.field}>
                                  <div className="flex items-center gap-2">
                                    <span>{field.field.replace('contact.', '').replace('data.', '')}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 font-mono">
                                      {field.type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Input
                      id="editConditionField"
                      type="text"
                      value={conditionField}
                      onChange={e => setConditionField(e.target.value)}
                      required
                      placeholder="e.g., contact.subscribed or contact.data.plan"
                      className="mt-1.5"
                    />
                  )}
                </div>

                {/* Binary mode: single operator + value */}
                {conditionMode === 'binary' && (
                  <>
                    <div>
                      <Label htmlFor="editConditionOperator">Operator</Label>
                      <Select value={conditionOperator} onValueChange={setConditionOperator}>
                        <SelectTrigger id="editConditionOperator" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {validOperators.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {needsValue && (
                      <div>
                        <Label htmlFor="editConditionValue">Value</Label>
                        {currentFieldType === 'boolean' ? (
                          <Select value={conditionValue || 'true'} onValueChange={setConditionValue}>
                            <SelectTrigger id="editConditionValue" className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : currentFieldType === 'number' ? (
                          <Input
                            id="editConditionValue"
                            type="number"
                            value={conditionValue}
                            onChange={e => setConditionValue(e.target.value)}
                            required
                            placeholder="e.g., 100"
                            className="mt-1.5"
                          />
                        ) : currentFieldType === 'date' ? (
                          <Input
                            id="editConditionValue"
                            type="datetime-local"
                            value={conditionValue}
                            onChange={e => setConditionValue(e.target.value)}
                            required
                            className="mt-1.5"
                          />
                        ) : (
                          <Input
                            id="editConditionValue"
                            type="text"
                            value={conditionValue}
                            onChange={e => setConditionValue(e.target.value)}
                            required
                            placeholder="e.g., premium, active"
                            className="mt-1.5"
                          />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Multi-branch mode: dynamic list of branches */}
                {conditionMode === 'multi' && (
                  <div className="space-y-3">
                    <Label>Branches</Label>
                    <p className="text-xs text-neutral-500">
                      Each branch defines a condition. The first matching branch is taken. Contacts not matching any
                      branch follow the Default path.
                    </p>

                    {conditionBranches.map((branch, idx) => (
                      <div
                        key={branch.id}
                        className="p-3 border border-neutral-200 rounded-lg space-y-3 bg-neutral-50/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-500">Branch {idx + 1}</span>
                          {conditionBranches.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setConditionBranches(prev => prev.filter(b => b.id !== branch.id))}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs">Name *</Label>
                          <Input
                            type="text"
                            value={branch.name}
                            onChange={e => {
                              const newName = e.target.value;
                              setConditionBranches(prev =>
                                prev.map(b => (b.id === branch.id ? {...b, name: newName} : b)),
                              );
                            }}
                            placeholder="e.g., Premium, Free, Enterprise"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={branch.operator}
                              onValueChange={val =>
                                setConditionBranches(prev =>
                                  prev.map(b => (b.id === branch.id ? {...b, operator: val} : b)),
                                )
                              }
                            >
                              <SelectTrigger className="mt-1 h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {validOperators.map(op => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {!['exists', 'notExists'].includes(branch.operator) && (
                            <div>
                              <Label className="text-xs">Value</Label>
                              <Input
                                type="text"
                                value={branch.value}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  setConditionBranches(prev =>
                                    prev.map(b => (b.id === branch.id ? {...b, value: newValue} : b)),
                                  );
                                }}
                                placeholder="Value..."
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {conditionBranches.length < 20 && (
                      <button
                        type="button"
                        onClick={() =>
                          setConditionBranches(prev => [
                            ...prev,
                            {id: crypto.randomUUID().slice(0, 8), name: '', operator: 'equals', value: ''},
                          ])
                        }
                        className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Branch
                      </button>
                    )}

                    <div className="p-2 bg-neutral-100 rounded-lg text-xs text-neutral-600 flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Branches are evaluated in order. The first match wins. Contacts not matching any branch will
                        follow the <strong>Default</strong> path.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WAIT_FOR_EVENT Configuration */}
          {step.type === 'WAIT_FOR_EVENT' && (
            <div className="space-y-4">
              <div>
                  <Label htmlFor="editEventName">Event Name</Label>
                  <div className="relative">
                    <Input
                      id="editEventName"
                      type="text"
                      value={eventName}
                      onChange={e => {
                        setEventName(e.target.value);
                        setEventPopoverOpen(true);
                      }}
                      onFocus={() => setEventPopoverOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setEventPopoverOpen(false), 150);
                      }}
                      required
                      placeholder="e.g., email.clicked, user.upgraded"
                      className="mt-1.5"
                      autoComplete="off"
                    />
                    {eventPopoverOpen && ((eventNamesData?.eventNames?.length ?? 0) > 0 || eventName?.trim()) && (
                      <div className="absolute z-50 w-full mt-1 rounded-md border border-neutral-200 bg-white shadow-md">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              {eventNamesData?.eventNames
                                ?.filter(n => !eventName || n.toLowerCase().includes(eventName.toLowerCase()))
                                .map(n => (
                                  <CommandItem key={n} value={n} onSelect={() => { setEventName(n); setEventPopoverOpen(false); }}>
                                    {n}
                                  </CommandItem>
                                ))}
                              {eventName?.trim() && !eventNamesData?.eventNames?.some(n => n === eventName.trim()) && (
                                <CommandItem
                                  key="__custom__"
                                  value={eventName.trim()}
                                  onSelect={() => { setEventName(eventName.trim()); setEventPopoverOpen(false); }}
                                >
                                  Use &ldquo;{eventName.trim()}&rdquo;
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
                </div>

              <div>
                  <Label htmlFor="editEventTimeoutAmount">Timeout (optional)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="editEventTimeoutAmount"
                      type="number"
                      value={eventTimeoutAmount}
                      onChange={e => setEventTimeoutAmount(e.target.value)}
                      placeholder="1"
                      min="0"
                      max={
                        eventTimeoutUnit === 'minutes'
                          ? 525600
                          : eventTimeoutUnit === 'hours'
                            ? 8760
                            : eventTimeoutUnit === 'days'
                              ? 365
                              : undefined
                      }
                      className="flex-1"
                    />
                    <Select
                      value={eventTimeoutUnit}
                      onValueChange={value => setEventTimeoutUnit(value as 'minutes' | 'hours' | 'days')}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5">
                    If not received, the workflow continues after this time
                  </p>
              </div>
            </div>
          )}

          {/* WEBHOOK Configuration */}
          {step.type === 'WEBHOOK' && (
            <div className="space-y-4">
              <Collapsible open={showWebhookInfo} onOpenChange={setShowWebhookInfo}>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showWebhookInfo ? 'rotate-180' : ''}`}
                    />
                    {showWebhookInfo ? 'Hide' : 'View'} request payload
                  </CollapsibleTrigger>
                  <Link
                    href={`${WIKI_URI}/guides/webhooks#webhook-payload`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2"
                  >
                    Webhook guide
                  </Link>
                </div>
                <CollapsibleContent className="mt-2">
                  <pre className="text-[10px] bg-neutral-50 p-2 rounded border border-neutral-200 overflow-x-auto">
                    {`{
  "contact": { "email": "user@example.com", "subscribed": true, "data": { ... } },
  "workflow": { "id": "wf_...", "name": "Welcome Series" },
  "execution": { "id": "exec_...", "startedAt": "2025-01-19T..." },
  "event": { ... }
}`}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              <div>
                <Label htmlFor="editWebhookUrl">URL</Label>
                <Input
                  className="font-mono mt-1.5"
                  id="editWebhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                  placeholder="https://api.example.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="editWebhookMethod">Method</Label>
                <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                  <SelectTrigger id="editWebhookMethod" className="font-mono mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Headers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWebhookHeaders([...webhookHeaders, {key: '', value: ''}])}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {webhookHeaders.map((header, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Name"
                        value={header.key}
                        onChange={e => {
                          const newHeaders = [...webhookHeaders];
                          if (newHeaders[index]) {
                            newHeaders[index].key = e.target.value;
                          }
                          setWebhookHeaders(newHeaders);
                        }}
                        className="text-sm font-mono"
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={e => {
                          const newHeaders = [...webhookHeaders];
                          if (newHeaders[index]) {
                            newHeaders[index].value = e.target.value;
                          }
                          setWebhookHeaders(newHeaders);
                        }}
                        className="text-sm font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newHeaders = webhookHeaders.filter((_, i) => i !== index);
                          setWebhookHeaders(newHeaders);
                        }}
                        className="h-9 w-9 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UPDATE_CONTACT Configuration */}
          {step.type === 'UPDATE_CONTACT' && (
            <KeyValueEditor
              key={`edit-${step.id}`}
              initialData={contactUpdateData}
              onChange={setContactUpdateData}
            />
          )}

          {/* EXIT Configuration */}
          {step.type === 'EXIT' && (
            <div>
              <Label htmlFor="editExitReason">Exit Reason (optional)</Label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger id="editExitReason" className="mt-1.5">
                  <SelectValue placeholder="Select exit reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItemWithDescription value="completed" title="Completed" description="Contact finished the workflow successfully" />
                  <SelectItemWithDescription value="unsubscribed" title="Unsubscribed" description="Contact unsubscribed from communications" />
                  <SelectItemWithDescription value="not_eligible" title="Not Eligible" description="Contact doesn't meet the required criteria" />
                  <SelectItemWithDescription value="opted_out" title="Opted Out" description="Contact opted out of this workflow" />
                  <SelectItemWithDescription value="goal_achieved" title="Goal Achieved" description="Workflow goal was met before completion" />
                  <SelectItemWithDescription value="duplicate" title="Duplicate" description="Contact was already in this workflow" />
                  <SelectItemWithDescription value="error" title="Error" description="A technical issue occurred" />
                  <SelectItemWithDescription value="other" title="Other" description="Custom or unlisted reason" />
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
