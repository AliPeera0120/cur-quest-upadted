import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Kicker, cn } from '@/components/cq';

/* ============================================================================
   Chrome for the three account screens.

   These routes sit outside both PublicLayout and ArenaShell (see routes.jsx),
   and that is deliberate: a visitor mid-sign-up should not be looking at a nav
   bar full of places they cannot go yet, and a nine-year-old on a shared
   Chromebook should see exactly one thing to do. So the page is a card on a
   wash, with the logo as the only way out.
   ========================================================================= */

/** Card widths. `wide` is for the teacher form, which has two columns of copy. */
const WIDTH = {
  sm: 'max-w-[27rem]',
  md: 'max-w-[32rem]',
  lg: 'max-w-[38rem]',
};

export default function AuthLayout({ kicker, title, lede, children, aside, foot, width = 'md' }) {
  return (
    <div className="cq-wash flex min-h-dvh flex-col bg-white">
      <a href="#main" className="cq-skip">Skip to content</a>

      <header className="cq-container flex flex-wrap items-center justify-between gap-3 py-5">
        <Link to="/" className="inline-flex min-h-[2.75rem] items-center gap-2.5 no-underline">
          <img src="/images/logo.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-bold tracking-[-0.025em] text-ink-900">
            Curiosity<span className="text-blue-600">Quest</span>
          </span>
          <span className="cq-sr">CuriosityQuest home</span>
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-blue-600"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to the main site
        </Link>
      </header>

      <main id="main" className="cq-container flex-1 pb-16">
        <div
          className={cn(
            'mx-auto grid gap-8',
            aside ? 'cb:grid-cols-[minmax(0,1fr)_19.5rem] cb:gap-12' : WIDTH[width] || WIDTH.md,
          )}
        >
          <div className="min-w-0">
            <section className="cq-panel cq-panel--lg cq-panel--lift p-6 cb:p-8">
              {kicker ? <Kicker pill>{kicker}</Kicker> : null}
              <h1 className={cn('text-h2', kicker && 'mt-4')}>{title}</h1>
              {lede ? <p className="mt-3 text-ink-600">{lede}</p> : null}
              <div className="mt-7">{children}</div>
            </section>
            {foot ? (
              <div className="mx-auto mt-5 max-w-[46ch] text-center text-sm text-ink-600">{foot}</div>
            ) : null}
          </div>

          {aside ? <div className="min-w-0">{aside}</div> : null}
        </div>
      </main>
    </div>
  );
}
