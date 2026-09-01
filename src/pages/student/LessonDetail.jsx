import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Play, RotateCcw, ArrowLeft, ArrowRight, Compass, Clock, Target, Swords, Zap,
  FlaskConical, Terminal, BookOpen, ClipboardCheck, ListChecks, Lightbulb,
  Hammer, MessageSquare, HelpCircle,
} from 'lucide-react';
import {
  Button, Badge, Panel, MasteryTag, MasteryLegend, Sparkline, EmptyState,
  ErrorState, Skeleton,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { FORMATS, DIFFICULTY } from '@/content/index.js';
import { minutes, duration, gradeLabel, ago, plural, plain } from '@/lib/format.js';

/* ============================================================================
   Lesson detail — the page between choosing a lesson and playing it.

   It exists to answer "is this the right thing for me right now?" honestly:
   what it covers, how long it takes, which skills it will produce evidence
   for, and what happened the last times this student played it. The answer is
   never "you may not have this one" — the Play button is the largest thing on
   the screen and it is always live.

   Activities come from getLessonForPlay(), which strips the answer key, so
   this page can describe what is inside a lesson without spoiling it.
   ========================================================================= */

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: ClipboardCheck,
};

const KIND = {
  intro: { label: 'Intro', icon: Lightbulb, blurb: 'What this is about, before anything is scored.' },
  explain: { label: 'Explain', icon: BookOpen, blurb: 'The ideas, in plain language, first.' },
  build: { label: 'Build', icon: Hammer, blurb: 'Steps to follow with real materials.' },
  quiz: { label: 'Questions', icon: ListChecks, blurb: 'Scored questions, each with an explanation afterwards.' },
  battle: { label: 'Battle', icon: Swords, blurb: 'Correct answers power your side of the fight.' },
  reflect: { label: 'Reflect', icon: MessageSquare, blurb: 'Write down what you noticed. Not scored.' },
};

const STATUS = {
  not_started: { label: 'Not tried yet', tone: 'default' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
  mastered: { label: 'Mastered', tone: 'success' },
};

export default function LessonDetail() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    if (!lessonId) { setState({ status: 'missing' }); return undefined; }
    let alive = true;
    setState({ status: 'loading' });
    Promise.all([api.getLessonForPlay(lessonId), api.getStudentOverview(), api.getCatalog()])
      .then(([content, overview, catalog]) => {
        if (!alive) return;
        if (!content?.lesson) { setState({ status: 'missing' }); return; }
        setState({ status: 'ready', content, overview, catalog });
      })
      .catch((e) => { if (alive) setState({ status: 'error', message: e?.message || 'Could not open that lesson.' }); });
    return () => { alive = false; };
  }, [lessonId, user?.id]);

  const related = useMemo(() => {
    if (state.status !== 'ready') return [];
    const { catalog, content } = state;
    return catalog.lessons
      .filter((l) => l.strandId === content.lesson.strandId && l.id !== content.lesson.id && l.status === 'published')
      .sort((a, b) => a.difficulty - b.difficulty || a.estMinutes - b.estMinutes)
      .slice(0, 6);
  }, [state]);

  if (state.status === 'loading') return <LoadingLesson />;

  if (state.status === 'missing') {
    return (
      <div className="cq-container py-10">
        <Meta title="Lesson not found" />
        <EmptyState
          icon={Compass}
          title="That lesson is not here"
          action={(
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button to="/arena/explore" variant="primary">Browse all lessons</Button>
              <Button to="/arena/home" variant="outline">Back to home</Button>
            </div>
          )}
        >
          The link may be out of date, or the lesson may have been renamed. Everything in the
          library is one search away.
        </EmptyState>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="cq-container py-10">
        <Meta title="Lesson" />
        <ErrorState title="Could not open that lesson" detail={state.message} onRetry={() => window.location.reload()} />
        <div className="mt-5"><Button to="/arena/explore" variant="outline">Back to the library</Button></div>
      </div>
    );
  }

  const { content, overview, catalog } = state;
  const { lesson, activities } = content;
  const progress = overview.progress[lesson.id] || null;
  const Icon = FORMAT_ICON[lesson.format] || Target;
  const status = STATUS[progress?.status || 'not_started'];
  const resumable = !!progress?.resumable;
  const strand = catalog.strand(lesson.strandId);
  const questionCount = activities.reduce((n, a) => n + (a.questions?.length || 0), 0);
  const skillNames = new Set((lesson.skills || []).map((s) => catalog.skill(s.skillId)?.name).filter(Boolean));
  const objectives = (lesson.objectives || []).filter((o) => !skillNames.has(o));

  return (
    <>
      <Meta title={lesson.title} description={plain(lesson.summary, 160)} />
      <div className="cq-container py-8 cb:py-10">
        <Link to="/arena/explore" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900">
          <ArrowLeft size={15} aria-hidden="true" /> All lessons
        </Link>

        {/* ---------------------------------------------------------- header */}
        <header className="mt-4 rounded-lg border border-line bg-white p-6 shadow-xs cb:p-7">
          <div className="flex flex-wrap items-start gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <Icon size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-micro font-semibold uppercase tracking-label text-blue-600">
                  {FORMATS[lesson.format]?.label}
                </span>
                <span aria-hidden="true" className="text-ink-300">·</span>
                <span className="text-micro font-semibold uppercase tracking-label text-ink-600">
                  {strand?.name || lesson.subject}
                </span>
                <Badge tone={status.tone} className="ml-1">{status.label}</Badge>
              </div>
              <h1 className="mt-2 text-h1">{lesson.title}</h1>
              <p className="mt-2.5 max-w-measure text-ink-600">{lesson.summary}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} aria-hidden="true" /> {minutes(lesson.estMinutes)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</span>
                <span aria-hidden="true">·</span>
                <span>{DIFFICULTY[lesson.difficulty]}</span>
                {questionCount ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{plural(questionCount, 'question')}</span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{plural(lesson.xpAward || 50, 'point')} for finishing</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Button to={`/arena/play/${lesson.id}`} size="xl" variant="primary">
              <Play size={19} aria-hidden="true" />
              {resumable ? 'Continue where you left off' : progress?.completions ? 'Play again' : 'Start the lesson'}
            </Button>
            {resumable ? (
              <Button to={`/arena/play/${lesson.id}?restart=1`} size="lg" variant="outline">
                <RotateCcw size={16} aria-hidden="true" /> Restart from the beginning
              </Button>
            ) : null}
            <p className="text-xs text-ink-500">
              {resumable
                ? 'Restarting abandons the part-finished try. Your best score is kept either way.'
                : 'Retake it as often as you like — your best score is the one that counts.'}
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-8 cb:grid-cols-[1.45fr_1fr] cb:gap-10">
          <div className="min-w-0 space-y-8">
            {/* ------------------------------------------------- objectives
                Many catalog lessons list their objectives as the names of the
                skills they cover, and printing the same four phrases twice in
                a row reads like a bug. Only genuinely extra objectives show. */}
            {objectives.length ? (
              <section aria-labelledby="obj-h">
                <h2 id="obj-h" className="text-h3">What you will work on</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {objectives.map((o) => (
                    <li key={o} className="flex gap-2.5 rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm text-ink-800">
                      <Target size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* ---------------------------------------------------- skills */}
            <section aria-labelledby="skills-h">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="skills-h" className="text-h3">Skills this practises</h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Where you are with each one right now, from all your answers so far.
                  </p>
                </div>
                <MasteryLegend compact className="text-micro" />
              </div>
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
                {(lesson.skills || []).map(({ skillId }) => {
                  const skill = catalog.skill(skillId);
                  const m = overview.mastery[skillId];
                  if (!skill) return null;
                  return (
                    <li key={skillId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink-900">{skill.name}</span>
                        <span className="mt-0.5 block text-micro text-ink-500">
                          {m && m.evidence > 0
                            ? `${plural(m.evidence, 'answer')} over ${plural(m.sessions, 'sitting')}`
                            : 'No evidence yet — this lesson will be the first'}
                        </span>
                      </span>
                      <MasteryTag level={m?.level || 'not_started'} pct={m?.pct} size="sm" showPct={!!m && m.evidence > 0} />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2.5 text-xs text-ink-500">
                <Link to="/arena/progress" className="font-semibold">See your full passport</Link>
                {' '}for every skill in every strand.
              </p>
            </section>

            {/* ------------------------------------------------ activities */}
            <section aria-labelledby="acts-h">
              <h2 id="acts-h" className="text-h3">What is in it</h2>
              <p className="mt-1 text-sm text-ink-500">{plural(activities.length, 'part')}, played in order.</p>
              <ol className="mt-4 space-y-3">
                {activities.map((a, i) => {
                  const meta = KIND[a.kind] || { label: a.kind, icon: HelpCircle, blurb: '' };
                  const n = a.questions?.length || 0;
                  return (
                    <li key={a.id} className="flex gap-3.5 rounded-md border border-line bg-white p-4 shadow-xs">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
                        <meta.icon size={17} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-micro font-semibold uppercase tracking-label text-ink-500">
                            Part {i + 1} · {meta.label}
                          </span>
                          {n ? <span className="cq-data text-micro text-ink-500">{plural(n, 'question')}</span> : null}
                        </div>
                        <p className="mt-1 text-sm font-medium text-ink-900">{a.title}</p>
                        <p className="mt-0.5 text-xs text-ink-600">{meta.blurb}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* --------------------------------------------------- related */}
            {related.length ? (
              <section aria-labelledby="rel-h">
                <h2 id="rel-h" className="text-h3">More in {strand?.name || 'this strand'}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.map((l) => {
                    const RIcon = FORMAT_ICON[l.format] || Target;
                    const p = overview.progress[l.id];
                    return (
                      <li key={l.id}>
                        <Link to={`/arena/lesson/${l.id}`} className="cq-panel cq-panel--action flex h-full flex-col p-4 no-underline">
                          <span className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
                              <RIcon size={13} aria-hidden="true" /> {FORMATS[l.format]?.label}
                            </span>
                            <span className="cq-data text-micro text-ink-500">{minutes(l.estMinutes)}</span>
                          </span>
                          <span className="mt-2 block font-display font-semibold leading-snug text-ink-900">{l.title}</span>
                          <span className="mt-2 flex flex-1 items-end justify-between gap-2 text-micro text-ink-500">
                            <span>{DIFFICULTY[l.difficulty]}</span>
                            {p?.bestScore != null ? <span className="cq-data">best {Math.round(p.bestScore)}%</span> : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Button to="/arena/explore" variant="ghost" size="sm" className="mt-3">
                  Explore the whole library <ArrowRight size={14} aria-hidden="true" />
                </Button>
              </section>
            ) : null}
          </div>

          {/* ------------------------------------------------------ history */}
          <aside className="min-w-0 space-y-8">
            <HistoryPanel lesson={lesson} progress={progress} status={status} />
            <Panel pad="md" lift>
              <h2 className="text-h4">{FORMATS[lesson.format]?.label} lessons</h2>
              <p className="mt-2 text-sm text-ink-600">{FORMATS[lesson.format]?.blurb}.</p>
              {lesson.tags?.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {lesson.tags.map((t) => <li key={t}><Badge>{t.replace(/^#/, '')}</Badge></li>)}
                </ul>
              ) : null}
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

function HistoryPanel({ lesson, progress, status }) {
  const hasHistory = !!progress && progress.attempts > 0;
  const trend = hasHistory && progress.completions >= 2
    ? [progress.firstScore, progress.latestScore].filter((v) => v != null)
    : [];

  return (
    <Panel pad="md" lift>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4">Your history</h2>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {!hasHistory ? (
        <p className="mt-3 text-sm text-ink-600">
          You have not played this one yet. Nothing is recorded until you do, and a first
          try is not a test — it is the first piece of evidence.
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
            {[
              ['Tries', progress.attempts],
              ['Finished', progress.completions],
              ['Best score', progress.bestScore != null ? `${Math.round(progress.bestScore)}%` : '—'],
              ['Latest score', progress.latestScore != null ? `${Math.round(progress.latestScore)}%` : '—'],
              ['Average', progress.avgScore != null ? `${Math.round(progress.avgScore)}%` : '—'],
              ['Accuracy', progress.accuracy != null ? `${Math.round(progress.accuracy)}%` : '—'],
              ['Time spent', duration(progress.seconds)],
              ['Last played', progress.lastPlayedAt ? ago(progress.lastPlayedAt) : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="cq-data text-base text-ink-900">{value}</dd>
                <dt className="text-micro text-ink-500">{label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-5 border-t border-line pt-4">
            {trend.length >= 2 ? (
              <>
                <p className="text-xs font-medium text-ink-700">First try to latest</p>
                <Sparkline points={trend} label={`${lesson.title} score over time`} className="mt-1.5" />
              </>
            ) : (
              <p className="text-xs text-ink-600">
                {progress.completions === 1
                  ? 'One finished try so far. Play it again and the change shows up here.'
                  : 'Finish it once and your score history starts here.'}
              </p>
            )}
          </div>

          {progress.resumable ? (
            <p className="mt-4 rounded-sm border border-[#EDD9A8] bg-warning-50 px-3 py-2.5 text-xs text-warning-700">
              You have a part-finished try open. Continuing picks it up where you stopped.
            </p>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function LoadingLesson() {
  return (
    <div className="cq-container py-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-48 w-full rounded-lg" />
      <div className="mt-8 grid gap-8 cb:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-md" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-md" />
      </div>
      <p className="cq-sr" role="status">Loading this lesson</p>
    </div>
  );
}
