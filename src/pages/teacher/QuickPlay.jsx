import React, { useEffect, useMemo, useState } from 'react';
import {
  Zap, ClipboardCheck, Presentation, Check, ArrowRight, Users, TrendingUp, Clock,
} from 'lucide-react';
import {
  Button, Badge, Panel, Select, Tabs, Callout, EmptyState, ErrorState,
  Skeleton, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import AssignmentResult from '@/components/teacher/AssignmentResult.jsx';
import { minutes, plural } from '@/lib/format.js';

/* ============================================================================
   Quick play — the "I have five minutes" screen.

   Three jobs a teacher does in the last minutes of a lesson or the first
   minutes of a unit, each with an honest time cost stated up front. Nothing
   here is a new content type: it is the existing catalog filtered to the two
   short formats, arranged around the moment it gets used.

   Class averages come from assignments, because that is the only place the
   platform actually measures a whole class against one lesson. If a quick
   check has never been assigned there is no average, and the screen says so
   rather than inventing one.
   ========================================================================= */

const TABS = [
  { value: 'exit', label: 'Exit ticket', icon: Zap },
  { value: 'growth', label: 'Pre & post check', icon: ClipboardCheck },
  { value: 'challenge', label: 'Whole-class challenge', icon: Presentation },
];

const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Engineering'];

export default function QuickPlay() {
  const toast = useToast();
  const [tab, setTab] = useState('exit');
  const [catalog, setCatalog] = useState(null);
  const [classes, setClasses] = useState(null);
  const [classId, setClassId] = useState('');
  const [history, setHistory] = useState({});
  const [error, setError] = useState(null);

  /* lessonId -> [{ className, classId, average, completed, assigned }] */
  const loadHistory = async (cls) => {
    const settled = await Promise.allSettled(cls.map((c) => api.listAssignments(c.id)));
    const map = {};
    settled.forEach((res, i) => {
      if (res.status !== 'fulfilled') return;
      for (const a of res.value) {
        (map[a.lessonId] ||= []).push({
          classId: cls[i].id,
          className: cls[i].name,
          assignmentId: a.id,
          average: a.stats.average,
          completed: a.stats.completed,
          assigned: a.stats.assigned,
        });
      }
    });
    setHistory(map);
  };

  useEffect(() => {
    Promise.all([api.getCatalog(), api.listMyClasses()])
      .then(([cat, cls]) => {
        setCatalog(cat);
        setClasses(cls);
        if (cls.length) setClassId(cls[0].id);
        return loadHistory(cls);
      })
      .catch((e) => setError(e?.message || 'Could not load your quick tools.'));
  }, []);

  const quick = useMemo(
    () => (catalog?.lessons || []).filter((l) => l.format === 'quick' && l.status === 'published'),
    [catalog],
  );
  const checks = useMemo(
    () => (catalog?.lessons || []).filter((l) => l.format === 'assessment' && l.status === 'published'),
    [catalog],
  );

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load quick play" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!catalog || !classes) return <LoadingQuick />;

  const cls = classes.find((c) => c.id === classId) || null;
  const refresh = () => loadHistory(classes);

  return (
    <>
      <Meta
        title="Quick play"
        description="Exit tickets, pre and post checks, and a projected whole-class challenge — the short-format tools."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Quick play</h1>
            <p className="mt-2.5 max-w-[64ch] text-ink-600">
              Three things that fit in the gaps: a five-minute check to close a lesson, a
              twelve-question pair to measure a unit, and a screen you can project. None of
              them are graded work — they are evidence you can act on tomorrow.
            </p>
          </div>
          {classes.length ? (
            <div className="w-full sm:w-[15rem]">
              <Select
                label="Class"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          ) : null}
        </header>

        {!classes.length ? (
          <EmptyState icon={Users} title="You need a class first" className="mt-8"
            action={<Button to="/arena/teach" variant="primary">Create a class</Button>}>
            All three tools assign to a class or project its join code, so there is nothing
            to do here until one exists.
          </EmptyState>
        ) : (
          <>
            <Tabs tabs={TABS} value={tab} onChange={setTab} className="mt-8" ariaLabel="Quick play tools" />
            <div className="mt-7">
              {tab === 'exit' ? (
                <ExitTicket lessons={quick} catalog={catalog} cls={cls} history={history}
                  toast={toast} onAssigned={refresh} />
              ) : null}
              {tab === 'growth' ? (
                <PrePost checks={checks} cls={cls} history={history} toast={toast} onAssigned={refresh} />
              ) : null}
              {tab === 'challenge' ? <Challenge cls={cls} classes={classes} /> : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ exit ticket --- */

function ExitTicket({ lessons, catalog, cls, history, toast, onAssigned }) {
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const assign = async () => {
    setBusy(true);
    try {
      /* Due at the end of today: an exit ticket that is due next week is not an
         exit ticket. Overdue still never blocks anything. */
      const end = new Date();
      end.setHours(23, 59, 59, 0);
      const created = await api.createAssignment({
        classId: cls.id,
        lessonId: picked.id,
        dueAt: end.toISOString(),
        minMastery: 80,
        note: 'Exit ticket — finish before you leave.',
      });
      toast.success('Exit ticket set', `${picked.title} → ${cls.name}`);
      setDone({ assignmentId: created.id, lesson: picked });
      onAssigned();
    } catch (err) {
      toast.error('Could not set that', err?.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-[46rem]">
        <AssignmentResult
          assignmentId={done.assignmentId}
          title={`${done.lesson.title} is set`}
          sub={`Due at the end of today · ${cls?.name}`}
          cls={cls}
          onAgain={() => { setDone(null); setPicked(null); }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-8 cb:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="exit-h" className="min-w-0">
        <h2 id="exit-h" className="text-h3">Pick a topic</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-500">
          {plural(lessons.length, 'five-question challenge')}, one per topic. Roughly five
          minutes including reading time, so it fits the end of a period.
        </p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {lessons.map((l) => {
            const rows = history[l.id] || [];
            const mine = rows.find((r) => r.classId === cls?.id);
            const other = rows.filter((r) => r.average != null && r.classId !== cls?.id);
            const active = picked?.id === l.id;
            const strand = catalog.strand(l.strandId);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPicked(l)}
                  className={cn(
                    'flex min-h-[2.75rem] w-full flex-col items-start gap-1.5 rounded-md border bg-white p-4 text-left shadow-xs transition-colors duration-1',
                    active ? 'border-blue-600 ring-1 ring-blue-200' : 'border-line hover:border-ink-300',
                  )}
                >
                  <span className="flex w-full items-start justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
                        style={{ background: `var(--cq-strand-${l.strandId})` }} />
                      <span className="truncate text-sm font-semibold text-ink-900">{l.subject}</span>
                    </span>
                    {active ? <Check size={16} aria-hidden="true" className="shrink-0 text-blue-600" /> : null}
                  </span>
                  <span className="text-micro text-ink-500">
                    {strand?.name} · 5 questions · {minutes(l.estMinutes)}
                  </span>
                  {mine?.average != null ? (
                    <span className="text-micro text-ink-700">
                      {cls.name} averaged <span className="cq-data text-ink-900">{mine.average}%</span>{' '}
                      last time ({mine.completed}/{mine.assigned} finished)
                    </span>
                  ) : other.length ? (
                    <span className="text-micro text-ink-500">
                      {other[0].className} averaged <span className="cq-data text-ink-700">{other[0].average}%</span>
                    </span>
                  ) : (
                    <span className="text-micro text-ink-400">No class data on this one yet</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="min-w-0 space-y-6">
        <Panel pad="md" lift>
          <h2 className="text-h4">Set it as today&rsquo;s exit ticket</h2>
          {picked ? (
            <>
              <p className="mt-3 font-display font-bold text-ink-900">{picked.title}</p>
              <p className="mt-1 text-sm text-ink-600">{picked.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <dd className="cq-data text-base text-ink-900">{cls?.name || '—'}</dd>
                  <dt className="text-micro text-ink-500">Class</dt>
                </div>
                <div>
                  <dd className="cq-data text-base text-ink-900">Today</dd>
                  <dt className="text-micro text-ink-500">Due</dt>
                </div>
              </dl>
              <Button variant="primary" block className="mt-5" loading={busy} onClick={assign} disabled={!cls}>
                Assign to {cls?.name}
              </Button>
              <Button variant="ghost" block className="mt-2" to={`/arena/lesson/${picked.id}`}>
                Look at it first
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-500">
              Choose a topic on the left. The target is 80% and the due date is the end of
              today — you can change either afterwards from the class page.
            </p>
          )}
        </Panel>

        <Callout tone="note" title="What an exit ticket is for">
          Five questions tell you whether to move on or reteach tomorrow. They are not
          worth marking: three students at 40% is the signal, not the individual scores.
        </Callout>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------- pre/post --- */

function PrePost({ checks, cls, history, toast, onAssigned }) {
  const [busy, setBusy] = useState(null);

  const assign = async (lesson, note) => {
    setBusy(lesson.id);
    try {
      await api.createAssignment({ classId: cls.id, lessonId: lesson.id, minMastery: 60, note });
      toast.success('Check assigned', `${lesson.title} → ${cls.name}`);
      onAssigned();
    } catch (err) {
      toast.error('Could not assign it', err?.message);
    } finally {
      setBusy(null);
    }
  };

  const rows = SUBJECTS.map((subject) => ({
    subject,
    pre: checks.find((l) => l.subject === subject && l.id.endsWith('.pre')),
    post: checks.find((l) => l.subject === subject && l.id.endsWith('.post')),
  })).filter((r) => r.pre && r.post);

  const mine = (lessonId) => (history[lessonId] || []).find((r) => r.classId === cls?.id) || null;

  return (
    <div className="grid gap-8 cb:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="growth-h" className="min-w-0">
        <h2 id="growth-h" className="text-h3">Measure a unit</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-500">
          Each pair is the same twelve questions twice: once before you teach the unit,
          once after — about twelve minutes a sitting. The gap between the two averages is
          the only number here worth quoting to anyone.
        </p>

        <ul className="mt-5 space-y-4">
          {rows.map((r) => {
            const pre = mine(r.pre.id);
            const post = mine(r.post.id);
            const growth = pre?.average != null && post?.average != null
              ? post.average - pre.average : null;
            return (
              <li key={r.subject}>
                <Panel pad="none">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
                    <div>
                      <h3 className="font-display text-h4 font-bold text-ink-900">{r.subject}</h3>
                      <p className="mt-0.5 text-xs text-ink-500">
                        12 questions · {minutes(r.pre.estMinutes)} per sitting
                      </p>
                    </div>
                    {growth != null ? (
                      <Badge tone={growth > 0 ? 'success' : 'warning'} icon={growth > 0 ? TrendingUp : undefined}>
                        {growth > 0 ? '+' : ''}{growth} pts for {cls?.name}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-px bg-line sm:grid-cols-2">
                    {[
                      { l: r.pre, kind: 'Before teaching', row: pre, note: 'Pre-check — answer what you can, guessing is fine.' },
                      { l: r.post, kind: 'After teaching', row: post, note: 'Post-check — the same questions as before.' },
                    ].map((side) => (
                      <div key={side.l.id} className="bg-white p-5">
                        <p className="text-micro font-semibold uppercase tracking-label text-ink-600">{side.kind}</p>
                        <p className="mt-1.5 text-sm font-medium text-ink-900">{side.l.title}</p>
                        <p className="mt-1 text-xs text-ink-500">
                          {!side.row ? 'Not assigned to this class' : (
                            <>
                              Assigned · {side.row.completed}/{side.row.assigned} finished
                              {side.row.average != null
                                ? <> · average <span className="cq-data text-ink-800">{side.row.average}%</span></>
                                : ' · no scores yet'}
                            </>
                          )}
                        </p>
                        <div className="mt-3.5 flex flex-wrap gap-2">
                          <Button size="sm" variant={side.row ? 'outline' : 'primary'}
                            loading={busy === side.l.id} onClick={() => assign(side.l, side.note)}>
                            {side.row ? 'Assign again' : 'Assign'}
                          </Button>
                          <Button size="sm" variant="ghost" to={`/arena/lesson/${side.l.id}`}>Preview</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="min-w-0 space-y-6">
        <Callout tone="note" title="Why the same questions twice">
          A post-check with different questions measures two things at once and separates
          neither. Identical items mean the difference is the learning, not the paper.
        </Callout>
        <Callout tone="warning" title="Do not use the pre-check as a grade">
          Students are meant to score badly on it. Say so before they start, or you will
          get guessing dressed up as data. The target on both is 60% for that reason.
        </Callout>
        <Panel pad="md" lift>
          <h2 className="text-h4">A sensible order</h2>
          <ol className="mt-3 space-y-2.5 text-sm text-ink-700">
            {[
              'Assign the pre-check the lesson before you start the unit.',
              'Teach. The class dashboard’s weakest strand tells you where to slow down.',
              'Assign the post-check in the last week.',
              'Compare the two averages here.',
            ].map((step, i) => (
              <li key={step}><span className="cq-data text-ink-900">{i + 1}.</span> {step}</li>
            ))}
          </ol>
        </Panel>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------- challenge --- */

function Challenge({ cls, classes }) {
  return (
    <div className="grid gap-8 cb:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="challenge-h" className="min-w-0">
        <h2 id="challenge-h" className="text-h3">Put it on the board</h2>
        <p className="mt-1 max-w-[60ch] text-sm text-ink-500">
          Classroom mode is a projection screen: the join code in very large type, live
          progress on whatever lesson you pick, and the class goal. It shows aggregate
          numbers only — no student names unless you deliberately turn them on.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <li key={c.id}>
              <Panel to={`/arena/teach/classroom/${c.id}`} pad="md" className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-h4 font-bold text-ink-900">{c.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {plural(c.studentCount ?? 0, 'student')}
                      {c.gradeBand ? ` · Grades ${c.gradeBand}` : ''}
                    </p>
                  </div>
                  <Presentation size={18} aria-hidden="true" className="shrink-0 text-ink-500" />
                </div>
                <p className="mt-4 font-display text-h3 font-bold tracking-wide text-blue-700">{c.joinCode}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                  Open classroom mode <ArrowRight size={13} aria-hidden="true" />
                </p>
              </Panel>
            </li>
          ))}
        </ul>
      </section>

      <aside className="min-w-0 space-y-6">
        <Panel pad="md" lift>
          <h2 className="text-h4">Running it as a challenge</h2>
          <ul className="mt-3 space-y-3 text-sm text-ink-700">
            <li className="flex gap-2.5">
              <Clock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-500" />
              Set an exit ticket first, then project this. The completed count climbing is
              the whole game — no leaderboard needed.
            </li>
            <li className="flex gap-2.5">
              <Users size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-500" />
              Students who are not signed in yet can read the code off the board and join in
              about thirty seconds.
            </li>
          </ul>
          <Button to={`/arena/teach/classroom/${cls?.id}`} variant="primary" block className="mt-5" disabled={!cls}>
            <Presentation size={16} aria-hidden="true" /> Project {cls?.name}
          </Button>
        </Panel>
        <Callout tone="note" title="Ten minutes, not a lesson">
          A whole-class challenge works because it is short and low-stakes. Nothing is
          recorded differently from ordinary play, and nobody is put on a screen by name.
        </Callout>
      </aside>
    </div>
  );
}

function LoadingQuick() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-[28rem]" />
      <Skeleton className="mt-8 h-12 w-full max-w-md rounded-sm" />
      <div className="mt-7 grid gap-3 sm:grid-cols-2 cb:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading quick play</p>
    </div>
  );
}
