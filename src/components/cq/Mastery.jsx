import React from 'react';
import { cn } from './cn';

/**
 * The mastery vocabulary, in one place.
 *
 * Every level carries three independent signals — a glyph, a word, and a
 * colour — so the information survives greyscale printing, colour blindness
 * and screen readers. Nothing in the product may show mastery as colour alone.
 */
export const MASTERY_LEVELS = ['not_started', 'beginning', 'developing', 'proficient', 'mastered'];

export const MASTERY = {
  not_started: { label: 'Not started', short: 'None',  glyph: '○', cls: 'cq-mastery--none',       rank: 0, hint: 'No evidence yet' },
  beginning:   { label: 'Beginning',   short: 'Begin', glyph: '◔', cls: 'cq-mastery--beginning',  rank: 1, hint: 'Getting started' },
  developing:  { label: 'Developing',  short: 'Devel', glyph: '◑', cls: 'cq-mastery--developing', rank: 2, hint: 'Making progress' },
  proficient:  { label: 'Proficient',  short: 'Prof',  glyph: '◕', cls: 'cq-mastery--proficient', rank: 3, hint: 'Solid understanding' },
  mastered:    { label: 'Mastered',    short: 'Master',glyph: '●', cls: 'cq-mastery--mastered',   rank: 4, hint: 'Consistent across attempts' },
};

export const masteryMeta = (level) => MASTERY[level] || MASTERY.not_started;

export function MasteryTag({ level, pct, size = 'md', showPct = true, className }) {
  const m = masteryMeta(level);
  return (
    <span
      className={cn('cq-mastery', m.cls, size === 'sm' ? 'text-xs' : 'text-sm', className)}
      title={`${m.label}${pct != null ? ` — ${Math.round(pct)}%` : ''}`}
    >
      <span className="cq-mastery__glyph" aria-hidden="true">{m.glyph}</span>
      <span>{m.label}</span>
      {showPct && pct != null ? (
        <span className="cq-data text-ink-600">{Math.round(pct)}%</span>
      ) : null}
    </span>
  );
}

/**
 * Compact matrix cell. Glyph + number, colour as reinforcement only.
 * `title` gives the full sentence for hover and for screen readers.
 */
export function MasteryCell({ level, pct, label, note, noteTitle, className }) {
  const m = masteryMeta(level);
  const empty = level === 'not_started' || pct == null;
  return (
    <span
      className={cn(
        'inline-flex min-h-[2rem] w-full items-center justify-center gap-1.5 rounded-sm border px-1.5 py-1 text-xs font-medium',
        empty ? 'cq-hatch border-line text-ink-600' : 'border-transparent',
        className,
      )}
      style={empty ? undefined : { background: `color-mix(in srgb, var(--cq-mastery-${level}) 12%, transparent)`, color: `var(--cq-mastery-${level})` }}
      title={[
        label ? `${label}: ${m.label}` : m.label,
        pct != null ? `${Math.round(pct)}%` : null,
        noteTitle || null,
      ].filter(Boolean).join(' · ')}
    >
      <span aria-hidden="true">{m.glyph}</span>
      <span className="cq-data">{empty ? '—' : `${Math.round(pct)}%`}</span>
      {note && !empty ? (
        <span className="cq-data text-[0.625rem] opacity-70">{note}</span>
      ) : null}
      <span className="cq-sr">{m.label}{noteTitle ? `, ${noteTitle}` : ''}</span>
    </span>
  );
}

/** Legend. Rendered next to every matrix so the glyph ramp is always taught. */
export function MasteryLegend({ className, compact }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs', className)}>
      {MASTERY_LEVELS.map((k) => {
        const m = MASTERY[k];
        return (
          <li key={k} className={cn('cq-mastery', m.cls)}>
            <span className="cq-mastery__glyph" aria-hidden="true">{m.glyph}</span>
            <span>{compact ? m.short : m.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
