import React from 'react';
import { cn } from './cn';

/**
 * A single metric. Deliberately not a floating card — it sits in a divided
 * strip so a row of stats reads as one instrument cluster rather than four
 * unrelated boxes.
 */
export function Stat({ label, value, unit, delta, hint, icon: Icon, tone, className }) {
  const positive = typeof delta === 'number' && delta > 0;
  const negative = typeof delta === 'number' && delta < 0;
  return (
    <div className={cn('min-w-0 px-4 py-3.5 first:pl-0', className)}>
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon size={13} className="shrink-0 text-ink-500" aria-hidden="true" /> : null}
        <span className="truncate text-micro font-semibold uppercase tracking-label text-ink-600">
          {label}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="cq-data cq-data--lg" style={tone ? { color: tone } : undefined}>{value}</span>
        {unit ? <span className="text-xs text-ink-600">{unit}</span> : null}
        {delta != null && delta !== 0 ? (
          <span
            className={cn('cq-data text-xs font-medium', positive ? 'text-success-600' : negative ? 'text-danger-600' : 'text-ink-600')}
            title={`${positive ? 'Up' : 'Down'} ${Math.abs(delta)} points`}
          >
            {positive ? '▲' : '▼'}{Math.abs(delta)}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-0.5 truncate text-micro text-ink-600">{hint}</p> : null}
    </div>
  );
}

/** Divided horizontal strip of stats. */
export function StatStrip({ children, className, cols }) {
  return (
    <div
      className={cn(
        'grid divide-line border-y border-line',
        cols === 2 ? 'grid-cols-2 divide-x' : cols === 3 ? 'grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0'
        : 'grid-cols-2 divide-x divide-y cb:grid-cols-4 cb:divide-y-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
