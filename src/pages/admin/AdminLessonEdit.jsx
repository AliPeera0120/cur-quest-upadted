import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Send, Plus, Trash2, ChevronUp, ChevronDown, Search,
  AlertTriangle, Check, Info, X,
} from 'lucide-react';
import {
  Button, Badge, Panel, PanelHead, Input, Textarea, Select, Chip, Modal,
  Callout, EmptyState, ErrorState, Skeleton, Tabs, useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { FORMATS, DIFFICULTY } from '@/content/index.js';
import { plural } from '@/lib/format.js';

/* ============================================================================
   Lesson editor.

   The requirement this screen exists to meet: CuriosityQuest staff must be
   able to add and change lessons without a developer.

   Two things it is opinionated about:

   · Skills are the point. A lesson's skill tags are how every answer inside it
     turns into mastery evidence, so the skills panel is not buried in an
     "advanced" section — and the copy says why accuracy matters more than
     breadth there.
   · Explanations are not optional. The feedback text after a question is where
     nearly all the learning happens, so the question editor treats a missing
     explanation as an error rather than a blank field.
   ========================================================================= */

const ACTIVITY_KINDS = [
  { value: 'intro', label: 'Intro — materials and safety' },
  { value: 'explain', label: 'Explain — written content' },
  { value: 'build', label: 'Build — step-by-step procedure' },
  { value: 'quiz', label: 'Quiz — scored questions' },
  { value: 'battle', label: 'Battle — answers charge elixir' },
  { value: 'reflect', label: 'Reflect — private free response' },
];

const TABS = [
  { value: 'meta', label: 'Details' },
  { value: 'skills', label: 'Skills' },
  { value: 'activities', label: 'Activities' },
];

export default function AdminLessonEdit() {
  const { lessonId } = useParams();
  const id = decodeURIComponent(lessonId);
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('meta');
  const [catalog, setCatalog] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [activities, setActivities] = useState(null);
  const [err, setErr] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, content] = await Promise.all([api.getCatalog(), api.getLessonForReview(id)]);
      if (!content) { setErr(new Error('That lesson no longer exists.')); return; }
      setCatalog(c);
      setLesson(content.lesson);
      setActivities(content.activities);
      setDirty(false);
      setErr(null);
    } catch (e) { setErr(e); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* Warn before losing edits on a hard navigation. In-app navigation is
     covered by the visible unsaved-changes banner. */
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const patch = (p) => { setLesson((l) => ({ ...l, ...p })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      await api.saveLesson(id, {
        title: lesson.title,
        summary: lesson.summary,
        strandId: lesson.strandId,
        subject: lesson.subject,
        gradeMin: Number(lesson.gradeMin),
        gradeMax: Number(lesson.gradeMax),
        difficulty: Number(lesson.difficulty),
        estMinutes: Number(lesson.estMinutes),
        objectives: lesson.objectives || [],
        tags: lesson.tags || [],
        xpAward: Number(lesson.xpAward),
        format: lesson.format,
        skills: lesson.skills || [],
      });
      await api.saveActivities(id, activities);
      toast.success('Saved');
      await load();
    } catch (e) {
      toast.error('Could not save', e?.message);
    } finally { setSaving(false); }
  };

  if (err) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not open that lesson" detail={err.message} />
        <div className="mt-5"><Button to="/arena/admin/lessons" variant="outline">Back to lessons</Button></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-9 w-96" />
        <Skeleton className="mt-8 h-96 w-full rounded-md" />
        <p className="cq-sr" role="status">Loading lesson</p>
      </div>
    );
  }

  const questionCount = activities.reduce((n, a) => n + (a.questions?.length || 0), 0);

  return (
    <>
      <Meta title={`Edit — ${lesson.title}`} />
      <div className="cq-container cq-container--wide py-8">
        <Link to="/arena/admin/lessons" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 no-underline hover:text-ink-900">
          <ArrowLeft size={15} aria-hidden="true" /> All lessons
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-h1">{lesson.title || 'Untitled lesson'}</h1>
              <Badge tone={lesson.status === 'published' ? 'success' : lesson.status === 'draft' ? 'warning' : 'default'}>
                {lesson.status}
              </Badge>
              <Badge>v{lesson.version || 1}</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              <code className="rounded-xs bg-ink-50 px-1.5 py-0.5">{lesson.id}</code>
              {' · '}{plural(activities.length, 'activity', 'activities')}
              {' · '}{plural(questionCount, 'question')}
              {' · '}{plural(lesson.skills?.length || 0, 'skill')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button to={`/arena/lesson/${encodeURIComponent(lesson.id)}`} variant="ghost">
              <Eye size={16} aria-hidden="true" /> Preview
            </Button>
            {lesson.status !== 'published' ? (
              <Button variant="outline" onClick={async () => {
                try { await api.setLessonStatus(id, 'published'); toast.success('Published'); await load(); }
                catch (e) { toast.error('Could not publish', e?.message); }
              }}>
                <Send size={16} aria-hidden="true" /> Publish
              </Button>
            ) : null}
            <Button variant="primary" onClick={save} loading={saving} disabled={!dirty}>
              <Save size={16} aria-hidden="true" /> {dirty ? 'Save changes' : 'Saved'}
            </Button>
          </div>
        </header>

        {dirty ? (
          <Callout tone="warning" title="Unsaved changes" className="mt-6">
            Nothing is stored until you press Save.
          </Callout>
        ) : null}

        {lesson.status === 'published' ? (
          <Callout tone="note" title="Editing a published lesson" className="mt-6">
            Changing the skills, difficulty or activities bumps the version number.
            Existing attempts keep the version they ran against, so scores stay
            comparable and nothing already learned is rewritten.
          </Callout>
        ) : null}

        <Tabs tabs={TABS} value={tab} onChange={setTab} className="mt-8" ariaLabel="Lesson editor sections" />

        <div className="mt-7">
          {tab === 'meta' ? <MetaEditor lesson={lesson} strands={catalog.strands} onChange={patch} /> : null}
          {tab === 'skills' ? (
            <SkillsEditor lesson={lesson} catalog={catalog} onChange={patch} />
          ) : null}
          {tab === 'activities' ? (
            <ActivitiesEditor
              lessonId={id}
              activities={activities}
              catalog={catalog}
              onChange={(next) => { setActivities(next); setDirty(true); }}
              toast={toast}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- meta ---- */
function MetaEditor({ lesson, strands, onChange }) {
  return (
    <div className="grid gap-8 cb:grid-cols-[1.3fr_1fr]">
      <Panel pad="lg">
        <div className="space-y-5">
          <Input label="Title" value={lesson.title || ''} onChange={(e) => onChange({ title: e.target.value })} />
          <Textarea label="Summary" rows={3} value={lesson.summary || ''}
            onChange={(e) => onChange({ summary: e.target.value })}
            hint="One or two sentences. This is what a student reads before deciding to open it." />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Format" value={lesson.format}
              onChange={(e) => onChange({ format: e.target.value })}
              options={Object.entries(FORMATS).map(([k, v]) => ({ value: k, label: v.label }))} />
            <Select label="Strand" value={lesson.strandId || ''}
              onChange={(e) => onChange({ strandId: e.target.value })}
              options={strands.map((s) => ({ value: s.id, label: s.name }))} />
          </div>

          <Input label="Subject label" value={lesson.subject || ''}
            onChange={(e) => onChange({ subject: e.target.value })}
            hint="Shown on cards, e.g. “Forces & Motion” or “Python”." />

          <div className="grid gap-4 sm:grid-cols-4">
            <Select label="From grade" value={String(lesson.gradeMin)}
              onChange={(e) => onChange({ gradeMin: e.target.value })}
              options={[3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: String(n) }))} />
            <Select label="To grade" value={String(lesson.gradeMax)}
              onChange={(e) => onChange({ gradeMax: e.target.value })}
              options={[3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: String(n) }))} />
            <Select label="Level" value={String(lesson.difficulty)}
              onChange={(e) => onChange({ difficulty: e.target.value })}
              options={[1, 2, 3].map((n) => ({ value: String(n), label: DIFFICULTY[n] }))} />
            <Input label="Minutes" type="number" min="1" max="180" value={lesson.estMinutes}
              onChange={(e) => onChange({ estMinutes: e.target.value })} />
          </div>

          <Input label="Discovery points" type="number" min="0" max="500" value={lesson.xpAward}
            onChange={(e) => onChange({ xpAward: e.target.value })}
            hint="Awarded once on first completion. Keep it proportional to real effort — points that do not mean anything make every other point mean less." />
        </div>
      </Panel>

      <div className="space-y-6">
        <ListEditor
          title="Learning objectives"
          hint="What a student should be able to do afterwards. Shown on the lesson page."
          items={lesson.objectives || []}
          placeholder="Explain why a heavier object falls at the same rate"
          onChange={(objectives) => onChange({ objectives })}
        />
        <ListEditor
          title="Tags"
          hint="Used by search and filtering. Lowercase, hash-prefixed by convention."
          items={lesson.tags || []}
          placeholder="#physics"
          onChange={(tags) => onChange({ tags })}
        />
      </div>
    </div>
  );
}

function ListEditor({ title, hint, items, placeholder, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  return (
    <Panel pad="md">
      <h3 className="text-h4">{title}</h3>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
      {items.length ? (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex items-start gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2">
              <span className="min-w-0 flex-1 text-sm">{item}</span>
              <button type="button" aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="shrink-0 rounded-xs p-1 text-ink-500 hover:bg-ink-100 hover:text-danger-700">
                <X size={13} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-500">None yet.</p>
      )}
      <div className="mt-4 flex gap-2">
        <input
          className="cq-field"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          aria-label={`Add to ${title}`}
        />
        <Button variant="outline" onClick={add}>Add</Button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- skills ---- */
function SkillsEditor({ lesson, catalog, onChange }) {
  const [q, setQ] = useState('');
  const selected = lesson.skills || [];
  const selectedIds = new Set(selected.map((s) => s.skillId));

  const grouped = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.strands.map((strand) => ({
      strand,
      skills: (catalog.skillsByStrand.get(strand.id) || [])
        .filter((s) => !needle || `${s.name} ${s.blurb}`.toLowerCase().includes(needle)),
    })).filter((g) => g.skills.length);
  }, [catalog, q]);

  const toggle = (skillId) => {
    onChange({
      skills: selectedIds.has(skillId)
        ? selected.filter((s) => s.skillId !== skillId)
        : [...selected, { skillId, weight: 1 }],
    });
  };

  const setWeight = (skillId, weight) => {
    onChange({ skills: selected.map((s) => (s.skillId === skillId ? { ...s, weight: Number(weight) } : s)) });
  };

  return (
    <div className="grid gap-8 cb:grid-cols-[1fr_1fr]">
      <div>
        <Callout tone="info" title="Why this panel matters most">
          Skill tags are the mechanism by which every answer inside this lesson becomes
          mastery evidence. Tagging accurately beats tagging generously: a skill listed
          here that the lesson does not really practise will show students and teachers
          progress that is not real.
        </Callout>

        <Panel pad="md" className="mt-6">
          <h3 className="text-h4">Tagged skills</h3>
          {selected.length === 0 ? (
            <p className="mt-3 text-sm text-warning-700">
              None yet — this lesson will record activity but generate no mastery evidence.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {selected.map((s) => {
                const skill = catalog.skill(s.skillId);
                return (
                  <li key={s.skillId} className="flex flex-wrap items-center gap-3 rounded-sm border border-line bg-surface-2 px-3.5 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{skill?.name || s.skillId}</span>
                      <span className="mt-0.5 block text-micro text-ink-500">
                        {catalog.strand(skill?.strandId)?.name}
                        {' · '}{plural((catalog.lessonsBySkill.get(s.skillId) || []).length, 'lesson')}
                      </span>
                    </span>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink-600">
                      Weight
                      <select
                        className="cq-field min-h-0 w-auto px-2 py-1 text-xs"
                        value={String(s.weight ?? 1)}
                        onChange={(e) => setWeight(s.skillId, e.target.value)}
                        aria-label={`Weight for ${skill?.name}`}
                      >
                        {['0.3', '0.6', '0.8', '1', '1.2'].map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => toggle(s.skillId)}
                      aria-label={`Remove ${skill?.name}`}
                      className="shrink-0 rounded-xs p-1 text-ink-500 hover:bg-ink-100 hover:text-danger-700">
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-ink-500">
            Weight scales how much this lesson&rsquo;s answers count toward that skill. Use
            below 1 where the skill is incidental — a reading lesson touching observation,
            say — and 1.2 for an assessment built specifically to test it.
          </p>
        </Panel>
      </div>

      <Panel pad="md">
        <h3 className="text-h4">All {catalog.skills.length} skills</h3>
        <Input label="Filter" className="mt-3" placeholder="friction, food webs…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-4 max-h-[34rem] space-y-5 overflow-y-auto pr-1">
          {grouped.map(({ strand, skills }) => (
            <div key={strand.id}>
              <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-ink-500">
                <span aria-hidden="true" className="h-2 w-2 rounded-pill" style={{ background: `var(--cq-strand-${strand.id})` }} />
                {strand.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Chip key={s.id} active={selectedIds.has(s.id)} onClick={() => toggle(s.id)}>
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------- activities ---- */
function ActivitiesEditor({ lessonId, activities, catalog, onChange, toast }) {
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);

  const move = (i, dir) => {
    const next = [...activities];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((a, k) => ({ ...a, position: k })));
  };

  const update = (i, p) => onChange(activities.map((a, k) => (k === i ? { ...a, ...p } : a)));

  const add = () => onChange([
    ...activities,
    { id: `new-${Date.now()}`, lessonId, kind: 'quiz', title: 'New activity', position: activities.length, required: true, config: { passPct: 70 }, questionIds: [], questions: [] },
  ]);

  const remove = (i) => onChange(activities.filter((_, k) => k !== i).map((a, k) => ({ ...a, position: k })));

  return (
    <>
      <div className="space-y-5">
        {activities.length === 0 ? (
          <EmptyState icon={Plus} title="No activities yet"
            action={<Button variant="primary" onClick={add}>Add the first activity</Button>}>
            A lesson needs at least one. Most are a single quiz; experiments usually run
            intro → build → reflect → quiz.
          </EmptyState>
        ) : null}

        {activities.map((a, i) => (
          <Panel key={a.id} pad="none">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-pill bg-blue-50 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <Badge tone="info">{a.kind}</Badge>
                {a.kind === 'quiz' || a.kind === 'battle' ? (
                  <span className="text-xs text-ink-500">{plural(a.questions?.length || 0, 'question')}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" iconOnly aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp size={15} aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" iconOnly aria-label="Move down" onClick={() => move(i, 1)} disabled={i === activities.length - 1}>
                  <ChevronDown size={15} aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="sm" iconOnly aria-label="Remove activity" onClick={() => remove(i)}>
                  <Trash2 size={15} aria-hidden="true" className="text-danger-600" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,16rem)]">
                <Input label="Title" value={a.title || ''} onChange={(e) => update(i, { title: e.target.value })} />
                <Select label="Kind" value={a.kind}
                  onChange={(e) => update(i, { kind: e.target.value })}
                  options={ACTIVITY_KINDS} />
              </div>

              {a.kind === 'explain' ? (
                <Textarea
                  label="Content (Markdown)"
                  rows={8}
                  value={a.config?.markdown || ''}
                  onChange={(e) => update(i, { config: { ...a.config, markdown: e.target.value } })}
                  hint="Headings, lists, bold and fenced code blocks all render."
                />
              ) : null}

              {a.kind === 'intro' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Textarea label="Materials" rows={3} value={a.config?.materials || ''}
                    onChange={(e) => update(i, { config: { ...a.config, materials: e.target.value } })}
                    hint="Comma-separated. Each becomes a checklist item." />
                  <Textarea label="What you learn" rows={3} value={a.config?.learn || ''}
                    onChange={(e) => update(i, { config: { ...a.config, learn: e.target.value } })} />
                </div>
              ) : null}

              {a.kind === 'build' ? (
                <Textarea
                  label="Steps (one per line)"
                  rows={7}
                  value={(a.config?.steps || []).join('\n')}
                  onChange={(e) => update(i, { config: { ...a.config, steps: e.target.value.split('\n').filter(Boolean) } })}
                  hint="Each line becomes a tickable step in the player."
                />
              ) : null}

              {a.kind === 'reflect' ? (
                <Textarea
                  label="Prompts (one per line)"
                  rows={4}
                  value={(a.config?.prompts || []).join('\n')}
                  onChange={(e) => update(i, { config: { ...a.config, prompts: e.target.value.split('\n').filter(Boolean) } })}
                  hint="Answers stay private to the student — they are never shown to a teacher."
                />
              ) : null}

              {a.kind === 'quiz' || a.kind === 'battle' ? (
                <QuestionList
                  activity={a}
                  onAddExisting={() => setPickerFor(i)}
                  onNew={() => setEditingQuestion({ activityIndex: i, question: null })}
                  onEdit={(qq) => setEditingQuestion({ activityIndex: i, question: qq })}
                  onRemove={(qid) => update(i, {
                    questionIds: (a.questionIds || []).filter((x) => x !== qid),
                    questions: (a.questions || []).filter((x) => x.id !== qid),
                  })}
                />
              ) : null}
            </div>
          </Panel>
        ))}

        {activities.length ? (
          <Button variant="outline" onClick={add}>
            <Plus size={16} aria-hidden="true" /> Add another activity
          </Button>
        ) : null}
      </div>

      <QuestionEditor
        state={editingQuestion}
        lessonId={lessonId}
        catalog={catalog}
        onClose={() => setEditingQuestion(null)}
        onSaved={(saved, activityIndex) => {
          const a = activities[activityIndex];
          const exists = (a.questions || []).some((x) => x.id === saved.id);
          onChange(activities.map((x, k) => (k === activityIndex ? {
            ...x,
            questionIds: exists ? x.questionIds : [...(x.questionIds || []), saved.id],
            questions: exists
              ? (x.questions || []).map((qq) => (qq.id === saved.id ? saved : qq))
              : [...(x.questions || []), saved],
          } : x)));
          setEditingQuestion(null);
          toast.success('Question saved');
        }}
        toast={toast}
      />

      <QuestionPicker
        open={pickerFor != null}
        onClose={() => setPickerFor(null)}
        exclude={new Set((activities[pickerFor]?.questionIds) || [])}
        catalog={catalog}
        onPick={(qq) => {
          const i = pickerFor;
          onChange(activities.map((x, k) => (k === i ? {
            ...x,
            questionIds: [...(x.questionIds || []), qq.id],
            questions: [...(x.questions || []), qq],
          } : x)));
          setPickerFor(null);
        }}
      />
    </>
  );
}

function QuestionList({ activity, onAddExisting, onNew, onEdit, onRemove }) {
  const questions = activity.questions || [];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
          Questions ({questions.length})
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onAddExisting}>
            <Search size={13} aria-hidden="true" /> From the bank
          </Button>
          <Button variant="outline" size="sm" onClick={onNew}>
            <Plus size={13} aria-hidden="true" /> Write a new one
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="mt-3 text-sm text-warning-700">
          No questions — this activity will not produce any evidence.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line overflow-hidden rounded-sm border border-line">
          {questions.map((qq, i) => (
            <li key={qq.id} className="flex flex-wrap items-start gap-3 bg-white px-3.5 py-2.5">
              <span className="cq-data mt-0.5 shrink-0 text-xs text-ink-500">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{qq.prompt}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-2 text-micro text-ink-500">
                  <span>{qq.skillId || 'no skill'}</span>
                  <span>·</span>
                  <span>L{qq.difficulty}</span>
                  {!qq.explanation ? (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-danger-700">
                        <AlertTriangle size={10} aria-hidden="true" /> no explanation
                      </span>
                    </>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={() => onEdit(qq)}>Edit</Button>
                <Button variant="ghost" size="sm" iconOnly aria-label="Remove question" onClick={() => onRemove(qq.id)}>
                  <X size={13} aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function QuestionEditor({ state, lessonId, catalog, onClose, onSaved, toast }) {
  const blank = { prompt: '', choices: ['', '', '', ''], answer: 0, explanation: '', skillId: '', difficulty: 1 };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(state?.question ? { ...blank, ...state.question } : blank);
    setError(null);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const setChoice = (i, v) => setForm((f) => ({ ...f, choices: f.choices.map((c, k) => (k === i ? v : c)) }));

  const submit = async () => {
    const choices = form.choices.map((c) => c.trim()).filter(Boolean);
    if (!form.prompt.trim()) { setError('The question needs a prompt.'); return; }
    if (choices.length < 2) { setError('At least two answer choices.'); return; }
    if (!form.explanation.trim()) {
      setError('An explanation is required. It is the part students actually learn from — a question without one just scores them.');
      return;
    }
    if (form.answer >= choices.length) { setError('The correct answer points at a choice that is empty.'); return; }
    setBusy(true);
    try {
      const saved = await api.saveQuestion(lessonId, {
        ...form,
        choices,
        answer: Number(form.answer),
        difficulty: Number(form.difficulty),
        kind: 'multiple_choice',
      });
      onSaved(saved, state.activityIndex);
    } catch (e) {
      setError(e?.message || 'Could not save.');
    } finally { setBusy(false); }
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="lg"
      title={state?.question ? 'Edit question' : 'New question'}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy}>Save question</Button>
        </>
      )}
    >
      <div className="space-y-5">
        {error ? <Callout tone="danger">{error}</Callout> : null}

        <Textarea label="Question" rows={2} data-autofocus value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          hint="Write it the way you would say it out loud to a ten-year-old." />

        <fieldset>
          <legend className="cq-label">Answer choices</legend>
          <p className="mb-3 text-xs text-ink-500">
            Select the radio button next to the correct one. Leave a box empty to use
            fewer than four choices.
          </p>
          <div className="space-y-2.5">
            {form.choices.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-answer"
                  checked={Number(form.answer) === i}
                  onChange={() => setForm({ ...form, answer: i })}
                  aria-label={`Choice ${String.fromCharCode(65 + i)} is correct`}
                  className="h-4 w-4 shrink-0 accent-[var(--cq-success-500)]"
                />
                <span className="w-4 shrink-0 text-xs font-bold text-ink-500">
                  {String.fromCharCode(65 + i)}
                </span>
                <input
                  className="cq-field"
                  value={c}
                  onChange={(e) => setChoice(i, e.target.value)}
                  aria-label={`Choice ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <Textarea label="Explanation" rows={3} value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          hint="Shown after every answer, right or wrong. Explain the science, do not just restate the answer." />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Skill" placeholder="Choose a skill" value={form.skillId}
            onChange={(e) => setForm({ ...form, skillId: e.target.value })}
            hint="Which skill this question is evidence for."
            options={catalog.skills.map((s) => ({
              value: s.id,
              label: `${catalog.strand(s.strandId)?.name} — ${s.name}`,
            }))} />
          <Select label="Difficulty" value={String(form.difficulty)}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            hint="Harder questions count for more in the mastery model."
            options={[1, 2, 3].map((n) => ({ value: String(n), label: `${n} — ${DIFFICULTY[n]}` }))} />
        </div>
      </div>
    </Modal>
  );
}

function QuestionPicker({ open, onClose, exclude, catalog, onPick }) {
  const [bank, setBank] = useState(null);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');

  useEffect(() => {
    if (!open || bank) return;
    import('@/content/bank.json').then((m) => setBank(Object.values(m.default.questions)));
  }, [open, bank]);

  const rows = useMemo(() => {
    if (!bank) return null;
    const needle = q.trim().toLowerCase();
    return bank
      .filter((x) => !exclude.has(x.id))
      .filter((x) => (!skill || x.skillId === skill))
      .filter((x) => !needle || x.prompt.toLowerCase().includes(needle))
      .slice(0, 60);
  }, [bank, q, skill, exclude]);

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Add from the question bank"
      description="234 questions, already tagged to skills and difficulty.">
      <div className="grid gap-4 sm:grid-cols-[1fr_minmax(0,15rem)]">
        <Input label="Search" placeholder="friction, food chain…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Skill" placeholder="Any skill" value={skill} onChange={(e) => setSkill(e.target.value)}
          options={catalog.skills.map((s) => ({ value: s.id, label: s.name }))} />
      </div>

      <div className="mt-5 max-h-[26rem] overflow-y-auto rounded-md border border-line">
        {!rows ? (
          <div className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-sm" />)}</div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">Nothing matches that.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => onPick(x)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-blue-50">
                  <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{x.prompt}</span>
                    <span className="mt-0.5 block text-micro text-ink-500">
                      {catalog.skill(x.skillId)?.name || x.skillId} · L{x.difficulty}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
