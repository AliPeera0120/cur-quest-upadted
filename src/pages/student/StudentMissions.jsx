import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Check, Users, Compass, Clock, ClipboardList, AlertTriangle, Target,
  Swords, Zap, FlaskConical, Terminal, BookOpen, ClipboardCheck,
} from 'lucide-react';
import {
  Button, Badge, Callout, EmptyState, ErrorState, Skeleton, Meter, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { FORMATS } from '@/content/index.js';
import { minutes, dueLabel, shortDate, plural } from '@/lib/format.js';

/* ============================================================================
   Assigned missions.

   The hard part of this screen is tone. A list of overdue work with a target
   percentage next to it can read as a debt collection notice, and for a child
   who is behind that is the fastest way to make them close the tab.

   So: two groups only — what is left to do and what is done — the due date
   stated plainly without alarm colours beyond the genuinely overdue, and a
   standing reminder at the top that none of this closes anything off. An
   assignment tells a teacher where to look. It is not a gate, and the whole
   library stays open whether this list is empty or twenty items long.
   ========================================================================= */

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: ClipboardCheck,
};

const STATE = {
  met: { label: 'Target met', tone: 'success', cta: 'Play again' },
  needs_work: { label: 'Below target', tone: 'warning', cta: 'Try again' },
  in_progress: { label: 'In progress', tone: 'info', cta: 'Continue' },
  not_started: { label: 'Not started', tone: 'default', cta: 'Start' },
};

export default function StudentMissions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getStudentOverview()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load your missions.'); });
    return () => { alive = false; };
  }, [user?.id]);

  const groups = useMemo(() => {
    if (!data) return { todo: [], done: [] };
    const todo = data.assignments.filter((a) => a.state !== 'met');
    const done = data.assignments.filter((a) => a.state === 'met');
    /* Overdue first, then soonest due, then anything with no date at all. */
    todo.sort((x, y) => {
      if (x.overdue !== y.overdue) return x.overdue ? -1 : 1;
      const dx = x.assignment.dueAt ? new Date(x.assignment.dueAt).getTime() : Infinity;
      const dy = y.assignment.dueAt ? new Date(y.assignment.dueAt).getTime() : Infinity;
      return dx - dy || x.lesson.title.localeCompare(y.lesson.title);
    });
    done.sort((x, y) => (y.progress?.bestScore ?? 0) - (x.progress?.bestScore ?? 0));
    return { todo, done };
  }, [data]);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Meta title="Missions" />
        <ErrorState title="Could not load your missions" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!data) return <LoadingMissions />;

  const { todo, done } = groups;
  const overdue = todo.filter((a) => a.overdue).length;

  return (
    <>
      <Meta
        title="Missions"
        description="Work your teacher has assigned you on CuriosityQuest, with due dates and targets."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header>
          <p className="text-micro font-semibold uppercase tracking-label text-blue-600">Assigned work</p>
          <h1 className="mt-2 text-h1">Your missions.</h1>
          <p className="mt-2.5 max-w-measure text-ink-600">
            {data.assignments.length === 0
              ? 'Nothing has been set for you.'
              : todo.length === 0
                ? `All ${plural(data.assignments.length, 'mission')} are at or above target. Nicely done.`
                : `${plural(todo.length, 'mission')} left to do${overdue ? `, ${overdue} past the due date` : ''}.`}
          </p>
        </header>

        {/* The most important sentence on the page. */}
        <Callout tone="note" title="These are guidance, not gates" className="mt-6 max-w-measure">
          Your teacher uses assignments to point you at something and to see how it went.
          Missing one does not lock anything: all {data.totals.catalogSize} lessons stay open,
          you can retake anything as many times as you like, and your best score is the one
          that counts.
        </Callout>

        {data.assignments.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={Users}
            title="No missions yet"
            action={(
              <div className="flex flex-wrap justify-center gap-2.5">
                <Button to="/arena/join" variant="primary">Join a class with a code</Button>
                <Button to="/arena/explore" variant="outline">
                  <Compass size={16} aria-hidden="true" /> Browse lessons instead
                </Button>
              </div>
            )}
          >
            Missions appear here once you are in a teacher&rsquo;s class and they set something.
            You do not need a class to use CuriosityQuest — every lesson is already
            available to you.
          </EmptyState>
        ) : (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Left to do', value: todo.length, hint: 'Not yet at target' },
                { label: 'Past due', value: overdue, hint: 'Still worth doing', warn: overdue > 0 },
                { label: 'At target', value: done.length, hint: `of ${data.assignments.length} set` },
              ].map((s) => (
                <div key={s.label} className={cn('rounded-md border bg-white p-4 shadow-xs',
                  s.warn ? 'border-[#F1DEB0]' : 'border-line')}>
                  <dd className={cn('cq-data cq-data--md', s.warn ? 'text-warning-700' : 'text-blue-700')}>{s.value}</dd>
                  <dt className="mt-0.5 text-sm font-medium text-ink-800">{s.label}</dt>
                  <p className="mt-0.5 text-micro text-ink-500">{s.hint}</p>
                </div>
              ))}
            </dl>

            <section className="mt-10" aria-labelledby="todo-h">
              <SectionHead
                id="todo-h"
                icon={ClipboardList}
                title="Needs doing"
                sub={todo.length ? 'Soonest due first' : null}
              />
              {todo.length === 0 ? (
                <p className="mt-4 rounded-md border border-[#B9DFCF] bg-success-50 px-4 py-3.5 text-sm text-success-700">
                  <Check size={15} aria-hidden="true" className="mr-1.5 inline" />
                  Nothing outstanding. Everything your teacher set is at or above its target.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {todo.map((item) => <MissionRow key={item.assignment.id} item={item} />)}
                </ul>
              )}
            </section>

            {done.length ? (
              <section className="mt-10" aria-labelledby="done-h">
                <SectionHead
                  id="done-h"
                  icon={Check}
                  title="Done"
                  sub={`${plural(done.length, 'mission')} at or above target`}
                />
                <ul className="mt-4 space-y-3">
                  {done.map((item) => <MissionRow key={item.assignment.id} item={item} />)}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {/* The empty state already offers the library, so this only appears
            for students who do have assignments. */}
        {data.assignments.length ? (
          <div className="mt-12 flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-5 shadow-xs">
            <Compass size={19} aria-hidden="true" className="text-blue-600" />
            <p className="min-w-0 flex-1 text-sm text-ink-700">
              Finished what was set, or fancy something else? The whole library is open.
            </p>
            <Button to="/arena/explore" variant="outline" size="sm">Explore lessons</Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

function SectionHead({ id, icon: Icon, title, sub }) {
  return (
    <div className="border-b border-line pb-3">
      <h2 id={id} className="flex items-center gap-2 text-h3">
        <Icon size={19} aria-hidden="true" className="text-blue-600" />
        {title}
      </h2>
      {sub ? <p className="mt-1 text-sm text-ink-500">{sub}</p> : null}
    </div>
  );
}

function MissionRow({ item }) {
  const { assignment, lesson, progress, state, threshold, overdue } = item;
  const meta = STATE[state];
  const due = dueLabel(assignment.dueAt);
  const Icon = FORMAT_ICON[lesson.format] || Target;
  const best = progress?.bestScore != null ? Math.round(progress.bestScore) : null;

  return (
    <li>
      <div className={cn('rounded-md border bg-white p-4 shadow-xs cb:p-5',
        overdue ? 'border-[#F5CDCA]' : 'border-line')}>
        <div className="flex flex-wrap items-start gap-4">
          <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-md',
            state === 'met' ? 'bg-success-50 text-success-700' : 'bg-blue-50 text-blue-700')}>
            <Icon size={19} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium',
                due.tone === 'danger' ? 'text-danger-700'
                : due.tone === 'warning' ? 'text-warning-700' : 'text-ink-500')}>
                {due.overdue ? <AlertTriangle size={12} aria-hidden="true" /> : <Clock size={12} aria-hidden="true" />}
                {due.text}
              </span>
            </div>

            <h3 className="mt-2 font-display text-h4 font-semibold text-ink-900">
              <Link to={`/arena/lesson/${lesson.id}`} className="no-underline hover:text-blue-700">
                {lesson.title}
              </Link>
            </h3>

            <p className="mt-1 text-xs text-ink-500">
              {assignment.className ? `${assignment.className} · ` : ''}
              {FORMATS[lesson.format]?.label} · {minutes(lesson.estMinutes)}
              {assignment.dueAt ? ` · due ${shortDate(assignment.dueAt)}` : ''}
            </p>

            {assignment.note ? (
              <p className="mt-2.5 border-l-2 border-blue-200 pl-3 text-sm italic text-ink-700">
                &ldquo;{assignment.note}&rdquo;
              </p>
            ) : null}

            <div className="mt-3 max-w-sm">
              <Meter
                value={best ?? 0}
                showValue={false}
                hideLabel
                size="sm"
                tone={state === 'met' ? 'success' : 'blue'}
                label={`Your best score on ${lesson.title}`}
              />
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-600">
                <span>Target <span className="cq-data text-ink-900">{threshold}%</span></span>
                <span aria-hidden="true">·</span>
                <span>
                  {best != null
                    ? <>Your best <span className="cq-data text-ink-900">{best}%</span></>
                    : 'No score yet'}
                </span>
                {progress?.attempts ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{plural(progress.attempts, 'try', 'tries')}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <Button
            to={`/arena/play/${lesson.id}?assignment=${assignment.id}`}
            size="md"
            variant={state === 'met' ? 'outline' : 'primary'}
            className="shrink-0"
          >
            <Play size={16} aria-hidden="true" /> {meta.cta}
          </Button>
        </div>
      </div>
    </li>
  );
}

function LoadingMissions() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-9 w-64" />
      <Skeleton className="mt-6 h-20 w-full max-w-measure rounded-md" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
      </div>
      <div className="mt-10 space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading your missions</p>
    </div>
  );
}
