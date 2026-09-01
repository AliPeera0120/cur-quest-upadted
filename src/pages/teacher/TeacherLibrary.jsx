import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, X, ChevronDown, ChevronUp, KeyRound, Eye, Plus, Check, Clock,
  Target, Swords, Zap, FlaskConical, Terminal, BookOpen,
} from 'lucide-react';
import {
  Button, Badge, Chip, Panel, Input, Select, EmptyState,
  ErrorState, Skeleton, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { minutes, gradeLabel, plural } from '@/lib/format.js';
import { FORMATS, DIFFICULTY, DURATION_BUCKETS } from '@/content/index.js';
import AssignModal from '@/components/teacher/AssignModal.jsx';
import AnswerKeyModal from '@/components/teacher/AnswerKeyModal.jsx';

/* ============================================================================
   The lesson library, teacher edition.

   Students get the same faceted search in Explore. The difference here is
   trust: a teacher is allowed to see the answer key, so every lesson can be
   opened up — objectives, activity structure, and the questions with their
   correct answers and explanations — before it is put in front of a class.

   Facet counts are requested for the query and grade band only, not for the
   chip selections. Counting within your own selection makes every unselected
   chip read zero, which is technically true and completely useless.
   ========================================================================= */

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: Check,
};
const FORMAT_ORDER = ['mission', 'quick', 'battle', 'assessment', 'experiment', 'course', 'brief'];

const SORTS = [
  { value: 'relevance', label: 'Best match' },
  { value: 'easiest', label: 'Easiest first' },
  { value: 'hardest', label: 'Hardest first' },
  { value: 'shortest', label: 'Shortest first' },
  { value: 'longest', label: 'Longest first' },
  { value: 'title', label: 'A to Z' },
];

const PAGE = 24;

export default function TeacherLibrary() {
  const toast = useToast();
  const [catalog, setCatalog] = useState(null);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const [strands, setStrands] = useState([]);
  const [formats, setFormats] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [durations, setDurations] = useState([]);
  const [grade, setGrade] = useState('');
  const [sort, setSort] = useState('relevance');
  const [limit, setLimit] = useState(PAGE);

  const [result, setResult] = useState(null);
  const [facets, setFacets] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const [classId, setClassId] = useState('');

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch((e) => setError(e?.message || 'Could not load the catalog.'));
    api.listMyClasses()
      .then((rows) => { setClasses(rows); if (rows.length) setClassId(rows[0].id); })
      .catch(() => setClasses([]));
  }, []);

  const grades = useMemo(() => (grade ? [Number(grade)] : []), [grade]);
  const filters = useMemo(() => ({
    q, strands, formats, difficulties, durations, grades,
  }), [q, strands, formats, difficulties, durations, grades]);

  /* Reset paging whenever the question changes, so "load more" never carries
     a page count over from a different result set. */
  useEffect(() => { setLimit(PAGE); setExpanded(null); }, [filters, sort]);

  useEffect(() => {
    let alive = true;
    setResult(null);
    const t = setTimeout(() => {
      api.listLessons({ ...filters, sort, limit, offset: 0 })
        .then((res) => { if (alive) setResult(res); })
        .catch((e) => { if (alive) setError(e?.message || 'Search failed.'); });
    }, q ? 200 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [filters, sort, limit, q]);

  useEffect(() => {
    let alive = true;
    api.getFacets({ q, grades })
      .then((f) => { if (alive) setFacets(f); })
      .catch(() => { if (alive) setFacets(null); });
    return () => { alive = false; };
  }, [q, grades]);

  const toggle = useCallback((setter) => (value) => {
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));
  }, []);

  const activeCount = strands.length + formats.length + difficulties.length + durations.length + (grade ? 1 : 0);
  const clearAll = () => {
    setStrands([]); setFormats([]); setDifficulties([]); setDurations([]); setGrade('');
  };

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not open the library" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!catalog) return <LoadingLibrary />;

  const count = facets?.filtered ?? null;
  const cls = classes.find((c) => c.id === classId) || null;

  return (
    <>
      <Meta
        title="Lesson library"
        description="All 204 CuriosityQuest lessons, filterable by strand, format, difficulty, grade and length — with the answer key."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Lesson library</h1>
            <p className="mt-2.5 max-w-[62ch] text-ink-600">
              All {catalog.lessons.filter((l) => l.status === 'published').length} lessons, exactly as
              students see them — plus the answer key, which they do not. Nothing here is
              locked for anyone.
            </p>
          </div>
          {classes.length ? (
            /* The Select wrapper is full-width by design, so inline filters get
               an explicit width here rather than fighting the component. */
            <div className="w-full sm:w-[15rem]">
              <Select
                label="Assign to"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                hint="Used by the Assign buttons below."
              />
            </div>
          ) : null}
        </header>

        <div className="mt-7 grid gap-8 cb:grid-cols-[16rem_1fr]">
          <aside className="min-w-0">
            <div className="cb:sticky cb:top-20 space-y-6">
              <Input
                label="Search lessons"
                type="search"
                placeholder="forces, circuits, cells…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                hint="Matches titles, summaries, objectives, tags and skills."
              />

              <Select
                label="Grade"
                placeholder="Any grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                options={[3, 4, 5, 6, 7, 8].map((g) => ({ value: String(g), label: `Grade ${g}` }))}
              />

              <FacetGroup label="Strand">
                {catalog.strands.map((s) => (
                  <Chip key={s.id} active={strands.includes(s.id)} count={count?.strands[s.id] ?? 0}
                    onClick={() => toggle(setStrands)(s.id)}>
                    {s.name}
                  </Chip>
                ))}
              </FacetGroup>

              <FacetGroup label="Format">
                {FORMAT_ORDER.map((f) => (
                  <Chip key={f} active={formats.includes(f)} count={count?.formats[f] ?? 0}
                    onClick={() => toggle(setFormats)(f)}>
                    {FORMATS[f]?.label || f}
                  </Chip>
                ))}
              </FacetGroup>

              <FacetGroup label="Difficulty">
                {[1, 2, 3].map((d) => (
                  <Chip key={d} active={difficulties.includes(d)} count={count?.difficulties[d] ?? 0}
                    onClick={() => toggle(setDifficulties)(d)}>
                    {DIFFICULTY[d]}
                  </Chip>
                ))}
              </FacetGroup>

              <FacetGroup label="Length">
                {DURATION_BUCKETS.map((b) => (
                  <Chip key={b.id} active={durations.includes(b.id)} count={count?.durations[b.id] ?? 0}
                    onClick={() => toggle(setDurations)(b.id)}>
                    {b.label}
                  </Chip>
                ))}
              </FacetGroup>

              {activeCount ? (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X size={14} aria-hidden="true" /> Clear {plural(activeCount, 'filter')}
                </Button>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="text-sm text-ink-600" role="status">
                {result
                  ? <>
                      <span className="cq-data font-semibold text-ink-900">{result.total}</span>{' '}
                      {result.total === 1 ? 'lesson' : 'lessons'} match
                      {q ? <> &ldquo;{q}&rdquo;</> : null}
                    </>
                  : 'Searching…'}
              </p>
              <div className="w-full sm:w-[12rem]">
                <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} />
              </div>
            </div>

            {!result ? (
              <div className="mt-5 space-y-3">
                {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 w-full rounded-md" />)}
              </div>
            ) : result.rows.length === 0 ? (
              <EmptyState icon={Search} title="Nothing matches that yet" className="mt-6"
                action={<Button variant="outline" onClick={() => { setQ(''); clearAll(); }}>Clear the search</Button>}>
                Try a single word — &ldquo;friction&rdquo;, &ldquo;circuits&rdquo;,
                &ldquo;photosynthesis&rdquo; — or drop a filter.
              </EmptyState>
            ) : (
              <>
                <ul className="mt-5 space-y-3">
                  {result.rows.map((l) => (
                    <LessonRow
                      key={l.id}
                      lesson={l}
                      catalog={catalog}
                      expanded={expanded === l.id}
                      onToggle={() => setExpanded((cur) => (cur === l.id ? null : l.id))}
                      onPreview={() => setPreviewing(l)}
                      onAssign={() => setAssignFor(l)}
                      canAssign={!!cls}
                      className={cls?.name}
                    />
                  ))}
                </ul>

                {result.rows.length < result.total ? (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
                      Show {Math.min(PAGE, result.total - result.rows.length)} more
                    </Button>
                    <p className="text-xs text-ink-500">
                      Showing {result.rows.length} of {result.total}.
                    </p>
                  </div>
                ) : (
                  <p className="mt-6 text-center text-xs text-ink-500">
                    That is all {result.total} of them.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnswerKeyModal lesson={previewing} onClose={() => setPreviewing(null)} />

      <AssignModal
        open={!!assignFor && !!cls}
        classId={cls?.id}
        className={cls?.name}
        gradeBand={cls?.gradeBand}
        onClose={() => setAssignFor(null)}
        onAssigned={(created) => {
          toast.success('Mission assigned', `${created.lessonTitle || 'Lesson'} → ${cls?.name}`);
          setAssignFor(null);
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- facets --- */

function FacetGroup({ label, children }) {
  return (
    <div>
      <p className="text-micro font-semibold uppercase tracking-label text-ink-600">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ row ---- */

function LessonRow({ lesson, catalog, expanded, onToggle, onPreview, onAssign, canAssign, className }) {
  const Icon = FORMAT_ICON[lesson.format] || Target;
  const skills = (lesson.skills || [])
    .map((s) => catalog.skill(s.skillId))
    .filter(Boolean);
  const strand = catalog.strand(lesson.strandId);

  return (
    <li>
      <Panel pad="none" className={cn(expanded && 'ring-1 ring-blue-200')}>
        <div className="flex flex-wrap items-start gap-4 p-4 cb:p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-blue-50 text-blue-600">
            <Icon size={19} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{FORMATS[lesson.format]?.label || lesson.format}</Badge>
              {strand ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[1px]"
                    style={{ background: `var(--cq-strand-${strand.id})` }} />
                  {strand.name}
                </span>
              ) : null}
            </div>

            <h2 className="mt-1.5 font-display text-h4 font-bold text-ink-900">
              <Link to={`/arena/lesson/${lesson.id}`} className="no-underline hover:text-blue-700">
                {lesson.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-ink-600">{lesson.summary}</p>

            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
              <span>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</span>
              <span aria-hidden="true">·</span>
              <span>{DIFFICULTY[lesson.difficulty]}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} aria-hidden="true" /> {minutes(lesson.estMinutes)}
              </span>
              {lesson.xpAward ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span><span className="cq-data">{lesson.xpAward}</span> DP</span>
                </>
              ) : null}
            </p>

            {skills.length ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <li key={s.id} className="rounded-pill border border-line bg-surface-2 px-2.5 py-1 text-micro text-ink-700">
                    {s.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={onAssign} disabled={!canAssign}
              title={canAssign ? `Assign to ${className}` : 'Create a class first'}>
              <Plus size={14} aria-hidden="true" /> Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={onToggle} aria-expanded={expanded}>
              {expanded
                ? <><ChevronUp size={14} aria-hidden="true" /> Less</>
                : <><ChevronDown size={14} aria-hidden="true" /> Details</>}
            </Button>
          </div>
        </div>

        {expanded ? <LessonDetail lesson={lesson} onPreview={onPreview} /> : null}
      </Panel>
    </li>
  );
}

function LessonDetail({ lesson, onPreview }) {
  const [content, setContent] = useState(null);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getLessonForReview(lesson.id)
      .then((c) => { if (alive) setContent(c); })
      .catch((e) => { if (alive) setFailed(e?.message || 'Could not load the activities.'); });
    return () => { alive = false; };
  }, [lesson.id]);

  const questionCount = content?.activities.reduce((n, a) => n + a.questions.length, 0) ?? 0;

  return (
    <div className="border-t border-line bg-paper-2 p-4 cb:p-5">
      <div className="grid gap-6 cb:grid-cols-2">
        <div>
          <h3 className="text-micro font-semibold uppercase tracking-label text-ink-600">
            What students should get out of it
          </h3>
          {lesson.objectives?.length ? (
            <ul className="mt-2 space-y-1.5">
              {lesson.objectives.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-ink-800">
                  <Check size={14} aria-hidden="true" className="mt-1 shrink-0 text-success-600" />
                  {o}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-500">No objectives recorded for this lesson.</p>
          )}
          {lesson.standards?.length ? (
            <p className="mt-3 text-xs text-ink-500">
              Standards: {lesson.standards.join(', ')}
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="text-micro font-semibold uppercase tracking-label text-ink-600">
            How it runs
          </h3>
          {failed ? (
            <p className="mt-2 text-sm text-danger-700">{failed}</p>
          ) : !content ? (
            <div className="mt-2 space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full rounded-sm" />)}
            </div>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {content.activities.map((a, i) => (
                <li key={a.id} className="flex items-baseline gap-2.5 text-sm">
                  <span className="cq-data shrink-0 text-xs text-ink-500">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="font-medium text-ink-900">{a.title || a.kind}</span>
                    <span className="ml-2 text-xs text-ink-500">
                      {a.kind}
                      {a.questions.length ? ` · ${plural(a.questions.length, 'question')}` : ''}
                      {a.config?.passPct ? ` · pass ${a.config.passPct}%` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onPreview} disabled={!questionCount}>
              <KeyRound size={14} aria-hidden="true" /> Preview questions and answers
            </Button>
            <Button size="sm" variant="ghost" to={`/arena/lesson/${lesson.id}`}>
              <Eye size={14} aria-hidden="true" /> Open as a student would
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            You can see the answer key because you are signed in as a teacher; the player
            never sends it to a student&rsquo;s browser.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingLibrary() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-96" />
      <div className="mt-8 grid gap-8 cb:grid-cols-[16rem_1fr]">
        <Skeleton className="h-96 w-full rounded-md" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-md" />)}
        </div>
      </div>
      <p className="cq-sr" role="status">Loading the lesson library</p>
    </div>
  );
}
