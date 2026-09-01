import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, X, SlidersHorizontal, Compass, LayoutGrid, Rows3, ArrowRight,
  Check, Swords, Target, Zap, FlaskConical, Terminal, BookOpen, ClipboardCheck,
} from 'lucide-react';
import {
  Button, Badge, Chip, Input, Select, EmptyState, ErrorState, Skeleton, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { FORMATS, DIFFICULTY, DURATION_BUCKETS } from '@/content/index.js';
import { minutes, gradeLabel, plural } from '@/lib/format.js';

/* ============================================================================
   The catalog.

   Every one of the 204 lessons is reachable from here, in any order, at any
   time. There is no lock icon on this page and no "finish X first" message,
   because no such rule exists in the product — a fifth-grader who wants the
   advanced circuits lesson gets the advanced circuits lesson.

   What the filters are for is narrowing 204 down to something a child can
   actually choose from, and the mastery filter is the interesting one: "show
   me what I have not tried" and "show me what I nearly had" are the two
   questions students ask that a plain subject list cannot answer.
   ========================================================================= */

const PAGE = 24;

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: ClipboardCheck,
};

const SORTS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'shortest', label: 'Shortest first' },
  { value: 'easiest', label: 'Easiest first' },
  { value: 'hardest', label: 'Hardest first' },
  { value: 'title', label: 'A to Z' },
];

const STATUS = {
  not_started: { label: 'Not tried yet', tone: 'default' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
  mastered: { label: 'Mastered', tone: 'success' },
};

const STATUS_ORDER = ['not_started', 'in_progress', 'completed', 'mastered'];

const EMPTY_FILTERS = {
  strands: [], formats: [], difficulties: [], grades: [], durations: [], masteryStates: [],
};

export default function StudentExplore() {
  const [base, setBase] = useState(null);          /* catalog + this student's progress */
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('relevance');
  const [shown, setShown] = useState(PAGE);
  const [mode, setMode] = useState('list');
  const firstLoad = useRef(true);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getCatalog(), api.getStudentOverview()])
      .then(([catalog, overview]) => {
        if (alive) setBase({ catalog, progress: overview.progress, total: overview.totals.catalogSize });
      })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load the lesson catalog.'); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  /* Any change to the query resets paging — otherwise a narrowed search would
     silently keep showing three screens of results. */
  useEffect(() => { setShown(PAGE); }, [debouncedQ, filters, sort]);

  useEffect(() => {
    if (!base) return undefined;
    let alive = true;
    setBusy(true);
    const query = { ...filters, q: debouncedQ, sort, masteryOf: base.progress };
    Promise.all([
      api.listLessons({ ...query, limit: mode === 'strands' ? null : shown }),
      api.getFacets(query),
      /* The mastery chips need counts that ignore the mastery filter itself,
         so choosing "In progress" does not zero out the other three. */
      api.listLessons({ ...query, masteryStates: [], limit: null }),
    ])
      .then(([page, facets, unfiltered]) => {
        if (!alive) return;
        const statusCounts = {};
        for (const l of unfiltered.rows) {
          const s = base.progress[l.id]?.status || 'not_started';
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
        setResult({ rows: page.rows, total: page.total, facets, statusCounts });
        setError(null);
        setBusy(false);
        firstLoad.current = false;
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || 'Could not search the catalog.');
        setBusy(false);
      });
    return () => { alive = false; };
  }, [base, debouncedQ, filters, sort, shown, mode]);

  const toggle = (group, value) => setFilters((f) => ({
    ...f,
    [group]: f[group].includes(value) ? f[group].filter((v) => v !== value) : [...f[group], value],
  }));

  const clearAll = () => { setFilters(EMPTY_FILTERS); setQ(''); setDebouncedQ(''); };

  /* Within a group, the counts of the values you have NOT chosen are
     meaningless once you have chosen one — the filtered set excludes them by
     definition. So a group with a selection falls back to catalog-wide counts. */
  const countFor = (group, value) => {
    const f = result?.facets;
    if (!f) return null;
    const src = filters[group].length ? f.all[group] : f.filtered[group];
    return src?.[value] || 0;
  };

  const activeChips = useMemo(() => {
    if (!base) return [];
    const out = [];
    for (const id of filters.strands) out.push({ group: 'strands', value: id, label: base.catalog.strand(id)?.name || id });
    for (const id of filters.formats) out.push({ group: 'formats', value: id, label: FORMATS[id]?.label || id });
    for (const d of filters.difficulties) out.push({ group: 'difficulties', value: d, label: DIFFICULTY[d] });
    for (const g of filters.grades) out.push({ group: 'grades', value: g, label: `Grade ${g}` });
    for (const d of filters.durations) out.push({ group: 'durations', value: d, label: DURATION_BUCKETS.find((b) => b.id === d)?.label || d });
    for (const s of filters.masteryStates) out.push({ group: 'masteryStates', value: s, label: STATUS[s].label });
    return out;
  }, [base, filters]);

  if (error && !result) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Meta title="Explore lessons" />
        <ErrorState title="Could not load the lessons" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!base) return <LoadingExplore />;

  const { catalog, progress } = base;
  const rows = result?.rows || [];
  const total = result?.total ?? 0;

  return (
    <>
      <Meta
        title="Explore lessons"
        description="Search all 204 CuriosityQuest lessons by topic, format, difficulty, grade and length. Nothing is locked."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-micro font-semibold uppercase tracking-label text-blue-600">Library</p>
            <h1 className="mt-2 text-h1">Explore {base.total} lessons.</h1>
            <p className="mt-2.5 max-w-[58ch] text-ink-600">
              Everything is open, all of the time. Pick by subject, by how long you have,
              or by what you have not tried yet.
            </p>
          </div>
          <div className="flex rounded-sm border border-line bg-white p-0.5 shadow-xs" role="group" aria-label="View">
            {[
              { id: 'list', label: 'All lessons', icon: LayoutGrid },
              { id: 'strands', label: 'By strand', icon: Rows3 },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={mode === v.id}
                onClick={() => setMode(v.id)}
                className={cn('inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-[4px] px-3.5 text-sm font-medium',
                  mode === v.id ? 'bg-blue-600 text-white' : 'text-ink-700 hover:bg-ink-50')}
              >
                <v.icon size={15} aria-hidden="true" /> {v.label}
              </button>
            ))}
          </div>
        </header>

        {/* ------------------------------------------------------- controls */}
        <div className="mt-7 grid gap-4 cb:grid-cols-[1fr_15rem]">
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-[2.35rem] text-ink-500" />
            <Input
              label="Search lessons"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="circuits, photosynthesis, bridges, python…"
              className="pl-10"
              autoComplete="off"
              type="search"
            />
          </div>
          <Select label="Sort by" value={sort} options={SORTS} onChange={(e) => setSort(e.target.value)} />
        </div>

        <div className="mt-5 space-y-4 rounded-md border border-line bg-white p-5 shadow-xs">
          <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-ink-600">
            <SlidersHorizontal size={13} aria-hidden="true" /> Narrow it down
          </p>
          <ChipGroup label="Strand">
            {catalog.strands.map((s) => (
              <Chip key={s.id} active={filters.strands.includes(s.id)} count={countFor('strands', s.id)}
                onClick={() => toggle('strands', s.id)}>{s.name}</Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="Kind">
            {Object.entries(FORMATS).map(([id, f]) => (
              <Chip key={id} active={filters.formats.includes(id)} count={countFor('formats', id)}
                onClick={() => toggle('formats', id)}>{f.label}</Chip>
            ))}
          </ChipGroup>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_10rem]">
            <ChipGroup label="Difficulty">
              {Object.entries(DIFFICULTY).map(([d, label]) => (
                <Chip key={d} active={filters.difficulties.includes(Number(d))} count={countFor('difficulties', d)}
                  onClick={() => toggle('difficulties', Number(d))}>{label}</Chip>
              ))}
            </ChipGroup>
            <ChipGroup label="Length">
              {DURATION_BUCKETS.map((b) => (
                <Chip key={b.id} active={filters.durations.includes(b.id)} count={countFor('durations', b.id)}
                  onClick={() => toggle('durations', b.id)}>{b.label}</Chip>
              ))}
            </ChipGroup>
            <Select
              label="Grade"
              placeholder="Any grade"
              value={filters.grades[0] ?? ''}
              options={[3, 4, 5, 6, 7, 8].map((g) => ({ value: g, label: `Grade ${g}` }))}
              onChange={(e) => setFilters((f) => ({ ...f, grades: e.target.value ? [Number(e.target.value)] : [] }))}
            />
          </div>
          <ChipGroup label="Where you are with it">
            {STATUS_ORDER.map((s) => (
              <Chip key={s} active={filters.masteryStates.includes(s)} count={result?.statusCounts?.[s] || 0}
                onClick={() => toggle('masteryStates', s)}>{STATUS[s].label}</Chip>
            ))}
          </ChipGroup>
        </div>

        {activeChips.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-600">Filtering by</span>
            {activeChips.map((c) => (
              <button
                key={`${c.group}-${c.value}`}
                type="button"
                onClick={() => toggle(c.group, c.value)}
                className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-pill border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-800 hover:border-blue-300"
              >
                {c.label}
                <X size={12} aria-hidden="true" />
                <span className="cq-sr">Remove this filter</span>
              </button>
            ))}
            <button type="button" onClick={clearAll} className="text-xs font-semibold text-ink-600 underline hover:text-ink-900">
              Clear all
            </button>
          </div>
        ) : null}

        {/* -------------------------------------------------------- results */}
        <div className="mt-7 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-ink-600" role="status" aria-live="polite">
            {busy && firstLoad.current ? 'Searching…'
              : mode === 'strands' ? `${plural(total, 'lesson')} across ${catalog.strands.length} strands`
              : total === 0 ? 'No lessons match'
              : `Showing ${Math.min(shown, total)} of ${plural(total, 'lesson')}`}
          </p>
          {debouncedQ ? <p className="text-xs text-ink-500">Searching for &ldquo;{debouncedQ}&rdquo;</p> : null}
        </div>

        {total === 0 && !busy ? (
          <EmptyState
            className="mt-5"
            icon={Compass}
            title="Nothing matches all of that"
            action={<Button variant="primary" onClick={clearAll}>Clear the filters</Button>}
          >
            Try removing a filter or two — searching just the strand, or just the length,
            usually turns something up. Every lesson is available; this is only a search.
          </EmptyState>
        ) : mode === 'strands' ? (
          <StrandSections
            rows={rows} catalog={catalog} progress={progress}
            onPickStrand={(id) => { setMode('list'); setFilters((f) => ({ ...f, strands: [id] })); }}
          />
        ) : (
          <>
            <ul className={cn('mt-5 grid gap-4 sm:grid-cols-2 cb:grid-cols-3', busy && 'opacity-60')}>
              {rows.map((l) => <LessonCard key={l.id} lesson={l} progress={progress[l.id]} />)}
            </ul>
            {shown < total ? (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg" loading={busy} onClick={() => setShown((s) => s + PAGE)}>
                  Show {Math.min(PAGE, total - shown)} more
                </Button>
                <p className="mt-2 text-xs text-ink-500">{total - shown} still to see</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

function ChipGroup({ label, children }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-ink-700">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function StatusBadge({ progress }) {
  const meta = STATUS[progress?.status || 'not_started'];
  return <Badge tone={meta.tone} icon={progress?.status === 'mastered' ? Check : undefined}>{meta.label}</Badge>;
}

function LessonCard({ lesson, progress }) {
  const Icon = FORMAT_ICON[lesson.format] || Target;
  return (
    <li>
      <Link to={`/arena/lesson/${lesson.id}`} className="cq-panel cq-panel--action flex h-full flex-col p-4 no-underline">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
            <Icon size={13} aria-hidden="true" /> {FORMATS[lesson.format]?.label}
          </span>
          <span className="cq-data text-micro text-ink-500">{minutes(lesson.estMinutes)}</span>
        </div>

        <h3 className="mt-2.5 font-display font-semibold leading-snug text-ink-900">{lesson.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-600">{lesson.summary}</p>

        <p className="mt-3 text-micro text-ink-500">
          {gradeLabel(lesson.gradeMin, lesson.gradeMax)} · {DIFFICULTY[lesson.difficulty]}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <StatusBadge progress={progress} />
          {progress?.bestScore != null ? (
            <span className="cq-data text-xs text-ink-700">best {Math.round(progress.bestScore)}%</span>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            Open <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

/** Browse-by-strand: the same result set, sectioned, six lessons deep. */
function StrandSections({ rows, catalog, progress, onPickStrand }) {
  const grouped = useMemo(() => {
    const map = new Map(catalog.strands.map((s) => [s.id, []]));
    for (const l of rows) map.get(l.strandId)?.push(l);
    return catalog.strands.map((s) => ({ strand: s, lessons: map.get(s.id) || [] }));
  }, [rows, catalog]);

  return (
    <div className="mt-6 space-y-10">
      {grouped.map(({ strand, lessons }) => (
        <section key={strand.id} aria-labelledby={`strand-${strand.id}`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <div className="min-w-0">
              <h2 id={`strand-${strand.id}`} className="flex items-center gap-2.5 text-h3">
                <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-pill"
                  style={{ background: `var(--cq-strand-${strand.id})` }} />
                {strand.name}
              </h2>
              <p className="mt-1 text-sm text-ink-600">{strand.blurb}</p>
            </div>
            <p className="cq-data text-sm text-ink-700">{plural(lessons.length, 'lesson')}</p>
          </div>
          {lessons.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">Nothing in this strand matches your filters.</p>
          ) : (
            <>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 cb:grid-cols-3">
                {lessons.slice(0, 6).map((l) => (
                  <LessonCard key={l.id} lesson={l} progress={progress[l.id]} />
                ))}
              </ul>
              {lessons.length > 6 ? (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => onPickStrand(strand.id)}>
                  See all {lessons.length} in {strand.name} <ArrowRight size={14} aria-hidden="true" />
                </Button>
              ) : null}
            </>
          )}
        </section>
      ))}
    </div>
  );
}

function LoadingExplore() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-80" />
      <Skeleton className="mt-6 h-11 w-full rounded-sm" />
      <Skeleton className="mt-5 h-40 w-full rounded-md" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 cb:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-52 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading the lesson catalog</p>
    </div>
  );
}
