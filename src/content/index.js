/* ============================================================================
   Content access.

   Three files, loaded at three different moments, so a visitor who only reads
   the homepage never downloads the lesson bank:

     summary.json   ~5 KB    bundled — real counts and a few sample lessons
                             for the public site
     catalog.json  ~254 KB   lazy    — every lesson's metadata; fetched when
                             someone enters the Arena, which is when search,
                             filtering and dashboards start needing it
     bank.json     ~381 KB   lazy    — activities and questions; fetched when
                             a lesson is actually opened

   Both lazy files are cached after the first load and shared by every caller.
   ========================================================================= */

import summary from './summary.json';

export const CONTENT_SUMMARY = summary;

let catalogPromise = null;
let bankPromise = null;

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = import('./catalog.json')
      .then((m) => index(m.default))
      .catch((err) => { catalogPromise = null; throw err; });
  }
  return catalogPromise;
}

export function loadBank() {
  if (!bankPromise) {
    bankPromise = import('./bank.json')
      .then((m) => {
        const byLesson = {};
        for (const a of m.default.activities) (byLesson[a.lessonId] ||= []).push(a);
        for (const list of Object.values(byLesson)) list.sort((x, y) => x.position - y.position);
        return { ...m.default, byLesson };
      })
      .catch((err) => { bankPromise = null; throw err; });
  }
  return bankPromise;
}

/** Build the lookup maps once, so no screen has to scan 204 lessons twice. */
function index(raw) {
  const lessons = raw.lessons;
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const skillById = new Map(raw.skills.map((s) => [s.id, s]));
  const strandById = new Map(raw.strands.map((s) => [s.id, s]));
  const lessonsBySkill = new Map();
  for (const l of lessons) {
    for (const s of l.skills) {
      if (!lessonsBySkill.has(s.skillId)) lessonsBySkill.set(s.skillId, []);
      lessonsBySkill.get(s.skillId).push(l);
    }
  }
  const skillsByStrand = new Map();
  for (const s of raw.skills) {
    if (!skillsByStrand.has(s.strandId)) skillsByStrand.set(s.strandId, []);
    skillsByStrand.get(s.strandId).push(s);
  }
  /* Pre-lowercased haystack per lesson keeps search fast without an index lib. */
  const haystack = new Map(lessons.map((l) => [
    l.id,
    `${l.title} ${l.summary} ${l.subject} ${(l.tags || []).join(' ')} ${(l.objectives || []).join(' ')} ${l.skills.map((s) => skillById.get(s.skillId)?.name || '').join(' ')}`.toLowerCase(),
  ]));

  return {
    ...raw,
    byId, skillById, strandById, lessonsBySkill, skillsByStrand, haystack,
    lesson: (id) => byId.get(id) || null,
    skill: (id) => skillById.get(id) || null,
    strand: (id) => strandById.get(id) || null,
  };
}

export const FORMATS = {
  mission:    { label: 'Mission',    blurb: 'Guided questions on one topic',        icon: 'target' },
  quick:      { label: 'Quick',      blurb: 'Five questions, about five minutes',   icon: 'zap' },
  battle:     { label: 'Battle',     blurb: 'Answer to power your army',            icon: 'swords' },
  experiment: { label: 'Experiment', blurb: 'Hands-on, with real materials',        icon: 'flask' },
  course:     { label: 'Coding',     blurb: 'Read, then write some code',           icon: 'terminal' },
  assessment: { label: 'Check',      blurb: 'Pre and post assessment',              icon: 'clipboard' },
  brief:      { label: 'Brief',      blurb: 'A five-minute read',                   icon: 'book' },
};

export const DIFFICULTY = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

export const DURATION_BUCKETS = [
  { id: 'under10', label: 'Under 10 min', test: (m) => m < 10 },
  { id: '10to20',  label: '10–20 min',    test: (m) => m >= 10 && m <= 20 },
  { id: 'over20',  label: 'Over 20 min',  test: (m) => m > 20 },
];

/**
 * Lesson search. Everything is filterable and nothing is gated: this function
 * has no concept of a lesson being locked, because in this product there is
 * no such thing.
 */
export function searchLessons(catalog, {
  q = '', strands = [], formats = [], difficulties = [], grades = [],
  durations = [], skills = [], tags = [], masteryOf = null, masteryStates = [],
  sort = 'relevance', limit = null, offset = 0,
} = {}) {
  const needle = q.trim().toLowerCase();
  const terms = needle ? needle.split(/\s+/).filter(Boolean) : [];

  let rows = catalog.lessons.filter((l) => {
    if (l.status !== 'published') return false;
    if (strands.length && !strands.includes(l.strandId)) return false;
    if (formats.length && !formats.includes(l.format)) return false;
    if (difficulties.length && !difficulties.includes(l.difficulty)) return false;
    if (grades.length && !grades.some((g) => g >= l.gradeMin && g <= l.gradeMax)) return false;
    if (durations.length && !durations.some((d) => DURATION_BUCKETS.find((b) => b.id === d)?.test(l.estMinutes))) return false;
    if (skills.length && !l.skills.some((s) => skills.includes(s.skillId))) return false;
    if (tags.length && !tags.some((t) => (l.tags || []).includes(t))) return false;
    if (masteryStates.length) {
      const state = masteryOf?.[l.id]?.status || 'not_started';
      if (!masteryStates.includes(state)) return false;
    }
    if (terms.length) {
      const hay = catalog.haystack.get(l.id) || '';
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const score = (l) => {
    if (!terms.length) return 0;
    const title = l.title.toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (title.startsWith(t)) s += 6;
      else if (title.includes(t)) s += 4;
      if ((l.subject || '').toLowerCase().includes(t)) s += 2;
    }
    return s;
  };

  rows = [...rows].sort((a, b) => {
    if (sort === 'shortest') return a.estMinutes - b.estMinutes;
    if (sort === 'longest') return b.estMinutes - a.estMinutes;
    if (sort === 'easiest') return a.difficulty - b.difficulty || a.estMinutes - b.estMinutes;
    if (sort === 'hardest') return b.difficulty - a.difficulty;
    if (sort === 'title') return a.title.localeCompare(b.title);
    const d = score(b) - score(a);
    if (d) return d;
    return FORMAT_ORDER.indexOf(a.format) - FORMAT_ORDER.indexOf(b.format) || a.title.localeCompare(b.title);
  });

  const total = rows.length;
  if (limit != null) rows = rows.slice(offset, offset + limit);
  return { rows, total };
}

const FORMAT_ORDER = ['battle', 'mission', 'quick', 'experiment', 'assessment', 'course', 'brief'];

/** Counts for each filter value, so the UI can show "Physics 34" style chips. */
export function facetCounts(catalog, lessons = catalog.lessons) {
  const out = { strands: {}, formats: {}, difficulties: {}, durations: {} };
  for (const l of lessons) {
    if (l.status !== 'published') continue;
    out.strands[l.strandId] = (out.strands[l.strandId] || 0) + 1;
    out.formats[l.format] = (out.formats[l.format] || 0) + 1;
    out.difficulties[l.difficulty] = (out.difficulties[l.difficulty] || 0) + 1;
    const bucket = DURATION_BUCKETS.find((b) => b.test(l.estMinutes));
    if (bucket) out.durations[bucket.id] = (out.durations[bucket.id] || 0) + 1;
  }
  return out;
}

/** Activities plus resolved questions for one lesson. */
export async function loadLessonContent(lessonId) {
  const [catalog, bank] = await Promise.all([loadCatalog(), loadBank()]);
  const lesson = catalog.lesson(lessonId);
  if (!lesson) return null;
  const acts = (bank.byLesson[lessonId] || []).map((a) => ({
    ...a,
    questions: a.questionIds.map((id) => bank.questions[id]).filter(Boolean),
  }));
  return { lesson, activities: acts };
}
