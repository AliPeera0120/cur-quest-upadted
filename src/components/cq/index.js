/**
 * The CuriosityQuest component library.
 *
 * Every screen — public marketing, student Arena, teacher dashboard, admin
 * CMS — is assembled from these. If a screen needs a new visual pattern, the
 * pattern belongs here first, so the four interfaces keep sharing one design
 * language even as their information architectures diverge.
 */
export { cn } from './cn';
export { Button, Spinner } from './Button';
export { Panel, PanelHead } from './Panel';
export { Badge, Chip } from './Badge';
export { Kicker, Eyebrow, TickRule, SectionHeader } from './Kicker';
export { MASTERY, MASTERY_LEVELS, masteryMeta, MasteryTag, MasteryCell, MasteryLegend } from './Mastery';
export { Meter, SegmentGauge } from './Meter';
export { Stat, StatStrip } from './Stat';
export { Field, Input, Textarea, Select, Checkbox, Switch } from './Field';
export { Modal } from './Modal';
export { ToastProvider, useToast } from './Toast';
export { DataTable, SortableTh } from './Table';
export { Tabs } from './Tabs';
export { Avatar, AVATAR_KEYS } from './Avatar';
export { Callout, EmptyState, ErrorState, Skeleton } from './Feedback';
export { Menu, MenuItem, MenuLabel } from './Menu';
export { MasteryDistribution, ActivityColumns, Sparkline, RankedBars, SmallMultiples } from './Viz';
export { Reveal, CountUp } from './Reveal';
export {
  ForceDiagram, CircuitDiagram, CellDiagram, TrussDiagram, OrbitDiagram,
  WaveDiagram, SkillGraph, AutoDiagram, LogoMark, DIAGRAMS,
} from './Diagrams';
