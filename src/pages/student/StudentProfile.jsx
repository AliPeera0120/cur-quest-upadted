import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Save, KeyRound, Users, ShieldCheck, Trash2, LogOut, Check, Database, Eye, ArrowRight,
} from 'lucide-react';
import {
  Button, Badge, Panel, Input, Select, Callout, Modal, Avatar, AVATAR_KEYS,
  Skeleton, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { ago, longDate } from '@/lib/format.js';

/* ============================================================================
   Account settings.

   One screen for all three roles, because the account itself is the same
   object; only the class relationship differs — a student joins classes, a
   teacher owns them. Role-specific parts are hidden rather than disabled.

   The "your data" section is written to be read by a suspicious eleven-year-old
   and by their parent. It lists what exists, names who can see it, and puts a
   real delete next to it. If we are going to tell schools this product does not
   harvest children, the account screen is where that has to be provable.
   ========================================================================= */

const GRADE_BANDS = [
  { value: '3-5', label: 'Grades 3–5' },
  { value: '6-8', label: 'Grades 6–8' },
];

export default function StudentProfile() {
  const { user, isStudent, isTeacher, isAdmin, isLocal, updateProfile, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState(null);

  const loadClasses = () => api.listMyClasses()
    .then((rows) => { setClasses(rows); setError(null); })
    .catch((e) => setError(e?.message || 'Could not load your classes.'));

  useEffect(() => { loadClasses(); }, [user?.id]);

  if (!user) return <LoadingProfile />;

  return (
    <>
      <Meta
        title="Your account"
        description="Change your name, avatar and password, manage your classes, and see exactly what CuriosityQuest stores about you."
      />
      <div className="cq-container py-8 cb:py-10">
        <header className="flex flex-wrap items-center gap-5">
          <Avatar name={user.displayName} avatarKey={user.avatarKey} size={64} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-h1">{user.displayName}</h1>
              <Badge tone={isTeacher ? 'info' : isAdmin ? 'ember' : 'default'}>
                {isAdmin ? 'Administrator' : isTeacher ? 'Teacher' : 'Student'}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-ink-600">
              {isStudent ? `Username ${user.username}` : user.username}
              {user.title ? ` · ${user.title}` : ''}
              {user.createdAt ? ` · joined ${longDate(user.createdAt)}` : ''}
            </p>
          </div>
          <Button variant="ghost" className="ml-auto" onClick={() => signOut()}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </Button>
        </header>

        <div className="mt-9 space-y-8">
          <ProfileForm user={user} isStudent={isStudent} isTeacher={isTeacher} onSave={updateProfile} toast={toast} />
          <PasswordForm minLength={isStudent ? 8 : 10} toast={toast} />

          <ClassesSection
            isStudent={isStudent} classes={classes} error={error}
            onChanged={loadClasses} toast={toast}
          />
          <DataSection user={user} isStudent={isStudent} isLocal={isLocal} classes={classes} />
          <DeleteSection
            isTeacher={isTeacher}
            onDeleted={async () => { await deleteAccount(); navigate('/', { replace: true }); }}
          />
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- profile --- */

function ProfileForm({ user, isStudent, isTeacher, onSave, toast }) {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    title: user.title || '',
    gradeBand: user.gradeBand || '',
    schoolName: user.schoolName || '',
    avatarKey: user.avatarKey || AVATAR_KEYS[0],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) { setErr('Your name cannot be empty.'); return; }
    setErr(null);
    setBusy(true);
    try {
      await onSave({
        displayName: form.displayName.trim(),
        title: form.title.trim() || null,
        gradeBand: form.gradeBand || null,
        avatarKey: form.avatarKey,
        ...(isTeacher ? { schoolName: form.schoolName.trim() || null } : null),
      });
      setSaved(true);
      toast.success('Saved', 'Your profile has been updated.');
      setTimeout(() => setSaved(false), 2500);
    } catch (e2) {
      setErr(e2?.message || 'Could not save those changes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel pad="md" lift as="section">
      <h2 className="text-h3">How you appear</h2>
      <p className="mt-1.5 text-sm text-ink-600">
        What your {isStudent ? 'teacher and classmates see' : 'students see'}. No photo and no
        surname — by design.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-6" noValidate>
        {err ? <Callout tone="danger">{err}</Callout> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Display name" required maxLength={40} value={form.displayName}
            hint="A first name is plenty."
            onChange={(e) => set({ displayName: e.target.value })}
          />
          <Input
            label="Title (optional)" maxLength={40} value={form.title}
            placeholder={isStudent ? 'Bridge Builder' : 'Head of Science'}
            hint="Something you pick for yourself. Not awarded, not ranked."
            onChange={(e) => set({ title: e.target.value })}
          />
          {isStudent ? (
            <Select
              label="Your grade" placeholder="Rather not say" options={GRADE_BANDS} value={form.gradeBand}
              hint="Only used to order suggested lessons. Nothing is hidden either way."
              onChange={(e) => set({ gradeBand: e.target.value })}
            />
          ) : null}
          {isTeacher ? (
            <Input
              label="School (optional)" maxLength={80} value={form.schoolName}
              onChange={(e) => set({ schoolName: e.target.value })}
            />
          ) : null}
        </div>

        <fieldset>
          <legend className="cq-label">Avatar</legend>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {AVATAR_KEYS.map((key) => (
              <button
                key={key} type="button" aria-pressed={form.avatarKey === key} aria-label={`Avatar: ${key}`}
                onClick={() => set({ avatarKey: key })}
                className={cn('grid h-14 w-14 place-items-center rounded-md border-2 transition-colors duration-1',
                  form.avatarKey === key ? 'border-blue-600 bg-blue-50' : 'border-line bg-white hover:border-ink-300')}
              >
                <Avatar name={form.displayName || user.displayName} avatarKey={key} size={34} />
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={busy}><Save size={16} aria-hidden="true" /> Save changes</Button>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-700">
              <Check size={15} aria-hidden="true" /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------- password --- */

function PasswordForm({ minLength, toast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setErr('The two new passwords do not match.'); return; }
    setErr(null);
    setBusy(true);
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed', 'Use the new one next time you sign in.');
    } catch (e2) {
      setErr(e2?.message || 'Could not change your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel pad="md" lift as="section">
      <h2 className="flex items-center gap-2 text-h3">
        <KeyRound size={19} aria-hidden="true" className="text-ink-500" /> Password
      </h2>
      <p className="mt-1.5 text-sm text-ink-600">
        You need the current one to set a new one. Forgotten it? A teacher can reset a
        student&rsquo;s password from their class page.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {err ? <Callout tone="danger">{err}</Callout> : null}
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { key: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
            { key: 'newPassword', label: 'New password', autoComplete: 'new-password', hint: `At least ${minLength} characters.` },
            { key: 'confirm', label: 'New password again', autoComplete: 'new-password' },
          ].map((f) => (
            <Input
              key={f.key} label={f.label} type="password" required autoComplete={f.autoComplete}
              hint={f.hint} value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          ))}
        </div>
        <Button type="submit" variant="outline" loading={busy}>Change password</Button>
      </form>
    </Panel>
  );
}

/* --------------------------------------------------------------- classes --- */

function ClassesSection({ isStudent, classes, error, onChanged, toast }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [leaving, setLeaving] = useState(null);

  const join = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await api.joinClass(code);
      setCode('');
      toast.success(res.alreadyMember ? 'Already in that class' : `Joined ${res.className}`, res.teacherName);
      onChanged();
    } catch (e2) {
      setErr(e2?.message || 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    const target = leaving;
    setLeaving(null);
    try {
      await api.leaveClass(target.id);
      toast.success('Left the class', `${target.name} no longer sees your work.`);
      onChanged();
    } catch (e2) {
      toast.error('Could not leave', e2?.message || 'Try again in a moment.');
    }
  };

  /* A teacher owns classes rather than joining them, so they get the same
     panel with the roster tools linked instead of a join form. */
  if (!isStudent) {
    return (
      <Panel pad="md" lift as="section">
        <h2 className="flex items-center gap-2 text-h3">
          <Users size={19} aria-hidden="true" className="text-blue-600" /> Your classes
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          {classes?.length
            ? `You teach ${classes.length === 1 ? 'one class' : `${classes.length} classes`}. Codes, rosters and assignments live on the class pages.`
            : 'You have not created a class yet.'}
        </p>
        <Button to="/arena/teach/classes" variant="outline" className="mt-4">
          Manage classes <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </Panel>
    );
  }

  return (
    <Panel pad="md" lift as="section">
      <h2 className="flex items-center gap-2 text-h3">
        <Users size={19} aria-hidden="true" className="text-blue-600" /> Your classes
      </h2>
      <p className="mt-1.5 text-sm text-ink-600">
        A class lets one teacher see your progress and set you missions. You can be in
        several, or none — everything is playable either way.
      </p>
      {error ? <Callout tone="danger" className="mt-4">{error}</Callout> : null}

      {classes === null ? (
        <Skeleton className="mt-5 h-20 w-full rounded-md" />
      ) : classes.length === 0 ? (
        <p className="mt-5 rounded-md border border-dashed border-line px-4 py-4 text-sm text-ink-600">
          You are not in a class. Nothing is missing from your account because of it.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-md border border-line">
          {classes.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 bg-white px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{c.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {c.teacherName}{c.subject ? ` · ${c.subject}` : ''}{c.archivedAt ? ' · archived' : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLeaving(c)}>Leave class</Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={join} className="mt-6 border-t border-line pt-6">
        {err ? <Callout tone="danger" className="mb-4">{err}</Callout> : null}
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Join another class" code className="max-w-[12rem]" placeholder="CQ-48291"
            autoComplete="off" value={code} hint="Your teacher writes this on the board."
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button type="submit" variant="outline" loading={busy} disabled={!code.trim()}>Join</Button>
        </div>
      </form>

      <Modal
        open={!!leaving}
        onClose={() => setLeaving(null)}
        title={`Leave ${leaving?.name || 'this class'}?`}
        description="Your progress stays with you. The teacher stops seeing it."
        footer={(
          <>
            <Button variant="ghost" onClick={() => setLeaving(null)}>Stay in the class</Button>
            <Button variant="danger" onClick={leave}>Leave class</Button>
          </>
        )}
      >
        <p className="text-sm text-ink-700">
          You keep every badge, point and skill you have built. Assignments from this class
          leave your missions list. Re-join later with the same code and your history comes
          back with you.
        </p>
      </Modal>
    </Panel>
  );
}

/* ------------------------------------------------------------ your data --- */

function DataSection({ user, isStudent, isLocal, classes }) {
  const teachers = [...new Set((classes || []).map((c) => c.teacherName).filter(Boolean))];
  const stored = [
    `Your display name (${user.displayName}), username and avatar.`,
    'Your password, stored as a salted hash — never as text anyone could read.',
    isStudent ? 'Your grade band and self-chosen title, if you set them.' : 'Your school name, if you set it.',
    'Every lesson attempt: score, time spent, and which questions you answered.',
    'Discovery points, badges and skill mastery, all derived from those answers.',
    'Which classes you are in, and when you joined.',
  ];
  const seenBy = [
    'You — all of it, on this account.',
    isStudent
      ? teachers.length
        ? `${teachers.join(' and ')} — your scores and mastery for the classes you are in, and nothing from before you joined.`
        : 'No teacher, because you are not in a class.'
      : 'Your students see your name and the class name. Never another student’s results.',
    isStudent
      ? 'Classmates see nothing about you. There is no leaderboard.'
      : 'CuriosityQuest administrators, for support and content fixes.',
  ];

  return (
    <Panel pad="md" lift as="section">
      <h2 className="flex items-center gap-2 text-h3">
        <ShieldCheck size={19} aria-hidden="true" className="text-success-600" /> Your data
      </h2>
      <div className="mt-5 grid gap-6 cb:grid-cols-2">
        <DataColumn icon={Database} title="What is stored" items={stored}>
          <p className="mt-3 text-sm font-medium text-ink-900">
            Not stored: your email, surname, birthday, address, photo or location.
          </p>
        </DataColumn>
        <DataColumn icon={Eye} title="Who can see it" items={seenBy}>
          <Callout tone="note" className="mt-4">
            {isLocal
              ? 'Right now this account lives in this browser on this device only. Nothing is sent to a server, and clearing your browser data would erase it.'
              : 'This account is stored on the CuriosityQuest server, readable only by you and the teachers of your classes.'}
            {' '}
            <Link to="/privacy" className="font-semibold">Read the full privacy note</Link>.
          </Callout>
        </DataColumn>
      </div>
      <p className="mt-5 max-w-none border-t border-line pt-4 text-xs text-ink-500">
        Account created {user.createdAt ? longDate(user.createdAt) : 'recently'}
        {user.lastSeenAt ? ` · last signed in ${ago(user.lastSeenAt)}` : ''}.
      </p>
    </Panel>
  );
}

function DataColumn({ icon: Icon, title, items, children }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-h4">
        <Icon size={16} aria-hidden="true" className="text-ink-500" /> {title}
      </h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-700 marker:text-ink-300">
        {items.map((line) => <li key={line}>{line}</li>)}
      </ul>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- delete -- */

function DeleteSection({ isTeacher, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const ready = typed.trim().toUpperCase() === 'DELETE';

  const run = async () => {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      await onDeleted();
    } catch (e) {
      setErr(e?.message || 'Could not delete this account.');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-md border border-[#F0C4C1] bg-danger-50 p-5 cb:p-6">
      <h2 className="flex items-center gap-2 text-h3 text-danger-700">
        <Trash2 size={19} aria-hidden="true" /> Delete this account
      </h2>
      <p className="mt-2 max-w-measure text-sm text-ink-700">
        This removes the whole learning record permanently: every attempt, every answer,
        every badge, every point, and the skill mastery built from them. It cannot be undone
        and we cannot restore it for you
        {isTeacher ? '. Your classes are archived, and your students keep their own accounts and progress.' : '.'}
      </p>
      {!open ? (
        <Button variant="danger" className="mt-5" onClick={() => setOpen(true)}>Delete my account</Button>
      ) : (
        /* Typed confirmation inline rather than in a dialog: the consequences
           are already on screen above, and a modal would cover them up. */
        <div className="mt-5 max-w-sm rounded-sm border border-[#F0C4C1] bg-white p-4">
          {err ? <Callout tone="danger" className="mb-4">{err}</Callout> : null}
          <Input
            label="Type DELETE to confirm" value={typed} autoFocus autoComplete="off"
            hint="Capitals or not, both work." onChange={(e) => setTyped(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="danger" loading={busy} disabled={!ready} onClick={run}>Delete everything</Button>
            <Button variant="ghost" onClick={() => { setOpen(false); setTyped(''); setErr(null); }}>
              Keep my account
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function LoadingProfile() {
  return (
    <div className="cq-container py-10">
      <Skeleton className="h-16 w-16" rounded="pill" />
      <Skeleton className="mt-4 h-8 w-52" />
      <div className="mt-9 space-y-8">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full rounded-md" />)}
      </div>
      <p className="cq-sr" role="status">Loading your account</p>
    </div>
  );
}
