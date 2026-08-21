import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Users, ArrowRight, TrendingUp, Copy, Check, Zap, ClipboardList,
  AlertTriangle, Sparkles, Library,
} from 'lucide-react';
import {
  Button, Badge, Panel, Meter, Modal, Input, Select, Callout, EmptyState,
  ErrorState, Skeleton, ActivityColumns, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { ago, plural } from '@/lib/format.js';

/* ============================================================================
   Teacher home.

   The first screen has to answer "is anything on fire?" before it answers
   anything else, so classes lead with the three numbers a teacher actually
   scans for: how many students, how many were active this week, and average
   mastery. Everything else is one click away.

   An empty account is a first-run experience, not an error state: the page
   walks a brand-new teacher through creating their first class inline.
   ========================================================================= */

export default function TeacherHome() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.getTeacherOverview()
    .then(setData)
    .catch((e) => setError(e?.message || 'Could not load your classes.'));

  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load your dashboard" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!data) return <LoadingTeacher />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const totalStudents = data.classes.reduce((n, c) => n + c.studentCount, 0);

  return (
    <>
      <Meta title="Teacher dashboard" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">{greeting}, {data.profile.displayName}.</h1>
            <p className="mt-2.5 text-ink-600">
              {data.classes.length
                ? `${plural(data.classes.length, 'class', 'classes')} · ${plural(totalStudents, 'student')}`
                : 'Let’s get your first class set up — it takes about a minute.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden="true" /> New class
            </Button>
            <Button to="/arena/teach/quick" variant="outline">
              <Zap size={16} aria-hidden="true" /> Quick play
            </Button>
          </div>
        </header>

        {data.classes.length === 0 ? (
          <FirstRun onCreate={() => setCreating(true)} />
        ) : (
          <>
            <section className="mt-9" aria-labelledby="classes-h">
              <h2 id="classes-h" className="text-h3">Your classes</h2>
              <ul className="mt-4 grid gap-4 cb:grid-cols-2 xl:grid-cols-3">
                {data.classes.map((c) => <ClassCard key={c.id} cls={c} toast={toast} />)}
              </ul>
            </section>

            <div className="mt-10 grid gap-8 cb:grid-cols-[1.3fr_1fr]">
              <Panel pad="md" lift>
                <h2 className="text-h4">Class activity, last two weeks</h2>
                <p className="mt-1 text-sm text-ink-500">Lessons finished across all your classes</p>
                {data.activity.some((a) => a.value > 0) ? (
                  <ActivityColumns data={data.activity} className="mt-5" height={90} />
                ) : (
                  <p className="mt-4 text-sm text-ink-500">
                    Nothing finished yet. Once students start playing, this fills in.
                  </p>
                )}
              </Panel>

              <Panel pad="none" lift>
                <div className="border-b border-line px-5 py-4">
                  <h2 className="text-h4">Recent activity</h2>
                </div>
                {data.recentEvents.length ? (
                  <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                    {data.recentEvents.map((e) => (
                      <li key={e.id} className="px-5 py-3">
                        <p className="text-sm text-ink-800">
                          <strong className="font-semibold">{e.studentName}</strong>{' '}
                          {describeEvent(e)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">{ago(e.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-ink-500">
                    Nothing yet. Share a class code to get started.
                  </p>
                )}
              </Panel>
            </div>
          </>
        )}
      </div>

      <CreateClassModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(cls) => {
          setCreating(false);
          toast.success('Class created', `Share the code ${cls.joinCode} with your students.`);
          load();
        }}
      />
    </>
  );
}

/* --------------------------------------------------------------- pieces --- */

function ClassCard({ cls, toast }) {
  const [copied, setCopied] = useState(false);
  const needsAttention = cls.studentCount > 0 && cls.activeThisWeek / cls.studentCount < 0.6;

  const copy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(cls.joinCode).then(() => {
      setCopied(true);
      toast.success('Code copied', cls.joinCode);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <li>
      <Link
        to={`/arena/teach/classes/${cls.id}`}
        className="cq-panel cq-panel--action block h-full p-5 no-underline"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-h4 font-bold text-ink-900">{cls.name}</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              {cls.gradeBand ? `Grades ${cls.gradeBand}` : 'All grades'}
              {cls.subject ? ` · ${cls.subject}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            title="Copy the class code"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink-800 hover:border-ink-300"
          >
            {copied ? <Check size={13} aria-hidden="true" className="text-success-600" /> : <Copy size={13} aria-hidden="true" />}
            {cls.joinCode}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Students', value: cls.studentCount },
            { label: 'Active', value: cls.studentCount ? `${cls.activeThisWeek}/${cls.studentCount}` : '—' },
            { label: 'Mastery', value: cls.avgMastery != null ? `${cls.avgMastery}%` : '—' },
          ].map((s) => (
            <div key={s.label}>
              <dd className="cq-data text-base text-ink-900">{s.value}</dd>
              <dt className="text-micro text-ink-500">{s.label}</dt>
            </div>
          ))}
        </dl>

        {cls.avgMastery != null ? (
          <Meter value={cls.avgMastery} showValue={false} hideLabel size="sm" className="mt-4"
            label={`${cls.name} average mastery`} />
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {needsAttention ? (
            <Badge tone="warning" icon={AlertTriangle}>
              {cls.studentCount - cls.activeThisWeek} inactive
            </Badge>
          ) : null}
          {cls.assignmentCount ? (
            <Badge icon={ClipboardList}>{plural(cls.assignmentCount, 'assignment')}</Badge>
          ) : (
            <Badge tone="info">No assignments yet</Badge>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            Open <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function FirstRun({ onCreate }) {
  return (
    <div className="mt-9 overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <div className="grid cb:grid-cols-[1.1fr_1fr]">
        <div className="p-7 cb:p-9">
          <Badge tone="info">First class</Badge>
          <h2 className="mt-3 text-h2">Four steps and you&rsquo;re running.</h2>
          <ol className="mt-6 space-y-4">
            {[
              { t: 'Create a class', d: 'A name is all it needs. "5th Grade Science" is fine.' },
              { t: 'Share the code', d: 'We generate something like CQ-48291. Write it on the board.' },
              { t: 'Students join', d: 'They type the code and appear on your roster immediately.' },
              { t: 'Assign a mission — or don’t', d: 'They can explore all 204 lessons either way. An assignment just tells you what to look at.' },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{s.t}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button size="lg" className="mt-8" onClick={onCreate}>
            <Plus size={17} aria-hidden="true" /> Create my first class
          </Button>
        </div>
        <div className="border-t border-line bg-paper-2 p-7 cb:border-l cb:border-t-0 cb:p-9">
          <h3 className="flex items-center gap-2 text-h4">
            <Sparkles size={17} aria-hidden="true" className="text-orange-600" />
            Want to look around first?
          </h3>
          <p className="mt-2 text-sm text-ink-600">
            Sign out and pick &ldquo;Open the teacher dashboard&rdquo; on the sign-in page to load
            a fully populated demo class — twenty students with real answer histories,
            assignments part-finished, and one student who has never logged in.
          </p>
          <div className="mt-5 space-y-2.5">
            <Button to="/arena/teach/library" variant="outline" block>
              <Library size={16} aria-hidden="true" /> Browse the 204 lessons
            </Button>
            <Button to="/educators" variant="ghost" block>Read what teachers get</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreateClassModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', gradeBand: '', subject: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const cls = await api.createClass(form);
      setForm({ name: '', gradeBand: '', subject: '' });
      onCreated?.(cls);
    } catch (err) {
      setError(err?.message || 'Could not create that class.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a class"
      description="You can change any of this later. Only the name is required."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy}>Create class</Button>
        </>
      )}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error ? <Callout tone="danger">{error}</Callout> : null}
        <Input
          label="Class name"
          required
          data-autofocus
          maxLength={60}
          placeholder="5th Grade Science"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Grade band"
            placeholder="Any"
            options={[{ value: '3-5', label: 'Grades 3–5' }, { value: '6-8', label: 'Grades 6–8' }]}
            value={form.gradeBand}
            onChange={(e) => setForm({ ...form, gradeBand: e.target.value })}
            hint="Used to sort suggested lessons."
          />
          <Input
            label="Subject"
            placeholder="General Science"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <Callout tone="note" title="What students see">
          Your name and the class name. Students in a class cannot see each other&rsquo;s
          progress — only their own.
        </Callout>
      </form>
    </Modal>
  );
}

function describeEvent(e) {
  const pct = e.payload?.scorePct;
  switch (e.type) {
    case 'lesson_completed': return `finished a lesson${pct != null ? ` with ${pct}%` : ''}.`;
    case 'lesson_started': return 'started a lesson.';
    case 'class_joined': return `joined ${e.payload?.className || 'a class'}.`;
    case 'skill_mastered': return 'mastered a skill.';
    case 'achievement_earned': return 'earned a badge.';
    case 'assignment_created': return 'was assigned a mission.';
    case 'password_reset_by_teacher': return 'had their password reset.';
    default: return e.type.replace(/_/g, ' ');
  }
}

function LoadingTeacher() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-9 w-80" />
      <Skeleton className="mt-3 h-4 w-52" />
      <div className="mt-9 grid gap-4 cb:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading your classes</p>
    </div>
  );
}
