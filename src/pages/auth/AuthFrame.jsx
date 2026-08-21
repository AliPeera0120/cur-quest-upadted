import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/components/cq';

/**
 * The frame around every sign-in and sign-up screen.
 *
 * A split layout: the form on the left where it gets full attention, and a
 * quiet panel on the right that says what the account is for. Auth screens are
 * where people abandon a product, so there is exactly one thing to do on each
 * of them.
 */
export default function AuthFrame({ title, lede, children, aside, footer, wide }) {
  return (
    <div className="min-h-dvh bg-white">
      <a href="#main" className="cq-skip">Skip to content</a>
      <header className="border-b border-line">
        <div className="cq-container flex h-[4.5rem] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <img src="/images/logo.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-bold tracking-[-0.025em] text-ink-900">
              Curiosity<span className="text-blue-600">Quest</span>
            </span>
          </Link>
          <Link to="/arena" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Science Arena
          </Link>
        </div>
      </header>

      <main id="main" className="cq-container">
        <div className={cn('grid items-start gap-12 py-12 cb:gap-20 cb:py-20',
          aside && (wide ? 'cb:grid-cols-[1.1fr_0.9fr]' : 'cb:grid-cols-[1fr_0.85fr]'))}>
          <div className={cn('w-full', !aside && 'mx-auto max-w-md')}>
            <div className={cn(aside && 'max-w-md')}>
              <h1 className="text-h1">{title}</h1>
              {lede ? <p className="mt-3.5 text-lead text-ink-600">{lede}</p> : null}
              <div className="mt-9">{children}</div>
              {footer ? <div className="mt-8 border-t border-line pt-6">{footer}</div> : null}
            </div>
          </div>
          {aside ? <div className="w-full">{aside}</div> : null}
        </div>
      </main>
    </div>
  );
}
