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
  Switch
} from '@plunk/ui';
import type {Template, Workflow, WorkflowExecution, WorkflowStep, WorkflowTransition} from '@plunk/db';
import {DashboardLayout} from '../../components/DashboardLayout';
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
  Webhook
} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import {WorkflowBuilder} from '../../components/WorkflowBuilder';
import {ReactFlowProvider} from '@xyflow/react';
import {WorkflowSchemas} from '@plunk/shared';

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

    // Check for CONDITION steps that don't have both yes and no branches
    workflow.steps.forEach(step => {
      if (step.type === 'CONDITION' && step.outgoingTransitions) {
        const hasYesBranch = step.outgoingTransitions.some(t => {
          const condition = t.condition;
          return condition && typeof condition === 'object' && 'branch' in condition && condition.branch === 'yes';
        });
        const hasNoBranch = step.outgoingTransitions.some(t => {
          const condition = t.condition;
          return condition && typeof condition === 'object' && 'branch' in condition && condition.branch === 'no';
        });

        if (!hasYesBranch || !hasNoBranch) {
          errors.push(`"${step.name}" condition step must have both YES and NO branches connected`);
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

  const handleUpdateSettings = async (data: {name: string; description?: string}) => {
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

    window.addEventListener('workflow-edit-step', handleEditStepEvent);
    return () => {
      window.removeEventListener('workflow-edit-step', handleEditStepEvent);
    };
  }, [workflow]);

  if (!workflow) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg
              className="h-8 w-8 animate-spin mx-auto text-neutral-900"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-500">Loading workflow...</p>
          </div>
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
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No executions yet</h3>
                  <p className="text-neutral-500 mb-6">
                    This workflow hasn&apos;t been executed yet. Enable it to start processing contacts.
                  </p>
                </div>
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
                            {new Date(execution.startedAt).toLocaleString()}
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
  onSave: (data: {name: string; description?: string; allowReentry?: boolean}) => Promise<void>;
}

function SettingsDialog({workflow, open, onOpenChange, onSave}: SettingsDialogProps) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description ?? '');
  const [allowReentry, setAllowReentry] = useState(workflow.allowReentry ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave({name, description: description || undefined, allowReentry});
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

  // DELAY fields
  const [delayAmount, setDelayAmount] = useState('24');
  const [delayUnit, setDelayUnit] = useState<'hours' | 'days' | 'minutes'>('hours');

  // CONDITION fields
  const [conditionField, setConditionField] = useState('');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // WAIT_FOR_EVENT fields
  const [eventName, setEventName] = useState('');
  const [eventTimeoutAmount, setEventTimeoutAmount] = useState('1');
  const [eventTimeoutUnit, setEventTimeoutUnit] = useState<'minutes' | 'hours' | 'days'>('days');

  // WEBHOOK fields
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookMethod, setWebhookMethod] = useState('POST');
  const [webhookHeaders, setWebhookHeaders] = useState('');

  // UPDATE_CONTACT fields
  const [contactUpdates, setContactUpdates] = useState('');

  // EXIT fields
  const [exitReason, setExitReason] = useState('completed');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {data: templatesData} = useSWR<{templates: Template[]}>('/templates?pageSize=100');
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
          const response = await network.fetch<{fields: string[]}>('GET', url);
          setAvailableFields(response.fields);

          // Set default field if available
          if (response.fields.length > 0 && !conditionField) {
            setConditionField(response.fields[0]!);
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
        config = {templateId};
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
        if (!contactUpdates.trim()) {
          toast.error('Contact updates are required');
          setIsSubmitting(false);
          return;
        }

        try {
          const updates = JSON.parse(contactUpdates);
          config = {updates};
        } catch {
          toast.error('Invalid JSON in contact updates');
          setIsSubmitting(false);
          return;
        }
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
      setContactUpdates('');
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
          <DialogTitle>Add Workflow Step</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Step Type *</Label>
            <Select value={type} onValueChange={value => setType(value as WorkflowStep['type'])}>
              <SelectTrigger id="type">
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
                <SelectItemWithDescription value="EXIT" title="Exit" description="End the workflow for this contact" />
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 mt-1">
              Note: The trigger step is automatically created with every workflow
            </p>
          </div>

          <div>
            <Label htmlFor="name">Step Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., Send Welcome Email"
            />
          </div>

          {/* SEND_EMAIL Configuration */}
          {type === 'SEND_EMAIL' && (
            <div>
              <Label htmlFor="template">Email Template *</Label>
              <Select value={templateId} onValueChange={setTemplateId} required>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.templates.map(template => (
                    <SelectItemWithDescription
                      key={template.id}
                      value={template.id}
                      title={template.name}
                      description={`${template.type === 'TRANSACTIONAL' ? 'Transactional' : 'Marketing'} • Subject: ${template.subject}`}
                    />
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* DELAY Configuration */}
          {type === 'DELAY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayAmount">Amount *</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="delayUnit">Unit *</Label>
                  <Select
                    value={delayUnit}
                    onValueChange={value => setDelayUnit(value as 'hours' | 'days' | 'minutes')}
                  >
                    <SelectTrigger id="delayUnit">
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
            </div>
          )}

          {/* CONDITION Configuration */}
          {type === 'CONDITION' && (
            <div className="space-y-4 p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600">Configure the condition to evaluate</p>

              <div>
                <Label htmlFor="conditionField">Field to Check *</Label>
                {loadingFields ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-500">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading fields...
                  </div>
                ) : availableFields.length > 0 ? (
                  <>
                    <Select value={conditionField} onValueChange={setConditionField} required>
                      <SelectTrigger id="conditionField">
                        <SelectValue placeholder="Select a field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500 mt-1">
                      Select from {availableFields.length} field{availableFields.length !== 1 ? 's' : ''} in your
                      contacts
                    </p>
                  </>
                ) : (
                  <>
                    <Input
                      id="conditionField"
                      type="text"
                      value={conditionField}
                      onChange={e => setConditionField(e.target.value)}
                      required
                      placeholder="e.g., subscribed or data.plan"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      No fields found in contacts. Enter a field manually.
                    </p>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="conditionOperator">Operator *</Label>
                <Select value={conditionOperator} onValueChange={setConditionOperator}>
                  <SelectTrigger id="conditionOperator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEquals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="notContains">Not Contains</SelectItem>
                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                    <SelectItem value="lessThan">Less Than</SelectItem>
                    <SelectItem value="greaterThanOrEqual">Greater Than or Equal</SelectItem>
                    <SelectItem value="lessThanOrEqual">Less Than or Equal</SelectItem>
                    <SelectItem value="exists">Exists</SelectItem>
                    <SelectItem value="notExists">Not Exists</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="conditionValue">Value *</Label>
                <Input
                  id="conditionValue"
                  type="text"
                  value={conditionValue}
                  onChange={e => setConditionValue(e.target.value)}
                  required
                  placeholder="e.g., true, false, premium, 100"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter: true/false for booleans, numbers for comparisons, or text for strings
                </p>
              </div>
            </div>
          )}

          {/* WAIT_FOR_EVENT Configuration */}
          {type === 'WAIT_FOR_EVENT' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                {eventNamesData?.eventNames && eventNamesData.eventNames.length > 0 ? (
                  <Select value={eventName} onValueChange={setEventName} required>
                    <SelectTrigger id="eventName">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventNamesData.eventNames.map(name => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="eventName"
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    required
                    placeholder="e.g., email.clicked, user.upgraded"
                  />
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  {eventNamesData?.eventNames && eventNamesData.eventNames.length > 0
                    ? 'Select from previously tracked events'
                    : 'The event name to wait for'}
                </p>
              </div>

              <div>
                <Label htmlFor="eventTimeoutAmount">Timeout</Label>
                <div className="flex gap-2">
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
              </div>
            </div>
          )}

          {/* WEBHOOK Configuration */}
          {type === 'WEBHOOK' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                  placeholder="https://api.example.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="webhookMethod">HTTP Method *</Label>
                <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                  <SelectTrigger id="webhookMethod">
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
                <Label htmlFor="webhookHeaders">Headers (JSON, optional)</Label>
                <textarea
                  id="webhookHeaders"
                  value={webhookHeaders}
                  onChange={e => setWebhookHeaders(e.target.value)}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono"
                  rows={3}
                />
                <p className="text-xs text-neutral-500 mt-1">Optional custom headers as JSON</p>
              </div>
            </div>
          )}

          {/* UPDATE_CONTACT Configuration */}
          {type === 'UPDATE_CONTACT' && (
            <div>
              <Label htmlFor="contactUpdates">Contact Data Updates (JSON) *</Label>
              <textarea
                id="contactUpdates"
                value={contactUpdates}
                onChange={e => setContactUpdates(e.target.value)}
                required
                placeholder='{"plan": "premium", "lastEngaged": "2025-01-19"}'
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono"
                rows={4}
              />
              <p className="text-xs text-neutral-500 mt-1">JSON object with fields to update in contact.data</p>
            </div>
          )}

          {/* EXIT Configuration */}
          {type === 'EXIT' && (
            <div>
              <Label htmlFor="exitReason">Exit Reason</Label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger id="exitReason">
                  <SelectValue placeholder="Select exit reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed - Contact completed the workflow successfully</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed - Contact unsubscribed</SelectItem>
                  <SelectItem value="not_eligible">Not Eligible - Contact doesn&apos;t meet criteria</SelectItem>
                  <SelectItem value="opted_out">Opted Out - Contact opted out of this workflow</SelectItem>
                  <SelectItem value="goal_achieved">Goal Achieved - Workflow goal was met early</SelectItem>
                  <SelectItem value="duplicate">Duplicate - Contact already in workflow</SelectItem>
                  <SelectItem value="error">Error - Technical issue occurred</SelectItem>
                  <SelectItem value="other">Other - Custom reason</SelectItem>
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

  // Get icon and colors for this step type
  const Icon = STEP_TYPE_ICONS[step.type as keyof typeof STEP_TYPE_ICONS] || GitBranch;
  const color = STEP_TYPE_COLORS[step.type as keyof typeof STEP_TYPE_COLORS] || '#6b7280';
  const bgColor = STEP_TYPE_BG[step.type as keyof typeof STEP_TYPE_BG] || '#f3f4f6';

  // SEND_EMAIL fields
  const [templateId, setTemplateId] = useState(step.template?.id || '');

  // DELAY fields
  const [delayAmount, setDelayAmount] = useState(String(config?.amount || '24'));
  const [delayUnit, setDelayUnit] = useState<'hours' | 'days' | 'minutes'>(
    (config?.unit === 'hours' || config?.unit === 'days' || config?.unit === 'minutes' ? config.unit : 'hours') as
      | 'hours'
      | 'days'
      | 'minutes',
  );

  // CONDITION fields - handle both old format (object) and new format (string)
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
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // WAIT_FOR_EVENT fields
  const [eventName, setEventName] = useState(String(config?.eventName || ''));
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
  const [contactUpdates, setContactUpdates] = useState(config?.updates ? JSON.stringify(config.updates, null, 2) : '');

  // EXIT fields
  const [exitReason, setExitReason] = useState(String(config?.reason || 'completed'));

  const {data: templatesData} = useSWR<{templates: Template[]}>('/templates?pageSize=100');
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
          const response = await network.fetch<{fields: string[]}>('GET', url);
          setAvailableFields(response.fields);
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
        newConfig = {templateId};
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
        if (!contactUpdates.trim()) {
          toast.error('Contact updates are required');
          setIsSubmitting(false);
          return;
        }

        try {
          const updates = JSON.parse(contactUpdates);
          newConfig = {updates};
        } catch {
          toast.error('Invalid JSON in contact updates');
          setIsSubmitting(false);
          return;
        }
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
          <DialogTitle>Edit Step</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{backgroundColor: bgColor}}>
              <Icon className="h-3.5 w-3.5" style={{color}} />
            </div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: bgColor,
                color,
              }}
            >
              {step.type.replace(/_/g, ' ')}
            </span>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editStepName">Step Name *</Label>
            <Input
              id="editStepName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., Send Welcome Email"
            />
          </div>

          {/* SEND_EMAIL Configuration */}
          {step.type === 'SEND_EMAIL' && (
            <div>
              <Label htmlFor="editTemplate">Email Template *</Label>
              <Select value={templateId} onValueChange={setTemplateId} required>
                <SelectTrigger id="editTemplate">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templatesData?.templates.map(template => (
                    <SelectItemWithDescription
                      key={template.id}
                      value={template.id}
                      title={template.name}
                      description={`${template.type === 'TRANSACTIONAL' ? 'Transactional' : 'Marketing'} • Subject: ${template.subject}`}
                    />
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* DELAY Configuration */}
          {step.type === 'DELAY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDelayAmount">Amount *</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="editDelayUnit">Unit *</Label>
                  <Select
                    value={delayUnit}
                    onValueChange={value => setDelayUnit(value as 'hours' | 'days' | 'minutes')}
                  >
                    <SelectTrigger id="editDelayUnit">
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
            </div>
          )}

          {/* CONDITION Configuration */}
          {step.type === 'CONDITION' && (
            <div className="space-y-4 p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600">Configure the condition to evaluate</p>

              <div>
                <Label htmlFor="editConditionField">Field to Check *</Label>
                {loadingFields ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-500">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading fields...
                  </div>
                ) : availableFields.length > 0 ? (
                  <>
                    <Select value={conditionField} onValueChange={setConditionField} required>
                      <SelectTrigger id="editConditionField">
                        <SelectValue placeholder="Select a field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-neutral-500 mt-1">
                      Select from {availableFields.length} field{availableFields.length !== 1 ? 's' : ''} in your
                      contacts
                    </p>
                  </>
                ) : (
                  <>
                    <Input
                      id="editConditionField"
                      type="text"
                      value={conditionField}
                      onChange={e => setConditionField(e.target.value)}
                      required
                      placeholder="e.g., subscribed or data.plan"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      No fields found in contacts. Enter a field manually.
                    </p>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="editConditionOperator">Operator *</Label>
                <Select value={conditionOperator} onValueChange={setConditionOperator}>
                  <SelectTrigger id="editConditionOperator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEquals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="notContains">Not Contains</SelectItem>
                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                    <SelectItem value="lessThan">Less Than</SelectItem>
                    <SelectItem value="greaterThanOrEqual">Greater Than or Equal</SelectItem>
                    <SelectItem value="lessThanOrEqual">Less Than or Equal</SelectItem>
                    <SelectItem value="exists">Exists</SelectItem>
                    <SelectItem value="notExists">Not Exists</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editConditionValue">Value *</Label>
                <Input
                  id="editConditionValue"
                  type="text"
                  value={conditionValue}
                  onChange={e => setConditionValue(e.target.value)}
                  required
                  placeholder="e.g., true, false, premium, 100"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter: true/false for booleans, numbers for comparisons, or text for strings
                </p>
              </div>
            </div>
          )}

          {/* WAIT_FOR_EVENT Configuration */}
          {step.type === 'WAIT_FOR_EVENT' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editEventName">Event Name *</Label>
                {eventNamesData?.eventNames && eventNamesData.eventNames.length > 0 ? (
                  <Select value={eventName} onValueChange={setEventName} required>
                    <SelectTrigger id="editEventName">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventNamesData.eventNames.map(name => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="editEventName"
                    type="text"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    required
                    placeholder="e.g., email.clicked, user.upgraded"
                  />
                )}
                <p className="text-xs text-neutral-500 mt-1">
                  {eventNamesData?.eventNames && eventNamesData.eventNames.length > 0
                    ? 'Select from previously tracked events'
                    : 'The event name to wait for'}
                </p>
              </div>

              <div>
                <Label htmlFor="editEventTimeoutAmount">Timeout</Label>
                <div className="flex gap-2">
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
              </div>
            </div>
          )}

          {/* WEBHOOK Configuration */}
          {step.type === 'WEBHOOK' && (
            <div className="space-y-4">
              {/* Info Alert about webhook body */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Request Body</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-xs">
                      Plunk will automatically send the following JSON payload with each webhook request:
                    </p>
                    <Collapsible open={showWebhookInfo} onOpenChange={setShowWebhookInfo}>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-900">
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${showWebhookInfo ? 'rotate-180' : ''}`}
                        />
                        {showWebhookInfo ? 'Hide' : 'Show'} payload structure
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <pre className="text-[10px] bg-neutral-50 p-2 rounded border border-neutral-200 overflow-x-auto">
                          {`{
  "contact": {
    "email": "user@example.com",
    "subscribed": true,
    "data": {
      // All custom contact fields
      "name": "John Doe",
      "plan": "premium"
    }
  },
  "workflow": {
    "id": "wf_...",
    "name": "Welcome Series"
  },
  "execution": {
    "id": "exec_...",
    "startedAt": "2025-01-19T..."
  },
  "event": {
    // Event data that triggered
    // the workflow (if any)
  }
}`}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="editWebhookUrl">Webhook URL *</Label>
                <Input
                  className={'font-mono'}
                  id="editWebhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                  placeholder="https://api.example.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="editWebhookMethod">HTTP Method *</Label>
                <Select value={webhookMethod} onValueChange={setWebhookMethod}>
                  <SelectTrigger id="editWebhookMethod" className={'font-mono'}>
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
                  <Label>HTTP Headers (optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWebhookHeaders([...webhookHeaders, {key: '', value: ''}])}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Header
                  </Button>
                </div>

                {webhookHeaders.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-2">
                    No custom headers. Click &quot;Add Header&quot; to include headers like Authorization.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {webhookHeaders.map((header, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Header name (e.g., Authorization)"
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
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Header value (e.g., Bearer token123)"
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
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHeaders = webhookHeaders.filter((_, i) => i !== index);
                            setWebhookHeaders(newHeaders);
                          }}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPDATE_CONTACT Configuration */}
          {step.type === 'UPDATE_CONTACT' && (
            <div>
              <Label htmlFor="editContactUpdates">Contact Data Updates (JSON) *</Label>
              <textarea
                id="editContactUpdates"
                value={contactUpdates}
                onChange={e => setContactUpdates(e.target.value)}
                required
                placeholder='{"plan": "premium", "lastEngaged": "2025-01-19"}'
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono"
                rows={4}
              />
              <p className="text-xs text-neutral-500 mt-1">JSON object with fields to update in contact.data</p>
            </div>
          )}

          {/* EXIT Configuration */}
          {step.type === 'EXIT' && (
            <div>
              <Label htmlFor="editExitReason">Exit Reason</Label>
              <Select value={exitReason} onValueChange={setExitReason}>
                <SelectTrigger id="editExitReason">
                  <SelectValue placeholder="Select exit reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed - Contact completed the workflow successfully</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed - Contact unsubscribed</SelectItem>
                  <SelectItem value="not_eligible">Not Eligible - Contact doesn&apos;t meet criteria</SelectItem>
                  <SelectItem value="opted_out">Opted Out - Contact opted out of this workflow</SelectItem>
                  <SelectItem value="goal_achieved">Goal Achieved - Workflow goal was met early</SelectItem>
                  <SelectItem value="duplicate">Duplicate - Contact already in workflow</SelectItem>
                  <SelectItem value="error">Error - Technical issue occurred</SelectItem>
                  <SelectItem value="other">Other - Custom reason</SelectItem>
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
