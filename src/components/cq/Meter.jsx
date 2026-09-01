import React from 'react';
import { cn } from './cn';

/**
 * Progress track. Renders as a real <div role="meter"> with the value in the
 * accessible name, and the numeric value beside it in print — never a bare
 * coloured bar.
 */
export function Meter({
  value = 0, max = 100, label, tone = 'blue', size = 'md',
  showValue = true, hideLabel = false, valueSuffix = '%', hint, className, barClassName,
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color =
    tone === 'mastery-mastered'   ? 'var(--cq-mastery-mastered)'
  : tone === 'mastery-proficient' ? 'var(--cq-mastery-proficient)'
  : tone === 'mastery-developing' ? 'var(--cq-mastery-developing)'
  : tone === 'mastery-beginning'  ? 'var(--cq-mastery-beginning)'
  : tone === 'ember'   ? 'var(--cq-ember-600)'
  : tone === 'success' ? 'var(--cq-success-500)'
  : tone === 'danger'  ? 'var(--cq-danger-600)'
  : tone === 'ink'     ? 'var(--cq-ink-700)'
  : tone?.startsWith('strand-') ? `var(--cq-strand-${tone.slice(7)})`
  : 'var(--cq-blue-600)';

  return (
    <div className={cn('w-full', className)}>
      {/* The label doubles as the meter's accessible name, so when it is
          rendered visually it must not also be announced twice. `hideLabel`
          keeps the name without printing it — used where the surrounding row
          already says what the bar is about. */}
      {((label && !hideLabel) || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && !hideLabel ? <span className="truncate text-xs font-medium text-ink-700">{label}</span> : <span />}
          {showValue ? (
            <span className="cq-data text-xs text-ink-800">{Math.round(value)}{valueSuffix}</span>
          ) : null}
        </div>
      )}
      <div
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ? `${label}: ${Math.round(value)}${valueSuffix}` : undefined}
        className={cn('cq-meter', size === 'lg' && 'cq-meter--lg', size === 'sm' && 'cq-meter--sm', barClassName)}
      >
        <div className="cq-meter__fill relative" style={{ width: `${pct}%`, background: color }} />
      </div>
      {hint ? <p className="mt-1 text-micro text-ink-600">{hint}</p> : null}
    </div>
  );
}

/** Blocky 10-segment gauge, for the student-facing "██████░░░░ 72%" reading. */
export function SegmentGauge({ value = 0, segments = 10, tone = 'blue', label, className }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  const color = tone?.startsWith('strand-') ? `var(--cq-strand-${tone.slice(7)})` : 'var(--cq-blue-600)';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex gap-[3px]" role="img" aria-label={`${label ? `${label}: ` : ''}${Math.round(value)} percent`}>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="h-3.5 w-2 rounded-[1px]"
            style={{ background: i < filled ? color : 'var(--cq-ink-200)' }}
          />
        ))}
      </span>
      <span className="cq-data text-xs text-ink-800">{Math.round(value)}%</span>
    </div>
  );
}
