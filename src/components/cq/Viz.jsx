import React, { useId, useMemo, useState } from 'react';
import { cn } from './cn';
import { MASTERY, MASTERY_LEVELS } from './Mastery';

/* ============================================================================
   Charts.
   Every chart here encodes ONE measure, so there is no categorical series
   palette that could fail a colour-blindness check. Magnitude uses a
   single-hue ordinal ramp (validated); "no data" uses a diagonal hatch
   texture rather than a colour; identity is always carried by a text label.
   Each chart also exposes its numbers as text so the data survives greyscale
   printing and screen readers.
   ========================================================================= */

const SEQ = ['var(--viz-seq-1)', 'var(--viz-seq-2)', 'var(--viz-seq-3)', 'var(--viz-seq-4)'];

/** Reusable 45° hatch pattern for "no data" / "not started" regions. */
function HatchDef({ id }) {
  return (
    <defs>
      <pattern id={id} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="var(--viz-surface)" />
        <line x1="0" y1="0" x2="0" y2="6" stroke="var(--viz-none)" strokeWidth="2.5" />
      </pattern>
    </defs>
  );
}

/* -------------------------------------------------------- distribution ---
   How many students sit at each mastery level. Ordinal, so the ramp runs
   light→dark; "Not started" is textured, not coloured. Segments are separated
   by a 2px surface gap and each is directly labelled when it has room. */
export function MasteryDistribution({ counts = {}, total, label, className }) {
  const hatchId = useId().replace(/:/g, '');
  const sum = total ?? MASTERY_LEVELS.reduce((a, k) => a + (counts[k] || 0), 0);
  if (!sum) {
    return (
      <p className={cn('cq-hatch rounded-xs border border-dashed border-line px-3 py-4 text-center text-xs text-ink-600', className)}>
        No activity recorded yet.
      </p>
    );
  }
  const order = ['mastered', 'proficient', 'developing', 'beginning', 'not_started'];
  const fills = { mastered: SEQ[3], proficient: SEQ[2], developing: SEQ[1], beginning: SEQ[0], not_started: `url(#${hatchId})` };
  const legendFill = { mastered: SEQ[3], proficient: SEQ[2], developing: SEQ[1], beginning: SEQ[0], not_started: 'var(--viz-none)' };

  let x = 0;
  const segs = order.map((k) => {
    const n = counts[k] || 0;
    const w = (n / sum) * 100;
    const seg = { k, n, x, w };
    x += w;
    return seg;
  }).filter((s) => s.n > 0);

  return (
    <figure className={cn('w-full', className)}>
      {label ? <figcaption className="mb-2 text-xs font-medium text-ink-700">{label}</figcaption> : null}
      <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="h-3.5 w-full" role="img"
        aria-label={`${label || 'Mastery distribution'}: ${segs.map((s) => `${s.n} ${MASTERY[s.k].label}`).join(', ')} of ${sum} students`}>
        <HatchDef id={hatchId} />
        {segs.map((s) => (
          <rect key={s.k} x={`${s.x}`} y="0" width={`${Math.max(0, s.w - 0.5)}`} height="12"
            fill={fills[s.k]} stroke="var(--viz-surface)" strokeWidth="0.4" />
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-micro text-ink-700">
        {segs.map((s) => (
          <li key={s.k} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[1px]"
              style={{ background: legendFill[s.k] }} />
            <span aria-hidden="true">{MASTERY[s.k].glyph}</span>
            {MASTERY[s.k].label}
            <span className="cq-data font-medium text-ink-900">{s.n}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------- columns ---
   Weekly activity. Single series, so no legend — the title names it. Bars
   have 4px rounded tops anchored to the baseline and a 2px gap between them. */
export function ActivityColumns({ data = [], label, unit = '', height = 72, className }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const gap = 2;
  const bw = (100 - gap * (n - 1)) / n;

  return (
    <figure className={cn('w-full', className)}>
      {label ? <figcaption className="mb-2 text-xs font-medium text-ink-700">{label}</figcaption> : null}
      <div className="relative">
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ height }} className="w-full"
          role="img" aria-label={`${label || 'Activity'}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(', ')}`}>
          <line x1="0" y1={height - 0.5} x2="100" y2={height - 0.5} stroke="var(--viz-axis)" strokeWidth="1"
            vectorEffect="non-scaling-stroke" />
          {data.map((d, i) => {
            const h = Math.max(d.value > 0 ? 2 : 0, (d.value / max) * (height - 6));
            return (
              <rect key={d.label} x={i * (bw + gap)} y={height - h - 1} width={bw} height={h}
                rx="1.5" fill={hover === i ? 'var(--cq-blue-500)' : 'var(--viz-bar)'}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            );
          })}
        </svg>
        {hover != null ? (
          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xs border border-ink-900 bg-surface px-2 py-1 text-micro shadow-pop">
            <span className="font-medium">{data[hover].label}</span>{' '}
            <span className="cq-data">{data[hover].value}{unit}</span>
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex justify-between cq-data text-micro text-ink-500" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.label} className={cn(i !== 0 && i !== data.length - 1 && 'hidden sm:inline')}>{d.short || d.label}</span>
        ))}
      </div>
    </figure>
  );
}

/* ----------------------------------------------------------- sparkline ---
   Growth over attempts. 2px line, 8px end marker, first/last labelled. */
export function Sparkline({ points = [], label, height = 40, suffix = '%', className }) {
  const vals = points.map((p) => (typeof p === 'number' ? p : p.value));
  if (vals.length < 2) {
    return (
      <p className={cn('text-xs text-ink-600', className)}>
        {vals.length === 1 ? `One attempt so far — ${vals[0]}${suffix}.` : 'Not enough attempts to show a trend yet.'}
      </p>
    );
  }
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 100);
  const span = max - min || 1;
  const x = (i) => (i / (vals.length - 1)) * 100;
  const y = (v) => height - 4 - ((v - min) / span) * (height - 8);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const delta = vals[vals.length - 1] - vals[0];

  return (
    <figure className={cn('w-full', className)}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ height }} className="w-full"
        role="img" aria-label={`${label || 'Trend'}: ${vals.join(', ')}${suffix}. Change ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)} points.`}>
        <path d={d} fill="none" stroke="var(--viz-line)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          vectorEffect="non-scaling-stroke" />
        <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="4"
          fill="var(--viz-line)" stroke="var(--viz-surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1 flex items-baseline gap-1.5 text-xs">
        <span className="cq-data text-ink-700">{vals[0]}{suffix}</span>
        <span aria-hidden="true" className="text-ink-400">→</span>
        <span className="cq-data font-semibold text-ink-900">{vals[vals.length - 1]}{suffix}</span>
        {delta !== 0 ? (
          <span className={cn('cq-data font-medium', delta > 0 ? 'text-success-600' : 'text-ink-600')}>
            {delta > 0 ? '+' : ''}{delta} pts
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------- ranked bars -----
   One measure across named categories. Single hue on purpose: colour here
   would encode nothing that the label doesn't already say. An optional
   identity swatch carries the strand colour, always beside its name. */
export function RankedBars({ rows = [], suffix = '%', label, max = 100, className, emptyLabel = 'No data yet' }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => (b.value ?? -1) - (a.value ?? -1)), [rows]);
  return (
    <figure className={cn('w-full', className)}>
      {label ? <figcaption className="mb-3 text-xs font-medium text-ink-700">{label}</figcaption> : null}
      <ul className="space-y-2.5">
        {sorted.map((r) => {
          const has = r.value != null;
          const pct = has ? Math.max(0, Math.min(100, (r.value / max) * 100)) : 0;
          return (
            <li key={r.key || r.label}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-xs text-ink-800">
                  {r.swatch ? (
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[1px]" style={{ background: r.swatch }} />
                  ) : null}
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="cq-data shrink-0 text-xs text-ink-900">
                  {has ? `${Math.round(r.value)}${suffix}` : <span className="text-ink-600">{emptyLabel}</span>}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-[2px] border border-line bg-ink-100">
                {has ? (
                  <div className="h-full rounded-r-[2px]" style={{ width: `${pct}%`, background: 'var(--viz-bar)' }} />
                ) : (
                  <div className="cq-hatch h-full" />
                )}
              </div>
              {r.hint ? <p className="mt-0.5 text-micro text-ink-600">{r.hint}</p> : null}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** 6 tiny sparkline cards — small multiples instead of a 6-series line chart. */
export function SmallMultiples({ items = [], className }) {
  return (
    <div className={cn('grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 cb:grid-cols-3', className)}>
      {items.map((it) => (
        <div key={it.key} className="bg-surface p-3.5">
          <div className="flex items-center gap-2">
            {it.swatch ? <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[1px]" style={{ background: it.swatch }} /> : null}
            <p className="truncate text-xs font-medium text-ink-800">{it.label}</p>
          </div>
          <p className="cq-data cq-data--md mt-1 text-ink-900">
            {it.value != null ? `${Math.round(it.value)}%` : '—'}
          </p>
          <Sparkline points={it.points || []} label={it.label} height={30} className="mt-1" />
        </div>
      ))}
    </div>
  );
}
