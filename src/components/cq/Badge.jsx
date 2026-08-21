import React from 'react';
import { cn } from './cn';

const TONES = {
  default: '', solid: 'cq-badge--solid', info: 'cq-badge--info', ember: 'cq-badge--ember',
  success: 'cq-badge--success', warning: 'cq-badge--warning', danger: 'cq-badge--danger',
};

export function Badge({ tone = 'default', square, icon: Icon, className, children, ...rest }) {
  return (
    <span className={cn('cq-badge', TONES[tone], square && 'cq-badge--square', className)} {...rest}>
      {Icon ? <Icon size={11} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** A selectable filter token. Pressed state is announced, not just coloured. */
export function Chip({ active, count, className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cn(
        'inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-pill border px-3 text-xs font-medium transition-colors duration-1 ease-out',
        active
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
          : 'border-ink-200 bg-surface text-ink-700 shadow-xs hover:border-ink-300 hover:bg-ink-50',
        className,
      )}
      {...rest}
    >
      {children}
      {count != null ? (
        <span className={cn('cq-data text-micro', active ? 'text-white/75' : 'text-ink-500')}>{count}</span>
      ) : null}
    </button>
  );
}
