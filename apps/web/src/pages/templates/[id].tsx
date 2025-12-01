import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StickySaveBar,
} from '@plunk/ui';
import type {Template} from '@plunk/db';
import {DashboardLayout} from '../../components/DashboardLayout';
import {EmailSettings} from '../../components/EmailSettings';
import {EmailEditor} from '../../components/EmailEditor';
import {network} from '../../lib/network';
import {useChangeTracking} from '../../lib/hooks/useChangeTracking';
import {ArrowLeft, Save} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import useSWR from 'swr';
import {TemplateSchemas} from '@plunk/shared';
import {useActiveProject} from '../../lib/contexts/ActiveProjectProvider';

export default function TemplateEditorPage() {
  const router = useRouter();
  const {id} = router.query;
  const {activeProject} = useActiveProject();

  const {data: template, mutate} = useSWR<Template>(id ? `/templates/${id}` : null, {
    revalidateOnFocus: false,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [fromName, setFromName] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'MARKETING' | 'TRANSACTIONAL'>('MARKETING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load template data into form
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? '');
      setSubject(template.subject);
      setFrom(template.from);
      setFromName(template.fromName ?? '');
      setReplyTo(template.replyTo ?? '');
      setBody(template.body);
      setType(template.type);
      // Reset hasChanges when loading fresh data
      setHasChanges(false);
    }
  }, [template]);

  // Track changes
  useEffect(() => {
    if (!template) return;

    const changed =
      name !== template.name ||
      description !== (template.description ?? '') ||
      subject !== template.subject ||
      from !== template.from ||
      fromName !== (template.fromName ?? '') ||
      replyTo !== (template.replyTo ?? '') ||
      body !== template.body ||
      type !== template.type;

    setHasChanges(changed);
  }, [name, description, subject, from, fromName, replyTo, body, type, template]);

  // Warn before leaving page with unsaved changes
  useChangeTracking(hasChanges);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await network.fetch<Template, typeof TemplateSchemas.update>('PATCH', `/templates/${id}`, {
        name,
        description: description || undefined,
        subject,
        body,
        from,
        fromName: fromName || undefined,
        replyTo: replyTo || undefined,
        type,
      });

      // Silent save - no toast notification
      setHasChanges(false);
      void mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) {
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
            <p className="mt-2 text-sm text-neutral-500">Loading template...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className={`space-y-6 ${hasChanges ? 'pb-32' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/templates">
              <Button type="button" variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Edit Template</h1>
              <p className="text-neutral-500 mt-1">Make changes to your email template</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!hasChanges && !isSubmitting && <span className="text-sm text-neutral-500">All changes saved</span>}
            {hasChanges && !isSubmitting && <span className="text-sm text-amber-600">Unsaved changes</span>}
            <Button type="submit" disabled={!hasChanges || isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Template Editor */}
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Template Settings */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure the basic settings for your template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Welcome Email"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Sent to new subscribers"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={value => setType(value as 'MARKETING' | 'TRANSACTIONAL')}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Marketing templates will automatically include a Plunk-hosted unsubscribe link.
                  </p>
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                    placeholder="Welcome to our platform!"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Use {'{{variableName}}'} for dynamic content</p>
                </div>

                <EmailSettings
                  from={from}
                  fromName={fromName}
                  replyTo={replyTo}
                  onFromChange={setFrom}
                  onFromNameChange={setFromName}
                  onReplyToChange={setReplyTo}
                  fromNamePlaceholder={activeProject?.name || 'Your Company'}
                  showFromNameHelpText
                  layout="vertical"
                />
              </CardContent>
            </Card>
          </div>

          {/* Email Body */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Email Body</CardTitle>
                <CardDescription>Create your email using the visual editor or paste custom HTML</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailEditor
                  value={body}
                  onChange={newBody => {
                    setBody(newBody);
                    setHasChanges(true);
                  }}
                  placeholder="<h1>Welcome!</h1><p>Thanks for subscribing to our newsletter.</p>"
                  canUploadImages={true}
                  subject={subject}
                  from={from}
                  replyTo={replyTo}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Sticky Save Bar */}
      <StickySaveBar hasChanges={hasChanges} isSubmitting={isSubmitting} onSave={handleSave} />
    </DashboardLayout>
  );
}
