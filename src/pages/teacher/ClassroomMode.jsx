import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  X, RefreshCw, Target, EyeOff, AlertTriangle, Check,
} from 'lucide-react';
import {
  Button, Badge, Modal, Switch, Meter, MasteryTag, Callout, ErrorState, Skeleton, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { minutes, plural } from '@/lib/format.js';
import { FORMATS } from '@/content/index.js';

/* ============================================================================
   Classroom mode — the projected screen.

   This renders inside the immersive shell (ArenaShell drops its header for
   /arena/teach/classroom/), so the page owns the whole viewport and provides
   its own exit. Type is sized in vw so the same layout reads from the back of
   a room on an 11" Chromebook mirrored to a projector and on a 1920px
   smartboard, without a second breakpoint set.

   Privacy is the hard constraint here, not a preference. A projected screen is
   published to everyone in the room, including whoever walks in, so names and
   individual scores are off until a teacher deliberately turns them on for
   that session. The toggle does not persist — every visit starts private.
   ========================================================================= */

const REFRESH_MS = 30000;

export default function ClassroomMode() {
  const { classId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [showNames, setShowNames] = useState(false);

  const load = () => api.getClassOverview(classId)
    .then((d) => { setData(d); setUpdatedAt(new Date()); setError(null); })
    .catch((e) => setError(e?.message || 'Could not load that class.'));

  useEffect(() => { setData(null); load(); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Data refresh only — nothing on this screen animates on a refresh, so
     reduced-motion users get exactly the same behaviour as everyone else. */
  useEffect(() => {
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const focus = useMemo(() => {
    if (!data?.assignments.length) return null;
    if (focusId) return data.assignments.find((a) => a.id === focusId) || data.assignments[0];
    /* Default: the soonest thing still due, otherwise the newest assignment. */
    const dated = data.assignments.filter((a) => a.dueAt).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    return dated[0] || data.assignments[0];
  }, [data, focusId]);

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-gutter">
        <div className="w-full max-w-lg">
          <ErrorState title="Cannot project that class" detail={error} />
          <div className="mt-5 flex justify-center gap-2.5">
            <Button to="/arena/teach" variant="outline">All classes</Button>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return <LoadingBoard />;

  const { class: cls, totals, goals, classStrands } = data;
  const weakest = [...classStrands]
    .filter((s) => s.pct != null)
    .sort((a, b) => a.pct - b.pct)[0] || null;

  return (
    <>
      <Meta title={`${cls.name} — classroom mode`} />
      <div className="min-h-dvh bg-white text-ink-900">
        {/* Minimal chrome: everything here is a control, nothing is decoration. */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 cb:px-10">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[clamp(1.5rem,2.2vw,2.75rem)] font-bold leading-tight">
              {cls.name}
            </h1>
            <p className="mt-0.5 text-[clamp(0.75rem,0.9vw,1.125rem)] text-ink-600">
              {plural(totals.students, 'student')}
              {updatedAt ? ` · updated ${updatedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}
              {' · refreshes every 30 seconds'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" onClick={() => setPicking(true)}>
              <Target size={16} aria-hidden="true" /> Today&rsquo;s focus
            </Button>
            <Button variant="outline" onClick={load}>
              <RefreshCw size={16} aria-hidden="true" /> Refresh
            </Button>
            <Button variant="ghost" to={`/arena/teach/classes/${classId}`}>
              <X size={16} aria-hidden="true" /> Exit
            </Button>
          </div>
        </header>

        <main className="px-6 py-7 cb:px-10 cb:py-9">
          <div className="grid gap-6 cb:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] cb:gap-8">
            <JoinCode cls={cls} />
            <Focus focus={focus} showNames={showNames} onPick={() => setPicking(true)} />
          </div>

          <div className="mt-6 grid gap-6 cb:mt-8 cb:grid-cols-2 cb:gap-8">
            <Weakest weakest={weakest} totals={totals} />
            <Goals goals={goals} />
          </div>

          <div className="mt-8 max-w-[52rem]">
            <Switch
              label="Show names — only do this if your class is comfortable with it"
              hint="Off by default. A projected screen is visible to everyone in the room, including people who are not in your class, so individual results stay hidden unless you choose otherwise. This choice is not remembered."
              checked={showNames}
              onChange={setShowNames}
              className="rounded-md border border-line bg-paper-2 p-4"
            />
            {showNames ? (
              <Callout tone="warning" className="mt-3" title="Names are on the board">
                Turn this off before you leave the room.
              </Callout>
            ) : null}
          </div>
        </main>
      </div>

      <FocusPicker
        open={picking}
        data={data}
        classId={classId}
        current={focus?.id || null}
        onClose={() => setPicking(false)}
        onPick={(id) => { setFocusId(id); setPicking(false); }}
        onAssigned={() => { setPicking(false); load(); }}
      />
    </>
  );
}

/* ------------------------------------------------------------- join code --- */

function JoinCode({ cls }) {
  return (
    <section aria-labelledby="code-h" className="flex flex-col justify-center rounded-lg border border-line bg-paper-2 p-6 text-center cb:p-9">
      <h2 id="code-h" className="text-[clamp(0.875rem,1vw,1.25rem)] font-semibold uppercase tracking-label text-ink-700">
        Join this class
      </h2>
      {/* nowrap plus a conservative vw factor: a join code that breaks across
          two lines is unreadable from the back of a room. */}
      <p className="mt-3 whitespace-nowrap font-display text-[clamp(2.5rem,7vw,9rem)] font-bold leading-[0.95] tracking-tight text-blue-700">
        {cls.joinCode}
      </p>
      <p className="mx-auto mt-4 max-w-[34ch] text-[clamp(0.875rem,1.15vw,1.5rem)] leading-snug text-ink-700">
        Science Arena &rarr; Join a class &rarr; type the code
      </p>
      {cls.codeActive === false ? (
        <Badge tone="warning" className="mt-4" icon={AlertTriangle}>This code is switched off</Badge>
      ) : null}
    </section>
  );
}

/* ----------------------------------------------------------------- focus --- */

function Focus({ focus, showNames, onPick }) {
  if (!focus) {
    return (
      <section className="rounded-lg border border-dashed border-line p-6 cb:p-9">
        <h2 className="text-[clamp(1.125rem,1.6vw,2rem)] font-display font-bold">No focus set</h2>
        <p className="mt-2 max-w-[46ch] text-[clamp(0.875rem,1.1vw,1.375rem)] text-ink-600">
          Pick something for the class to work on and its progress appears here, live.
        </p>
        <Button variant="primary" size="lg" className="mt-5" onClick={onPick}>
          <Target size={17} aria-hidden="true" /> Choose today&rsquo;s focus
        </Button>
      </section>
    );
  }

  const { stats } = focus;
  const pct = stats.assigned ? Math.min(100, Math.round((stats.completed / stats.assigned) * 100)) : 0;

  return (
    <section aria-labelledby="focus-h" className="rounded-lg border border-line bg-white p-6 shadow-sm cb:p-9">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[clamp(0.75rem,0.85vw,1.0625rem)] font-semibold uppercase tracking-label text-ink-600">
            Today&rsquo;s focus
          </p>
          <h2 id="focus-h" className="mt-1.5 font-display text-[clamp(1.375rem,2.3vw,3rem)] font-bold leading-tight">
            {focus.lessonTitle}
          </h2>
          <p className="mt-1.5 text-[clamp(0.8125rem,1vw,1.25rem)] text-ink-600">
            {focus.lesson ? `${FORMATS[focus.lesson.format]?.label || focus.lesson.format} · ${minutes(focus.lesson.estMinutes)} · ` : ''}
            target {focus.minMastery ?? 80}%
          </p>
        </div>
        <Button variant="ghost" onClick={onPick}>Change</Button>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Finished', value: `${stats.completed}/${stats.assigned}` },
          { label: 'Hit the target', value: `${stats.mastered}/${stats.assigned}` },
          { label: 'Class average', value: stats.average != null ? `${stats.average}%` : '—' },
        ].map((s) => (
          <div key={s.label}>
            <dd className="cq-data text-[clamp(2rem,4.2vw,4.5rem)] leading-none text-ink-900">{s.value}</dd>
            <dt className="mt-1.5 text-[clamp(0.75rem,0.9vw,1.125rem)] text-ink-600">{s.label}</dt>
          </div>
        ))}
      </dl>

      <Meter
        value={pct}
        showValue={false}
        hideLabel
        size="lg"
        className="mt-6"
        label={`${focus.lessonTitle}: ${stats.completed} of ${stats.assigned} finished`}
      />

      {showNames ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[clamp(0.8125rem,0.95vw,1.125rem)] font-semibold">Still to finish</p>
          {stats.needsAttention.length ? (
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {stats.needsAttention.map((s) => (
                <li key={s.id} className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-2 px-3.5 py-1.5 text-[clamp(0.8125rem,0.95vw,1.125rem)]">
                  {s.name}
                  <span className={cn('cq-data', s.score == null ? 'text-ink-500' : 'text-ink-900')}>
                    {s.score == null ? 'not started' : `${Math.round(s.score)}%`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 inline-flex items-center gap-2 text-[clamp(0.875rem,1vw,1.25rem)] text-success-700">
              <Check size={18} aria-hidden="true" /> Everyone has hit the target.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 inline-flex items-center gap-2 border-t border-line pt-5 text-[clamp(0.75rem,0.9vw,1.0625rem)] text-ink-500">
          <EyeOff size={15} aria-hidden="true" />
          Individual results are hidden on this screen.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------- the rest --- */

function Weakest({ weakest, totals }) {
  return (
    <section aria-labelledby="weak-h" className="rounded-lg border border-line bg-white p-6 shadow-xs cb:p-8">
      <h2 id="weak-h" className="text-[clamp(0.75rem,0.85vw,1.0625rem)] font-semibold uppercase tracking-label text-ink-600">
        Where the class is weakest
      </h2>
      {weakest ? (
        <>
          <p className="mt-2.5 font-display text-[clamp(1.25rem,2vw,2.5rem)] font-bold leading-tight">
            {weakest.strand.name}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MasteryTag
              level={weakest.pct >= 85 ? 'mastered' : weakest.pct >= 70 ? 'proficient' : weakest.pct >= 45 ? 'developing' : 'beginning'}
              pct={weakest.pct}
            />
            <span className="text-[clamp(0.8125rem,0.95vw,1.125rem)] text-ink-600">
              class average · {plural(weakest.n, 'student')} with evidence
            </span>
          </div>
          <p className="mt-4 text-[clamp(0.875rem,1vw,1.25rem)] text-ink-700">
            Class mastery overall is{' '}
            <span className="cq-data text-ink-900">{totals.avgMastery != null ? `${totals.avgMastery}%` : '—'}</span>.
          </p>
        </>
      ) : (
        <p className="mt-2.5 text-[clamp(0.875rem,1vw,1.25rem)] text-ink-600">
          No strand has enough evidence yet. Once the class answers a few questions this
          names the topic to spend time on.
        </p>
      )}
    </section>
  );
}

function Goals({ goals }) {
  return (
    <section aria-labelledby="goal-h" className="rounded-lg border border-line bg-white p-6 shadow-xs cb:p-8">
      <h2 id="goal-h" className="text-[clamp(0.75rem,0.85vw,1.0625rem)] font-semibold uppercase tracking-label text-ink-600">
        Class goal
      </h2>
      {goals.length ? (
        <ul className="mt-3 space-y-5">
          {goals.map((g) => (
            <li key={g.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-[clamp(1.0625rem,1.5vw,1.875rem)] font-bold leading-tight">
                  {g.title}
                </p>
                <p className="cq-data text-[clamp(1.25rem,2.2vw,2.5rem)] leading-none text-ink-900">
                  {g.current}<span className="text-ink-500">/{g.target}</span>
                </p>
              </div>
              <Meter value={g.pct} showValue={false} hideLabel size="lg" className="mt-3"
                tone={g.pct >= 100 ? 'success' : 'blue'} label={`${g.title}: ${g.current} of ${g.target}`} />
              {g.pct >= 100 ? (
                <p className="mt-2 text-[clamp(0.875rem,1vw,1.25rem)] font-medium text-success-700">Done — together.</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 text-[clamp(0.875rem,1vw,1.25rem)] text-ink-600">
          No shared goal set. A class goal is one number the whole group works towards —
          it is never a ranking between students.
        </p>
      )}
    </section>
  );
}

/* ----------------------------------------------------------- focus picker --- */

function FocusPicker({ open, data, classId, current, onClose, onPick, onAssigned }) {
  const [quick, setQuick] = useState(null);
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    if (!open || quick) return;
    api.listLessons({ formats: ['quick'], sort: 'title', limit: 20 })
      .then((res) => setQuick(res.rows))
      .catch(() => setQuick([]));
  }, [open, quick]);

  const assignAndFocus = async (lesson) => {
    setBusy(lesson.id);
    setFailed(null);
    try {
      await api.createAssignment({ classId, lessonId: lesson.id, minMastery: 80 });
      onAssigned();
    } catch (err) {
      setFailed(err?.message || 'Could not assign that.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Today's focus"
      description="Anything already assigned to this class can be shown live. A quick check can be assigned right now."
      footer={<Button variant="ghost" onClick={onClose}>Cancel</Button>}
    >
      {failed ? <Callout tone="danger" className="mb-4">{failed}</Callout> : null}

      <h3 className="text-micro font-semibold uppercase tracking-label text-ink-600">Assigned to this class</h3>
      {data.assignments.length ? (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line">
          {data.assignments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onPick(a.id)}
                className={cn('flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50',
                  a.id === current && 'bg-blue-50')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink-900">{a.lessonTitle}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {a.stats.completed}/{a.stats.assigned} finished · target {a.minMastery ?? 80}%
                  </span>
                </span>
                {a.id === current ? <Check size={16} aria-hidden="true" className="shrink-0 text-blue-600" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-500">Nothing assigned yet.</p>
      )}

      <h3 className="mt-6 text-micro font-semibold uppercase tracking-label text-ink-600">
        Or assign a five-minute check now
      </h3>
      {!quick ? (
        <div className="mt-2 space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full rounded-sm" />)}
        </div>
      ) : (
        <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-md border border-line">
          {quick.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0 truncate text-sm text-ink-800">{l.subject}</span>
              <Button size="sm" variant="outline" loading={busy === l.id} onClick={() => assignAndFocus(l)}>
                Assign
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-ink-500">
        Assigning here does the same thing it does anywhere else: it sets a target and a
        note on the students&rsquo; mission list. It does not lock anything.
      </p>
    </Modal>
  );
}

function LoadingBoard() {
  return (
    <div className="min-h-dvh bg-white px-6 py-6 cb:px-10">
      <Skeleton className="h-10 w-80" />
      <div className="mt-8 grid gap-6 cb:grid-cols-2 cb:gap-8">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
      <div className="mt-8 grid gap-6 cb:grid-cols-2 cb:gap-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <p className="cq-sr" role="status">Loading the classroom screen</p>
    </div>
  );
}
