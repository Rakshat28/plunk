import {cn} from '../../lib';

export interface IconSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-4 h-4',
    border: 'border-2',
    innerInset: 'inset-0.5',
    dot: 'w-1 h-1',
  },
  md: {
    container: 'w-8 h-8',
    border: 'border-[2.5px]',
    innerInset: 'inset-1',
    dot: 'w-1.5 h-1.5',
  },
  lg: {
    container: 'w-12 h-12',
    border: 'border-[3px]',
    innerInset: 'inset-1.5',
    dot: 'w-2 h-2',
  },
  xl: {
    container: 'w-16 h-16',
    border: 'border-[3px]',
    innerInset: 'inset-2',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * Animated spinner icon component with dual rotating rings
 */
export function IconSpinner({size = 'md', className}: IconSpinnerProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('relative inline-block', config.container, className)}>
      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-full bg-neutral-900/10 blur-sm animate-pulse" />

      {/* Base circle */}
      <div className={cn('absolute inset-0 rounded-full border-neutral-100', config.border)} />

      {/* Primary animated ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full border-transparent border-t-neutral-900 border-r-neutral-700 animate-spin',
          config.border,
        )}
        style={{animationDuration: '0.8s'}}
      />

      {/* Secondary animated ring (counter-rotating) */}
      <div
        className={cn(
          'absolute rounded-full border-transparent border-b-neutral-800 border-l-neutral-600 animate-spin',
          config.border,
          config.innerInset,
        )}
        style={{animationDuration: '1.2s', animationDirection: 'reverse'}}
      />

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn('bg-neutral-900 rounded-full animate-pulse', config.dot)} />
      </div>
    </div>
  );
}
