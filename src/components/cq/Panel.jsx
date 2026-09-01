import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './cn';

/**
 * A bounded record. Used where a card is semantically right — a lesson, a
 * student, a class, a stat — and deliberately NOT used as generic wallpaper
 * for page sections.
 */
export const Panel = forwardRef(function Panel(
  { as, to, href, tone = 'default', pad = 'md', action, lift, raised, radius, className, children, ...rest },
  ref,
) {
  const classes = cn(
    'cq-panel',
    tone === 'quiet' && 'cq-panel--quiet',
    tone === 'flat' && 'cq-panel--flat',
    lift && 'cq-panel--lift',
    raised && 'cq-panel--raised',
    radius === 'lg' && 'cq-panel--lg',
    pad === 'md' && 'cq-panel--pad',
    pad === 'lg' && 'cq-panel--pad-lg',
    (action || to || href) && 'cq-panel--action',
    (to || href) && 'block no-underline text-inherit',
    className,
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...rest}>{children}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...rest}>{children}</a>;
  const Tag = as || (action ? 'button' : 'div');
  return (
    <Tag ref={ref} className={classes} {...(Tag === 'button' ? { type: 'button' } : null)} {...rest}>
      {children}
    </Tag>
  );
});

/** Header strip inside a panel. Keeps every panel's title treatment identical. */
export function PanelHead({ title, sub, action, icon: Icon, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-h4 font-display font-semibold text-ink-900">
          {Icon ? <Icon size={17} className="shrink-0 text-ink-600" aria-hidden="true" /> : null}
          <span className="truncate">{title}</span>
        </h3>
        {sub ? <p className="mt-1 text-xs text-ink-600">{sub}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
