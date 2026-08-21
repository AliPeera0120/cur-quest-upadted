/** @type {import('tailwindcss').Config} */
/**
 * Tailwind is the layout engine here — flex, grid, spacing, breakpoints.
 * Everything about identity (colour, type, radius, shadow) is a design token
 * defined in src/design/tokens.css and merely surfaced to Tailwind below, so
 * there is exactly one source of truth.
 */
const ink = (n) => `var(--cq-ink-${n})`;

module.exports = {
  darkMode: ['class', "[data-skin='arena']"],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    // Deliberate breakpoints named after the hardware they serve.
    screens: {
      sm: '480px',   // large phone
      md: '768px',   // tablet portrait / iPad
      cb: '1024px',  // Chromebook 11" & iPad landscape — the classroom default
      lg: '1200px',  // laptop
      xl: '1440px',  // desktop
      '2xl': '1720px',
      touch: { raw: '(hover: none)' },
      motion: { raw: '(prefers-reduced-motion: no-preference)' },
      print: { raw: 'print' },
    },
    extend: {
      colors: {
        ink: {
          950: ink(950), 900: ink(900), 800: ink(800), 700: ink(700), 600: ink(600),
          500: ink(500), 400: ink(400), 300: ink(300), 200: ink(200), 100: ink(100), 50: ink(50),
        },
        blue: {
          950: 'var(--cq-blue-950)', 900: 'var(--cq-blue-900)', 800: 'var(--cq-blue-800)',
          700: 'var(--cq-blue-700)', 600: 'var(--cq-blue-600)', 500: 'var(--cq-blue-500)',
          400: 'var(--cq-blue-400)', 300: 'var(--cq-blue-300)', 200: 'var(--cq-blue-200)',
          100: 'var(--cq-blue-100)', 50: 'var(--cq-blue-50)',
        },
        orange: {
          950: 'var(--cq-orange-950)', 900: 'var(--cq-orange-900)', 800: 'var(--cq-orange-800)',
          700: 'var(--cq-orange-700)', 600: 'var(--cq-orange-600)', 500: 'var(--cq-orange-500)',
          400: 'var(--cq-orange-400)', 300: 'var(--cq-orange-300)', 200: 'var(--cq-orange-200)',
          100: 'var(--cq-orange-100)', 50: 'var(--cq-orange-50)',
        },
        /* Alias kept so `ember-*` classes written earlier keep resolving. */
        ember: {
          950: 'var(--cq-ember-950)', 900: 'var(--cq-ember-900)', 800: 'var(--cq-ember-800)',
          700: 'var(--cq-ember-700)', 600: 'var(--cq-ember-600)', 500: 'var(--cq-ember-500)',
          400: 'var(--cq-ember-400)', 300: 'var(--cq-ember-300)', 200: 'var(--cq-ember-200)',
          100: 'var(--cq-ember-100)', 50: 'var(--cq-ember-50)',
        },
        paper: { DEFAULT: 'var(--cq-paper)', 2: 'var(--cq-paper-2)' },
        surface: { DEFAULT: 'var(--cq-surface)', 2: 'var(--cq-surface-2)' },
        line: { DEFAULT: 'var(--cq-line)', strong: 'var(--cq-line-strong)', ink: 'var(--cq-line-ink)' },
        success: { 700: 'var(--cq-success-700)', 600: 'var(--cq-success-600)', 500: 'var(--cq-success-500)', 100: 'var(--cq-success-100)', 50: 'var(--cq-success-50)' },
        warning: { 700: 'var(--cq-warning-700)', 600: 'var(--cq-warning-600)', 500: 'var(--cq-warning-500)', 100: 'var(--cq-warning-100)', 50: 'var(--cq-warning-50)' },
        danger:  { 700: 'var(--cq-danger-700)',  600: 'var(--cq-danger-600)',  500: 'var(--cq-danger-500)',  100: 'var(--cq-danger-100)',  50: 'var(--cq-danger-50)' },
        strand: {
          forces: 'var(--cq-strand-forces)', 'forces-soft': 'var(--cq-strand-forces-soft)',
          matter: 'var(--cq-strand-matter)', 'matter-soft': 'var(--cq-strand-matter-soft)',
          life:   'var(--cq-strand-life)',   'life-soft':   'var(--cq-strand-life-soft)',
          earth:  'var(--cq-strand-earth)',  'earth-soft':  'var(--cq-strand-earth-soft)',
          build:  'var(--cq-strand-build)',  'build-soft':  'var(--cq-strand-build-soft)',
          method: 'var(--cq-strand-method)', 'method-soft': 'var(--cq-strand-method-soft)',
        },
        mastery: {
          none: 'var(--cq-mastery-none)', beginning: 'var(--cq-mastery-beginning)',
          developing: 'var(--cq-mastery-developing)', proficient: 'var(--cq-mastery-proficient)',
          mastered: 'var(--cq-mastery-mastered)',
        },
        arena: {
          bg: 'var(--arena-bg)', surface: 'var(--arena-surface)', 'surface-2': 'var(--arena-surface-2)',
          'surface-3': 'var(--arena-surface-3)', line: 'var(--arena-line)', 'line-2': 'var(--arena-line-2)',
          text: 'var(--arena-text)', 'text-2': 'var(--arena-text-2)', muted: 'var(--arena-muted)',
          elixir: 'var(--arena-elixir)', 'elixir-2': 'var(--arena-elixir-2)',
          ally: 'var(--arena-ally)', foe: 'var(--arena-foe)', gold: 'var(--arena-gold)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        micro: ['var(--text-micro)', { lineHeight: '1.35' }],
        xs:    ['var(--text-xs)',    { lineHeight: '1.5' }],
        sm:    ['var(--text-sm)',    { lineHeight: '1.55' }],
        base:  ['var(--text-body)',  { lineHeight: 'var(--lh-body)' }],
        lead:  ['var(--text-lead)',  { lineHeight: 'var(--lh-relaxed)' }],
        h4:    ['var(--text-h4)',    { lineHeight: 'var(--lh-heading)' }],
        h3:    ['var(--text-h3)',    { lineHeight: 'var(--lh-heading)' }],
        h2:    ['var(--text-h2)',    { lineHeight: 'var(--lh-heading)', letterSpacing: 'var(--track-heading)' }],
        h1:    ['var(--text-h1)',    { lineHeight: 'var(--lh-snug)',    letterSpacing: 'var(--track-display)' }],
        display: ['var(--text-display)', { lineHeight: 'var(--lh-tight)', letterSpacing: 'var(--track-display)' }],
      },
      letterSpacing: { label: 'var(--track-label)' },
      borderRadius: {
        none: '0', xs: 'var(--r-xs)', sm: 'var(--r-sm)', DEFAULT: 'var(--r-md)',
        md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)',
        full: 'var(--r-pill)', pill: 'var(--r-pill)',
      },
      boxShadow: {
        none: 'none',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        ring: 'var(--shadow-ring)',
        /* Aliases from the previous system. */
        hair: 'var(--shadow-xs)',
        panel: 'var(--shadow-sm)',
        lift: 'var(--shadow-lg)',
        pop: 'var(--shadow-xl)',
        focus: 'var(--focus-ring)',
      },
      spacing: {
        gutter: 'var(--gutter)',
        section: 'var(--section-y)',
        'section-tight': 'var(--section-y-tight)',
        tap: 'var(--tap-min)',
        'tap-kid': 'var(--tap-kid)',
      },
      maxWidth: {
        container: 'var(--container)',
        'container-wide': 'var(--container-wide)',
        'container-narrow': 'var(--container-narrow)',
        measure: '68ch',
        'measure-short': '46ch',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)', 'in-out': 'var(--ease-in-out)', spring: 'var(--ease-spring)',
      },
      transitionDuration: { 1: 'var(--dur-1)', 2: 'var(--dur-2)', 3: 'var(--dur-3)', 4: 'var(--dur-4)' },
      zIndex: { float: 'var(--z-float)', header: 'var(--z-header)', dropdown: 'var(--z-dropdown)', modal: 'var(--z-modal)', toast: 'var(--z-toast)' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        rise:  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        fade:  { from: { opacity: '0' }, to: { opacity: '1' } },
        sweep: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
        'tick-in': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        'accordion-down': 'accordion-down var(--dur-2) var(--ease-out)',
        'accordion-up': 'accordion-up var(--dur-2) var(--ease-out)',
        rise: 'rise var(--dur-3) var(--ease-out)',
        fade: 'fade var(--dur-2) var(--ease-out)',
        sweep: 'sweep 1.4s var(--ease-in-out) infinite',
        'tick-in': 'tick-in var(--dur-4) var(--ease-out) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
