import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Copy, Check, Archive, ArchiveRestore, Users, ArrowRight, Settings, RefreshCw,
} from 'lucide-react';
import {
  Button, Badge, Panel, Meter, Modal, Switch, Select, Callout, EmptyState,
  ErrorState, Skeleton, Menu, MenuItem, MenuLabel, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { ago, plural } from '@/lib/format.js';
import { CreateClassModal } from './TeacherHome.jsx';

/**
 * Class management.
 *
 * TeacherHome shows the classes a teacher is actively working in; this screen
 * is for the administrative jobs — codes, settings, archiving, and getting
 * last year's classes out of the way without deleting anything a student
 * learned.
 */
export default function TeacherClasses() {
  const toast = useToast();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settingsFor, setSettingsFor] = useState(null);

  const load = () => api.listMyClasses({ includeArchived: true })
    .then((rows) => { setClasses(rows); setError(null); })
    .catch((e) => setError(e?.message || 'Could not load your classes.'));

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load your classes" detail={error} onRetry={load} />
      </div>
    );
  }
  if (!classes) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-md" />)}
        </div>
        <p className="cq-sr" role="status">Loading classes</p>
      </div>
    );
  }

  const active = classes.filter((c) => !c.archivedAt);
  const archived = classes.filter((c) => c.archivedAt);
  const shown = showArchived ? archived : active;

  return (
    <>
      <Meta title="Classes" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Classes</h1>
            <p className="mt-2.5 text-ink-600">
              {plural(active.length, 'active class', 'active classes')}
              {archived.length ? ` · ${archived.length} archived` : ''}
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> New class
          </Button>
        </header>

        {archived.length ? (
          <div className="mt-7 flex gap-1 border-b border-line" role="tablist" aria-label="Class status">
            {[
              { key: false, label: `Active (${active.length})` },
              { key: true, label: `Archived (${archived.length})` },
            ].map((t) => (
              <button
                key={String(t.key)}
                type="button"
                role="tab"
                aria-selected={showArchived === t.key}
                onClick={() => setShowArchived(t.key)}
                className={cn(
                  '-mb-px min-h-[3rem] border-b-2 px-3.5 font-display text-sm font-semibold transition-colors duration-1',
                  showArchived === t.key ? 'border-orange-500 text-ink-900' : 'border-transparent text-ink-600 hover:text-ink-900',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {shown.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={Users}
            title={showArchived ? 'Nothing archived' : 'No classes yet'}
            action={showArchived ? null : <Button variant="primary" onClick={() => setCreating(true)}>Create a class</Button>}
          >
            {showArchived
              ? 'Archived classes keep their rosters and student records — they just stop appearing in your dashboard.'
              : 'A class takes a name and about thirty seconds. Students join with the code it generates.'}
          </EmptyState>
        ) : (
          <ul className="mt-8 space-y-4">
            {shown.map((c) => (
              <ClassRow
                key={c.id}
                cls={c}
                toast={toast}
                onChanged={load}
                onSettings={() => setSettingsFor(c)}
              />
            ))}
          </ul>
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

      <ClassSettingsModal
        cls={settingsFor}
        onClose={() => setSettingsFor(null)}
        onSaved={() => { setSettingsFor(null); toast.success('Settings saved'); load(); }}
        toast={toast}
      />
    </>
  );
}

function ClassRow({ cls, toast, onChanged, onSettings }) {
  const [copied, setCopied] = useState(false);

  const copy = () => navigator.clipboard?.writeText(cls.joinCode).then(() => {
    setCopied(true);
    toast.success('Code copied', cls.joinCode);
    setTimeout(() => setCopied(false), 2200);
  });

  return (
    <li>
      <Panel pad="md" lift className={cn(cls.archivedAt && 'opacity-80')}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to={`/arena/teach/classes/${cls.id}`}
                className="font-display text-h3 font-bold text-ink-900 no-underline hover:text-blue-600"
              >
                {cls.name}
              </Link>
              {cls.archivedAt ? <Badge tone="warning">Archived {ago(cls.archivedAt)}</Badge> : null}
              {!cls.codeActive && !cls.archivedAt ? <Badge tone="warning">Code off</Badge> : null}
            </div>
            <p className="mt-1.5 text-sm text-ink-500">
              {plural(cls.studentCount ?? 0, 'student')}
              {cls.gradeBand ? ` · Grades ${cls.gradeBand}` : ''}
              {cls.subject ? ` · ${cls.subject}` : ''}
              {' · created '}{ago(cls.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cls.archivedAt ? (
              <button
                type="button"
                onClick={copy}
                title="Copy the class code"
                className="inline-flex h-11 items-center gap-2 rounded-sm border border-line bg-white px-3.5 font-display text-sm font-bold text-ink-900 shadow-xs hover:border-ink-300"
              >
                {copied
                  ? <Check size={15} aria-hidden="true" className="text-success-600" />
                  : <Copy size={15} aria-hidden="true" className="text-ink-500" />}
                {cls.joinCode}
              </button>
            ) : null}
            <Button to={`/arena/teach/classes/${cls.id}`} variant="primary" size="sm">
              Open <ArrowRight size={14} aria-hidden="true" />
            </Button>
            <Menu label={`Options for ${cls.name}`}
              trigger={<Button variant="outline" size="sm" iconOnly aria-label={`Options for ${cls.name}`}>⋯</Button>}>
              <MenuLabel>{cls.name}</MenuLabel>
              <MenuItem icon={Settings} onClick={onSettings}>Class settings</MenuItem>
              {!cls.archivedAt ? (
                <MenuItem icon={RefreshCw} onClick={async () => {
                  try {
                    const res = await api.regenerateJoinCode(cls.id);
                    toast.success('New class code', res.joinCode);
                    onChanged();
                  } catch (err) { toast.error('Could not change the code', err?.message); }
                }}>
                  Generate a new code
                </MenuItem>
              ) : null}
              <MenuItem
                icon={cls.archivedAt ? ArchiveRestore : Archive}
                danger={!cls.archivedAt}
                onClick={async () => {
                  try {
                    await api.archiveClass(cls.id, !cls.archivedAt);
                    toast.success(cls.archivedAt ? 'Class restored' : 'Class archived');
                    onChanged();
                  } catch (err) { toast.error('Could not update the class', err?.message); }
                }}
              >
                {cls.archivedAt ? 'Restore class' : 'Archive class'}
              </MenuItem>
            </Menu>
          </div>
        </div>
      </Panel>
    </li>
  );
}

/**
 * Class settings.
 *
 * Deliberately short. Sensible defaults matter more than configurability here:
 * a teacher setting up a class before a lesson does not want thirty toggles,
 * and every option below has a defensible default already set.
 */
function ClassSettingsModal({ cls, onClose, onSaved, toast }) {
  const [settings, setSettings] = useState(cls?.settings || {});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSettings(cls?.settings || {}); }, [cls]);

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <Modal
      open={!!cls}
      onClose={onClose}
      title={`${cls?.name || 'Class'} settings`}
      description="Every one of these has a sensible default. Change them only if you want to."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.updateClass(cls.id, { settings });
                onSaved();
              } catch (err) { toast.error('Could not save', err?.message); }
              finally { setBusy(false); }
            }}
          >
            Save settings
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <Select
          label="Default mastery target for new assignments"
          value={String(settings.masteryThreshold ?? 80)}
          onChange={(e) => set('masteryThreshold', Number(e.target.value))}
          options={[60, 70, 80, 90].map((n) => ({ value: String(n), label: `${n}%` }))}
        />

        <div className="space-y-4 border-t border-line pt-5">
          <Switch
            label="Let students retry lessons"
            hint="On by default. Retrying is how mastery is built — turning it off makes the mastery model far less meaningful."
            checked={settings.allowRetry !== false}
            onChange={(v) => set('allowRetry', v)}
          />
          <Switch
            label="Show the correct answer after each question"
            hint="On by default. The explanation is where most of the learning happens."
            checked={settings.showAnswers !== false}
            onChange={(v) => set('showAnswers', v)}
          />
          <Switch
            label="Discovery points and levels"
            hint="Light gamification. Points only come from real learning — never from logging in."
            checked={settings.xpEnabled !== false}
            onChange={(v) => set('xpEnabled', v)}
          />
          <Switch
            label="Badges"
            checked={settings.achievementsEnabled !== false}
            onChange={(v) => set('achievementsEnabled', v)}
          />
          <Switch
            label="Cooperative class goals"
            hint="A shared target the whole class works toward."
            checked={settings.classGoalsEnabled !== false}
            onChange={(v) => set('classGoalsEnabled', v)}
          />
          <Switch
            label="Leaderboard"
            hint="Off by default, and we would leave it off. Ranking children against each other tends to discourage exactly the students who need the most encouragement."
            checked={!!settings.leaderboardEnabled}
            onChange={(v) => set('leaderboardEnabled', v)}
          />
        </div>

        <Callout tone="note" title="What these do not control">
          Nothing here locks lessons. Students can open any of the 204 lessons in any
          order regardless of these settings — that is a product decision, not a
          configuration option.
        </Callout>
      </div>
    </Modal>
  );
}
