import React from 'react';
import { cn } from './cn';

/**
 * The small uppercase label that sits above a heading. Present on every major
 * section so the whole product feels like one voice.
 */
export function Kicker({ children, onDark, orange, pill, dot = true, className }) {
  return (
    <p className={cn('cq-eyebrow', pill && 'cq-eyebrow--pill', orange && 'cq-eyebrow--orange',
      onDark && 'cq-eyebrow--onDark', className)}>
      {dot ? <span aria-hidden="true" className="cq-eyebrow__dot" /> : null}
      <span>{children}</span>
    </p>
  );
}

/** Alias kept so the two names can be used interchangeably in page code. */
export const Eyebrow = Kicker;

/** A plain hairline divider. */
export function TickRule({ className, onDark }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-px w-full', onDark ? 'bg-white/12' : 'bg-line', className)}
    />
  );
}

/** Standard section heading block: eyebrow, title, optional lede and action. */
export function SectionHeader({
  kicker, title, lede, action, align = 'start', onDark, level = 2, pill, className,
}) {
  const H = `h${level}`;
  return (
    <header
      className={cn(
        'flex flex-col gap-5 cb:flex-row cb:items-end cb:justify-between',
        align === 'center' && 'items-center text-center cb:flex-col cb:items-center',
        className,
      )}
    >
      <div className={cn('max-w-[62ch]', align === 'center' && 'mx-auto')}>
        {kicker ? <Kicker onDark={onDark} pill={pill}>{kicker}</Kicker> : null}
        <H className={cn('mt-3.5 text-h2', onDark && 'text-white')}>{title}</H>
        {lede ? (
          <p className={cn('mt-4 text-lead', onDark ? 'text-white/75' : 'text-ink-600')}>{lede}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
