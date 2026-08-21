/* ============================================================================
   Content management, local backend.

   The catalog that ships with the build is the baseline. Admin edits are
   stored as overrides layered on top, which means:

     · a CuriosityQuest admin can create and edit lessons in the browser with
       no developer involved, which is the actual requirement;
     · a rebuilt catalog never silently discards their work;
     · every override is exportable as JSON, so real edits can be committed
       back into src/content and become part of the next build.

   Editing a published lesson bumps its version. Attempts record the version
   they ran against, so re-writing a lesson never rewrites history.
   ========================================================================= */

import { db, commit } from '../store.js';
import { randomId } from '../crypto.js';
import { loadCatalog, loadBank, searchLessons, facetCounts, loadLessonContent } from '../../content/index.js';
import { _requireUser as requireUser, _fail as fail, _now as now } from './local.js';

const requireAdmin = () => {
  const me = requireUser();
  if (me.role !== 'admin') fail('forbidden', 'Content editing requires an administrator account.');
  return me;
};

/** Catalog with admin overrides applied. */
async function catalog() {
  const base = await loadCatalog();
  const overrides = db().contentOverrides;
  if (!Object.keys(overrides).length) return base;

  const merged = base.lessons
    .map((l) => (overrides[l.id]?.lesson ? { ...l, ...overrides[l.id].lesson } : l))
    .concat(Object.values(overrides).filter((o) => o.isNew).map((o) => o.lesson));

  /* Re-index so search, facets and skill lookups see the edits. */
  const byId = new Map(merged.map((l) => [l.id, l]));
  const lessonsBySkill = new Map();
  for (const l of merged) {
    for (const s of l.skills || []) {
      if (!lessonsBySkill.has(s.skillId)) lessonsBySkill.set(s.skillId, []);
      lessonsBySkill.get(s.skillId).push(l);
    }
  }
  const haystack = new Map(merged.map((l) => [
    l.id,
    `${l.title} ${l.summary} ${l.subject} ${(l.tags || []).join(' ')} ${(l.objectives || []).join(' ')}`.toLowerCase(),
  ]));
  return {
    ...base,
    lessons: merged,
    byId, lessonsBySkill, haystack,
    lesson: (id) => byId.get(id) || null,
  };
}

async function listLessons(filters = {}) {
  const c = await catalog();
  return searchLessons(c, filters);
}

async function getCatalog() {
  return catalog();
}

async function getFacets(filters = {}) {
  const c = await catalog();
  const { rows } = searchLessons(c, { ...filters, limit: null });
  return { all: facetCounts(c), filtered: facetCounts(c, rows) };
}

/**
 * Full lesson content for the player.
 *
 * `forPlay` strips the answer key. Grading goes through submitResponse(), which
 * mirrors the server-side cq_submit_response() function — so a student reading
 * the network payload learns nothing.
 */
async function getLessonForPlay(lessonId) {
  const content = await withOverrides(lessonId);
  if (!content) return null;
  return {
    ...content,
    activities: content.activities.map((a) => ({
      ...a,
      questions: a.questions.map(({ answer, explanation, ...rest }) => rest),
    })),
  };
}

/** Same payload with answers, for admin preview and teacher review only. */
async function getLessonForReview(lessonId) {
  const me = requireUser();
  if (!['teacher', 'admin'].includes(me.role)) fail('forbidden', 'Answer keys are for teachers and admins.');
  return withOverrides(lessonId);
}

async function withOverrides(lessonId) {
  const override = db().contentOverrides[lessonId];
  if (override?.isNew || override?.activities) {
    const bank = await loadBank();
    const c = await catalog();
    const lesson = c.lesson(lessonId);
    if (!lesson) return null;
    const acts = (override.activities || bank.byLesson[lessonId] || []).map((a) => ({
      ...a,
      questions: (a.questionIds || []).map((id) => override.questions?.[id] || bank.questions[id]).filter(Boolean),
    }));
    return { lesson, activities: acts };
  }
  const base = await loadLessonContent(lessonId);
  if (!base) return null;
  const c = await catalog();
  return { ...base, lesson: c.lesson(lessonId) || base.lesson };
}

/* ------------------------------------------------------------ admin CRUD --- */

const BLANK_LESSON = () => ({
  title: 'Untitled lesson',
  summary: '',
  strandId: 'method',
  subject: '',
  gradeMin: 3, gradeMax: 8, difficulty: 1, estMinutes: 10,
  objectives: [], standards: [], tags: [], activityKinds: ['quiz'],
  skills: [], xpAward: 50, format: 'mission', status: 'draft', version: 1,
  source: { kind: 'authored' },
});

async function createLesson(patch = {}) {
  const me = requireAdmin();
  const id = patch.id?.trim() || `authored.${randomId()}`.slice(0, 48);
  const c = await catalog();
  if (c.lesson(id)) fail('taken', 'A lesson already uses that id.');
  const lesson = { ...BLANK_LESSON(), ...patch, id, createdBy: me.id, createdAt: now(), updatedAt: now() };
  commit((d) => {
    d.contentOverrides[id] = {
      isNew: true, lesson,
      activities: [{ id: randomId('a'), lessonId: id, position: 0, kind: 'quiz', title: lesson.title, required: true, config: { passPct: 70 }, questionIds: [] }],
      questions: {},
    };
  });
  return lesson;
}

async function saveLesson(lessonId, patch) {
  requireAdmin();
  const c = await catalog();
  const existing = c.lesson(lessonId);
  if (!existing) fail('not_found', 'That lesson no longer exists.');
  return commit((d) => {
    const prev = d.contentOverrides[lessonId] || { isNew: false, lesson: { ...existing } };
    const bumped = existing.status === 'published' && touchesContent(patch);
    const lesson = {
      ...existing, ...prev.lesson, ...patch,
      id: lessonId,
      version: bumped ? (existing.version || 1) + 1 : existing.version || 1,
      updatedAt: now(),
    };
    d.contentOverrides[lessonId] = { ...prev, lesson };
    return lesson;
  });
}

const touchesContent = (patch) =>
  ['skills', 'difficulty', 'activityKinds', 'objectives'].some((k) => k in patch);

async function setLessonStatus(lessonId, status) {
  requireAdmin();
  if (!['draft', 'published', 'archived'].includes(status)) fail('invalid', 'Unknown status.');
  return saveLesson(lessonId, { status, publishedAt: status === 'published' ? now() : undefined });
}

async function duplicateLesson(lessonId) {
  requireAdmin();
  const content = await withOverrides(lessonId);
  if (!content) fail('not_found', 'That lesson no longer exists.');
  const newId = `${lessonId}.copy.${randomId().slice(0, 6)}`;
  const lesson = {
    ...content.lesson, id: newId,
    title: `${content.lesson.title} (copy)`,
    status: 'draft', version: 1, createdAt: now(), updatedAt: now(),
    source: { ...content.lesson.source, copiedFrom: lessonId },
  };
  commit((d) => {
    d.contentOverrides[newId] = {
      isNew: true, lesson,
      activities: content.activities.map((a) => ({ ...a, id: randomId('a'), lessonId: newId })),
      questions: {},
    };
  });
  return lesson;
}

async function saveActivities(lessonId, activities) {
  requireAdmin();
  const c = await catalog();
  if (!c.lesson(lessonId)) fail('not_found', 'That lesson no longer exists.');
  const bank = await loadBank();
  return commit((d) => {
    const prev = d.contentOverrides[lessonId] || { isNew: false, lesson: { ...c.lesson(lessonId) } };
    d.contentOverrides[lessonId] = {
      ...prev,
      activities: activities.map((a, i) => ({
        ...a,
        id: a.id || randomId('a'),
        lessonId,
        position: i,
        questionIds: a.questionIds || [],
      })),
      questions: prev.questions || {},
    };
    /* Keep the derived kind list on the lesson honest. */
    d.contentOverrides[lessonId].lesson = {
      ...d.contentOverrides[lessonId].lesson,
      activityKinds: [...new Set(activities.map((a) => a.kind))],
      updatedAt: now(),
    };
    return d.contentOverrides[lessonId].activities;
  });
}

async function saveQuestion(lessonId, question) {
  requireAdmin();
  const id = question.id || `q.authored.${randomId().slice(0, 10)}`;
  return commit((d) => {
    const prev = d.contentOverrides[lessonId] || { isNew: false, lesson: {} };
    d.contentOverrides[lessonId] = {
      ...prev,
      questions: { ...(prev.questions || {}), [id]: { ...question, id } },
    };
    return { ...question, id };
  });
}

/** Everything an admin has changed, as JSON to commit into src/content. */
function exportOverrides() {
  requireAdmin();
  return JSON.stringify(db().contentOverrides, null, 2);
}

function importOverrides(json) {
  requireAdmin();
  let parsed;
  try { parsed = JSON.parse(json); } catch { fail('invalid', 'That is not valid JSON.'); }
  commit((d) => { d.contentOverrides = { ...d.contentOverrides, ...parsed }; });
  return true;
}

function clearOverrides() {
  requireAdmin();
  commit((d) => { d.contentOverrides = {}; });
  return true;
}

export const contentApi = {
  getCatalog, listLessons, getFacets, getLessonForPlay, getLessonForReview,
  createLesson, saveLesson, setLessonStatus, duplicateLesson,
  saveActivities, saveQuestion,
  exportOverrides, importOverrides, clearOverrides,
};
