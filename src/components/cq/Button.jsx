import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './cn';

const VARIANTS = {
  primary: 'cq-btn--primary',
  /* The documented orange accent. Without this entry `variant="accent"` fell
     through to primary, so the brand colour never reached a real button. */
  accent: 'cq-btn--accent',
  secondary: 'cq-btn--secondary',
  outline: 'cq-btn--outline',
  ghost: 'cq-btn--ghost',
  danger: 'cq-btn--danger',
  onDark: 'cq-btn--onDark',
  outlineOnDark: 'cq-btn--outlineOnDark',
};

const SIZES = { sm: 'cq-btn--sm', md: '', lg: 'cq-btn--lg', xl: 'cq-btn--xl' };

/**
 * The one button in the product.
 *
 * `as` switches the rendered element: a router <Link> when `to` is given,
 * an <a> when `href` is given, otherwise a <button>. Consumers never need to
 * restyle an anchor to look like a button.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    block,
    iconOnly,
    to,
    href,
    className,
    children,
    loading,
    type,
    'aria-label': ariaLabel,
    ...rest
  },
  ref,
) {
  const classes = cn(
    'cq-btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size],
    block && 'cq-btn--block',
    iconOnly && 'cq-btn--icon',
    className,
  );

  const inner = (
    <>
      {loading && <Spinner className="shrink-0" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-label={ariaLabel} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        aria-label={ariaLabel}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        {...rest}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type || 'button'}
      className={classes}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      {...rest}
    >
      {inner}
    </button>
  );
});

export function Spinner({ className, label }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center', className)}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className="animate-spin">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M18 10a8 8 0 0 0-8-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="cq-sr">{label || 'Loading'}</span>
    </span>
  );
}
