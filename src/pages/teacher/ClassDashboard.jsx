import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, RefreshCw, Users, Plus, Download, Presentation,
  AlertTriangle, TrendingUp, Sparkles, Archive, UserMinus, KeyRound, ClipboardList,
} from 'lucide-react';
import {
  Button, Badge, Panel, PanelHead, Meter, MasteryCell, MasteryLegend, MasteryTag,
  Tabs, DataTable, SortableTh, Avatar, Modal, Input, Select, Callout, EmptyState,
  ErrorState, Skeleton, Menu, MenuItem, MenuLabel, RankedBars, ActivityColumns,
  MasteryDistribution, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { ago, duration, plural, downloadText, dueLabel } from '@/lib/format.js';
import AssignModal from '@/components/teacher/AssignModal.jsx';

/* ============================================================================
   Class dashboard.

   The point of this screen is to answer one question fast: who needs help, and
   with what. So insights come first — generated from evidence, not typed in by
   the teacher — then the matrix, then the roster.

   The matrix is a real table with row and column headers, sticky on both axes,
   and every cell states its mastery in words as well as colour. A teacher
   should be able to print it, and a screen-reader user should be able to read
   down a column.
   ========================================================================= */

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'matrix', label: 'Mastery matrix' },
  { value: 'students', label: 'Students' },
  { value: 'assignments', label: 'Assignments' },
];

export default function ClassDashboard() {
  const { classId } = useParams();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const load = () => api.getClassOverview(classId)
    .then((d) => { setData(d); setError(null); })
    .catch((e) => setError(e?.message || 'Could not load that class.'));

  useEffect(() => { setData(null); load(); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not open that class" detail={error} />
        <div className="mt-5"><Button to="/arena/teach" variant="outline">Back to my classes</Button></div>
      </div>
    );
  }
  if (!data) return <LoadingClass />;

  const { class: cls, totals } = data;

  return (
    <>
      <Meta title={cls.name} />
      <div className="cq-container cq-container--wide py-8">
        <Link to="/arena/teach" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900">
          <ArrowLeft size={15} aria-hidden="true" /> All classes
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-h1">{cls.name}</h1>
              {cls.archivedAt ? <Badge tone="warning">Archived</Badge> : null}
            </div>
            <p className="mt-2 text-ink-600">
              {plural(totals.students, 'student')}
              {cls.gradeBand ? ` · Grades ${cls.gradeBand}` : ''}
              {cls.subject ? ` · ${cls.subject}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <ClassCodeButton cls={cls} onChanged={load} toast={toast} />
            <Button variant="primary" onClick={() => setAssigning(true)}>
              <Plus size={16} aria-hidden="true" /> Assign a mission
            </Button>
            <ClassMenu cls={cls} data={data} onChanged={load} toast={toast} />
          </div>
        </header>

        {/* Headline numbers */}
        <dl className="mt-7 grid gap-4 sm:grid-cols-2 cb:grid-cols-5">
          {[
            { label: 'Class mastery', value: totals.avgMastery != null ? `${totals.avgMastery}%` : '—', hint: 'Average across the six strands' },
            { label: 'Active this week', value: `${totals.activeThisWeek}/${totals.students}`, hint: 'Played something in 7 days' },
            { label: 'Lessons completed', value: totals.lessonsCompleted, hint: 'All time' },
            { label: 'Average accuracy', value: totals.avgAccuracy != null ? `${totals.avgAccuracy}%` : '—', hint: 'Across every question answered' },
            { label: 'Needs attention', value: totals.needsAttention, hint: 'Below 60% or no data yet', tone: totals.needsAttention > 0 ? 'warn' : null },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-md border bg-white p-4 shadow-xs',
              s.tone === 'warn' ? 'border-[#F1DEB0]' : 'border-line')}>
              <dd className={cn('cq-data cq-data--md', s.tone === 'warn' ? 'text-warning-700' : 'text-blue-700')}>
                {s.value}
              </dd>
              <dt className="mt-0.5 text-sm font-medium text-ink-800">{s.label}</dt>
              <p className="mt-0.5 text-micro text-ink-500">{s.hint}</p>
            </div>
          ))}
        </dl>

        <Tabs tabs={TABS} value={tab} onChange={setTab} className="mt-9" ariaLabel="Class views" />

        <div className="mt-7">
          {tab === 'overview' ? <Overview data={data} onAssign={() => setAssigning(true)} onTab={setTab} /> : null}
          {tab === 'matrix' ? <Matrix data={data} /> : null}
          {tab === 'students' ? <Roster data={data} classId={classId} onChanged={load} toast={toast} /> : null}
          {tab === 'assignments' ? <Assignments data={data} onAssign={() => setAssigning(true)} onChanged={load} toast={toast} /> : null}
        </div>
      </div>

      <AssignModal
        open={assigning}
        classId={classId}
        className={cls.name}
        gradeBand={cls.gradeBand}
        onClose={() => setAssigning(false)}
        onAssigned={(a) => { setAssigning(false); toast.success('Mission assigned', a.lessonTitle || undefined); load(); }}
      />
    </>
  );
}

/* ------------------------------------------------------------- overview --- */
function Overview({ data, onAssign, onTab }) {
  const { insights, classStrands, roster, perStudent, goals, activity, skillMatrix, weakSkills } = data;
  const needsHelp = [...perStudent]
    .filter((p) => p.overall == null || p.overall < 65)
    .sort((a, b) => (a.overall ?? -1) - (b.overall ?? -1))
    .slice(0, 6);
  const improving = [...perStudent]
    .filter((p) => p.growth != null && p.growth >= 10)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5);

  return (
    <div className="grid gap-8 cb:grid-cols-[1.25fr_1fr]">
      <div className="min-w-0 space-y-8">
        {/* Insights first: this is the reason the page exists. */}
        <section aria-labelledby="insights-h">
          <h2 id="insights-h" className="flex items-center gap-2 text-h3">
            <Sparkles size={19} aria-hidden="true" className="text-orange-600" />
            What the data is telling you
          </h2>
          {insights.length ? (
            <ul className="mt-4 space-y-3">
              {insights.map((i) => <InsightCard key={i.id} insight={i} onAssign={onAssign} onTab={onTab} />)}
            </ul>
          ) : (
            <Callout tone="note" title="Nothing needs your attention yet" className="mt-4">
              Once students have answered enough questions, this is where class-wide gaps,
              inactive students and lagging assignments appear.
            </Callout>
          )}
        </section>

        <section aria-labelledby="strand-h">
          <h2 id="strand-h" className="text-h3">Class mastery by strand</h2>
          <p className="mt-1 text-sm text-ink-500">
            One measure — average mastery — across the six science strands. Lowest first.
          </p>
          <Panel pad="md" className="mt-4">
            <RankedBars
              rows={classStrands.map((s) => ({
                key: s.strand.id,
                label: s.strand.name,
                value: s.pct,
                swatch: `var(--cq-strand-${s.strand.id})`,
                hint: s.n ? `${s.n} of ${roster.length} students with evidence` : 'No evidence yet',
              })).reverse()}
              emptyLabel="No data"
            />
          </Panel>
        </section>

        {needsHelp.length ? (
          <section aria-labelledby="help-h">
            <h2 id="help-h" className="flex items-center gap-2 text-h3">
              <AlertTriangle size={19} aria-hidden="true" className="text-warning-600" />
              Who needs help
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Below 65% overall, or no evidence yet. Not a ranking — a shortlist.
            </p>
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
              {needsHelp.map((p) => (
                <li key={p.student.id}>
                  <Link
                    to={`/arena/teach/classes/${data.class.id}/students/${p.student.id}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-3.5 no-underline hover:bg-blue-50"
                  >
                    <Avatar name={p.student.displayName} avatarKey={p.student.avatarKey} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-900">{p.student.displayName}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {p.lastActiveAt ? `last active ${ago(p.lastActiveAt)}` : 'never signed in'}
                        {p.questionsAnswered ? ` · ${plural(p.questionsAnswered, 'question')} answered` : ''}
                      </span>
                    </span>
                    <span className="cq-data shrink-0 text-sm text-ink-900">
                      {p.overall != null ? `${p.overall}%` : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <aside className="min-w-0 space-y-8">
        <Panel pad="md" lift>
          <h2 className="text-h4">Activity, last two weeks</h2>
          {activity.some((a) => a.value > 0) ? (
            <ActivityColumns data={activity} className="mt-4" height={80} />
          ) : (
            <p className="mt-3 text-sm text-ink-500">No lessons finished yet.</p>
          )}
        </Panel>

        <Panel pad="md" lift>
          <h2 className="text-h4">Where the class sits</h2>
          <p className="mt-1 text-sm text-ink-500">Students at each mastery level, overall</p>
          <MasteryDistribution
            className="mt-4"
            counts={perStudent.reduce((acc, p) => {
              const lvl = p.overall == null ? 'not_started'
                : p.overall >= 85 ? 'mastered'
                : p.overall >= 70 ? 'proficient'
                : p.overall >= 45 ? 'developing' : 'beginning';
              acc[lvl] = (acc[lvl] || 0) + 1;
              return acc;
            }, {})}
            total={perStudent.length}
          />
        </Panel>

        {improving.length ? (
          <Panel pad="md" lift>
            <h2 className="flex items-center gap-2 text-h4">
              <TrendingUp size={17} aria-hidden="true" className="text-success-600" />
              Clearly improving
            </h2>
            <ul className="mt-3 space-y-2">
              {improving.map((p) => (
                <li key={p.student.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink-800">{p.student.displayName}</span>
                  <span className="cq-data shrink-0 text-success-700">+{p.growth} pts</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {goals.length ? (
          <Panel pad="md" lift>
            <h2 className="text-h4">Class goals</h2>
            <ul className="mt-3 space-y-4">
              {goals.map((g) => (
                <li key={g.id}>
                  <p className="text-sm font-medium text-ink-900">{g.title}</p>
                  <Meter value={g.pct} showValue={false} hideLabel size="sm" className="mt-2"
                    tone={g.pct >= 100 ? 'success' : 'blue'} label={g.title} />
                  <p className="mt-1 text-xs text-ink-500">
                    <span className="cq-data">{g.current}</span> of {g.target}
                    {g.pct >= 100 ? ' · complete' : ''}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink-500">
              Cooperative by design — the class works toward a shared number rather than
              being ranked against each other.
            </p>
          </Panel>
        ) : null}
      </aside>
    </div>
  );
}

function InsightCard({ insight, onAssign, onTab }) {
  const tone = insight.severity === 'high' ? 'danger'
    : insight.severity === 'medium' ? 'warning'
    : insight.severity === 'good' ? 'success' : 'info';
  const border = { danger: 'border-[#F5CDCA]', warning: 'border-[#F1DEB0]', success: 'border-[#C7EBDD]', info: 'border-blue-100' }[tone];
  const bg = { danger: 'bg-danger-50', warning: 'bg-warning-50', success: 'bg-success-50', info: 'bg-blue-50' }[tone];

  return (
    <li className={cn('rounded-md border p-4', border, bg)}>
      <p className="font-display font-semibold text-ink-900">{insight.title}</p>
      <p className="mt-1.5 text-sm text-ink-700">{insight.detail}</p>
      {insight.action ? (
        <div className="mt-3.5">
          {insight.action.type === 'review_skill' ? (
            <Button size="sm" variant="primary" onClick={onAssign}>{insight.action.label}</Button>
          ) : insight.action.type === 'view_assignment' ? (
            <Button size="sm" variant="outline" onClick={() => onTab('assignments')}>{insight.action.label}</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onTab('students')}>{insight.action.label}</Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

/* --------------------------------------------------------------- matrix --- */
function Matrix({ data }) {
  const { roster, perStudent, classStrands } = data;
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  const rows = useMemo(() => {
    const list = [...perStudent];
    list.sort((a, b) => {
      let d = 0;
      if (sort.key === 'name') d = a.student.displayName.localeCompare(b.student.displayName);
      else if (sort.key === 'overall') d = (a.overall ?? -1) - (b.overall ?? -1);
      else d = (a.strands[sort.key]?.pct ?? -1) - (b.strands[sort.key]?.pct ?? -1);
      return sort.dir === 'asc' ? d : -d;
    });
    return list;
  }, [perStudent, sort]);

  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  if (!roster.length) {
    return (
      <EmptyState icon={Users} title="No students yet">
        Share the class code and this fills in as soon as they join.
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-h3">Mastery matrix</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500">
            Every cell shows a level, a percentage, and how many of that strand&rsquo;s
            skills the student has actually attempted. A hatched cell means no evidence
            yet — not a zero. A high percentage on few skills stays below Proficient on
            purpose. Tap a column header to sort.
          </p>
        </div>
        <MasteryLegend />
      </div>

      <Panel pad="none" className="mt-5 overflow-hidden">
        <DataTable
          sticky
          caption={`Mastery by student and science strand for ${data.class.name}`}
          wrapClassName="max-h-[70vh]"
          head={(
            <tr>
              <SortableTh label="Student" active={sort.key === 'name'} dir={sort.dir}
                onSort={() => toggle('name')} className="cq-table__rowhead min-w-[11rem]" />
              <SortableTh label="Overall" active={sort.key === 'overall'} dir={sort.dir}
                onSort={() => toggle('overall')} align="right" />
              {classStrands.map((s) => (
                <SortableTh
                  key={s.strand.id}
                  label={s.strand.name}
                  active={sort.key === s.strand.id}
                  dir={sort.dir}
                  onSort={() => toggle(s.strand.id)}
                />
              ))}
            </tr>
          )}
        >
          {rows.map((p) => (
            <tr key={p.student.id}>
              <th scope="row" className="cq-table__rowhead px-3.5 py-2.5 text-left">
                <Link
                  to={`/arena/teach/classes/${data.class.id}/students/${p.student.id}`}
                  className="flex items-center gap-2.5 text-sm font-medium no-underline"
                >
                  <Avatar name={p.student.displayName} avatarKey={p.student.avatarKey} size={26} />
                  <span className="truncate">{p.student.displayName}</span>
                </Link>
              </th>
              <td className="text-right">
                <span className="cq-data text-sm">{p.overall != null ? `${p.overall}%` : '—'}</span>
              </td>
              {classStrands.map((s) => {
                const cell = p.strands[s.strand.id];
                return (
                  <td key={s.strand.id} className="min-w-[8.25rem]">
                    {/* The coverage fraction is shown whenever it is limiting the
                        level — otherwise a 100% cell labelled "Developing" reads
                        as a bug rather than as "one skill out of eight". */}
                    <MasteryCell
                      level={cell?.level || 'not_started'}
                      pct={cell?.pct}
                      note={cell && cell.touched > 0 && cell.touched < cell.totalSkills
                        ? `${cell.touched}/${cell.totalSkills}` : null}
                      noteTitle={cell && cell.touched > 0
                        ? `${cell.touched} of ${cell.totalSkills} skills attempted` : null}
                      label={`${p.student.displayName}, ${s.strand.name}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-surface-2 font-semibold">
            <th scope="row" className="cq-table__rowhead px-3.5 py-2.5 text-left text-sm">Class average</th>
            <td className="text-right">
              <span className="cq-data text-sm">
                {data.totals.avgMastery != null ? `${data.totals.avgMastery}%` : '—'}
              </span>
            </td>
            {classStrands.map((s) => (
              <td key={s.strand.id}>
                <span className="cq-data text-sm">{s.pct != null ? `${s.pct}%` : '—'}</span>
              </td>
            ))}
          </tr>
        </DataTable>
      </Panel>
    </div>
  );
}

/* --------------------------------------------------------------- roster --- */
function Roster({ data, classId, onChanged, toast }) {
  const [confirm, setConfirm] = useState(null);
  const [resetting, setResetting] = useState(null);

  if (!data.roster.length) {
    return (
      <EmptyState icon={Users} title="Nobody has joined yet"
        action={<Button variant="primary" onClick={() => navigator.clipboard?.writeText(data.class.joinCode)}>
          Copy code {data.class.joinCode}
        </Button>}>
        Students go to the sign-in page, choose &ldquo;Join a class&rdquo;, and type{' '}
        <strong>{data.class.joinCode}</strong>. They appear here immediately.
      </EmptyState>
    );
  }

  return (
    <>
      <Panel pad="none">
        <PanelHead
          title={`${plural(data.roster.length, 'student')} on the roster`}
          sub="Sorted by name. Click a student for their full record."
        />
        <DataTable
          caption={`Roster for ${data.class.name}`}
          head={(
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Overall</th>
              <th scope="col">Growth</th>
              <th scope="col">Lessons</th>
              <th scope="col">Accuracy</th>
              <th scope="col">Time</th>
              <th scope="col">Last active</th>
              <th scope="col"><span className="cq-sr">Actions</span></th>
            </tr>
          )}
        >
          {data.perStudent.map((p) => (
            <tr key={p.student.id}>
              <td>
                <Link
                  to={`/arena/teach/classes/${classId}/students/${p.student.id}`}
                  className="flex items-center gap-2.5 font-medium no-underline"
                >
                  <Avatar name={p.student.displayName} avatarKey={p.student.avatarKey} size={28} />
                  <span>
                    {p.student.displayName}
                    <span className="block text-xs font-normal text-ink-500">@{p.student.username}</span>
                  </span>
                </Link>
              </td>
              <td>
                {p.overall != null
                  ? <MasteryTag level={levelFor(p.overall)} pct={p.overall} size="sm" />
                  : <span className="text-xs text-ink-500">No evidence yet</span>}
              </td>
              <td>
                {p.growth != null ? (
                  <span className={cn('cq-data text-sm', p.growth > 0 ? 'text-success-700' : p.growth < 0 ? 'text-danger-700' : 'text-ink-600')}>
                    {p.growth > 0 ? '+' : ''}{p.growth}
                  </span>
                ) : <span className="text-ink-400">—</span>}
              </td>
              <td><span className="cq-data text-sm">{p.lessonsCompleted}</span></td>
              <td><span className="cq-data text-sm">{p.accuracy != null ? `${p.accuracy}%` : '—'}</span></td>
              <td><span className="text-sm text-ink-600">{duration(p.seconds)}</span></td>
              <td>
                <span className={cn('text-sm', p.activeThisWeek ? 'text-ink-700' : 'text-warning-700')}>
                  {p.lastActiveAt ? ago(p.lastActiveAt) : 'never'}
                </span>
              </td>
              <td className="text-right">
                <Menu
                  label={`Actions for ${p.student.displayName}`}
                  trigger={<Button variant="ghost" size="sm" iconOnly aria-label={`Actions for ${p.student.displayName}`}>⋯</Button>}
                >
                  <MenuLabel>{p.student.displayName}</MenuLabel>
                  <MenuItem to={`/arena/teach/classes/${classId}/students/${p.student.id}`}>
                    View full record
                  </MenuItem>
                  <MenuItem icon={KeyRound} onClick={() => setResetting(p.student)}>
                    Set a new password
                  </MenuItem>
                  <MenuItem icon={UserMinus} danger onClick={() => setConfirm(p.student)}>
                    Remove from class
                  </MenuItem>
                </Menu>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Remove ${confirm?.displayName} from this class?`}
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  await api.removeStudent(classId, confirm.id);
                  toast.success('Student removed', `${confirm.displayName} is no longer on this roster.`);
                  setConfirm(null);
                  onChanged();
                } catch (err) { toast.error('Could not remove', err?.message); }
              }}
            >
              Remove
            </Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          Their account and everything they have learned stays intact — they simply
          stop appearing on your roster, and you stop seeing their progress. They can
          re-join with the class code, and their history comes back with them.
        </p>
      </Modal>

      <ResetPasswordModal
        student={resetting}
        classId={classId}
        onClose={() => setResetting(null)}
        toast={toast}
      />
    </>
  );
}

function ResetPasswordModal({ student, classId, onClose, toast }) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title={`Set a new password for ${student?.displayName || ''}`}
      description="For the &ldquo;they forgot it again&rdquo; case, which is most cases."
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              setBusy(true); setError(null);
              try {
                await api.resetStudentPassword({ classId, studentId: student.id, newPassword: pw });
                toast.success('Password changed', `Tell ${student.displayName} their new password.`);
                setPw('');
                onClose();
              } catch (err) { setError(err?.message || 'Could not change it.'); }
              finally { setBusy(false); }
            }}
          >
            Set password
          </Button>
        </>
      )}
    >
      {error ? <Callout tone="danger" className="mb-4">{error}</Callout> : null}
      <Input
        label="New password"
        data-autofocus
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        hint="At least 8 characters. Write it down for them."
      />
      <Callout tone="note" className="mt-4">
        You can only do this for students in your own classes, and it is recorded in
        their activity log.
      </Callout>
    </Modal>
  );
}

/* ---------------------------------------------------------- assignments --- */
function Assignments({ data, onAssign, onChanged, toast }) {
  if (!data.assignments.length) {
    return (
      <EmptyState icon={ClipboardList} title="No missions assigned yet"
        action={<Button variant="primary" onClick={onAssign}>Assign a mission</Button>}>
        Students can already play all 204 lessons. An assignment does not unlock
        anything — it tells them what you want done, and tells you who has done it.
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-5">
      {data.assignments.map((a) => {
        const due = dueLabel(a.dueAt);
        const { stats } = a;
        return (
          <li key={a.id}>
            <Panel pad="none">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5">
                <div className="min-w-0">
                  <h3 className="font-display text-h4 font-bold">{a.lessonTitle}</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    Target {a.minMastery}% ·{' '}
                    <span className={due.tone === 'danger' ? 'text-danger-700 font-medium' : ''}>{due.text}</span>
                    {a.note ? ` · “${a.note}”` : ''}
                  </p>
                </div>
                <Menu label="Assignment actions" trigger={<Button variant="ghost" size="sm" iconOnly aria-label="Assignment actions">⋯</Button>}>
                  <MenuItem to={`/arena/lesson/${a.lessonId}`}>Preview the lesson</MenuItem>
                  <MenuItem icon={Archive} danger onClick={async () => {
                    try { await api.archiveAssignment(a.id); toast.success('Assignment removed'); onChanged(); }
                    catch (err) { toast.error('Could not remove', err?.message); }
                  }}>Remove assignment</MenuItem>
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
                          to={`/arena/teach/classes/${data.class.id}/students/${s.id}`}
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
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------- bits ---- */
function ClassCodeButton({ cls, onChanged, toast }) {
  const [copied, setCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  return (
    <>
      <div className="flex items-center overflow-hidden rounded-sm border border-line bg-white shadow-xs">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(cls.joinCode).then(() => {
              setCopied(true); toast.success('Code copied', cls.joinCode);
              setTimeout(() => setCopied(false), 2200);
            });
          }}
          className="inline-flex h-11 items-center gap-2 px-3.5 font-display text-sm font-bold tracking-wide text-ink-900 hover:bg-surface-2"
          title="Copy the class code"
        >
          {copied ? <Check size={15} aria-hidden="true" className="text-success-600" /> : <Copy size={15} aria-hidden="true" className="text-ink-500" />}
          {cls.joinCode}
        </button>
        <button
          type="button"
          onClick={() => setRegen(true)}
          title="Generate a new code"
          aria-label="Generate a new class code"
          className="grid h-11 w-10 place-items-center border-l border-line text-ink-500 hover:bg-surface-2 hover:text-ink-900"
        >
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      </div>

      <Modal
        open={regen}
        onClose={() => setRegen(false)}
        title="Generate a new class code?"
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setRegen(false)}>Cancel</Button>
            <Button variant="primary" onClick={async () => {
              try {
                const res = await api.regenerateJoinCode(cls.id);
                toast.success('New code', res.joinCode);
                setRegen(false);
                onChanged();
              } catch (err) { toast.error('Could not change the code', err?.message); }
            }}>New code</Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          Students already on the roster stay on it. The old code stops working, which
          is the point if it has been shared somewhere public.
        </p>
      </Modal>
    </>
  );
}

function ClassMenu({ cls, data, onChanged, toast }) {
  const exportCsv = async (kind, filename) => {
    try {
      const csv = await api.exportClassCsv(cls.id, kind);
      downloadText(filename, csv);
      toast.success('Downloaded', filename);
    } catch (err) { toast.error('Could not export', err?.message); }
  };
  const slug = cls.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <Menu label="Class options" trigger={<Button variant="outline" iconOnly aria-label="Class options">⋯</Button>}>
      <MenuLabel>Export</MenuLabel>
      <MenuItem icon={Download} onClick={() => exportCsv('skills', `${slug}-mastery.csv`)}>Mastery by strand (CSV)</MenuItem>
      <MenuItem icon={Download} onClick={() => exportCsv('summary', `${slug}-summary.csv`)}>Student summary (CSV)</MenuItem>
      <MenuItem icon={Download} onClick={() => exportCsv('assignments', `${slug}-assignments.csv`)}>Assignments (CSV)</MenuItem>
      <MenuLabel>Class</MenuLabel>
      <MenuItem icon={Presentation} to={`/arena/teach/classroom/${cls.id}`}>Classroom mode</MenuItem>
      <MenuItem icon={Archive} danger onClick={async () => {
        try {
          await api.archiveClass(cls.id, !cls.archivedAt);
          toast.success(cls.archivedAt ? 'Class restored' : 'Class archived');
          onChanged();
        } catch (err) { toast.error('Could not archive', err?.message); }
      }}>
        {cls.archivedAt ? 'Restore class' : 'Archive class'}
      </MenuItem>
    </Menu>
  );
}

const levelFor = (pct) => (pct >= 85 ? 'mastered' : pct >= 70 ? 'proficient' : pct >= 45 ? 'developing' : 'beginning');

function LoadingClass() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-9 w-72" />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 cb:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
      </div>
      <Skeleton className="mt-9 h-96 w-full rounded-md" />
      <p className="cq-sr" role="status">Loading class</p>
    </div>
  );
}
