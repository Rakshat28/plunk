import {Input, Label} from '@plunk/ui';
import {EmailDomainInput} from './EmailDomainInput';

interface EmailSettingsProps {
  from: string;
  fromName: string;
  replyTo: string;
  onFromChange: (value: string) => void;
  onFromNameChange: (value: string) => void;
  onReplyToChange: (value: string) => void;
  fromPlaceholder?: string;
  fromNamePlaceholder?: string;
  replyToPlaceholder?: string;
  showFromNameHelpText?: boolean;
  layout?: 'vertical' | 'grid';
}

/**
 * Reusable email settings component for from, fromName, and replyTo fields
 * Used in campaign and template forms
 */
export function EmailSettings({
  from,
  fromName,
  replyTo,
  onFromChange,
  onFromNameChange,
  onReplyToChange,
  fromPlaceholder = 'hello',
  fromNamePlaceholder = 'Your Company',
  replyToPlaceholder = 'support',
  showFromNameHelpText = false,
  layout = 'grid',
}: EmailSettingsProps) {
  const GridWrapper = layout === 'grid' ? 'div' : 'div';
  const gridClassName = layout === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4';

  return (
    <div className="space-y-4">
      <GridWrapper className={gridClassName}>
        <div>
          <EmailDomainInput
            id="from"
            label="From Email *"
            value={from}
            onChange={onFromChange}
            required
            placeholder={fromPlaceholder}
          />
        </div>

        <div>
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            type="text"
            value={fromName}
            onChange={e => onFromNameChange(e.target.value)}
            placeholder={fromNamePlaceholder}
          />
          {showFromNameHelpText && (
            <p className="text-xs text-neutral-500 mt-1">
              The sender name that appears in the recipient&apos;s inbox. Defaults to your project name if not set.
            </p>
          )}
        </div>
      </GridWrapper>

      <GridWrapper className={layout === 'grid' ? 'grid gap-4 md:grid-cols-2' : ''}>
        <div>
          <EmailDomainInput
            id="replyTo"
            label="Reply-To Email"
            value={replyTo}
            onChange={onReplyToChange}
            placeholder={replyToPlaceholder}
          />
        </div>
      </GridWrapper>
    </div>
  );
}
