import React from 'react';

/**
 * Hand-drawn SVG battle sprites for the Science Arena.
 * All units are drawn facing right; the battlefield mirrors enemy units with scaleX(-1).
 * No <defs>/gradient ids are used so the same sprite can appear many times without id clashes.
 */

// ---- Units ----
function Spark() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="44" rx="11" ry="3" fill="rgba(0,0,0,0.18)" />
      <circle cx="24" cy="24" r="15" fill="#fde68a" opacity="0.55" />
      <circle cx="24" cy="24" r="11" fill="#fbbf24" />
      <circle cx="24" cy="24" r="11" fill="none" stroke="#f59e0b" strokeWidth="2" />
      <path d="M26 15 L20 25 H24 L21 33 L30 22 H25 Z" fill="#fff7ed" stroke="#b45309" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="19" cy="21" r="2" fill="#7c2d12" />
      <circle cx="28" cy="21" r="2" fill="#7c2d12" />
    </svg>
  );
}
function VoltBot() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="45" rx="12" ry="3" fill="rgba(0,0,0,0.18)" />
      <line x1="24" y1="6" x2="24" y2="12" stroke="#0369a1" strokeWidth="2" />
      <circle cx="24" cy="6" r="3" fill="#38bdf8" />
      <rect x="12" y="12" width="24" height="20" rx="6" fill="#0ea5e9" stroke="#0369a1" strokeWidth="2" />
      <rect x="16" y="17" width="16" height="8" rx="3" fill="#0c4a6e" />
      <circle cx="21" cy="21" r="2.4" fill="#7dd3fc" />
      <circle cx="28" cy="21" r="2.4" fill="#7dd3fc" />
      <rect x="15" y="33" width="6" height="9" rx="2" fill="#0369a1" />
      <rect x="27" y="33" width="6" height="9" rx="2" fill="#0369a1" />
      <rect x="9" y="20" width="4" height="8" rx="2" fill="#0369a1" />
      <rect x="35" y="20" width="4" height="8" rx="2" fill="#0369a1" />
    </svg>
  );
}
function Gearling() {
  const teeth = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    teeth.push(
      <rect key={i} x="22" y="6" width="4" height="6" rx="1" fill="#0f766e"
        transform={`rotate(${(a * 180) / Math.PI} 24 24)`} />
    );
  }
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="45" rx="12" ry="3" fill="rgba(0,0,0,0.18)" />
      {teeth}
      <circle cx="24" cy="24" r="14" fill="#14b8a6" stroke="#0f766e" strokeWidth="2" />
      <circle cx="24" cy="24" r="7" fill="#0f766e" />
      <circle cx="21" cy="22" r="2.2" fill="#ccfbf1" />
      <circle cx="27" cy="22" r="2.2" fill="#ccfbf1" />
      <rect x="18" y="40" width="5" height="6" rx="2" fill="#0f766e" />
      <rect x="25" y="40" width="5" height="6" rx="2" fill="#0f766e" />
    </svg>
  );
}
function Golem() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="45" rx="14" ry="3" fill="rgba(0,0,0,0.2)" />
      <path d="M12 20 L18 10 L30 10 L36 20 L34 38 L14 38 Z" fill="#7f1d1d" stroke="#450a0a" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 14 L26 20 L22 26 L30 30" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 30 L21 33" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2.5" fill="#fde047" />
      <circle cx="29" cy="20" r="2.5" fill="#fde047" />
      <rect x="16" y="38" width="7" height="7" rx="2" fill="#450a0a" />
      <rect x="25" y="38" width="7" height="7" rx="2" fill="#450a0a" />
    </svg>
  );
}
function Frost() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="45" rx="9" ry="2.5" fill="rgba(0,0,0,0.15)" />
      <path d="M23 24 C10 12 6 20 12 26 C6 30 14 34 23 28 Z" fill="#a5f3fc" stroke="#0891b2" strokeWidth="1.5" />
      <path d="M25 24 C38 12 42 20 36 26 C42 30 34 34 25 28 Z" fill="#a5f3fc" stroke="#0891b2" strokeWidth="1.5" />
      <ellipse cx="24" cy="26" rx="4" ry="9" fill="#0e7490" />
      <circle cx="22" cy="20" r="1.8" fill="#ecfeff" />
      <circle cx="26" cy="20" r="1.8" fill="#ecfeff" />
      <line x1="24" y1="14" x2="21" y2="10" stroke="#0891b2" strokeWidth="1.5" />
      <line x1="24" y1="14" x2="27" y2="10" stroke="#0891b2" strokeWidth="1.5" />
    </svg>
  );
}
function Titan() {
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%">
      <ellipse cx="24" cy="45" rx="13" ry="3" fill="rgba(0,0,0,0.2)" />
      <ellipse cx="24" cy="22" rx="20" ry="8" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8" />
      <ellipse cx="24" cy="22" rx="20" ry="8" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8" transform="rotate(60 24 22)" />
      <ellipse cx="24" cy="22" rx="20" ry="8" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.8" transform="rotate(120 24 22)" />
      <circle cx="24" cy="22" r="11" fill="#7c3aed" stroke="#5b21b6" strokeWidth="2" />
      <circle cx="20" cy="20" r="2.4" fill="#ede9fe" />
      <circle cx="28" cy="20" r="2.4" fill="#ede9fe" />
      <path d="M19 27 Q24 30 29 27" fill="none" stroke="#ede9fe" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="4" cy="18" r="2" fill="#c4b5fd" />
      <circle cx="44" cy="26" r="2" fill="#c4b5fd" />
    </svg>
  );
}

const UNIT_SVGS = { spark: Spark, voltbot: VoltBot, gearling: Gearling, golem: Golem, frost: Frost, titan: Titan };

export function UnitSprite({ id }) {
  const Comp = UNIT_SVGS[id] || VoltBot;
  return <Comp />;
}

// ---- Towers ----
export function TowerSprite({ variant }) {
  const enemy = variant === 'enemy';
  const body = enemy ? '#b91c1c' : '#055b8e';
  const bodyDark = enemy ? '#7f1d1d' : '#044a73';
  const orb = enemy ? '#fca5a5' : '#7dd3fc';
  const orbGlow = enemy ? '#ef4444' : '#38bdf8';
  return (
    <svg viewBox="0 0 64 96" width="100%" height="100%">
      <ellipse cx="32" cy="92" rx="24" ry="5" fill="rgba(0,0,0,0.18)" />
      {/* base */}
      <rect x="12" y="46" width="40" height="44" rx="6" fill={body} stroke={bodyDark} strokeWidth="3" />
      <rect x="12" y="46" width="40" height="10" fill={bodyDark} opacity="0.4" />
      {/* battlements */}
      <rect x="10" y="40" width="10" height="10" fill={body} stroke={bodyDark} strokeWidth="2" />
      <rect x="27" y="40" width="10" height="10" fill={body} stroke={bodyDark} strokeWidth="2" />
      <rect x="44" y="40" width="10" height="10" fill={body} stroke={bodyDark} strokeWidth="2" />
      {/* door */}
      <rect x="26" y="66" width="12" height="24" rx="6" fill={bodyDark} />
      {/* glowing science orb / flask on top */}
      <circle cx="32" cy="26" r="16" fill={orbGlow} opacity="0.25" />
      <path d="M27 12 h10 v6 l6 12 a8 8 0 0 1 -7 12 h-8 a8 8 0 0 1 -7 -12 l6 -12 z" fill={orb} stroke={bodyDark} strokeWidth="2" />
      <circle cx="32" cy="30" r="4" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
