import React from 'react';
import { cn } from './cn';

/* ============================================================================
   Diagrams.
   Instead of stock photography or abstract gradient blobs, the site is
   illustrated with annotated technical diagrams — the kind of thing that
   would actually be sketched in a lab notebook. Each one is hand-authored
   SVG: a few hundred bytes, scales perfectly, inherits design tokens, and
   carries a real caption so it means something to a screen reader.
   ========================================================================= */

const L = 'var(--cq-ink-900)';     // primary line work
const L2 = 'var(--cq-ink-400)';    // construction lines
const A = 'var(--cq-orange-500)';  // annotation / vector accent
const F = 'var(--cq-blue-100)';    // flat fill

/** Shared label chip. Monospace, uppercase — matches the kicker treatment. */
function Tag({ x, y, children, anchor = 'start', tone = L }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={tone}
      style={{ font: "600 8px var(--font-sans)", letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </text>
  );
}

function Frame({ children, viewBox = '0 0 220 160', label, className, grid = true, ...rest }) {
  return (
    <figure className={cn('relative', className)} {...rest}>
      <svg viewBox={viewBox} className="h-full w-full" role="img" aria-label={label}
        fill="none" strokeLinecap="round" strokeLinejoin="round">
        {grid ? (
          <>
            <rect width="100%" height="100%" rx="10" fill="var(--cq-blue-50)" />
          </>
        ) : null}
        {children}
      </svg>
    </figure>
  );
}

/* -------------------------------------------------- forces on an incline --- */
export function ForceDiagram({ className }) {
  return (
    <Frame label="Diagram: a block resting on a ramp, with arrows showing gravity, the normal force, and friction" className={className}>
      <path d="M20 128 H200" stroke={L} strokeWidth="1.6" />
      <path d="M40 128 L170 66" stroke={L} strokeWidth="1.6" />
      <path d="M40 128 L170 128 L170 66" stroke={L2} strokeWidth="0.8" strokeDasharray="3 3" />
      <rect x="96" y="80" width="30" height="22" rx="1.5" transform="rotate(-25 111 91)" fill={F} stroke={L} strokeWidth="1.6" />
      {/* gravity */}
      <path d="M111 96 V132" stroke={A} strokeWidth="1.8" />
      <path d="M111 136 l-3.6 -6 h7.2 z" fill={A} />
      <Tag x={116} y={128} tone={A}>Fg</Tag>
      {/* normal */}
      <path d="M111 88 L127 54" stroke="var(--cq-strand-forces)" strokeWidth="1.8" />
      <path d="M128 50 l1.4 6.9 -6.4 -3 z" fill="var(--cq-strand-forces)" />
      <Tag x={131} y={50} tone="var(--cq-strand-forces)">Fn</Tag>
      {/* friction */}
      <path d="M96 100 L70 112" stroke="var(--cq-strand-build)" strokeWidth="1.8" />
      <path d="M66 114 l6.6 -2.4 -0.6 7 z" fill="var(--cq-strand-build)" />
      <Tag x={30} y={112} tone="var(--cq-strand-build)">Ff</Tag>
      <path d="M56 128 a16 16 0 0 0 5 -8" stroke={L2} strokeWidth="0.9" />
      <Tag x={62} y={124} tone="var(--cq-ink-600)">θ</Tag>
      <Tag x={20} y={148} tone="var(--cq-ink-600)">Fig. 1 — Forces &amp; motion</Tag>
    </Frame>
  );
}

/* ----------------------------------------------------------- circuit ------ */
export function CircuitDiagram({ className }) {
  return (
    <Frame label="Diagram: a simple series circuit with a battery, a switch, a resistor, and a lamp" className={className}>
      <path d="M34 44 H186 V120 H34 Z" stroke={L} strokeWidth="1.6" />
      {/* battery */}
      <path d="M34 74 H24 M34 90 H24" stroke="transparent" />
      <path d="M26 66 V82 M34 62 V86" stroke={L} strokeWidth="2.4" />
      <rect x="18" y="60" width="32" height="44" fill="var(--cq-paper)" stroke="none" />
      <path d="M28 68 V96 M38 62 V102" stroke={L} strokeWidth="2.6" />
      <Tag x={8} y={116} tone="var(--cq-ink-600)">Cell</Tag>
      {/* resistor */}
      <rect x="86" y="37" width="46" height="14" fill="var(--cq-paper)" stroke={L} strokeWidth="1.6" />
      <Tag x={92} y={30} tone="var(--cq-ink-600)">R</Tag>
      {/* switch */}
      <circle cx="164" cy="44" r="2" fill={L} />
      <circle cx="186" cy="58" r="2" fill={L} />
      <path d="M164 44 L184 34" stroke={L} strokeWidth="1.8" />
      <Tag x={166} y={26} tone="var(--cq-ink-600)">Sw</Tag>
      {/* lamp */}
      <circle cx="110" cy="120" r="13" fill="var(--cq-ember-100)" stroke={L} strokeWidth="1.6" />
      <path d="M101 111 L119 129 M119 111 L101 129" stroke={L} strokeWidth="1.2" />
      <path d="M110 141 v6 M96 136 l-4 5 M124 136 l4 5" stroke={A} strokeWidth="1.4" />
      {/* current */}
      <path d="M60 44 l7 -4 v8 z" fill="var(--cq-strand-forces)" />
      <path d="M186 88 l-4 -7 h8 z" fill="var(--cq-strand-forces)" />
      <Tag x={64} y={36} tone="var(--cq-strand-forces)">I</Tag>
      <Tag x={20} y={152} tone="var(--cq-ink-600)">Fig. 2 — Electricity</Tag>
    </Frame>
  );
}

/* -------------------------------------------------------------- cell ------ */
export function CellDiagram({ className }) {
  return (
    <Frame label="Diagram: a plant cell with the wall, nucleus, chloroplasts and vacuole labelled" className={className}>
      <rect x="30" y="26" width="150" height="110" rx="4" fill="var(--cq-strand-life-soft)" stroke={L} strokeWidth="1.8" />
      <rect x="38" y="34" width="134" height="94" rx="3" fill="none" stroke={L2} strokeWidth="1" />
      <circle cx="88" cy="74" r="20" fill="var(--cq-paper)" stroke={L} strokeWidth="1.6" />
      <circle cx="88" cy="74" r="7" fill="var(--cq-strand-life)" />
      <rect x="120" y="52" width="26" height="14" rx="7" fill="var(--cq-strand-life)" opacity="0.7" />
      <rect x="132" y="92" width="26" height="14" rx="7" fill="var(--cq-strand-life)" opacity="0.7" transform="rotate(28 145 99)" />
      <rect x="60" y="104" width="52" height="20" rx="6" fill="var(--cq-blue-100)" stroke={L2} strokeWidth="1" />
      <path d="M88 54 L88 40 M120 59 L150 40 M86 114 L60 138" stroke={L2} strokeWidth="0.8" />
      <Tag x={72} y={36} tone="var(--cq-ink-700)">Nucleus</Tag>
      <Tag x={152} y={38} tone="var(--cq-ink-700)">Chloroplast</Tag>
      <Tag x={34} y={148} tone="var(--cq-ink-700)">Vacuole</Tag>
      <Tag x={140} y={152} anchor="end" tone="var(--cq-ink-600)">Fig. 3 — Cells</Tag>
    </Frame>
  );
}

/* ------------------------------------------------------------- truss ------ */
export function TrussDiagram({ className }) {
  return (
    <Frame label="Diagram: a Warren truss bridge showing load arrows and the members in tension and compression" className={className}>
      <path d="M24 104 H196" stroke={L} strokeWidth="2" />
      <path d="M24 56 H196" stroke={L} strokeWidth="2" />
      <path d="M24 104 L52 56 L80 104 L108 56 L136 104 L164 56 L196 104" stroke={L} strokeWidth="1.6" />
      {[24, 52, 80, 108, 136, 164, 196].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 === 0 ? 104 : 56} r="3" fill="var(--cq-paper)" stroke={L} strokeWidth="1.5" />
      ))}
      {[60, 100, 140].map((x) => (
        <g key={x}>
          <path d={`M${x} 22 V44`} stroke={A} strokeWidth="1.8" />
          <path d={`M${x} 48 l-3.6 -6 h7.2 z`} fill={A} />
        </g>
      ))}
      <Tag x={24} y={18} tone={A}>Load</Tag>
      <path d="M24 104 l-6 12 h12 z M196 104 l-6 12 h12 z" fill={L} />
      <Tag x={86} y={126} tone="var(--cq-strand-build)">Compression</Tag>
      <Tag x={86} y={138} tone="var(--cq-strand-forces)">Tension</Tag>
      <Tag x={196} y={152} anchor="end" tone="var(--cq-ink-600)">Fig. 4 — Structures</Tag>
    </Frame>
  );
}

/* ------------------------------------------------------------- orbit ------ */
export function OrbitDiagram({ className }) {
  return (
    <Frame label="Diagram: three planets on elliptical orbits around a star, with the orbital period labelled" className={className}>
      <ellipse cx="110" cy="82" rx="86" ry="34" stroke={L2} strokeWidth="1" strokeDasharray="4 4" />
      <ellipse cx="110" cy="82" rx="58" ry="23" stroke={L2} strokeWidth="1" strokeDasharray="4 4" />
      <ellipse cx="110" cy="82" rx="30" ry="12" stroke={L2} strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="110" cy="82" r="14" fill="var(--cq-ember-500)" />
      <circle cx="110" cy="82" r="20" stroke={A} strokeWidth="0.8" strokeDasharray="2 3" />
      <circle cx="140" cy="82" r="4" fill="var(--cq-strand-matter)" />
      <circle cx="66" cy="70" r="6" fill="var(--cq-strand-forces)" />
      <circle cx="182" cy="94" r="8" fill="var(--cq-strand-earth)" />
      <circle cx="196" cy="88" r="2.4" fill="var(--cq-ink-400)" />
      <path d="M182 86 V60" stroke={L2} strokeWidth="0.8" />
      <Tag x={168} y={54} tone="var(--cq-ink-700)">Period T</Tag>
      <Tag x={22} y={148} tone="var(--cq-ink-600)">Fig. 5 — Space</Tag>
    </Frame>
  );
}

/* -------------------------------------------------------------- wave ------ */
export function WaveDiagram({ className }) {
  return (
    <Frame label="Diagram: a transverse wave with wavelength and amplitude marked" className={className}>
      <path d="M20 88 H200" stroke={L2} strokeWidth="1" strokeDasharray="4 4" />
      <path d="M20 88 C40 34 60 34 80 88 S120 142 140 88 S180 34 200 88"
        stroke="var(--cq-strand-matter)" strokeWidth="2.2" />
      <path d="M50 88 V56" stroke={A} strokeWidth="1.4" />
      <path d="M50 52 l-3.4 6 h6.8 z" fill={A} />
      <Tag x={56} y={58} tone={A}>Amplitude</Tag>
      <path d="M50 122 H140" stroke="var(--cq-strand-forces)" strokeWidth="1.4" />
      <path d="M46 122 l6 -3.4 v6.8 z M144 122 l-6 -3.4 v6.8 z" fill="var(--cq-strand-forces)" />
      <Tag x={70} y={136} tone="var(--cq-strand-forces)">Wavelength λ</Tag>
      <Tag x={200} y={30} anchor="end" tone="var(--cq-ink-600)">Fig. 6 — Waves</Tag>
    </Frame>
  );
}

/* ------------------------------------------------------- skill network ---- */
export function SkillGraph({ className }) {
  const nodes = [
    { x: 40,  y: 118, r: 8,  s: 'forces', label: 'Forces' },
    { x: 92,  y: 78,  r: 11, s: 'forces', label: 'Motion' },
    { x: 150, y: 108, r: 9,  s: 'build',  label: 'Design' },
    { x: 128, y: 40,  r: 7,  s: 'matter', label: 'Energy' },
    { x: 190, y: 62,  r: 6,  s: 'method', label: 'Data' },
  ];
  const edges = [[0, 1], [1, 2], [1, 3], [3, 4], [2, 4]];
  return (
    <Frame label="Diagram: a network of connected science skills, sized by how much evidence has been gathered" className={className} grid={false}>
      {edges.map(([a, b], i) => (
        <path key={i} d={`M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}`} stroke={L2} strokeWidth="1.2" />
      ))}
      {nodes.map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={`var(--cq-strand-${n.s})`} />
          <circle cx={n.x} cy={n.y} r={n.r + 4} stroke={`var(--cq-strand-${n.s})`} strokeOpacity="0.35" strokeWidth="1" />
          <Tag x={n.x} y={n.y + n.r + 14} anchor="middle" tone="var(--cq-ink-700)">{n.label}</Tag>
        </g>
      ))}
    </Frame>
  );
}

export const DIAGRAMS = {
  forces: ForceDiagram,
  circuit: CircuitDiagram,
  cell: CellDiagram,
  truss: TrussDiagram,
  orbit: OrbitDiagram,
  wave: WaveDiagram,
  skills: SkillGraph,
};

/** Picks a stable diagram for a given key, so the same lesson always looks the same. */
export function AutoDiagram({ seed = '', className }) {
  const keys = Object.keys(DIAGRAMS).filter((k) => k !== 'skills');
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  const Cmp = DIAGRAMS[keys[h % keys.length]];
  return <Cmp className={className} />;
}

/** The CQ monogram, as crisp vector for the nav and favicon. */
/**
 * The organisation's existing logo. Kept exactly as it is — the identity work
 * here is everything around it, not a replacement for it.
 */
export function LogoMark({ size = 36, className }) {
  return (
    <img
      src="/images/logo.png"
      width={size}
      height={size}
      alt=""
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      loading="eager"
      decoding="async"
    />
  );
}
