import React from 'react';
import { cn } from './cn';

/**
 * Student identity is an initial and a generated geometric mark — no photos,
 * no uploads, nothing that could identify a child outside their class.
 */
export const AVATAR_KEYS = ['beaker', 'circuit', 'orbit', 'leaf', 'gear', 'prism', 'wave', 'crystal'];

const PALETTE = {
  beaker:  ['var(--cq-strand-life)',   'var(--cq-strand-life-soft)'],
  circuit: ['var(--cq-strand-forces)', 'var(--cq-strand-forces-soft)'],
  orbit:   ['var(--cq-strand-matter)', 'var(--cq-strand-matter-soft)'],
  leaf:    ['var(--cq-strand-life)',   'var(--cq-strand-life-soft)'],
  gear:    ['var(--cq-strand-build)',  'var(--cq-strand-build-soft)'],
  prism:   ['var(--cq-strand-matter)', 'var(--cq-strand-matter-soft)'],
  wave:    ['var(--cq-strand-forces)', 'var(--cq-strand-forces-soft)'],
  crystal: ['var(--cq-strand-earth)',  'var(--cq-strand-earth-soft)'],
};

const GLYPHS = {
  beaker:  <path d="M7 4h10l-1 5 4 9a2 2 0 0 1-1.8 3H6.8A2 2 0 0 1 5 18l4-9z" />,
  circuit: <path d="M4 12h4m8 0h4M12 4v4m0 8v4M9 9h6v6H9z" />,
  orbit:   <><circle cx="12" cy="12" r="3.2" /><ellipse cx="12" cy="12" rx="9" ry="4" /></>,
  leaf:    <path d="M5 19C5 10 11 4 19 4c0 9-5 15-14 15zM8 16c2-4 5-6 8-7" />,
  gear:    <><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3 5.6 18.4" /></>,
  prism:   <path d="M12 4 3 19h18z" />,
  wave:    <path d="M3 13c2.5-6 5.5-6 8 0s5.5 6 8 0" />,
  crystal: <path d="M12 3 5 9l3 11h8l3-11z M5 9h14M9 20 12 3l3 17" />,
};

export function Avatar({ name = '', avatarKey = 'beaker', size = 36, className, showRing }) {
  const [fg, bg] = PALETTE[avatarKey] || PALETTE.beaker;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center rounded-pill', showRing && 'ring-2 ring-white', className)}
      style={{ width: size, height: size, background: bg, color: fg }}
      title={name}
    >
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {GLYPHS[avatarKey] || GLYPHS.beaker}
      </svg>
      <span className="cq-sr">{name}</span>
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-pill border-2 border-white font-display font-bold"
        style={{ width: size * 0.44, height: size * 0.44, fontSize: size * 0.24, background: fg, color: '#fff' }}
      >
        {initial}
      </span>
    </span>
  );
}
