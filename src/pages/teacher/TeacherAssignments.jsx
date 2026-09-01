import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Plus, Archive, Eye, Users, AlertTriangle, Clock,
} from 'lucide-react';
import {
  Button, Badge, Panel, Select, Modal, Callout, EmptyState, ErrorState, Skeleton,
  Menu, MenuItem, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { dueLabel, plural, shortDate } from '@/lib/format.js';
import { FORMATS } from '@/content/index.js';
import AssignModal from '@/components/teacher/AssignModal.jsx';

/* ============================================================================
   Every assignment, across every class.

   The class dashboard answers "how is 5th Grade Science doing". This screen
   answers the other question a teacher with three classes has: "what is
   outstanding anywhere, and what is overdue". So the default sort is by due
   date with overdue work first, and the class is a column rather than the
   organising principle.

   Assignments are fetched per class rather than in one call, because that is
   what the API offers and a teacher has single-digit classes. Failures are
   per-class too — one archived or reassigned class should not blank the page.
   ========================================================================= */

const SORTS = [
  { value: 'due', label: 'Due date' },
  { value: 'created', label: 'Recently created' },
  { value: 'attention', label: 'Most unfinished' },
];

export default function TeacherAssignments() {
  const toast = useToast();
  const [classes, setClasses] = useState(null);
  const [rows, setRows] = useState(null);
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState(null);
  const [classFilter, setClassFilter] = useState('');
  const [sort, setSort] = useState('due');
  const [picking, setPicking] = useState(false);
  const [assignTo, setAssignTo] = useState(null);

  const load = async () => {
    try {
      const cls = await api.listMyClasses();
      setClasses(cls);
      const settled = await Promise.allSettled(cls.map((c) => api.listAssignments(c.id)));
      const all = [];
      const bad = [];
      settled.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          for (const a of res.value) all.push({ ...a, cls: cls[i] });
        } else {
          bad.push(`${cls[i].name}: ${res.reason?.message || 'could not be loaded.'}`);
        }
      });
      setRows(all);
      setProblems(bad);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Could not load your assignments.');
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    if (!rows) return [];
    const list = rows.filter((a) => !classFilter || a.classId === classFilter);
    const byDue = (a, b) => {
      /* No due date sorts last: it is not urgent, it is just open. */
      if (!a.dueAt && !b.dueAt) return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt) - new Date(b.dueAt);
    };
    const unfinished = (a) => a.stats.assigned - a.stats.mastered;
    if (sort === 'created') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'attention') list.sort((a, b) => unfinished(b) - unfinished(a) || byDue(a, b));
    else list.sort(byDue);
    return list;
  }, [rows, classFilter, sort]);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load your assignments" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!rows || !classes) return <LoadingAssignments />;

  const overdue = visible.filter((a) => dueLabel(a.dueAt).overdue).length;
  const startAssign = () => {
    if (classes.length === 1) setAssignTo(classes[0]);
    else if (classFilter) setAssignTo(classes.find((c) => c.id === classFilter));
    else setPicking(true);
  };

  return (
    <>
      <Meta
        title="Assignments"
        description="Every mission you have set, across all your classes, with who has finished it."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Assignments</h1>
            <p className="mt-2.5 text-ink-600">
              {rows.length
                ? <>
                    {plural(rows.length, 'mission')} across {plural(classes.length, 'class', 'classes')}
                    {overdue ? <> · <span className="font-medium text-danger-700">{overdue} overdue</span></> : null}
                  </>
                : 'Nothing set yet.'}
            </p>
          </div>
          <Button variant="primary" onClick={startAssign} disabled={!classes.length}>
            <Plus size={16} aria-hidden="true" /> Assign a mission
          </Button>
        </header>

        {problems.length ? (
          <Callout tone="warning" title="Some classes did not load" className="mt-6">
            <ul className="list-disc pl-5">
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Callout>
        ) : null}

        {!classes.length ? (
          <EmptyState icon={Users} title="No classes yet" className="mt-8"
            action={<Button to="/arena/teach" variant="primary">Create a class</Button>}>
            Assignments belong to a class, so the first step is a class and a join code.
          </EmptyState>
        ) : rows.length === 0 ? (
          <NothingAssigned onAssign={startAssign} />
        ) : (
          <>
            {/* Explicit column widths: the shared Select fills its container,
                so a flex row would give every filter the full page width. */}
            <div className="mt-7 grid items-end gap-3 sm:grid-cols-[15rem_12rem_1fr]">
              <Select
                label="Class"
                placeholder={`All classes (${rows.length})`}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={classes.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${rows.filter((a) => a.classId === c.id).length})`,
                }))}
              />
              <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} />
              <p className="pb-2.5 text-xs text-ink-500">
                Showing {visible.length} of {plural(rows.length, 'mission')}.
              </p>
            </div>

            {visible.length ? (
              <ul className="mt-6 space-y-5">
                {visible.map((a) => (
                  <AssignmentCard key={a.id} a={a} onChanged={load} toast={toast} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={ClipboardList} title="Nothing in that class" className="mt-6" compact>
                Clear the class filter, or assign something to it.
              </EmptyState>
            )}
          </>
        )}
      </div>

      <ClassPicker
        open={picking}
        classes={classes}
        onClose={() => setPicking(false)}
        onPick={(c) => { setPicking(false); setAssignTo(c); }}
      />

      <AssignModal
        open={!!assignTo}
        classId={assignTo?.id}
        className={assignTo?.name}
        gradeBand={assignTo?.gradeBand}
        onClose={() => setAssignTo(null)}
        onAssigned={(created) => {
          toast.success('Mission assigned', `${created.lessonTitle || 'Lesson'} → ${assignTo?.name}`);
          setAssignTo(null);
          load();
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ card --- */

function AssignmentCard({ a, onChanged, toast }) {
  const [confirm, setConfirm] = useState(false);
  const due = dueLabel(a.dueAt);
  const { stats } = a;

  return (
    <li>
      <Panel pad="none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/arena/teach/classes/${a.classId}`} className="text-xs font-semibold text-blue-700 no-underline hover:underline">
                {a.cls.name}
              </Link>
              {a.lesson ? <Badge tone="info">{FORMATS[a.lesson.format]?.label || a.lesson.format}</Badge> : null}
              {due.overdue ? <Badge tone="danger" icon={AlertTriangle}>{due.text}</Badge> : null}
            </div>
            <h2 className="mt-1.5 font-display text-h4 font-bold text-ink-900">{a.lessonTitle}</h2>
            <p className="mt-1 text-sm text-ink-500">
              Target {a.minMastery ?? 80}% ·{' '}
              <span className={cn(due.tone === 'danger' && 'font-medium text-danger-700',
                due.tone === 'warning' && 'font-medium text-warning-700')}>
                {due.text}
              </span>
              {' · set '}{shortDate(a.createdAt)}
              {a.note ? ` · “${a.note}”` : ''}
            </p>
          </div>
          <Menu label="Assignment actions"
            trigger={<Button variant="ghost" size="sm" iconOnly aria-label={`Actions for ${a.lessonTitle}`}>⋯</Button>}>
            <MenuItem icon={Eye} to={`/arena/lesson/${a.lessonId}`}>Preview the lesson</MenuItem>
            <MenuItem icon={Users} to={`/arena/teach/classes/${a.classId}`}>Open the class</MenuItem>
            <MenuItem icon={Archive} danger onClick={() => setConfirm(true)}>Remove assignment</MenuItem>
          </Menu>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            { label: 'Assigned', value: stats.assigned },
            { label: 'Completed', value: `${stats.completed}/${stats.assigned}` },
            { label: 'Hit the target', value: `${stats.mastered}/${stats.assigned}` },
            { label: 'Class average', value: stats.average != null ? `${stats.average}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-white px-4 py-3.5">
              <dd className="cq-data text-base text-ink-900">{s.value}</dd>
              <dt className="text-micro text-ink-500">{s.label}</dt>
            </div>
          ))}
        </dl>

        {stats.needsAttention.length ? (
          <div className="border-t border-line p-5">
            <p className="text-sm font-semibold text-ink-900">Still to finish</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {stats.needsAttention.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/arena/teach/classes/${a.classId}/students/${s.id}`}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium no-underline hover:border-ink-300"
                  >
                    {s.name}
                    <span className={cn('cq-data', s.score == null ? 'text-ink-500' : 'text-ink-900')}>
                      {s.score == null ? 'not started' : `${Math.round(s.score)}%`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="border-t border-line p-5 text-sm text-success-700">
            Everyone has hit the target on this one.
          </p>
        )}
      </Panel>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Remove “${a.lessonTitle}” from ${a.cls.name}?`}
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              try {
                await api.archiveAssignment(a.id);
                toast.success('Assignment removed', a.lessonTitle);
                setConfirm(false);
                onChanged();
              } catch (err) { toast.error('Could not remove it', err?.message); }
            }}>Remove</Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          The lesson stays playable and every score students have already earned stays on
          their record. Removing it only takes it off their mission list and off this page.
        </p>
      </Modal>
    </li>
  );
}

/* ----------------------------------------------------------------- bits ---- */

function ClassPicker({ open, classes, onClose, onPick }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Which class?"
      description="An assignment goes to one class at a time."
      size="sm"
      footer={<Button variant="ghost" onClick={onClose}>Cancel</Button>}
    >
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
        {classes.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              data-autofocus
              onClick={() => onPick(c)}
              className="flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink-900">{c.name}</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {plural(c.studentCount ?? 0, 'student')}
                  {c.gradeBand ? ` · Grades ${c.gradeBand}` : ''}
                </span>
              </span>
              <span aria-hidden="true" className="text-ink-400">→</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function NothingAssigned({ onAssign }) {
  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="grid cb:grid-cols-[1.1fr_1fr]">
        <div className="p-7 cb:p-9">
          <Badge tone="info">Nothing assigned</Badge>
          <h2 className="mt-3 text-h2">You don&rsquo;t have to assign anything.</h2>
          <p className="mt-3 text-ink-600">
            Your students can already open all 204 lessons. An assignment does not unlock
            anything and does not lock anything either — it says &ldquo;do this one, aim for
            this score, by this day&rdquo;, and it gives you a single page showing who has.
          </p>
          <p className="mt-3 text-ink-600">
            Overdue work is flagged here and on the student&rsquo;s own dashboard. It is never
            blocked, and a missed date never removes access to anything.
          </p>
          <Button size="lg" className="mt-7" onClick={onAssign}>
            <Plus size={17} aria-hidden="true" /> Assign your first mission
          </Button>
        </div>
        <div className="border-t border-line bg-paper-2 p-7 cb:border-l cb:border-t-0 cb:p-9">
          <h3 className="text-h4">What you get back</h3>
          <ul className="mt-4 space-y-3.5">
            {[
              { t: 'Who finished it', d: 'Completed, and how many hit your target score.' },
              { t: 'Who is stuck', d: 'A chip per student still short of the target, linking to their record.' },
              { t: 'The class average', d: 'One number for the whole group on that lesson.' },
            ].map((x) => (
              <li key={x.t} className="flex gap-3">
                <Clock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-500" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{x.t}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{x.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button to="/arena/teach/library" variant="outline" block className="mt-6">
            Browse the lesson library
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingAssignments() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading assignments</p>
    </div>
  );
}
