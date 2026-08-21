import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Sparkles, Clock, Plus, ClipboardList, Check,
  History, TrendingUp,
} from 'lucide-react';
import {
  Button, Badge, Panel, PanelHead, Meter, MasteryTag, MasteryLegend, Avatar,
  Callout, EmptyState, ErrorState, Skeleton, ActivityColumns, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { levelForPct } from '@/platform/mastery.js';
import Meta from '@/shell/Meta.jsx';
import { ago, duration, minutes, plural, shortDate } from '@/lib/format.js';
import { FORMATS } from '@/content/index.js';
import AssignModal from '@/components/teacher/AssignModal.jsx';

/* ============================================================================
   One student, as their teacher sees them.

   This screen is a case file, not a report card. It is ordered by what a
   teacher does with it: what to reteach (review), what to build on
   (strengths), what actually happened (timeline), and what is outstanding
   (assignments). The headline numbers lead only because they orient the rest.

   Everything here is inferred from answered questions. The closing note says
   so plainly, because a percentage on a school screen gets read as a grade
   unless you tell people otherwise.
   ========================================================================= */

export default function StudentDetail() {
  const { classId, studentId } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [cls, setCls] = useState(null);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const load = () => api.getStudentDetail(classId, studentId)
    .then((d) => { setData(d); setError(null); })
    .catch((e) => setError(e?.message || 'Could not load that student.'));

  useEffect(() => {
    setData(null);
    load();
    /* The class name is only needed for the back link and the assign dialog,
       so it comes from the cheap list rather than the full class overview. */
    api.listMyClasses({ includeArchived: true })
      .then((rows) => setCls(rows.find((c) => c.id === classId) || null))
      .catch(() => setCls(null));
  }, [classId, studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not open that student" detail={error} />
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button to={`/arena/teach/classes/${classId}`} variant="outline">Back to the class</Button>
          <Button to="/arena/teach" variant="ghost">All classes</Button>
        </div>
      </div>
    );
  }
  if (!data) return <LoadingStudent />;

  const { student, overall, growth, totals } = data;
  const className = cls?.name || 'this class';

  return (
    <>
      <Meta
        title={`${student.displayName} · ${className}`}
        description={`Evidence-based progress record for ${student.displayName}.`}
      />
      <div className="cq-container cq-container--wide py-8">
        <Link
          to={`/arena/teach/classes/${classId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900"
        >
          <ArrowLeft size={15} aria-hidden="true" /> {cls?.name || 'Back to the class'}
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={student.displayName} avatarKey={student.avatarKey} size={60} />
            <div className="min-w-0">
              <h1 className="text-h1">{student.displayName}</h1>
              <p className="mt-1 text-sm text-ink-500">
                @{student.username}
                {student.gradeBand ? ` · Grades ${student.gradeBand}` : ''}
                {' · '}
                {totals.lastActiveAt ? `last active ${ago(totals.lastActiveAt)}` : 'never played anything'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {overall != null
                  ? <MasteryTag level={levelForPct(overall, totals.questionsAnswered)} pct={overall} />
                  : <Badge tone="warning" icon={AlertTriangle}>No evidence yet</Badge>}
                <GrowthBadge growth={growth} mastery={data.mastery} />
              </div>
            </div>
          </div>
          <Button variant="primary" onClick={() => setAssigning(true)}>
            <Plus size={16} aria-hidden="true" /> Assign a mission
          </Button>
        </header>

        <dl className="mt-7 grid gap-4 sm:grid-cols-3 cb:grid-cols-6">
          {[
            { label: 'Lessons completed', value: totals.lessonsCompleted },
            { label: 'Time on task', value: duration(totals.seconds) },
            { label: 'Questions answered', value: totals.questionsAnswered },
            { label: 'Accuracy', value: totals.accuracy != null ? `${totals.accuracy}%` : '—' },
            { label: 'Skills mastered', value: totals.skillsMastered },
            { label: 'Attempts', value: totals.attempts },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-line bg-white p-4 shadow-xs">
              <dd className="cq-data cq-data--md text-blue-700">{s.value}</dd>
              <dt className="mt-0.5 text-sm font-medium text-ink-800">{s.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-9 grid gap-8 cb:grid-cols-[1.25fr_1fr]">
          <div className="min-w-0 space-y-9">
            <Strands strands={data.strands} />
            <Review
              review={data.review}
              classId={classId}
              className={className}
              studentName={student.displayName}
              toast={toast}
              onAssigned={load}
            />
            <Strengths strengths={data.strengths} />
            <Timeline timeline={data.timeline} />
          </div>

          <aside className="min-w-0 space-y-8">
            <Panel pad="md" lift>
              <h2 className="text-h4">Activity, last four weeks</h2>
              <p className="mt-1 text-sm text-ink-500">Lessons finished per day</p>
              {data.activity.some((a) => a.value > 0) ? (
                <ActivityColumns data={data.activity} className="mt-4" height={86} />
              ) : (
                <p className="mt-3 text-sm text-ink-500">Nothing finished in the last 28 days.</p>
              )}
            </Panel>

            <Assignments assignments={data.assignments} onAssign={() => setAssigning(true)} />

            <Callout tone="note" title="What these numbers are">
              Everything on this page is inferred from the questions{' '}
              {student.displayName} has answered — weighted towards recent work, and held
              back where there is too little evidence to be fair. It is a picture of what
              the platform has seen, not a grade, and it is not built to be transcribed
              into a gradebook.
            </Callout>
          </aside>
        </div>
      </div>

      <AssignModal
        open={assigning}
        classId={classId}
        className={className}
        gradeBand={cls?.gradeBand}
        onClose={() => setAssigning(false)}
        onAssigned={(a) => {
          setAssigning(false);
          toast.success('Mission assigned', `${a.lessonTitle || 'Lesson'} → ${className}`);
          load();
        }}
      />
    </>
  );
}

/* --------------------------------------------------------------- header --- */

/** First attempts → latest attempts, in points, averaged across skills. */
function GrowthBadge({ growth, mastery }) {
  /* Only skills that have a growth figure count, so the two endpoints and the
     platform's own growth number are the same arithmetic — otherwise the badge
     reads "78% → 83% · +11 pts" and looks broken. */
  const span = useMemo(() => {
    const rows = Object.values(mastery).filter((m) => m.growth != null);
    if (!rows.length) return null;
    const mean = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
    return { first: mean(rows.map((m) => m.firstPct)), latest: mean(rows.map((m) => m.latestPct)) };
  }, [mastery]);

  if (growth == null || !span) {
    return <span className="text-xs text-ink-500">Not enough attempts to show growth yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-2 px-3 py-1.5 text-xs">
      {growth > 0 ? <TrendingUp size={13} aria-hidden="true" className="text-success-600" /> : null}
      <span className="text-ink-700">First</span>
      <span className="cq-data text-ink-900">{span.first}%</span>
      <span aria-hidden="true" className="text-ink-400">→</span>
      <span className="cq-data font-semibold text-ink-900">{span.latest}%</span>
      <span className={cn('cq-data font-medium',
        growth > 0 ? 'text-success-700' : growth < 0 ? 'text-danger-700' : 'text-ink-600')}>
        {growth > 0 ? '+' : ''}{growth} pts
      </span>
    </span>
  );
}

/* ------------------------------------------------------------- sections --- */

function Strands({ strands }) {
  const [catalog, setCatalog] = useState(null);
  useEffect(() => { api.getCatalog().then(setCatalog).catch(() => setCatalog(null)); }, []);

  return (
    <section aria-labelledby="strands-h">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="strands-h" className="text-h3">Mastery by strand</h2>
          <p className="mt-1 max-w-[58ch] text-sm text-ink-500">
            Coverage is part of the reading: a high percentage on two skills out of eight stays
            below Proficient on purpose.
          </p>
        </div>
        <MasteryLegend compact />
      </div>

      <Panel pad="md" className="mt-4">
        {!catalog ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-sm" />)}
          </div>
        ) : (
          <ul className="space-y-5">
            {catalog.strands.map((strand) => {
              const s = strands[strand.id]
                || { pct: null, level: 'not_started', touched: 0, totalSkills: 0, mastered: 0 };
              return (
                <li key={strand.id}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                        style={{ background: `var(--cq-strand-${strand.id})` }} />
                      <span className="truncate text-sm font-medium text-ink-900">{strand.name}</span>
                    </span>
                    <MasteryTag level={s.level} pct={s.pct} size="sm" />
                  </div>
                  <Meter
                    value={s.pct ?? 0}
                    showValue={false}
                    hideLabel
                    size="sm"
                    className="mt-2"
                    tone={`mastery-${s.level}`}
                    label={`${strand.name} mastery`}
                  />
                  <p className="mt-1 text-micro text-ink-500">
                    {s.touched
                      ? `${s.touched} of ${s.totalSkills} skills attempted · ${plural(s.mastered, 'skill')} mastered`
                      : `No evidence yet across ${plural(s.totalSkills, 'skill')}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </section>
  );
}

function Review({ review, classId, className, studentName, toast, onAssigned }) {
  const [busy, setBusy] = useState(null);

  const assign = async (lesson) => {
    setBusy(lesson.id);
    try {
      await api.createAssignment({ classId, lessonId: lesson.id, minMastery: 80 });
      toast.success('Assigned to the whole class', `${lesson.title} → ${className}`);
      onAssigned();
    } catch (err) {
      toast.error('Could not assign that', err?.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="review-h">
      <h2 id="review-h" className="flex items-center gap-2 text-h3">
        <AlertTriangle size={19} aria-hidden="true" className="text-warning-600" />
        Areas to review
      </h2>
      <p className="mt-1 max-w-[58ch] text-sm text-ink-500">
        Skills below 70% where {studentName} has answered enough questions for the number
        to mean something. Weakest first.
      </p>

      {review.length ? (
        <ul className="mt-4 space-y-4">
          {review.map((r) => (
            <li key={r.skill.id} className="rounded-md border border-[#F1DEB0] bg-warning-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink-900">{r.skill.name}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {r.skill.topic} · {plural(r.mastery.evidence, 'answer')} on record
                    {r.mastery.trend === 'up' ? ' · trending up' : r.mastery.trend === 'down' ? ' · trending down' : ''}
                  </p>
                </div>
                <MasteryTag level={r.mastery.level} pct={r.mastery.pct} size="sm" />
              </div>

              {r.suggestions.length ? (
                <ul className="mt-3.5 space-y-2">
                  {r.suggestions.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-white px-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <Link to={`/arena/lesson/${l.id}`} className="block truncate text-sm font-medium text-ink-900 no-underline hover:text-blue-700">
                          {l.title}
                        </Link>
                        <span className="mt-0.5 block text-micro text-ink-500">
                          {FORMATS[l.format]?.label || l.format} · {minutes(l.estMinutes)}
                        </span>
                      </span>
                      <Button size="sm" variant="outline" loading={busy === l.id} onClick={() => assign(l)}>
                        Assign this
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-600">
                  No easier lesson covers this skill yet — worth doing in person.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Callout tone="success" title="Nothing is flagged" className="mt-4">
          Either everything with enough evidence is above 70%, or {studentName} has not
          answered enough questions yet for a gap to be worth naming.
        </Callout>
      )}

      <p className="mt-3 text-xs text-ink-500">
        &ldquo;Assign this&rdquo; sends the lesson to the whole class — assignments are
        class-level, so nothing here singles a student out to their classmates.
      </p>
    </section>
  );
}

function Strengths({ strengths }) {
  if (!strengths.length) return null;
  return (
    <section aria-labelledby="strengths-h">
      <h2 id="strengths-h" className="flex items-center gap-2 text-h3">
        <Sparkles size={19} aria-hidden="true" className="text-success-600" />
        What they&rsquo;re good at
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Skills at 80% or better with real evidence behind them. Useful for pairing
        students up.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {strengths.map((s) => (
          <li key={s.skill.id} className="flex items-center justify-between gap-3 rounded-md border border-[#C7EBDD] bg-success-50 px-4 py-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-900">{s.skill.name}</span>
              {/* The evidence count is here because a skill can sit at 100% and
                  still read "Developing" until enough questions back it up. */}
              <span className="mt-0.5 block truncate text-micro text-ink-600">
                {s.skill.topic} · {plural(s.mastery.evidence, 'answer')}
              </span>
            </span>
            <MasteryTag level={s.mastery.level} pct={s.mastery.pct} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Timeline({ timeline }) {
  /* Grouped by day so a teacher sees "four things on Tuesday" without reading
     four timestamps. */
  const days = useMemo(() => {
    const out = [];
    for (const t of timeline) {
      const key = String(t.at).slice(0, 10);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(t);
      else out.push({ key, at: t.at, items: [t] });
    }
    return out;
  }, [timeline]);

  return (
    <section aria-labelledby="timeline-h">
      <h2 id="timeline-h" className="flex items-center gap-2 text-h3">
        <History size={19} aria-hidden="true" className="text-ink-500" />
        Everything they have finished
      </h2>
      <p className="mt-1 text-sm text-ink-500">Newest first, up to the last 25 attempts.</p>

      {days.length ? (
        <ol className="mt-4 space-y-5">
          {days.map((day) => (
            <li key={day.key}>
              <p className="text-micro font-semibold uppercase tracking-label text-ink-600">{shortDate(day.at)} · {ago(day.at)}</p>
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
                {day.items.map((t, i) => (
                  <li key={`${t.lesson.id}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <Link to={`/arena/lesson/${t.lesson.id}`} className="block truncate text-sm font-medium text-ink-900 no-underline hover:text-blue-700">
                        {t.lesson.title}
                      </Link>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-micro text-ink-500">
                        <span>{FORMATS[t.lesson.format]?.label || t.lesson.format}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" /> {duration(t.seconds)}
                        </span>
                      </span>
                    </span>
                    {t.scorePct != null
                      ? <MasteryTag level={levelForPct(t.scorePct)} pct={t.scorePct} size="sm" />
                      : <span className="text-xs text-ink-500">No score recorded</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState icon={History} title="Nothing finished yet" className="mt-4" compact>
          Once they complete a lesson it appears here with the date, the score and how long
          it took.
        </EmptyState>
      )}
    </section>
  );
}

const STATE_META = {
  met: { label: 'Hit the target', tone: 'success', icon: Check },
  needs_work: { label: 'Done, below target', tone: 'warning', icon: AlertTriangle },
  in_progress: { label: 'In progress', tone: 'info', icon: Clock },
  not_started: { label: 'Not started', tone: 'default', icon: null },
};

function Assignments({ assignments, onAssign }) {
  const rows = assignments.filter((a) => a.lesson);
  return (
    <Panel pad="none" lift>
      <PanelHead title="Assignments for this class" sub="Where this student stands on each one" icon={ClipboardList} />
      {rows.length ? (
        <ul className="divide-y divide-line">
          {rows.map((a) => {
            const meta = STATE_META[a.state] || STATE_META.not_started;
            const best = a.progress?.bestScore;
            return (
              <li key={a.assignment.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link to={`/arena/lesson/${a.lesson.id}`} className="min-w-0 flex-1 text-sm font-medium text-ink-900 no-underline hover:text-blue-700">
                    {a.lesson.title}
                  </Link>
                  <Badge tone={meta.tone} icon={meta.icon || undefined}>{meta.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  Target {a.assignment.minMastery ?? 80}%
                  {best != null
                    ? <> · best <span className="cq-data text-ink-800">{Math.round(best)}%</span></>
                    : ' · no score yet'}
                  {a.progress?.attempts ? ` · ${plural(a.progress.attempts, 'attempt')}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-5">
          <p className="text-sm text-ink-600">
            Nothing assigned to this class. Students can play every lesson regardless — an
            assignment only tells you who has done what.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onAssign}>Assign a mission</Button>
        </div>
      )}
    </Panel>
  );
}

function LoadingStudent() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <div className="flex items-start gap-4">
        <Skeleton className="h-[60px] w-[60px]" rounded="pill" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-3 cb:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
      </div>
      <Skeleton className="mt-9 h-96 w-full rounded-md" />
      <p className="cq-sr" role="status">Loading student record</p>
    </div>
  );
}
