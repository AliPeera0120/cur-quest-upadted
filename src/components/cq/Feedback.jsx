import React from 'react';
import { Info, TriangleAlert, Check, Lightbulb } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

const CALLOUT = {
  info:    { cls: 'border-blue-200 bg-blue-50 text-blue-800',        Icon: Info },
  note:    { cls: 'border-ink-200 bg-paper-2 text-ink-800',          Icon: Lightbulb },
  success: { cls: 'border-[#B9DFCF] bg-success-50 text-success-700', Icon: Check },
  warning: { cls: 'border-[#EDD9A8] bg-warning-50 text-warning-700', Icon: TriangleAlert },
  danger:  { cls: 'border-[#F0C4C1] bg-danger-50 text-danger-700',   Icon: TriangleAlert },
};

export function Callout({ tone = 'info', title, children, icon, className }) {
  const { cls, Icon } = CALLOUT[tone] || CALLOUT.info;
  const Ico = icon || Icon;
  return (
    <div className={cn('flex gap-3 rounded-md border-l-2 border-y border-r px-4 py-3 text-sm', cls, className)}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}>
      <Ico size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && 'mt-1', 'text-current/90')}>{children}</div> : null}
      </div>
    </div>
  );
}

/** Empty states always say what to do next, never just "no data". */
export function EmptyState({ icon: Icon, title, children, action, className, compact }) {
  return (
    <div className={cn('cq-hatch rounded-md border border-dashed border-line text-center',
      compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      {Icon ? (
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-md border border-line bg-surface text-ink-600">
          <Icon size={19} aria-hidden="true" />
        </span>
      ) : null}
      <p className="font-display text-h4 font-semibold text-ink-900">{title}</p>
      {children ? <div className="mx-auto mt-1.5 max-w-measure-short text-sm text-ink-700">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', detail, onRetry, className }) {
  return (
    <div className={cn('rounded-md border border-[#F0C4C1] bg-danger-50 px-5 py-6 text-center', className)} role="alert">
      <TriangleAlert size={20} className="mx-auto mb-2 text-danger-600" aria-hidden="true" />
      <p className="font-display font-semibold text-danger-700">{title}</p>
      {detail ? <p className="mx-auto mt-1 max-w-measure-short text-sm text-ink-700">{detail}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>
      ) : null}
    </div>
  );
}

/** Skeleton block. Uses a slow sweep, disabled under reduced-motion. */
export function Skeleton({ className, rounded = 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative block overflow-hidden bg-ink-100', rounded === 'pill' ? 'rounded-pill' : 'rounded-xs', className)}
    >
      <span className="absolute inset-0 motion:animate-sweep"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent)' }} />
    </span>
  );
}
