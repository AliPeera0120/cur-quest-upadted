/* ============================================================================
   Analytics.

   Everything a dashboard renders is derived here, from `attempts` and
   `responses`, using the same pure functions in mastery.js that the server
   backend will call. No screen recomputes a rule of its own, so the student's
   "78% in Forces" and the teacher's "78%" for that student are the same number
   by construction.
   ========================================================================= */

import { db, commit } from '../store.js';
import { randomId } from '../crypto.js';
import { computeMastery, computeLessonProgress, rollUp, rankForXp, nextRank } from '../mastery.js';
import { loadCatalog } from '../../content/index.js';
import { recommendFor, classInsights } from '../recommend.js';
import { achievementProgress } from '../achievements.js';
import {
  _assertCanReadStudent as assertCanReadStudent,
  _assertOwnsClass as assertOwnsClass,
  _assertCanReadClass as assertCanReadClass,
  _requireUser as requireUser,
  _attemptsFor as attemptsFor,
  _responsesFor as responsesFor,
  _activeMemberships as activeMemberships,
  _publicProfile as publicProfile,
  _fail as fail,
  _now as now,
} from './local.js';

/* --------------------------------------------------------------- helpers --- */

/** lessonId -> progress record for one student. */
function lessonProgressMap(studentId) {
  const byLesson = {};
  for (const a of attemptsFor(studentId)) (byLesson[a.lessonId] ||= []).push(a);
  const out = {};
  for (const [lessonId, list] of Object.entries(byLesson)) out[lessonId] = computeLessonProgress(list);
  return out;
}

/** skillId -> mastery record for one student. */
function skillMasteryMap(studentId, responses = null) {
  const rs = responses || responsesFor(studentId);
  const bySkill = {};
  for (const r of rs) { if (r.skillId) (bySkill[r.skillId] ||= []).push(r); }
  const out = {};
  for (const [skillId, list] of Object.entries(bySkill)) out[skillId] = computeMastery(list);
  return out;
}

/** strandId -> rolled-up record. */
function strandRollup(catalog, masteryMap) {
  const out = {};
  for (const strand of catalog.strands) {
    const skills = catalog.skillsByStrand.get(strand.id) || [];
    /* Only count skills that some published lesson actually covers — holding a
       student to a skill nothing teaches would be unfair. */
    const teachable = skills.filter((k) => (catalog.lessonsBySkill.get(k.id) || []).length > 0);
    const records = teachable.map((k) => masteryMap[k.id]).filter(Boolean);
    const roll = rollUp(records, teachable.length);
    out[strand.id] = {
      ...roll,
      totalSkills: teachable.length,
      touchedSkills: roll.touched,
    };
  }
  return out;
}

/** Open (non-archived) assignments visible to one student across their classes. */
function assignmentsForStudent(studentId) {
  const d = db();
  const classIds = activeMemberships(studentId).map((m) => m.classId);
  return Object.values(d.assignments)
    .filter((a) => classIds.includes(a.classId) && !a.archivedAt)
    .map((a) => ({ ...a, className: d.classes[a.classId]?.name || null }));
}

const daySpan = (n) => {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
};

const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function activitySeries(studentIds, days = 14) {
  const set = new Set(studentIds);
  const buckets = daySpan(days).map((d) => ({
    key: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    short: DAY_SHORT[d.getDay()],
    value: 0,
  }));
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const a of Object.values(db().attempts)) {
    if (!set.has(a.studentId) || !a.completedAt) continue;
    const key = a.completedAt.slice(0, 10);
    const i = index.get(key);
    if (i != null) buckets[i].value += 1;
  }
  return buckets;
}

/* ============================================================== STUDENT === */

/** Everything the student dashboard needs, in one call. */
async function getStudentOverview(studentIdArg = null) {
  const me = requireUser();
  const studentId = studentIdArg || me.id;
  assertCanReadStudent(studentId);
  const catalog = await loadCatalog();
  const d = db();
  const profile = publicProfile(d.profiles[studentId]);

  const attempts = attemptsFor(studentId);
  const responses = responsesFor(studentId);
  const progress = lessonProgressMap(studentId);
  const mastery = skillMasteryMap(studentId, responses);
  const strands = strandRollup(catalog, mastery);
  const assignments = assignmentsForStudent(studentId);

  /* Continue playing: the most recently touched unfinished attempt. */
  const open = attempts
    .filter((a) => !a.completedAt && !a.abandonedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  const continueCard = open ? (() => {
    const lesson = catalog.lesson(open.lessonId);
    if (!lesson) return null;
    const total = open.state?.totalQuestions ?? null;
    return {
      lesson,
      attemptId: open.id,
      questionIndex: open.state?.questionIndex ?? open.questionsAnswered,
      totalQuestions: total,
      activityIndex: open.state?.activityIndex ?? 0,
      updatedAt: open.updatedAt,
      label: total
        ? `Question ${Math.min(total, (open.state?.questionIndex ?? open.questionsAnswered) + 1)} of ${total}`
        : 'Picked up where you left off',
    };
  })() : null;

  /* Recently played, newest first. */
  const recent = [...attempts]
    .filter((a) => a.completedAt || a.abandonedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
    .map((a) => ({
      lesson: catalog.lesson(a.lessonId),
      scorePct: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null,
      at: a.updatedAt,
      progress: progress[a.lessonId],
    }))
    .filter((r) => r.lesson);

  const recentSkillIds = [...new Set(
    responses.slice(-40).map((r) => r.skillId).filter(Boolean),
  )];

  const recommendations = recommendFor({
    catalog, lessonProgress: progress, skillMastery: mastery,
    assignments, recentSkillIds, limit: 6,
  });

  const assignmentCards = assignments
    .map((a) => {
      const lesson = catalog.lesson(a.lessonId);
      if (!lesson) return null;
      const p = progress[a.lessonId];
      const threshold = a.minMastery ?? 80;
      const met = (p?.bestScore ?? 0) >= threshold && (p?.completions ?? 0) > 0;
      return {
        assignment: a, lesson, progress: p || null,
        state: met ? 'met' : p?.completions ? 'needs_work' : p?.status === 'in_progress' ? 'in_progress' : 'not_started',
        threshold,
        overdue: a.dueAt ? new Date(a.dueAt) < new Date() && !met : false,
      };
    })
    .filter(Boolean)
    .sort((x, y) => {
      const rank = { not_started: 0, in_progress: 1, needs_work: 2, met: 3 };
      return rank[x.state] - rank[y.state]
        || new Date(x.assignment.dueAt || '2999-01-01') - new Date(y.assignment.dueAt || '2999-01-01');
    });

  /* Achievements, earned and in-progress. */
  const earnedIds = d.achievements.filter((a) => a.studentId === studentId);
  const facts = achievementFacts(catalog, attempts, responses, mastery, progress);
  const achievements = catalog.achievements.map((def) => {
    const got = earnedIds.find((e) => e.achievementId === def.id);
    return {
      ...def,
      earned: !!got,
      earnedAt: got?.earnedAt || null,
      progress: got ? null : achievementProgress(def, facts),
    };
  });

  const completions = Object.values(progress).filter((p) => p.completions > 0).length;
  const totalSeconds = Object.values(progress).reduce((a, p) => a + p.seconds, 0);
  const questionsAnswered = responses.length;
  const questionsCorrect = responses.filter((r) => r.isCorrect).length;
  const masteredSkills = Object.values(mastery).filter((m) => m.level === 'mastered').length;

  return {
    profile,
    rank: rankForXp(profile.xpTotal),
    nextRank: nextRank(profile.xpTotal),
    continueCard,
    assignments: assignmentCards,
    recent,
    recommendations,
    progress,
    mastery,
    strands,
    achievements,
    classes: activeMemberships(studentId).map((m) => {
      const c = d.classes[m.classId];
      if (!c) return null;
      return {
        id: c.id, name: c.name, archivedAt: c.archivedAt,
        teacherName: d.profiles[c.teacherId]?.displayName || 'Teacher',
        joinedAt: m.joinedAt,
      };
    }).filter(Boolean),
    activity: activitySeries([studentId], 14),
    totals: {
      lessonsCompleted: completions,
      lessonsStarted: Object.keys(progress).length,
      seconds: totalSeconds,
      questionsAnswered,
      questionsCorrect,
      accuracy: questionsAnswered ? Math.round((questionsCorrect / questionsAnswered) * 100) : null,
      skillsMastered: masteredSkills,
      skillsTouched: Object.values(mastery).filter((m) => m.evidence > 0).length,
      strandsTouched: Object.values(strands).filter((s) => s.evidence > 0).length,
      catalogSize: catalog.lessons.length,
    },
  };
}

function achievementFacts(catalog, attempts, responses, mastery, progress) {
  const completedByFormat = {};
  const completedByStrand = {};
  const strandsTouched = new Set();
  const strandsDeveloping = new Set();
  let improvement = 0;
  let lessonsCompleted = 0;
  for (const [lessonId, p] of Object.entries(progress)) {
    const lesson = catalog.lesson(lessonId);
    if (!lesson) continue;
    if (p.completions > 0) {
      lessonsCompleted += 1;
      completedByFormat[lesson.format] = (completedByFormat[lesson.format] || 0) + 1;
      if (lesson.strandId) {
        completedByStrand[lesson.strandId] = (completedByStrand[lesson.strandId] || 0) + 1;
        strandsTouched.add(lesson.strandId);
      }
    }
    if (p.growth != null && p.growth > improvement) improvement = p.growth;
  }
  for (const [skillId, m] of Object.entries(mastery)) {
    const s = catalog.skill(skillId);
    if (s && ['developing', 'proficient', 'mastered'].includes(m.level)) strandsDeveloping.add(s.strandId);
  }
  return {
    lessonsCompleted,
    questionsCorrect: responses.filter((r) => r.isCorrect).length,
    skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
    skillsProficient: Object.values(mastery).filter((m) => ['proficient', 'mastered'].includes(m.level)).length,
    strandsTouched: strandsTouched.size,
    strandsDeveloping: strandsDeveloping.size,
    strandMastered: 0,
    improvement,
    completedByFormat,
    completedByStrand,
  };
}

/** Skill-by-skill detail for the student's progress page. */
async function getSkillDetail(studentIdArg = null) {
  const me = requireUser();
  const studentId = studentIdArg || me.id;
  assertCanReadStudent(studentId);
  const catalog = await loadCatalog();
  const mastery = skillMasteryMap(studentId);
  return catalog.strands.map((strand) => ({
    strand,
    rollup: rollUp((catalog.skillsByStrand.get(strand.id) || []).map((s) => mastery[s.id]).filter(Boolean)),
    skills: (catalog.skillsByStrand.get(strand.id) || []).map((s) => ({
      skill: s,
      mastery: mastery[s.id] || null,
      lessonCount: (catalog.lessonsBySkill.get(s.id) || []).length,
    })),
  }));
}

/** The activity timeline, newest first. */
function getTimeline(studentIdArg = null, limit = 40) {
  const me = requireUser();
  const studentId = studentIdArg || me.id;
  assertCanReadStudent(studentId);
  return db().events
    .filter((e) => e.studentId === studentId)
    .slice(-limit * 2)
    .reverse()
    .slice(0, limit);
}

/* ============================================================== TEACHER === */

/** Cards for the teacher home page. */
async function getTeacherOverview() {
  const me = requireUser();
  if (!['teacher', 'admin'].includes(me.role)) fail('forbidden', 'Teacher access required.');
  const d = db();
  const catalog = await loadCatalog();
  const classes = Object.values(d.classes)
    .filter((c) => (me.role === 'admin' || c.teacherId === me.id) && !c.archivedAt);

  const cards = [];
  for (const cls of classes) {
    const roster = d.classMembers.filter((m) => m.classId === cls.id && !m.removedAt);
    const studentIds = roster.map((m) => m.studentId);
    let masterySum = 0;
    let masteryCount = 0;
    let completed = 0;
    let activeThisWeek = 0;
    const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
    for (const sid of studentIds) {
      const mastery = skillMasteryMap(sid);
      const strands = strandRollup(catalog, mastery);
      const pcts = Object.values(strands).map((s) => s.pct).filter((p) => p != null);
      if (pcts.length) { masterySum += pcts.reduce((a, b) => a + b, 0) / pcts.length; masteryCount += 1; }
      const attempts = attemptsFor(sid);
      completed += attempts.filter((a) => a.completedAt).length;
      if (attempts.some((a) => new Date(a.updatedAt).getTime() > weekAgo)) activeThisWeek += 1;
    }
    cards.push({
      ...cls,
      studentCount: studentIds.length,
      avgMastery: masteryCount ? Math.round(masterySum / masteryCount) : null,
      lessonsCompleted: completed,
      activeThisWeek,
      assignmentCount: Object.values(d.assignments).filter((a) => a.classId === cls.id && !a.archivedAt).length,
    });
  }

  const allStudentIds = classes.flatMap((c) =>
    d.classMembers.filter((m) => m.classId === c.id && !m.removedAt).map((m) => m.studentId));

  return {
    profile: publicProfile(d.profiles[me.id]),
    classes: cards.sort((a, b) => a.name.localeCompare(b.name)),
    activity: activitySeries([...new Set(allStudentIds)], 14),
    recentEvents: d.events
      .filter((e) => allStudentIds.includes(e.studentId))
      .slice(-40).reverse().slice(0, 20)
      .map((e) => ({ ...e, studentName: d.profiles[e.studentId]?.displayName || 'Student' })),
  };
}

/**
 * The class dashboard payload: totals, the student-by-skill matrix, the
 * assignment list with its stats, and the generated insights.
 */
async function getClassOverview(classId) {
  const cls = assertCanReadClass(classId);
  const d = db();
  const catalog = await loadCatalog();
  const roster = d.classMembers
    .filter((m) => m.classId === classId && !m.removedAt)
    .map((m) => ({ ...publicProfile(d.profiles[m.studentId]), joinedAt: m.joinedAt }))
    .filter((p) => p.id)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const skillMatrix = {};
  const strandMatrix = {};
  const activityByStudent = {};
  const perStudent = [];

  for (const s of roster) {
    const attempts = attemptsFor(s.id);
    const responses = responsesFor(s.id);
    const progress = lessonProgressMap(s.id);
    const mastery = skillMasteryMap(s.id, responses);
    const strands = strandRollup(catalog, mastery);
    skillMatrix[s.id] = mastery;
    strandMatrix[s.id] = strands;

    const lastActiveAt = attempts.reduce((a, x) => (new Date(x.updatedAt) > new Date(a || 0) ? x.updatedAt : a), null);
    const pcts = Object.values(strands).map((x) => x.pct).filter((p) => p != null);
    const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    const growths = Object.values(mastery).map((m) => m.growth).filter((g) => g != null);
    const growth = growths.length ? Math.round(growths.reduce((a, b) => a + b, 0) / growths.length) : null;

    activityByStudent[s.id] = { lastActiveAt, growth };
    perStudent.push({
      student: s,
      overall,
      growth,
      lastActiveAt,
      activeThisWeek: !!lastActiveAt && new Date(lastActiveAt).getTime() > weekAgo,
      lessonsCompleted: Object.values(progress).filter((p) => p.completions > 0).length,
      seconds: Object.values(progress).reduce((a, p) => a + p.seconds, 0),
      questionsAnswered: responses.length,
      accuracy: responses.length ? Math.round((responses.filter((r) => r.isCorrect).length / responses.length) * 100) : null,
      skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
      strands,
    });
  }

  /* Class-level strand averages. */
  const classStrands = catalog.strands.map((strand) => {
    const pcts = perStudent.map((p) => p.strands[strand.id]?.pct).filter((x) => x != null);
    const levels = perStudent.map((p) => p.strands[strand.id]?.level || 'not_started');
    const counts = levels.reduce((a, l) => ({ ...a, [l]: (a[l] || 0) + 1 }), {});
    return {
      strand,
      pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
      counts,
      n: pcts.length,
    };
  });

  /* Assignments with their stats. */
  const assignments = Object.values(d.assignments)
    .filter((a) => a.classId === classId && !a.archivedAt)
    .map((a) => withAssignmentStats(a, roster, catalog))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const { insights, weakSkills } = classInsights({
    catalog, roster, skillMatrix, assignments, activityByStudent,
  });

  const overallPcts = perStudent.map((p) => p.overall).filter((x) => x != null);

  return {
    class: { ...cls, studentCount: roster.length },
    roster,
    perStudent,
    skillMatrix,
    strandMatrix,
    classStrands,
    assignments,
    insights,
    weakSkills,
    goals: Object.values(d.classGoals).filter((g) => g.classId === classId).map((g) => withGoalProgress(g, roster)),
    activity: activitySeries(roster.map((s) => s.id), 14),
    totals: {
      students: roster.length,
      avgMastery: overallPcts.length ? Math.round(overallPcts.reduce((a, b) => a + b, 0) / overallPcts.length) : null,
      activeThisWeek: perStudent.filter((p) => p.activeThisWeek).length,
      lessonsCompleted: perStudent.reduce((a, p) => a + p.lessonsCompleted, 0),
      questionsAnswered: perStudent.reduce((a, p) => a + p.questionsAnswered, 0),
      avgAccuracy: (() => {
        const xs = perStudent.map((p) => p.accuracy).filter((x) => x != null);
        return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
      })(),
      skillsMastered: perStudent.reduce((a, p) => a + p.skillsMastered, 0),
      needsAttention: perStudent.filter((p) => p.overall != null && p.overall < 60).length
        + perStudent.filter((p) => p.overall == null).length,
    },
  };
}

/** One student, as their teacher sees them. */
async function getStudentDetail(classId, studentId) {
  assertOwnsClass(classId);
  const d = db();
  if (!d.classMembers.some((m) => m.classId === classId && m.studentId === studentId && !m.removedAt)) {
    fail('not_found', 'That student is not in this class.');
  }
  const catalog = await loadCatalog();
  const attempts = attemptsFor(studentId);
  const responses = responsesFor(studentId);
  const progress = lessonProgressMap(studentId);
  const mastery = skillMasteryMap(studentId, responses);
  const strands = strandRollup(catalog, mastery);

  /* "Areas to review" — weakest skills with enough evidence to be fair. */
  const review = Object.entries(mastery)
    .filter(([, m]) => m.evidence >= 3 && m.pct < 70)
    .sort((a, b) => a[1].pct - b[1].pct)
    .slice(0, 5)
    .map(([skillId, m]) => ({
      skill: catalog.skill(skillId), mastery: m,
      suggestions: (catalog.lessonsBySkill.get(skillId) || [])
        .filter((l) => l.difficulty <= 2)
        .slice(0, 2)
        .map((l) => ({ id: l.id, title: l.title, estMinutes: l.estMinutes, format: l.format })),
    }))
    .filter((r) => r.skill);

  const strengths = Object.entries(mastery)
    .filter(([, m]) => m.evidence >= 3 && m.pct >= 80)
    .sort((a, b) => b[1].pct - a[1].pct)
    .slice(0, 5)
    .map(([skillId, m]) => ({ skill: catalog.skill(skillId), mastery: m }))
    .filter((r) => r.skill);

  const timeline = [...attempts]
    .filter((a) => a.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 25)
    .map((a) => ({
      lesson: catalog.lesson(a.lessonId),
      scorePct: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null,
      at: a.completedAt,
      seconds: a.secondsSpent,
      assignmentId: a.assignmentId,
    }))
    .filter((t) => t.lesson);

  const growths = Object.values(mastery).map((m) => m.growth).filter((g) => g != null);
  const overallPcts = Object.values(strands).map((s) => s.pct).filter((p) => p != null);

  return {
    student: publicProfile(d.profiles[studentId]),
    overall: overallPcts.length ? Math.round(overallPcts.reduce((a, b) => a + b, 0) / overallPcts.length) : null,
    growth: growths.length ? Math.round(growths.reduce((a, b) => a + b, 0) / growths.length) : null,
    strands, mastery, progress,
    review, strengths, timeline,
    activity: activitySeries([studentId], 28),
    totals: {
      lessonsCompleted: Object.values(progress).filter((p) => p.completions > 0).length,
      seconds: Object.values(progress).reduce((a, p) => a + p.seconds, 0),
      questionsAnswered: responses.length,
      accuracy: responses.length ? Math.round((responses.filter((r) => r.isCorrect).length / responses.length) * 100) : null,
      skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
      attempts: attempts.length,
      lastActiveAt: attempts.reduce((a, x) => (new Date(x.updatedAt) > new Date(a || 0) ? x.updatedAt : a), null),
    },
    assignments: Object.values(d.assignments)
      .filter((a) => a.classId === classId && !a.archivedAt)
      .map((a) => {
        const p = progress[a.lessonId];
        const threshold = a.minMastery ?? 80;
        return {
          assignment: a, lesson: catalog.lesson(a.lessonId), progress: p || null,
          state: (p?.completions ?? 0) > 0 && (p?.bestScore ?? 0) >= threshold ? 'met'
            : (p?.completions ?? 0) > 0 ? 'needs_work'
            : p?.status === 'in_progress' ? 'in_progress' : 'not_started',
        };
      }),
  };
}

/* ---------------------------------------------------------- assignments --- */

function withAssignmentStats(assignment, roster, catalog) {
  const lesson = catalog.lesson(assignment.lessonId);
  const threshold = assignment.minMastery ?? 80;
  const rows = roster.map((s) => {
    const p = computeLessonProgress(attemptsFor(s.id, assignment.lessonId));
    const met = p.completions > 0 && (p.bestScore ?? 0) >= threshold;
    return {
      student: s, progress: p, met,
      state: met ? 'met' : p.completions > 0 ? 'needs_work' : p.status === 'in_progress' ? 'in_progress' : 'not_started',
    };
  });
  const scores = rows.map((r) => r.progress.bestScore).filter((x) => x != null);
  return {
    ...assignment,
    lessonTitle: lesson?.title || assignment.lessonId,
    lesson,
    rows,
    stats: {
      assigned: rows.length,
      completed: rows.filter((r) => r.progress.completions > 0).length,
      mastered: rows.filter((r) => r.met).length,
      notStarted: rows.filter((r) => r.state === 'not_started').length,
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      needsAttention: rows
        .filter((r) => r.state !== 'met')
        .sort((a, b) => (a.progress.bestScore ?? -1) - (b.progress.bestScore ?? -1))
        .slice(0, 6)
        .map((r) => ({
          id: r.student.id, name: r.student.displayName,
          score: r.progress.bestScore, state: r.state,
        })),
    },
  };
}

function createAssignment({ classId, lessonId, dueAt = null, minMastery = 80, required = true, note = null, title = null }) {
  const cls = assertOwnsClass(classId);
  const me = requireUser();
  const id = randomId('as');
  return commit((d) => {
    d.assignments[id] = {
      id, classId, lessonId, teacherId: me.id, title, note,
      dueAt, minMastery, required, createdAt: now(), archivedAt: null,
    };
    for (const m of d.classMembers.filter((x) => x.classId === classId && !x.removedAt)) {
      d.events.push({
        id: randomId('e'), studentId: m.studentId, classId, type: 'assignment_created',
        lessonId, payload: { assignmentId: id, className: cls.name }, createdAt: now(),
      });
    }
    return { ...d.assignments[id] };
  });
}

async function listAssignments(classId) {
  assertCanReadClass(classId);
  const catalog = await loadCatalog();
  const roster = listRosterInternal(classId);
  return Object.values(db().assignments)
    .filter((a) => a.classId === classId && !a.archivedAt)
    .map((a) => withAssignmentStats(a, roster, catalog))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getAssignment(assignmentId) {
  const a = db().assignments[assignmentId];
  if (!a) fail('not_found', 'That assignment no longer exists.');
  assertCanReadClass(a.classId);
  const catalog = await loadCatalog();
  return withAssignmentStats(a, listRosterInternal(a.classId), catalog);
}

function updateAssignment(assignmentId, patch) {
  const a = db().assignments[assignmentId];
  if (!a) fail('not_found', 'That assignment no longer exists.');
  assertOwnsClass(a.classId);
  return commit((d) => {
    for (const k of ['dueAt', 'minMastery', 'required', 'note', 'title']) if (k in patch) d.assignments[assignmentId][k] = patch[k];
    return { ...d.assignments[assignmentId] };
  });
}

function archiveAssignment(assignmentId) {
  const a = db().assignments[assignmentId];
  if (!a) fail('not_found', 'That assignment no longer exists.');
  assertOwnsClass(a.classId);
  commit((d) => { d.assignments[assignmentId].archivedAt = now(); });
  return true;
}

function listRosterInternal(classId) {
  const d = db();
  return d.classMembers
    .filter((m) => m.classId === classId && !m.removedAt)
    .map((m) => publicProfile(d.profiles[m.studentId]))
    .filter(Boolean)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/* --------------------------------------------------------- class goals ---- */

function withGoalProgress(goal, roster) {
  const ids = roster.map((s) => s.id);
  let current = 0;
  const start = goal.startsAt ? new Date(goal.startsAt).getTime() : 0;
  const end = goal.endsAt ? new Date(goal.endsAt).getTime() : Infinity;
  if (goal.metric === 'lessons_completed') {
    current = Object.values(db().attempts).filter((a) => ids.includes(a.studentId) && a.completedAt
      && new Date(a.completedAt).getTime() >= start && new Date(a.completedAt).getTime() <= end).length;
  } else if (goal.metric === 'questions_correct') {
    current = db().responses.filter((r) => ids.includes(r.studentId) && r.isCorrect
      && new Date(r.answeredAt).getTime() >= start && new Date(r.answeredAt).getTime() <= end).length;
  } else if (goal.metric === 'skills_mastered') {
    current = ids.reduce((a, id) => a + Object.values(skillMasteryMap(id)).filter((m) => m.level === 'mastered').length, 0);
  }
  return { ...goal, current, pct: Math.min(100, Math.round((current / goal.target) * 100)) };
}

function createClassGoal({ classId, title, metric, target, endsAt = null }) {
  assertOwnsClass(classId);
  const id = randomId('g');
  return commit((d) => {
    d.classGoals[id] = { id, classId, title, metric, target, startsAt: now(), endsAt, completedAt: null };
    return { ...d.classGoals[id] };
  });
}

function deleteClassGoal(goalId) {
  const g = db().classGoals[goalId];
  if (!g) return true;
  assertOwnsClass(g.classId);
  commit((d) => { delete d.classGoals[goalId]; });
  return true;
}

/* -------------------------------------------------------------- exports --- */

/** CSV export. Uses the shared builder so both backends emit identical files. */
async function exportClassCsv(classId, kind = 'skills') {
  const [data, catalog, { exportRows }] = await Promise.all([
    getClassOverview(classId), loadCatalog(), import('./csv.js'),
  ]);
  return exportRows(data, catalog, kind);
}

export const analyticsApi = {
  getStudentOverview, getSkillDetail, getTimeline,
  getTeacherOverview, getClassOverview, getStudentDetail,
  createAssignment, listAssignments, getAssignment, updateAssignment, archiveAssignment,
  createClassGoal, deleteClassGoal,
  exportClassCsv,
  lessonProgressMap, skillMasteryMap, strandRollup,
};
