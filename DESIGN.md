# CuriosityQuest design system

The single source of truth for how this product looks and behaves. Read this
before touching a page.

## The feel

Clean, modern, premium education product. Crisp white surfaces, generous
breathing room, soft elevation, restrained rounded cards, deep blue as the
confident primary with the brand orange as a deliberate accent. Confident and
trustworthy rather than playful. Nothing decorative for its own sake.

**Explicitly avoid:** graph-paper or dot textures, monospace "technical"
labels, hard offset shadows, hard square corners, big gradient blobs,
glassmorphism, three-equal-column feature rows repeated down a page, generic
stock photography, "Unlock your potential" copy.

## Tokens

All defined in `src/design/tokens.css`, surfaced to Tailwind in
`tailwind.config.js`. Never hard-code a hex value in a component.

| Concern | Use |
|---|---|
| Page background | `bg-white`, alternating sections `bg-paper-2` |
| Cards | `cq-panel` (+ `cq-panel--pad`, `--lift`, `--raised`, `--lg`) |
| Body text | `text-ink-900`, secondary `text-ink-600`, muted `text-ink-500` |
| Borders | `border-line` |
| Primary colour | `blue-600` (#055B8E) |
| Accent | `orange-500` for fills/icons, `orange-700` for buttons, `orange-800` for text on white |
| Radius | `rounded-sm` (6px) controls, `rounded-md` (10px) cards, `rounded-lg` (14px) big surfaces, `rounded-pill` badges/avatars |
| Shadow | `shadow-xs` resting card, `shadow-sm` raised, `shadow-lg` floating, `shadow-xl` modal |
| Section padding | `cq-section` (or `cq-section--tight`) |
| Container | `cq-container`, `cq-container--wide` for dashboards, `--narrow` for prose |
| Breakpoints | `sm` 480, `md` 768, **`cb` 1024 (Chromebook — the classroom default)**, `lg` 1200, `xl` 1440 |

Numbers use `cq-data` (display face, tabular figures) so dashboard columns
line up. Small uppercase labels use
`text-micro font-semibold uppercase tracking-label` — never monospace.

## Components — import from `@/components/cq`

`Button` (variants: `primary` blue, `accent` orange, `secondary`, `outline`,
`ghost`, `danger`, `onDark`, `outlineOnDark`; sizes `sm|md|lg|xl`; `to`/`href`
render a link), `Panel`, `PanelHead`, `Badge`, `Chip`, `Kicker`/`Eyebrow`,
`SectionHeader`, `TickRule`, `MasteryTag`, `MasteryCell`, `MasteryLegend`,
`MASTERY`, `Meter`, `SegmentGauge`, `Stat`, `StatStrip`, `Input`, `Textarea`,
`Select`, `Checkbox`, `Switch`, `Field`, `Modal`, `useToast`, `DataTable`,
`SortableTh`, `Tabs`, `Avatar`, `Callout`, `EmptyState`, `ErrorState`,
`Skeleton`, `Menu`/`MenuItem`/`MenuLabel`, `MasteryDistribution`,
`ActivityColumns`, `Sparkline`, `RankedBars`, `SmallMultiples`, `Reveal`,
`CountUp`, diagrams (`ForceDiagram`, `CircuitDiagram`, `CellDiagram`,
`TrussDiagram`, `OrbitDiagram`, `WaveDiagram`, `SkillGraph`, `AutoDiagram`),
`LogoMark`, `cn`.

Marketing section primitives are in `@/components/marketing/Sections.jsx`:
`Band`, `Split`, `Ledger`, `FeatureGrid`, `FeatureCard`, `Statement`,
`TextLink`, `Figure`, `StatRow`.

Formatting helpers in `@/lib/format.js`: `minutes`, `duration`, `pct`, `ago`,
`shortDate`, `longDate`, `dueLabel`, `gradeLabel`, `plural`, `downloadText`,
`plain`.

**If a page needs a new visual pattern, add it to the library first** so the
four interfaces keep sharing one language.

## Non-negotiables

1. **Nothing is ever locked.** No "complete X to unlock Y" anywhere. Mastery
   describes; it never gates. Do not add lock icons to lessons.
2. **Mastery is never colour alone.** Always glyph + word (`MasteryTag`,
   `MasteryCell`), and a legend near any matrix.
3. **Touch targets ≥ 44px** (`min-h-[2.75rem]`), larger inside the player.
4. **Every input has a visible label.** Use the `Input`/`Select` wrappers.
5. **Empty states say what to do next**, never just "no data".
6. **Charts encode one measure.** Single-hue blue ramp for magnitude, hatch for
   no-data, status colours only with an icon and a word. No categorical series
   palettes.
7. **Respect `prefers-reduced-motion`** — handled globally; do not add
   inline animations that bypass it.
8. **Real content only.** Use the actual catalog, the actual event photos in
   `public/images/`, the actual team data in `src/data/team.json`. No lorem, no
   invented testimonials, no fake statistics.
9. **Copy is plain and specific.** Say "24 students, 72% class mastery", not
   "Empower your learners". Address students directly and without condescension.
10. **No emoji in UI copy.** Use lucide icons.

## Page skeleton

```jsx
import Meta from '@/shell/Meta.jsx';
import { Band, Split } from '@/components/marketing/Sections.jsx';
import { Button, Kicker } from '@/components/cq';

export default function ThePage() {
  return (
    <>
      <Meta title="…" description="…" />
      {/* hero: cq-wash section, Kicker + h1 + lede + buttons */}
      <Band kicker="…" title="…" lede="…">…</Band>
      <Band tone="tint">…</Band>
    </>
  );
}
```

Vary the composition between sections — split, editorial rows, uneven feature
grid, full-bleed statement, photo band. Never stack three identical
three-column card rows.
