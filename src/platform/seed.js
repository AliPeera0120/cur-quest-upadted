/* ============================================================================
   Demo data.

   Dashboards are impossible to evaluate against an empty database — a mastery
   matrix with no students tells you nothing about whether the design works. So
   this builds a plausible school: two classes, twenty students with different
   ability profiles and different engagement levels, real attempts against real
   questions, and assignments in various states of completion.

   Everything is generated through the ordinary API-shaped paths, so the demo
   exercises the same mastery and achievement code the product runs. It is
   deterministic: the same seed always produces the same class, which makes it
   usable as a fixture for tests and screenshots.

   Nothing here runs automatically. A teacher or reviewer chooses to load it.
   ========================================================================= */

import { db, commit, flush } from './store.js';
import { hashSecret, randomId } from './crypto.js';
import { loadCatalog, loadBank } from '../content/index.js';
import { evaluateAchievements } from './achievements.js';
import { computeLessonProgress } from './mastery.js';

/* Deterministic PRNG so the demo class is stable across reloads and builds. */
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const AVATARS = ['beaker', 'circuit', 'orbit', 'leaf', 'gear', 'prism', 'wave', 'crystal'];

/**
 * Each student gets an ability profile and an engagement profile. Ability
 * varies by strand, because a real class has a student who is strong on
 * engineering and shaky on biology — a uniform "good student / bad student"
 * axis would make the dashboards look far more useful than they are.
 */
const STUDENTS = [
  { name: 'Alex',    base: 0.86, growth: 0.16, sessions: 16, strengths: ['forces', 'earth'],  weaknesses: ['life'] },
  { name: 'Mia',     base: 0.82, growth: 0.10, sessions: 18, strengths: ['life', 'matter'],   weaknesses: ['build'] },
  { name: 'James',   base: 0.48, growth: 0.22, sessions: 9,  strengths: ['build'],            weaknesses: ['forces', 'matter'] },
  { name: 'Sarah',   base: 0.90, growth: 0.06, sessions: 20, strengths: ['method', 'life'],   weaknesses: [] },
  { name: 'Ethan',   base: 0.60, growth: 0.05, sessions: 7,  strengths: [],                   weaknesses: ['method'] },
  { name: 'Priya',   base: 0.78, growth: 0.19, sessions: 14, strengths: ['matter'],           weaknesses: ['earth'] },
  { name: 'Marcus',  base: 0.71, growth: 0.12, sessions: 11, strengths: ['build', 'forces'],  weaknesses: ['life'] },
  { name: 'Chloe',   base: 0.55, growth: 0.28, sessions: 12, strengths: ['life'],             weaknesses: ['forces', 'build'] },
  { name: 'Diego',   base: 0.83, growth: 0.08, sessions: 15, strengths: ['earth', 'method'],  weaknesses: [] },
  { name: 'Amara',   base: 0.66, growth: 0.15, sessions: 10, strengths: ['method'],           weaknesses: ['matter'] },
  { name: 'Noah',    base: 0.42, growth: 0.09, sessions: 4,  strengths: [],                   weaknesses: ['forces', 'method', 'life'] },
  { name: 'Leila',   base: 0.94, growth: 0.04, sessions: 22, strengths: ['forces', 'matter', 'build'], weaknesses: [] },
  { name: 'Tobias',  base: 0.00, growth: 0.00, sessions: 0,  strengths: [],                   weaknesses: [] }, // joined, never played
  { name: 'Yusuf',   base: 0.74, growth: 0.11, sessions: 13, strengths: ['build'],            weaknesses: ['earth'] },
];

const CLUB_STUDENTS = [
  { name: 'Ravi',    base: 0.88, growth: 0.09, sessions: 17, strengths: ['build', 'matter'],  weaknesses: [] },
  { name: 'Hana',    base: 0.79, growth: 0.14, sessions: 12, strengths: ['method'],           weaknesses: ['forces'] },
  { name: 'Oliver',  base: 0.63, growth: 0.21, sessions: 8,  strengths: [],                   weaknesses: ['life'] },
  { name: 'Zoe',     base: 0.91, growth: 0.05, sessions: 19, strengths: ['life', 'earth'],    weaknesses: [] },
  { name: 'Kenji',   base: 0.57, growth: 0.17, sessions: 6,  strengths: ['build'],            weaknesses: ['matter'] },
  { name: 'Fatima',  base: 0.85, growth: 0.12, sessions: 14, strengths: ['forces'],           weaknesses: [] },
];

const DEMO_PASSWORD = 'sciencelab24';
const TEACHER_PASSWORD = 'CuriosityQuest!24';

/**
 * Load the demo class. Idempotent — running it twice does nothing the second
 * time. Returns the credentials so the sign-in screen can offer them.
 */
export async function seedDemo({ force = false } = {}) {
  if (db().meta.seeded && !force) return credentials();

  const [catalog, bank] = await Promise.all([loadCatalog(), loadBank()]);
  const secret = await hashSecret(DEMO_PASSWORD);
  const teacherSecret = await hashSecret(TEACHER_PASSWORD);

  const iso = (daysAgo, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, Math.floor(rng(`h${daysAgo}${hour}`)() * 59), 0, 0);
    return d.toISOString();
  };

  /* Lessons the demo actually plays: a spread of formats and strands. */
  const playable = catalog.lessons.filter((l) => {
    const acts = bank.byLesson[l.id] || [];
    return acts.some((a) => (a.questionIds || []).length >= 3);
  });
  const byStrand = {};
  for (const l of playable) (byStrand[l.strandId] ||= []).push(l);

  commit((d) => {
    if (force) {
      d.profiles = {}; d.usernames = {}; d.classes = {}; d.joinCodes = {};
      d.classMembers = []; d.attempts = {}; d.responses = []; d.assignments = {};
      d.events = []; d.achievements = []; d.xp = []; d.classGoals = {}; d.session = null;
    }

    /* --------------------------------------------------------- teachers --- */
    const teacherId = 'u_demo_teacher';
    d.profiles[teacherId] = {
      id: teacherId, role: 'teacher', username: 'teacher@demo.curiosity-quest.org',
      displayName: 'Mrs. Smith', avatarKey: 'circuit', schoolName: 'Spring-Ford Elementary',
      xpTotal: 0, settings: {}, createdAt: iso(64), lastSeenAt: iso(0, 8),
      secret: teacherSecret, recovery: null, demo: true,
    };
    d.usernames['teacher@demo.curiosity-quest.org'] = teacherId;

    const adminId = 'u_demo_admin';
    d.profiles[adminId] = {
      id: adminId, role: 'admin', username: 'admin@demo.curiosity-quest.org',
      displayName: 'CQ Admin', avatarKey: 'gear', xpTotal: 0, settings: {},
      createdAt: iso(90), lastSeenAt: iso(1), secret: teacherSecret, recovery: null, demo: true,
    };
    d.usernames['admin@demo.curiosity-quest.org'] = adminId;

    /* ---------------------------------------------------------- classes --- */
    const mkClass = (id, name, code, gradeBand, subject, createdDaysAgo) => {
      d.classes[id] = {
        id, teacherId, name, gradeBand, subject,
        joinCode: code, codeActive: true, codeExpiresAt: null,
        settings: {
          masteryThreshold: 80, allowRetry: true, showAnswers: true,
          xpEnabled: true, achievementsEnabled: true, classGoalsEnabled: true,
          leaderboardEnabled: false,
        },
        createdAt: iso(createdDaysAgo), archivedAt: null, demo: true,
      };
      d.joinCodes[code] = id;
      return id;
    };
    const classA = mkClass('c_demo_5sci', '5th Grade Science', 'CQ-48291', '3-5', 'General Science', 60);
    const classB = mkClass('c_demo_club', 'STEM Club', 'CQ-73104', '6-8', 'Enrichment', 45);
    mkClass('c_demo_old', '4th Grade Enrichment (last year)', 'CQ-19483', '3-5', 'Enrichment', 300);
    d.classes.c_demo_old.archivedAt = iso(120);
    d.classes.c_demo_old.codeActive = false;
    d.joinCodes['CQ-19483'] = 'c_demo_old';

    /* --------------------------------------------------------- students --- */
    const makeStudent = (spec, classId, i, prefix) => {
      const id = `u_demo_${prefix}_${i}`;
      const uname = `${spec.name.toLowerCase()}${prefix === 'club' ? '.club' : ''}`;
      d.profiles[id] = {
        id, role: 'student', username: uname, displayName: spec.name,
        avatarKey: AVATARS[i % AVATARS.length], gradeBand: prefix === 'club' ? '6-8' : '3-5',
        title: null, xpTotal: 0, settings: {},
        createdAt: iso(50 - i), lastSeenAt: spec.sessions ? iso(Math.max(0, 14 - spec.sessions)) : iso(40),
        secret, demo: true,
      };
      d.usernames[uname] = id;
      d.classMembers.push({ id: `m_${id}`, classId, studentId: id, joinedAt: iso(48 - i), removedAt: null });
      return id;
    };

    const idsA = STUDENTS.map((s, i) => makeStudent(s, classA, i, 'a'));
    const idsB = CLUB_STUDENTS.map((s, i) => makeStudent(s, classB, i, 'club'));
    /* Two students belong to both classes — the model supports it, so the demo
       should exercise it. */
    d.classMembers.push({ id: 'm_cross_1', classId: classB, studentId: idsA[0], joinedAt: iso(30), removedAt: null });
    d.classMembers.push({ id: 'm_cross_2', classId: classB, studentId: idsA[11], joinedAt: iso(28), removedAt: null });
    /* One student who was removed from the roster, so that path is covered. */
    d.classMembers.push({ id: 'm_removed', classId: classA, studentId: idsB[4], joinedAt: iso(40), removedAt: iso(12) });

    /* -------------------------------------------------------- gameplay --- */
    const specs = [...STUDENTS.map((s, i) => [s, idsA[i]]), ...CLUB_STUDENTS.map((s, i) => [s, idsB[i]])];

    for (const [spec, studentId] of specs) {
      if (!spec.sessions) continue;
      const rand = rng(`play:${spec.name}`);
      let xpTotal = 0;

      /* Pick a spread of lessons weighted toward this student's strengths. */
      const chosen = [];
      for (let i = 0; i < spec.sessions; i += 1) {
        const strandPool = i % 3 === 0 && spec.strengths.length
          ? byStrand[spec.strengths[i % spec.strengths.length]] || playable
          : i % 4 === 0 && spec.weaknesses.length
            ? byStrand[spec.weaknesses[i % spec.weaknesses.length]] || playable
            : playable;
        const lesson = strandPool[Math.floor(rand() * strandPool.length)];
        if (lesson) chosen.push(lesson);
      }

      /* Some lessons get replayed, which is what produces growth curves. */
      const plan = [];
      chosen.forEach((lesson, i) => {
        const replays = rand() < 0.35 ? 2 : rand() < 0.15 ? 3 : 1;
        for (let r = 0; r < replays; r += 1) plan.push({ lesson, run: r, order: i });
      });

      plan.forEach((item, n) => {
        const { lesson, run } = item;
        const acts = (bank.byLesson[lesson.id] || []).filter((a) => (a.questionIds || []).length);
        if (!acts.length) return;
        const qIds = acts.flatMap((a) => a.questionIds).slice(0, 10);
        if (qIds.length < 3) return;

        const daysAgo = Math.max(0, Math.round(28 - (n / Math.max(1, plan.length)) * 28) - run);
        const strandBoost = spec.strengths.includes(lesson.strandId) ? 0.09
          : spec.weaknesses.includes(lesson.strandId) ? -0.16 : 0;
        /* Ability climbs with practice, plus a bit of noise per sitting. */
        const skill = Math.max(0.12, Math.min(0.98,
          spec.base + strandBoost + spec.growth * (n / Math.max(1, plan.length)) + run * 0.09 + (rand() - 0.5) * 0.14));

        const attemptId = `at_demo_${studentId}_${n}`;
        let correct = 0;
        const startedAt = iso(daysAgo, 9 + (n % 6));
        const responses = [];
        qIds.forEach((qid, qi) => {
          const q = bank.questions[qid];
          if (!q) return;
          /* Harder questions are harder. */
          const p = skill - (q.difficulty - 1) * 0.11;
          const isCorrect = rand() < p;
          if (isCorrect) correct += 1;
          responses.push({
            id: `r_demo_${attemptId}_${qi}`, attemptId, studentId, questionId: qid,
            lessonId: lesson.id, skillId: q.skillId, isCorrect,
            difficulty: q.difficulty, response: isCorrect ? q.answer : (q.answer + 1) % 4,
            msElapsed: 6000 + Math.floor(rand() * 22000), attemptNo: qi + 1,
            answeredAt: startedAt,
          });
        });
        d.responses.push(...responses);

        const seconds = 200 + Math.floor(rand() * 900);
        d.attempts[attemptId] = {
          id: attemptId, studentId, lessonId: lesson.id, lessonVersion: 1,
          assignmentId: null, startedAt, updatedAt: startedAt, completedAt: startedAt,
          abandonedAt: null, score: correct, maxScore: qIds.length,
          questionsAnswered: qIds.length, questionsCorrect: correct,
          secondsSpent: seconds,
          state: { totalQuestions: qIds.length, questionIndex: qIds.length },
        };

        const pct = Math.round((correct / qIds.length) * 100);
        const xp = lesson.xpAward || 50;
        xpTotal += run === 0 ? xp : Math.round(xp / 2);
        d.xp.push({ id: `x_${attemptId}`, studentId, amount: run === 0 ? xp : Math.round(xp / 2), reason: run === 0 ? 'Lesson completed' : 'Lesson replayed', refType: 'lesson', refId: lesson.id, createdAt: startedAt });
        d.events.push({ id: `e_${attemptId}`, studentId, classId: null, type: 'lesson_completed', lessonId: lesson.id, payload: { scorePct: pct, attemptId }, createdAt: startedAt });
      });

      /* Leave a couple of students mid-lesson so "Continue playing" has
         something real to show. */
      if (['Alex', 'Chloe', 'Ravi'].includes(spec.name)) {
        const lesson = playable.find((l) => l.format === 'mission' && l.strandId === 'forces') || playable[0];
        const acts = (bank.byLesson[lesson.id] || []).filter((a) => (a.questionIds || []).length);
        const qIds = acts.flatMap((a) => a.questionIds);
        const attemptId = `at_demo_open_${studentId}`;
        const startedAt = iso(spec.name === 'Alex' ? 0 : 2, 15);
        const answered = Math.min(qIds.length - 3, 4);
        for (let i = 0; i < answered; i += 1) {
          const q = bank.questions[qIds[i]];
          if (!q) continue;
          const isCorrect = rand() < spec.base;
          d.responses.push({
            id: `r_open_${studentId}_${i}`, attemptId, studentId, questionId: qIds[i],
            lessonId: lesson.id, skillId: q.skillId, isCorrect, difficulty: q.difficulty,
            response: isCorrect ? q.answer : (q.answer + 2) % 4, msElapsed: 9000,
            attemptNo: i + 1, answeredAt: startedAt,
          });
        }
        d.attempts[attemptId] = {
          id: attemptId, studentId, lessonId: lesson.id, lessonVersion: 1, assignmentId: null,
          startedAt, updatedAt: startedAt, completedAt: null, abandonedAt: null,
          score: 0, maxScore: 0, questionsAnswered: answered, questionsCorrect: 0,
          secondsSpent: 240,
          state: { totalQuestions: qIds.length, questionIndex: answered, activityIndex: acts.length > 1 ? 1 : 0 },
        };
      }

      d.profiles[studentId].xpTotal = xpTotal;
    }

    /* ------------------------------------------------------ assignments --- */
    const pickLesson = (pred) => playable.find(pred) || playable[0];
    const asg = [
      { id: 'as_demo_1', classId: classA, lesson: pickLesson((l) => l.id.startsWith('mission.forces-motion.explorer')), due: -3, min: 80, note: 'Do this before Friday’s lab.' },
      { id: 'as_demo_2', classId: classA, lesson: pickLesson((l) => l.id.startsWith('mission.energy')), due: 4, min: 80, note: null },
      { id: 'as_demo_3', classId: classA, lesson: pickLesson((l) => l.format === 'quick' && l.strandId === 'life'), due: 1, min: 60, note: 'Exit ticket for Tuesday.' },
      { id: 'as_demo_4', classId: classB, lesson: pickLesson((l) => l.format === 'battle'), due: 7, min: 70, note: 'Club challenge — beat the boss.' },
      { id: 'as_demo_5', classId: classB, lesson: pickLesson((l) => l.strandId === 'build' && l.format === 'mission'), due: null, min: 80, note: null },
    ];
    for (const a of asg) {
      if (!a.lesson) continue;
      const dueAt = a.due == null ? null : iso(-a.due, 23);
      d.assignments[a.id] = {
        id: a.id, classId: a.classId, lessonId: a.lesson.id, teacherId,
        title: null, note: a.note, dueAt, minMastery: a.min, required: true,
        createdAt: iso(14), archivedAt: null, demo: true,
      };
    }

    /* ------------------------------------------------------ class goals --- */
    d.classGoals.g_demo_1 = {
      id: 'g_demo_1', classId: classA, title: 'Class Science Mission: 100 challenges together',
      metric: 'lessons_completed', target: 100, startsAt: iso(21), endsAt: iso(-7), completedAt: null,
    };
    d.classGoals.g_demo_2 = {
      id: 'g_demo_2', classId: classB, title: 'Master 40 skills as a club',
      metric: 'skills_mastered', target: 40, startsAt: iso(30), endsAt: null, completedAt: null,
    };

    d.meta.seeded = true;
  });

  /* The demo writes attempts directly rather than going through the play API,
     so the badge rules never fired. Run them once now, otherwise every demo
     student shows a full history with zero badges — which reads as a bug and
     makes the achievements screen impossible to evaluate. */
  await awardSeededAchievements(catalog);

  flush();
  return credentials();
}

/** Backfill achievements for the seeded students, exactly as play would. */
async function awardSeededAchievements(catalog) {
  const d = db();
  const students = Object.values(d.profiles).filter((p) => p.role === 'student' && !p.deletedAt);
  for (const student of students) {
    const attempts = Object.values(d.attempts).filter((a) => a.studentId === student.id);
    if (!attempts.length) continue;
    const responses = d.responses.filter((r) => r.studentId === student.id);
    const already = d.achievements.filter((a) => a.studentId === student.id).map((a) => a.achievementId);
    /* eslint-disable no-await-in-loop -- seeding is a one-off, and running
       twenty students concurrently would just thrash the same store. */
    const earned = await evaluateAchievements(student.id, { catalog, attempts, responses, already });
    if (!earned.length) continue;
    commit((dd) => {
      for (const a of earned) {
        dd.achievements.push({ studentId: student.id, achievementId: a.id, earnedAt: new Date().toISOString() });
        dd.profiles[student.id].xpTotal = (dd.profiles[student.id].xpTotal || 0) + (a.xp || 0);
        dd.xp.push({
          id: randomId('x'), studentId: student.id, amount: a.xp || 0,
          reason: `Achievement: ${a.name}`, refType: 'achievement', refId: a.id,
          createdAt: new Date().toISOString(),
        });
      }
    });
  }
}

export const credentials = () => ({
  teacher: { label: 'Mrs. Smith (teacher)', identifier: 'teacher@demo.curiosity-quest.org', password: TEACHER_PASSWORD },
  student: { label: 'Alex (student)', identifier: 'alex', password: DEMO_PASSWORD },
  strugglingStudent: { label: 'James (student who needs help)', identifier: 'james', password: DEMO_PASSWORD },
  admin: { label: 'CQ Admin', identifier: 'admin@demo.curiosity-quest.org', password: TEACHER_PASSWORD },
  classCode: 'CQ-48291',
});

export const isSeeded = () => !!db().meta.seeded;
