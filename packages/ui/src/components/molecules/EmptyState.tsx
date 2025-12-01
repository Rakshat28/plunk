import type {LucideIcon} from 'lucide-react';
import * as React from 'react';

import {cn} from '../../lib';
import {Button} from '../atoms';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({icon: Icon, title, description, action, className}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
