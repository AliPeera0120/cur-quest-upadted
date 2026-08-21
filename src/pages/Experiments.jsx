import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FlaskConical, ListChecks,
  Play, Search, ShoppingBasket, Sparkles, Target,
} from 'lucide-react';
import {
  Badge, Button, Callout, Chip, EmptyState, ErrorState, Input, Kicker, Panel,
  PanelHead, Skeleton, cn,
} from '@/components/cq';
import Meta from '@/shell/Meta.jsx';
import { api } from '@/platform/api.js';
import { DIFFICULTY, DURATION_BUCKETS } from '@/content/index.js';
import { gradeLabel, minutes, plural } from '@/lib/format.js';

/* One route component serves the list and the detail, because they share the
   same catalog load and the same ordering — which is what makes prev/next
   between experiments possible without a second request. */
export default function Experiments() {
  const { lessonId } = useParams();
  return lessonId ? <ExperimentDetail lessonId={lessonId} /> : <ExperimentBrowser />;
}

/** Catalog experiments in the order the catalog itself defines: grouped by
 *  subject, easiest first. `source.order` is that sequence. */
function useExperiments() {
  const [state, setState] = useState({ rows: null, catalog: null, err: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const catalog = await api.getCatalog();
        if (!alive) return;
        const rows = catalog.lessons
          .filter((l) => l.format === 'experiment' && l.status === 'published')
          .sort((a, b) => (a.source?.order ?? 0) - (b.source?.order ?? 0));
        setState({ rows, catalog, err: null });
      } catch (err) {
        if (alive) setState({ rows: null, catalog: null, err });
      }
    })();
    return () => { alive = false; };
  }, []);

  return state;
}

/* ============================================================== browser ==== */

const EMPTY = { subjects: [], difficulties: [], durations: [] };

function ExperimentBrowser() {
  const { rows, catalog, err } = useExperiments();
  const [q, setQ] = useState('');
  const [f, setF] = useState(EMPTY);

  const toggle = (key, value) => setF((prev) => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
  }));

  const active = q.trim() !== '' || Object.values(f).some((v) => v.length > 0);
  const clear = () => { setQ(''); setF(EMPTY); };

  /* Facet values come from the data rather than a hard-coded list, so a new
     subject or a shorter experiment appears here the moment it is published. */
  const subjects = useMemo(
    () => [...new Set((rows || []).map((l) => l.subject))].sort(),
    [rows],
  );
  const durations = useMemo(
    () => DURATION_BUCKETS.filter((b) => (rows || []).some((l) => b.test(l.estMinutes))),
    [rows],
  );

  const terms = useMemo(
    () => q.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [q],
  );

  /* `except` lets a chip's own dimension be ignored while counting, so the
     number on each chip answers "how many would I get if I added this?"
     rather than always reading zero once that row has a selection. */
  const filtered = useMemo(() => {
    if (!rows) return { list: [], count: () => 0 };
    const keep = (l, except) => {
      if (except !== 'subjects' && f.subjects.length && !f.subjects.includes(l.subject)) return false;
      if (except !== 'difficulties' && f.difficulties.length && !f.difficulties.includes(l.difficulty)) return false;
      if (except !== 'durations' && f.durations.length
        && !f.durations.some((id) => DURATION_BUCKETS.find((b) => b.id === id)?.test(l.estMinutes))) return false;
      if (terms.length) {
        const hay = catalog?.haystack.get(l.id) || `${l.title} ${l.summary}`.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    };
    return {
      list: rows.filter((l) => keep(l, null)),
      count: (dimension, test) => rows.filter((l) => keep(l, dimension) && test(l)).length,
    };
  }, [rows, catalog, f, terms]);

  return (
    <>
      <Meta
        title="Hands-on experiments"
        description="72 free STEM experiments for grades 3–8 in physics, chemistry, biology and engineering. Each one has a materials list, numbered steps and the science explained — using things already in a kitchen or supply closet."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-12 cb:py-16">
          <Kicker pill>Hands-on experiments</Kicker>
          <h1 className="mt-5 max-w-[24ch] text-h1">
            Pick something and go make it happen.
          </h1>
          <p className="mt-5 max-w-[62ch] text-lead text-ink-600">
            {rows ? plural(rows.length, 'experiment') : 'Experiments'} using materials
            you probably already own. Every one lists what you need, walks through the
            steps, and explains why it worked rather than leaving it as a trick.
          </p>
        </div>
      </section>

      <div className="cq-container cq-section">
        {err ? (
          <ErrorState title="The experiment list did not load" detail={err.message}
            onRetry={() => window.location.reload()} />
        ) : !rows ? (
          <LoadingGrid />
        ) : (
          <>
            <Panel pad="lg" className="mb-9">
              <div className="grid gap-6 cb:grid-cols-[minmax(0,20rem)_1fr] cb:gap-10">
                <Input
                  label="Search experiments"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="volcano, bridge, magnet…"
                  hint="Searches titles, topics and skills"
                />

                <div className="space-y-4">
                  <ChipRow label="Subject">
                    {subjects.map((s) => (
                      <Chip key={s} active={f.subjects.includes(s)}
                        count={filtered.count('subjects', (l) => l.subject === s)}
                        onClick={() => toggle('subjects', s)}>
                        {s}
                      </Chip>
                    ))}
                  </ChipRow>

                  <ChipRow label="Difficulty">
                    {[1, 2, 3].map((d) => (
                      <Chip key={d} active={f.difficulties.includes(d)}
                        count={filtered.count('difficulties', (l) => l.difficulty === d)}
                        onClick={() => toggle('difficulties', d)}>
                        {DIFFICULTY[d]}
                      </Chip>
                    ))}
                  </ChipRow>

                  <ChipRow label="How long">
                    {durations.map((b) => (
                      <Chip key={b.id} active={f.durations.includes(b.id)}
                        count={filtered.count('durations', (l) => b.test(l.estMinutes))}
                        onClick={() => toggle('durations', b.id)}>
                        {b.label}
                      </Chip>
                    ))}
                  </ChipRow>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <p className="text-sm text-ink-600" role="status" aria-live="polite">
                  Showing <span className="cq-data text-ink-900">{filtered.list.length}</span>
                  {' '}of <span className="cq-data text-ink-900">{rows.length}</span> experiments
                </p>
                {active ? (
                  <Button variant="ghost" size="sm" onClick={clear}>Clear filters</Button>
                ) : null}
              </div>
            </Panel>

            {filtered.list.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Nothing matches all of those filters at once"
                action={<Button variant="primary" onClick={clear}>Clear filters</Button>}
              >
                Try removing the search text, or widening the subject and time filters —
                all {rows.length} experiments are still here.
              </EmptyState>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 cb:grid-cols-3">
                {filtered.list.map((l) => (
                  <li key={l.id} className="min-w-0">
                    <ExperimentCard lesson={l} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}

function ChipRow({ label, children }) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-micro font-semibold uppercase tracking-label text-ink-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ExperimentCard({ lesson }) {
  return (
    <Panel to={`/explore/experiments/${lesson.id}`} className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
          <FlaskConical size={13} aria-hidden="true" />
          {lesson.subject}
        </span>
        <span className="cq-data text-micro text-ink-500">{minutes(lesson.estMinutes)}</span>
      </div>
      <h2 className="mt-3 text-h4 font-semibold text-ink-900">{lesson.title}</h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-600">{lesson.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="info">{DIFFICULTY[lesson.difficulty]}</Badge>
        <Badge>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</Badge>
      </div>
    </Panel>
  );
}

function LoadingGrid() {
  return (
    <>
      <Skeleton className="mb-9 h-52 w-full" />
      <ul className="grid gap-5 sm:grid-cols-2 cb:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}><Skeleton className="h-52 w-full" /></li>
        ))}
      </ul>
    </>
  );
}

/* =============================================================== detail ==== */

function ExperimentDetail({ lessonId }) {
  const { rows, catalog, err } = useExperiments();
  const [content, setContent] = useState(undefined); /* undefined = loading, null = missing */
  const [contentErr, setContentErr] = useState(null);

  useEffect(() => {
    let alive = true;
    setContent(undefined);
    setContentErr(null);
    (async () => {
      try {
        const data = await api.getLessonForPlay(lessonId);
        if (alive) setContent(data);
      } catch (e) {
        if (alive) setContentErr(e);
      }
    })();
    return () => { alive = false; };
  }, [lessonId]);

  const anyErr = err || contentErr;
  if (anyErr) {
    return (
      <div className="cq-container cq-section">
        <ErrorState title="This experiment did not load" detail={anyErr.message}
          onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (content === undefined || !rows) return <DetailSkeleton />;

  /* A wrong id, or an id belonging to something that is not an experiment. */
  if (!content || content.lesson.format !== 'experiment') {
    return (
      <div className="cq-container cq-section">
        <EmptyState
          icon={FlaskConical}
          title="That experiment is not here"
          action={<Button to="/explore/experiments" variant="primary">See all experiments</Button>}
        >
          The link may be out of date. All {rows.length} experiments are on one page,
          filterable by subject and by how long they take.
        </EmptyState>
      </div>
    );
  }

  const { lesson, activities } = content;
  const act = (kind) => activities.find((a) => a.kind === kind);
  const intro = act('intro');
  const build = act('build');
  const reflect = act('reflect');
  const quiz = act('quiz');

  /* Materials arrive as one newline-separated string, which is how the source
     material was written. Split late rather than reshaping the catalog. */
  const materials = String(intro?.config?.materials || '')
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const steps = build?.config?.steps || [];
  const learn = intro?.config?.learn || lesson.objectives?.[0] || '';

  const i = rows.findIndex((l) => l.id === lesson.id);
  const prev = i > 0 ? rows[i - 1] : null;
  const next = i >= 0 && i < rows.length - 1 ? rows[i + 1] : null;

  const skillNames = (lesson.skills || [])
    .map((s) => catalog?.skill(s.skillId)?.name)
    .filter(Boolean);

  return (
    <>
      <Meta title={lesson.title} description={lesson.summary} />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-10 cb:py-14">
          <Link to="/explore/experiments"
            className="inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm font-semibold text-blue-600 no-underline hover:text-blue-500">
            <ArrowLeft size={15} aria-hidden="true" />
            All experiments
          </Link>

          <div className="mt-3 grid gap-8 cb:grid-cols-[1.3fr_auto] cb:items-end">
            <div className="min-w-0">
              <Kicker>{lesson.subject}</Kicker>
              <h1 className="mt-3 max-w-[28ch] text-h1">{lesson.title}</h1>
              <p className="mt-5 max-w-[62ch] text-lead text-ink-600">{lesson.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Badge tone="info">{DIFFICULTY[lesson.difficulty]}</Badge>
                <Badge>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</Badge>
                <Badge>{minutes(lesson.estMinutes)}</Badge>
                <Badge>{plural(materials.length, 'material')}</Badge>
                <Badge>{plural(steps.length, 'step')}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button to={`/arena/lesson/${lesson.id}`} variant="accent" size="lg">
                <Play size={17} aria-hidden="true" />
                Play this in Science Arena
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="cq-container cq-section">
        <div className="grid gap-8 cb:grid-cols-[0.85fr_1.15fr] cb:items-start cb:gap-12">
          {/* Left rail: everything you need before touching anything. */}
          <div className="space-y-6 cb:sticky cb:top-24">
            <Panel pad="none">
              <PanelHead title="What you need" icon={ShoppingBasket}
                sub={intro?.title || 'Before you start'} />
              <ul className="divide-y divide-line">
                {materials.map((m) => (
                  <li key={m} className="px-5 py-2.5 text-sm text-ink-800">{m}</li>
                ))}
              </ul>
            </Panel>

            {intro?.config?.safety ? (
              <Callout tone="warning" title="Get an adult before you start">
                Ask a grown-up to stay nearby for anything with heat, flames, sharp
                tools or household chemicals — and read the whole step list once before
                you begin, so nothing catches you out halfway through.
              </Callout>
            ) : null}

            {learn ? (
              <Panel pad="lg" tone="quiet">
                <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
                  <Target size={13} aria-hidden="true" /> What this teaches
                </p>
                <p className="mt-2.5 text-ink-700">{learn}</p>
                {skillNames.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skillNames.map((n) => <Badge key={n} tone="info">{n}</Badge>)}
                  </div>
                ) : null}
              </Panel>
            ) : null}
          </div>

          {/* Right column: the experiment itself. */}
          <div className="min-w-0 space-y-6">
            <Panel pad="none">
              <PanelHead title={build?.title || 'Run the experiment'} icon={ListChecks}
                sub={`${plural(steps.length, 'step')} · about ${minutes(lesson.estMinutes)}`} />
              <ol className="divide-y divide-line">
                {steps.map((s, n) => (
                  <li key={s} className="flex gap-4 px-5 py-4">
                    <span className="cq-data grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-blue-50 text-xs text-blue-700">
                      {n + 1}
                    </span>
                    <p className="text-ink-800">{s}</p>
                  </li>
                ))}
              </ol>
            </Panel>

            {reflect?.config?.prompts?.length ? (
              <Panel pad="lg">
                <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-ink-500">
                  <Sparkles size={13} aria-hidden="true" /> {reflect.title || 'What happened?'}
                </p>
                <p className="mt-2 text-sm text-ink-600">
                  Worth answering out loud, with whoever is in the room.
                </p>
                <ul className="mt-4 space-y-3">
                  {reflect.config.prompts.map((p) => (
                    <li key={p} className="flex gap-3 text-ink-800">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-orange-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            <Panel pad="lg" className="bg-blue-50" tone="flat">
              <h2 className="text-h3">{quiz?.title || 'Check your thinking'}</h2>
              <p className="mt-2.5 max-w-[58ch] text-ink-700">
                {quiz?.questions?.length
                  ? `${plural(quiz.questions.length, 'question')} on what just happened, in Science Arena.`
                  : 'A short check on what just happened, in Science Arena.'}
                {' '}Answers are tagged to science skills, so the questions build a
                picture of what you understand instead of just a score.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button to={`/arena/lesson/${lesson.id}`} variant="primary">
                  Play this in Science Arena <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button to="/arena" variant="outline">What is the Arena?</Button>
              </div>
            </Panel>
          </div>
        </div>

        <PrevNext prev={prev} next={next} />
      </div>
    </>
  );
}

/** Walks the catalog order, so a reader can work through a subject in sequence. */
function PrevNext({ prev, next }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Other experiments" className="mt-12 grid gap-4 border-t border-line pt-8 cb:grid-cols-2">
      {[
        { l: prev, dir: 'Previous', Icon: ChevronLeft },
        { l: next, dir: 'Next', Icon: ChevronRight },
      ].map(({ l, dir, Icon }, idx) => (l ? (
        <Panel key={dir} to={`/explore/experiments/${l.id}`}
          className={cn('flex items-center gap-4 p-5', idx === 1 && 'cb:col-start-2 cb:text-right')}>
          {idx === 0 ? <Icon size={20} className="shrink-0 text-ink-500" aria-hidden="true" /> : null}
          <span className="min-w-0 flex-1">
            <span className="block text-micro font-semibold uppercase tracking-label text-ink-500">
              {dir} · {l.subject}
            </span>
            <span className="mt-1 block truncate font-display font-semibold text-ink-900">{l.title}</span>
          </span>
          {idx === 1 ? <Icon size={20} className="shrink-0 text-ink-500" aria-hidden="true" /> : null}
        </Panel>
      ) : <span key={dir} aria-hidden="true" />))}
    </nav>
  );
}

function DetailSkeleton() {
  return (
    <div className="cq-container cq-section">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-12 w-full max-w-[36rem]" />
      <Skeleton className="mt-4 h-4 w-full max-w-[44rem]" />
      <div className="mt-12 grid gap-8 cb:grid-cols-[0.85fr_1.15fr] cb:gap-12">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
