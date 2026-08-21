import React from 'react';
import { Heart, Instagram } from 'lucide-react';

/**
 * The two bubbles that were pinned to the corners of the old site. They are
 * kept because they earn their place: donations are how this runs, and
 * Instagram is where the events actually get seen.
 *
 * Deliberately different from the originals in three ways:
 *
 *  - No perpetual bobbing animation. A thing that moves forever is a thing the
 *    eye keeps returning to, and it reads as a widget bolted on rather than
 *    part of the site. They rise once on load and lift on hover.
 *  - Stacked on one side instead of one in each corner, so they cannot collide
 *    with a toast (bottom-left) and so a kid on a phone has one thing to avoid
 *    rather than two.
 *  - Labels collapse to icon-only below `sm`, where the screen is narrow enough
 *    that a pill would sit on top of the content. The accessible name stays
 *    either way.
 *
 * Public pages only — mounted in PublicLayout, not the Arena shell. A donate
 * button floating over a student's lesson would be both distracting and, for a
 * platform aimed at minors, in poor taste.
 */

const DONATE_URL = 'https://hcb.hackclub.com/donations/start/curiosityquest';
const INSTAGRAM_URL = 'https://www.instagram.com/curiosityquest25';

export default function FloatingActions() {
  return (
    <div
      className="fixed bottom-4 right-4 z-float flex flex-col items-end gap-2.5 print:hidden cb:bottom-6 cb:right-6"
      /* The wrapper itself must not eat clicks in the gap between the two
         bubbles, or it would block whatever sits underneath. */
      style={{ pointerEvents: 'none' }}
    >
      <Bubble
        href={DONATE_URL}
        label="Donate"
        title="Donate to CuriosityQuest"
        icon={Heart}
        className="cq-float--accent"
        delay="0ms"
      />
      <Bubble
        href={INSTAGRAM_URL}
        label="Follow us"
        title="Follow CuriosityQuest on Instagram"
        icon={Instagram}
        className="cq-float--plain"
        delay="90ms"
      />
    </div>
  );
}

function Bubble({
  href, label, title, icon: Icon, className, delay,
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      className={`cq-float ${className}`}
      style={{ pointerEvents: 'auto', animationDelay: delay }}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
