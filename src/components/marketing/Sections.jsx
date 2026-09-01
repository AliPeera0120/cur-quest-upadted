import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Kicker, Reveal, cn } from '@/components/cq';

/* ============================================================================
   Marketing section primitives.

   Pages vary their composition — split screens, editorial rows, feature grids,
   full-bleed colour bands — while the type scale, spacing rhythm and label
   treatment stay identical everywhere. Variety of layout, consistency of
   language: that combination is what stops a site reading like a stack of
   independently generated templates.
   ========================================================================= */

/** A page section. `tone` picks the surface; spacing comes from one token. */
export function Band({
  kicker, title, lede, children, tone = 'white', wash = false,
  id, className, align = 'start', dense, actions, headerClassName,
}) {
  const surface =
    tone === 'ink' ? 'bg-ink-950 text-white'
    : tone === 'blue' ? 'bg-blue-800 text-white'
    : tone === 'tint' ? 'bg-paper-2'
    : 'bg-white';
  const onDark = tone === 'ink' || tone === 'blue';
  return (
    <section id={id} className={cn('relative', surface, wash && 'cq-wash', className)}>
      <div className={cn('cq-container relative', dense ? 'cq-section--tight' : 'cq-section')}>
        {(kicker || title) && (
          <Reveal className={cn('max-w-[64ch]', align === 'center' && 'mx-auto text-center', headerClassName)}>
            {kicker ? <Kicker onDark={onDark} pill>{kicker}</Kicker> : null}
            {title ? <h2 className={cn('mt-4 text-h2', onDark && 'text-white')}>{title}</h2> : null}
            {lede ? (
              <p className={cn('mt-4 text-lead', onDark ? 'text-white/75' : 'text-ink-600')}>{lede}</p>
            ) : null}
            {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
          </Reveal>
        )}
        {children ? <div className={cn(kicker || title ? 'mt-12 cb:mt-14' : '')}>{children}</div> : null}
      </div>
    </section>
  );
}

/** Text on one side, a visual on the other. Used instead of another card row. */
export function Split({ children, visual, flip, ratio = 'even', align = 'center', className }) {
  return (
    <div className={cn(
      'grid items-center gap-10 cb:gap-[clamp(2.5rem,4.5vw,5rem)]',
      ratio === 'text' ? 'cb:grid-cols-[1.15fr_1fr]' : ratio === 'visual' ? 'cb:grid-cols-[1fr_1.15fr]' : 'cb:grid-cols-2',
      align === 'start' && 'items-start',
      className,
    )}>
      <div className={cn('min-w-0', flip && 'cb:order-2')}>{children}</div>
      <div className={cn('min-w-0', flip && 'cb:order-1')}>{visual}</div>
    </div>
  );
}

/**
 * Editorial rows separated by hairlines. These are steps in an argument, not
 * independent records, so they are deliberately not boxed as cards.
 */
export function Ledger({ items, className, onDark, numbered = true }) {
  return (
    <ol className={cn('divide-y', onDark ? 'divide-white/12' : 'divide-line', className)}>
      {items.map((item, i) => (
        <Reveal as="li" key={item.title} delay={i * 60}
          className="grid gap-4 py-7 cb:grid-cols-[auto_1fr_auto] cb:items-start cb:gap-8">
          {numbered ? (
            <span className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-pill text-sm font-bold',
              onDark ? 'bg-white/12 text-white' : 'bg-blue-50 text-blue-700',
            )}>
              {i + 1}
            </span>
          ) : item.icon ? (
            <span className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-md',
              onDark ? 'bg-white/12 text-white' : 'bg-blue-50 text-blue-600',
            )}>
              <item.icon size={20} aria-hidden="true" />
            </span>
          ) : <span />}
          <div className="min-w-0">
            <h3 className={cn('text-h4 font-semibold', onDark && 'text-white')}>{item.title}</h3>
            <p className={cn('mt-2 max-w-[62ch]', onDark ? 'text-white/70' : 'text-ink-600')}>{item.body}</p>
            {item.detail ? (
              <p className={cn('mt-2.5 text-xs font-medium', onDark ? 'text-white/50' : 'text-ink-500')}>
                {item.detail}
              </p>
            ) : null}
          </div>
          {item.to ? (
            <Link
              to={item.to}
              className={cn('inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold no-underline',
                onDark ? 'text-white hover:text-orange-300' : 'text-blue-600 hover:text-blue-500')}
            >
              {item.linkLabel || 'Read more'}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </Reveal>
      ))}
    </ol>
  );
}

/** Feature grid with intentionally uneven spans, so it never reads as thirds. */
export function FeatureGrid({ children, className }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 cb:grid-cols-6', className)}>
      {children}
    </div>
  );
}

export function FeatureCard({
  span = 2, children, tone = 'white', className, to, href, image, imageAlt,
}) {
  const cls = cn(
    'group relative flex min-w-0 flex-col overflow-hidden rounded-lg border no-underline',
    tone === 'ink' ? 'border-transparent bg-ink-950 text-white'
      : tone === 'blue' ? 'border-transparent bg-blue-800 text-white'
      : tone === 'tint' ? 'border-transparent bg-paper-2'
      : 'border-line bg-white',
    (to || href) && 'cq-panel--action shadow-xs',
    span === 2 ? 'cb:col-span-2' : span === 3 ? 'cb:col-span-3' : span === 4 ? 'cb:col-span-4' : span === 6 ? 'cb:col-span-6' : 'cb:col-span-2',
    className,
  );
  const body = (
    <>
      {image ? (
        <div className="overflow-hidden bg-ink-100">
          <img src={image} alt={imageAlt || ''} loading="lazy" decoding="async"
            className="aspect-[16/9] w-full object-cover transition-transform duration-4 ease-out group-hover:scale-[1.03]" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </>
  );
  if (to) return <Link to={to} className={cls}>{body}</Link>;
  if (href) return <a href={href} className={cls}>{body}</a>;
  return <div className={cls}>{body}</div>;
}

/** Full-bleed statement. One idea, set large, nothing competing. */
export function Statement({ children, cite, action, tone = 'blue', className }) {
  return (
    <section className={cn('relative overflow-hidden',
      tone === 'blue' ? 'bg-blue-800 text-white' : 'bg-ink-950 text-white', className)}>
      <div aria-hidden="true" className="absolute inset-0 opacity-60"
        style={{ background: 'radial-gradient(900px 420px at 85% 0%, rgba(237,114,25,.22), transparent 62%)' }} />
      <div className="cq-container relative cq-section--tight">
        <div className="grid gap-8 cb:grid-cols-[1.4fr_auto] cb:items-end">
          <p className="max-w-[30ch] font-display text-[clamp(1.75rem,1.1rem+2.4vw,2.875rem)] font-bold leading-[1.16] tracking-[-0.028em]">
            {children}
          </p>
          <div>
            {cite ? <p className="text-sm text-white/60">{cite}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inline link with a trailing arrow, used instead of a "learn more" button. */
export function TextLink({ to, href, children, onDark, className }) {
  const cls = cn(
    'group/link inline-flex items-center gap-1.5 text-sm font-semibold no-underline',
    onDark ? 'text-white hover:text-orange-300' : 'text-blue-600 hover:text-blue-500',
    className,
  );
  const inner = (
    <>
      {children}
      {href
        ? <ArrowUpRight size={15} aria-hidden="true" />
        : <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-2 group-hover/link:translate-x-0.5" />}
    </>
  );
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <Link to={to} className={cls}>{inner}</Link>;
}

/** A photo or diagram with a real caption. */
export function Figure({ children, caption, className, rounded = true }) {
  return (
    <figure className={cn('min-w-0', className)}>
      <div className={cn('overflow-hidden bg-ink-100', rounded && 'rounded-lg')}>
        {children}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-xs leading-relaxed text-ink-500">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

/** A row of headline numbers. */
export function StatRow({ items, onDark, className }) {
  return (
    <dl className={cn('grid gap-6 sm:grid-cols-2 cb:grid-cols-4', className)}>
      {items.map((s) => (
        <div key={s.label} className={cn('rounded-md border p-5',
          onDark ? 'border-white/12 bg-white/[0.04]' : 'border-line bg-white shadow-xs')}>
          <dd className={cn('cq-data cq-data--lg', onDark ? 'text-white' : 'text-blue-700')}>{s.value}</dd>
          <dt className={cn('mt-1.5 text-sm font-medium', onDark ? 'text-white/70' : 'text-ink-600')}>{s.label}</dt>
          {s.hint ? <p className={cn('mt-1 text-xs', onDark ? 'text-white/50' : 'text-ink-500')}>{s.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}
