import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Terminal, Play,
  Search, Sparkles, Code2, FolderCode, GraduationCap,
} from 'lucide-react';
import {
  Badge, Button, Callout, Chip, EmptyState, ErrorState, Input, Kicker,
  Panel, Skeleton, cn,
} from '@/components/cq';
import Meta from '@/shell/Meta.jsx';
import { api } from '@/platform/api.js';
import { DIFFICULTY } from '@/content/index.js';
import { gradeLabel, minutes, plural, plain } from '@/lib/format.js';

/* One route serves the track list and a single lesson, so prev/next inside a
   track works off the same catalog load. */
export default function Coding() {
  const { lessonId } = useParams();
  return lessonId ? <CodingLesson lessonId={lessonId} /> : <CodingBrowser />;
}

/** Coding lessons in their authored order, grouped into the three tracks. */
function useCoding() {
  const [state, setState] = useState({ rows: null, err: null });
  useEffect(() => {
    let alive = true;
    api.getCatalog()
      .then((catalog) => {
        if (!alive) return;
        const rows = catalog.lessons
          .filter((l) => l.format === 'course' && l.status === 'published')
          .sort((a, b) => (a.source?.track ?? 9) - (b.source?.track ?? 9)
            || (a.source?.order ?? 0) - (b.source?.order ?? 0));
        setState({ rows, err: null });
      })
      .catch((err) => { if (alive) setState({ rows: null, err }); });
    return () => { alive = false; };
  }, []);
  return state;
}

const TRACKS = [
  {
    id: 'Python', icon: Terminal,
    blurb: 'Start here if you have never written code. Variables, loops, functions, and by the end a program that does something you decide.',
  },
  {
    id: 'Java', icon: Code2,
    blurb: 'More formal than Python and closer to what school computer-science courses use. Types, classes, control flow.',
  },
  {
    id: 'HTML/CSS', icon: FolderCode,
    blurb: 'Build an actual web page. Structure with HTML, then make it look like something with CSS.',
  },
];

const TYPES = ['Lesson', 'Program', 'Project'];

/* ============================================================== browser ==== */
function CodingBrowser() {
  const { rows, err } = useCoding();
  const [q, setQ] = useState('');
  const [track, setTrack] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const filtered = useMemo(() => {
    if (!rows) return null;
    const needle = q.trim().toLowerCase();
    return rows.filter((l) => {
      if (track && l.subject !== track) return false;
      if (type && l.source?.activityType !== type) return false;
      if (difficulty && String(l.difficulty) !== difficulty) return false;
      if (needle && !`${l.title} ${l.summary}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, track, type, difficulty]);

  const counts = useMemo(() => {
    if (!rows) return {};
    return {
      track: rows.reduce((a, l) => ({ ...a, [l.subject]: (a[l.subject] || 0) + 1 }), {}),
      type: rows.reduce((a, l) => {
        const t = l.source?.activityType || 'Lesson';
        return { ...a, [t]: (a[t] || 0) + 1 };
      }, {}),
      difficulty: rows.reduce((a, l) => ({ ...a, [l.difficulty]: (a[l.difficulty] || 0) + 1 }), {}),
    };
  }, [rows]);

  if (err) {
    return (
      <div className="cq-container py-16">
        <ErrorState title="Could not load the coding courses" detail={err.message} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const byTrack = TRACKS.map((t) => ({
    ...t,
    lessons: (filtered || []).filter((l) => l.subject === t.id),
  })).filter((t) => t.lessons.length);

  const active = [track, type, difficulty].filter(Boolean).length + (q.trim() ? 1 : 0);

  return (
    <>
      <Meta
        title="Coding courses"
        description="Free beginner coding courses in Python, Java, and HTML & CSS — 50 lessons that end in projects you keep."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <Kicker pill>Coding courses</Kicker>
          <h1 className="mt-5 max-w-[22ch] text-display">Write your first real program.</h1>
          <p className="mt-6 max-w-[54ch] text-lead text-ink-600">
            Three tracks, {rows ? rows.length : 50} lessons, no prior experience assumed.
            Read the explanation, type the code, and keep what you build.
          </p>
        </div>
      </section>

      {/* Track overview — three genuinely different starting points, so a
          learner is choosing between them rather than scrolling a flat list. */}
      <div className="cq-container cq-section--tight">
        <div className="grid gap-5 cb:grid-cols-3">
          {TRACKS.map(({ id, icon: Icon, blurb }) => {
            const n = counts.track?.[id] || 0;
            const isOn = track === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTrack(isOn ? '' : id)}
                aria-pressed={isOn}
                className={cn(
                  'rounded-lg border p-6 text-left transition-all duration-2',
                  isOn ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-line bg-white shadow-xs hover:-translate-y-0.5 hover:shadow-md',
                )}
              >
                <span className={cn('grid h-11 w-11 place-items-center rounded-md',
                  isOn ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600')}>
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-h3">{id}</h2>
                <p className="mt-1 text-xs font-semibold text-ink-500">{plural(n, 'lesson')}</p>
                <p className="mt-2.5 text-sm text-ink-600">{blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="cq-container pb-20">
        <Panel pad="md" className="sticky top-[5.25rem] z-10">
          <div className="grid gap-5 cb:grid-cols-[minmax(0,18rem)_1fr]">
            <Input
              label="Search lessons"
              placeholder="loops, functions, colours…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="space-y-3.5">
              <FilterRow
                label="Kind"
                items={TYPES.map((t) => ({ value: t, label: t, count: counts.type?.[t] || 0 }))}
                value={type}
                onChange={setType}
              />
              <FilterRow
                label="Level"
                items={[1, 2, 3].map((d) => ({ value: String(d), label: DIFFICULTY[d], count: counts.difficulty?.[d] || 0 }))}
                value={difficulty}
                onChange={setDifficulty}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-ink-600">
              {filtered
                ? <>Showing <strong className="text-ink-900">{filtered.length}</strong> of {rows.length} lessons</>
                : 'Loading…'}
            </p>
            {active ? (
              <Button variant="ghost" size="sm" onClick={() => { setQ(''); setTrack(''); setType(''); setDifficulty(''); }}>
                Clear {active === 1 ? 'filter' : 'filters'}
              </Button>
            ) : null}
          </div>
        </Panel>

        {!filtered ? (
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={Search}
            title="Nothing matches that"
            action={<Button variant="outline" onClick={() => { setQ(''); setTrack(''); setType(''); setDifficulty(''); }}>Clear filters</Button>}
          >
            Try a shorter search, or clear a filter.
          </EmptyState>
        ) : (
          <div className="mt-10 space-y-12">
            {byTrack.map(({ id, icon: Icon, lessons }) => (
              <section key={id} aria-labelledby={`track-${id.replace(/\W/g, '')}`}>
                <div className="flex items-center gap-2.5">
                  <Icon size={20} aria-hidden="true" className="text-blue-600" />
                  <h2 id={`track-${id.replace(/\W/g, '')}`} className="text-h3">{id}</h2>
                  <span className="text-sm text-ink-500">{plural(lessons.length, 'lesson')}</span>
                </div>
                <ol className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
                  {lessons.map((l, i) => (
                    <li key={l.id}>
                      <Link
                        to={`/explore/coding/${encodeURIComponent(l.id)}`}
                        className="flex flex-wrap items-center gap-4 p-4 no-underline hover:bg-blue-50"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 font-display text-sm font-bold text-ink-600">
                          {l.source?.order ?? i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display font-semibold text-ink-900">{l.title}</span>
                          <span className="mt-0.5 block text-sm text-ink-600">{l.summary}</span>
                        </span>
                        <span className="flex shrink-0 flex-wrap items-center gap-2">
                          <Badge tone={l.source?.activityType === 'Project' ? 'ember' : 'default'}>
                            {l.source?.activityType || 'Lesson'}
                          </Badge>
                          <Badge>{DIFFICULTY[l.difficulty]}</Badge>
                          <span className="cq-data text-xs text-ink-500">{minutes(l.estMinutes)}</span>
                          <ChevronRight size={16} aria-hidden="true" className="text-ink-400" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterRow({ label, items, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-micro font-semibold uppercase tracking-label text-ink-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <Chip
            key={it.value}
            active={value === it.value}
            count={it.count}
            onClick={() => onChange(value === it.value ? '' : it.value)}
          >
            {it.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/* =============================================================== lesson ==== */
function CodingLesson({ lessonId }) {
  const { rows } = useCoding();
  const [content, setContent] = useState(null);
  const [err, setErr] = useState(null);
  const id = decodeURIComponent(lessonId);

  useEffect(() => {
    let alive = true;
    setContent(null);
    api.getLessonForPlay(id)
      .then((c) => { if (alive) { if (c) setContent(c); else setErr(new Error('not found')); } })
      .catch((e) => { if (alive) setErr(e); });
    return () => { alive = false; };
  }, [id]);

  const siblings = useMemo(() => {
    if (!rows || !content) return { prev: null, next: null };
    const track = rows.filter((l) => l.subject === content.lesson.subject);
    const i = track.findIndex((l) => l.id === id);
    return { prev: track[i - 1] || null, next: track[i + 1] || null };
  }, [rows, content, id]);

  if (err) {
    return (
      <div className="cq-container py-16">
        <ErrorState title="That lesson isn’t here" detail="It may have been renamed. The rest of the course is still available." />
        <div className="mt-5"><Button to="/explore/coding" variant="outline">All coding lessons</Button></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="cq-container cq-container--narrow py-14">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
        <p className="cq-sr" role="status">Loading lesson</p>
      </div>
    );
  }

  const { lesson, activities } = content;
  const explain = activities.find((a) => a.kind === 'explain');

  return (
    <>
      <Meta title={lesson.title} description={plain(lesson.summary, 150)} />
      <div className="cq-container cq-container--narrow py-12 cb:py-16">
        <Link to="/explore/coding" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900">
          <ArrowLeft size={15} aria-hidden="true" /> All coding lessons
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge tone="info">{lesson.subject}</Badge>
          <Badge>{lesson.source?.activityType || 'Lesson'}</Badge>
          <Badge>{DIFFICULTY[lesson.difficulty]}</Badge>
          <Badge>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</Badge>
          <span className="cq-data text-xs text-ink-500">{minutes(lesson.estMinutes)}</span>
        </div>

        <h1 className="mt-4 text-h1">{lesson.title}</h1>
        <p className="mt-3.5 text-lead text-ink-600">{lesson.summary}</p>

        {explain?.config?.markdown ? (
          <div className="cq-prose mt-9">
            <Markdown>{explain.config.markdown}</Markdown>
          </div>
        ) : (
          <p className="mt-9 text-ink-600">This lesson has no written content yet.</p>
        )}

        <Callout tone="info" title="Where to type this" className="mt-10">
          You do not need to install anything. For Python, an online editor works fine —
          anything that lets you run a script. For HTML and CSS, any text editor plus a
          browser is enough.
        </Callout>

        <div className="mt-10 rounded-lg border border-line bg-paper-2 p-6">
          <h2 className="flex items-center gap-2 text-h4">
            <Sparkles size={17} aria-hidden="true" className="text-orange-600" />
            Track this in Science Arena
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Playing this in the Arena marks it complete, counts it toward your coding
            skills, and remembers where you got to. Free, and no email needed.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button to={`/arena/play/${encodeURIComponent(lesson.id)}`} variant="primary">
              <Play size={16} aria-hidden="true" /> Open in the Arena
            </Button>
            <Button to="/arena/join" variant="outline">
              <GraduationCap size={16} aria-hidden="true" /> Make an account
            </Button>
          </div>
        </div>

        <nav className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-2" aria-label="Lesson navigation">
          {siblings.prev ? (
            <Link to={`/explore/coding/${encodeURIComponent(siblings.prev.id)}`}
              className="group rounded-md border border-line bg-white p-4 no-underline shadow-xs hover:border-blue-300">
              <span className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-ink-500">
                <ChevronLeft size={13} aria-hidden="true" /> Previous
              </span>
              <span className="mt-1.5 block font-display font-semibold text-ink-900">{siblings.prev.title}</span>
            </Link>
          ) : <span />}
          {siblings.next ? (
            <Link to={`/explore/coding/${encodeURIComponent(siblings.next.id)}`}
              className="group rounded-md border border-line bg-white p-4 text-right no-underline shadow-xs hover:border-blue-300 sm:col-start-2">
              <span className="flex items-center justify-end gap-1.5 text-micro font-semibold uppercase tracking-label text-ink-500">
                Next <ChevronRight size={13} aria-hidden="true" />
              </span>
              <span className="mt-1.5 block font-display font-semibold text-ink-900">{siblings.next.title}</span>
            </Link>
          ) : null}
        </nav>
      </div>
    </>
  );
}
