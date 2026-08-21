/* ============================================================================
   Dashboard aggregation, Postgres backend.

   Row fetching differs from the local backend; the maths does not. Both call
   the same pure functions in mastery.js and the same explainable rankers in
   recommend.js, which is what guarantees the student's number and the
   teacher's number for that student agree.

   At classroom scale (tens of students) fetching rows and folding them here is
   the right trade: one round trip, no view maintenance, and the rules stay in
   one readable place. If a district-sized deployment ever needs it, each
   function below has an obvious Postgres view equivalent and the signature
   would not change.
   ========================================================================= */

import { computeMastery, computeLessonProgress, rollUp, rankForXp, nextRank } from '../mastery.js';
import { loadCatalog } from '../../content/index.js';
import { recommendFor, classInsights } from '../recommend.js';

const DAY = 86_400_000;
const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function buildAnalytics({ sb, unwrap, camel, requireMe, fail }) {
  const groupBy = (rows, key) => rows.reduce((acc, r) => { (acc[r[key]] ||= []).push(r); return acc; }, {});

  const lessonProgressFrom = (attempts) =>
    Object.fromEntries(Object.entries(groupBy(attempts, 'lessonId'))
      .map(([id, list]) => [id, computeLessonProgress(list)]));

  const skillMasteryFrom = (responses) =>
    Object.fromEntries(Object.entries(groupBy(responses.filter((r) => r.skillId), 'skillId'))
      .map(([id, list]) => [id, computeMastery(list)]));

  const strandRollupFrom = (catalog, mastery) =>
    Object.fromEntries(catalog.strands.map((s) => {
      const skills = catalog.skillsByStrand.get(s.id) || [];
      const records = skills.map((k) => mastery[k.id]).filter(Boolean);
      return [s.id, { ...rollUp(records), totalSkills: skills.length, touchedSkills: records.filter((r) => r.evidence > 0).length }];
    }));

  const series = (attempts, days) => {
    const buckets = [];
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(base.getTime() - i * DAY);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        short: DAY_SHORT[d.getDay()], value: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const a of attempts) {
      if (!a.completedAt) continue;
      const i = idx.get(String(a.completedAt).slice(0, 10));
      if (i != null) buckets[i].value += 1;
    }
    return buckets;
  };

  const fetchAttempts = async (studentIds) =>
    unwrap(await sb.from('attempts').select('*').in('student_id', studentIds)).map(camel);
  const fetchResponses = async (studentIds) =>
    unwrap(await sb.from('responses').select('*').in('student_id', studentIds)).map(camel);

  async function getStudentOverview(studentIdArg = null) {
    const u = await requireMe();
    const studentId = studentIdArg || u.id;
    const catalog = await loadCatalog();

    const [attempts, responses, memberships, assignmentRows, earned] = await Promise.all([
      fetchAttempts([studentId]),
      fetchResponses([studentId]),
      unwrap(await sb.from('class_members')
        .select('joined_at, class_id, classes(id,name,archived_at,teacher_id,profiles!classes_teacher_id_fkey(display_name))')
        .eq('student_id', studentId).is('removed_at', null)),
      unwrap(await sb.from('assignments').select('*').is('archived_at', null)),
      unwrap(await sb.from('student_achievements').select('*').eq('student_id', studentId)),
    ]);

    const classIds = memberships.map((m) => m.class_id);
    const assignments = assignmentRows.map(camel).filter((a) => classIds.includes(a.classId));
    const progress = lessonProgressFrom(attempts);
    const mastery = skillMasteryFrom(responses);
    const strands = strandRollupFrom(catalog, mastery);

    const open = attempts.filter((a) => !a.completedAt && !a.abandonedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const continueCard = open && catalog.lesson(open.lessonId) ? {
      lesson: catalog.lesson(open.lessonId), attemptId: open.id,
      questionIndex: open.state?.questionIndex ?? open.questionsAnswered,
      totalQuestions: open.state?.totalQuestions ?? null,
      activityIndex: open.state?.activityIndex ?? 0,
      updatedAt: open.updatedAt,
      label: open.state?.totalQuestions
        ? `Question ${Math.min(open.state.totalQuestions, (open.state.questionIndex ?? 0) + 1)} of ${open.state.totalQuestions}`
        : 'Picked up where you left off',
    } : null;

    const questionsCorrect = responses.filter((r) => r.isCorrect).length;
    const profile = studentId === u.id ? u : camel(unwrap(await sb.from('profiles').select('*').eq('id', studentId).limit(1))[0]);

    return {
      profile,
      rank: rankForXp(profile.xpTotal || 0),
      nextRank: nextRank(profile.xpTotal || 0),
      continueCard,
      progress, mastery, strands,
      assignments: assignments.map((a) => {
        const lesson = catalog.lesson(a.lessonId);
        if (!lesson) return null;
        const p = progress[a.lessonId];
        const threshold = a.minMastery ?? 80;
        const met = (p?.bestScore ?? 0) >= threshold && (p?.completions ?? 0) > 0;
        return {
          assignment: a, lesson, progress: p || null, threshold,
          state: met ? 'met' : p?.completions ? 'needs_work' : p?.status === 'in_progress' ? 'in_progress' : 'not_started',
          overdue: a.dueAt ? new Date(a.dueAt) < new Date() && !met : false,
        };
      }).filter(Boolean),
      recent: [...attempts].filter((a) => a.completedAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8)
        .map((a) => ({
          lesson: catalog.lesson(a.lessonId),
          scorePct: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null,
          at: a.updatedAt, progress: progress[a.lessonId],
        })).filter((r) => r.lesson),
      recommendations: recommendFor({
        catalog, lessonProgress: progress, skillMastery: mastery, assignments,
        recentSkillIds: [...new Set(responses.slice(-40).map((r) => r.skillId).filter(Boolean))],
      }),
      achievements: catalog.achievements.map((def) => {
        const got = earned.find((e) => e.achievement_id === def.id);
        return { ...def, earned: !!got, earnedAt: got?.earned_at || null, progress: null };
      }),
      classes: memberships.map((m) => ({
        id: m.classes.id, name: m.classes.name, archivedAt: m.classes.archived_at,
        teacherName: m.classes.profiles?.display_name || 'Teacher', joinedAt: m.joined_at,
      })),
      activity: series(attempts, 14),
      totals: {
        lessonsCompleted: Object.values(progress).filter((p) => p.completions > 0).length,
        lessonsStarted: Object.keys(progress).length,
        seconds: Object.values(progress).reduce((a, p) => a + p.seconds, 0),
        questionsAnswered: responses.length,
        questionsCorrect,
        accuracy: responses.length ? Math.round((questionsCorrect / responses.length) * 100) : null,
        skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
        skillsTouched: Object.values(mastery).filter((m) => m.evidence > 0).length,
        strandsTouched: Object.values(strands).filter((s) => s.evidence > 0).length,
        catalogSize: catalog.lessons.length,
      },
    };
  }

  async function getSkillDetail(studentIdArg = null) {
    const u = await requireMe();
    const studentId = studentIdArg || u.id;
    const catalog = await loadCatalog();
    const mastery = skillMasteryFrom(await fetchResponses([studentId]));
    return catalog.strands.map((strand) => ({
      strand,
      rollup: (() => {
        const teachable = (catalog.skillsByStrand.get(strand.id) || [])
          .filter((k) => (catalog.lessonsBySkill.get(k.id) || []).length > 0);
        return rollUp(teachable.map((k) => mastery[k.id]).filter(Boolean), teachable.length);
      })(),
      skills: (catalog.skillsByStrand.get(strand.id) || []).map((s) => ({
        skill: s, mastery: mastery[s.id] || null,
        lessonCount: (catalog.lessonsBySkill.get(s.id) || []).length,
      })),
    }));
  }

  async function getTimeline(studentIdArg = null, limit = 40) {
    const u = await requireMe();
    return unwrap(await sb.from('learning_events').select('*')
      .eq('student_id', studentIdArg || u.id)
      .order('created_at', { ascending: false }).limit(limit)).map(camel);
  }

  async function getTeacherOverview() {
    const u = await requireMe();
    const catalog = await loadCatalog();
    const classes = unwrap(await sb.from('classes').select('*').eq('teacher_id', u.id).is('archived_at', null)).map(camel);
    const members = classes.length
      ? unwrap(await sb.from('class_members').select('class_id,student_id').in('class_id', classes.map((c) => c.id)).is('removed_at', null))
      : [];
    const studentIds = [...new Set(members.map((m) => m.student_id))];
    const attempts = studentIds.length ? await fetchAttempts(studentIds) : [];
    const responses = studentIds.length ? await fetchResponses(studentIds) : [];
    const byStudent = groupBy(attempts, 'studentId');
    const respByStudent = groupBy(responses, 'studentId');
    const weekAgo = Date.now() - 7 * DAY;

    const cards = classes.map((c) => {
      const ids = members.filter((m) => m.class_id === c.id).map((m) => m.student_id);
      const pcts = ids.map((id) => {
        const strands = strandRollupFrom(catalog, skillMasteryFrom(respByStudent[id] || []));
        const xs = Object.values(strands).map((s) => s.pct).filter((p) => p != null);
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
      }).filter((x) => x != null);
      return {
        ...c,
        studentCount: ids.length,
        avgMastery: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
        lessonsCompleted: ids.reduce((a, id) => a + (byStudent[id] || []).filter((x) => x.completedAt).length, 0),
        activeThisWeek: ids.filter((id) => (byStudent[id] || []).some((x) => new Date(x.updatedAt).getTime() > weekAgo)).length,
      };
    });

    const events = studentIds.length
      ? unwrap(await sb.from('learning_events')
          .select('*, profiles(display_name)')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false }).limit(20))
      : [];

    return {
      profile: u,
      classes: cards.sort((a, b) => a.name.localeCompare(b.name)),
      activity: series(attempts, 14),
      recentEvents: events.map((e) => ({ ...camel(e), studentName: e.profiles?.display_name || 'Student' })),
    };
  }

  async function getClassOverview(classId) {
    const catalog = await loadCatalog();
    const cls = camel(unwrap(await sb.from('classes').select('*').eq('id', classId).limit(1))[0] || fail('not_found', 'Class not found.'));
    const memberRows = unwrap(await sb.from('class_members')
      .select('joined_at, profiles(id,display_name,avatar_key,username,xp_total,last_seen_at)')
      .eq('class_id', classId).is('removed_at', null));
    const roster = memberRows.map((r) => ({ ...camel(r.profiles), joinedAt: r.joined_at }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const ids = roster.map((s) => s.id);

    const [attempts, responses, assignmentRows, goalRows] = await Promise.all([
      ids.length ? fetchAttempts(ids) : [],
      ids.length ? fetchResponses(ids) : [],
      unwrap(await sb.from('assignments').select('*').eq('class_id', classId).is('archived_at', null)),
      unwrap(await sb.from('class_goals').select('*').eq('class_id', classId)),
    ]);

    const attByStudent = groupBy(attempts, 'studentId');
    const respByStudent = groupBy(responses, 'studentId');
    const weekAgo = Date.now() - 7 * DAY;
    const skillMatrix = {};
    const strandMatrix = {};
    const activityByStudent = {};

    const perStudent = roster.map((s) => {
      const at = attByStudent[s.id] || [];
      const rs = respByStudent[s.id] || [];
      const progress = lessonProgressFrom(at);
      const mastery = skillMasteryFrom(rs);
      const strands = strandRollupFrom(catalog, mastery);
      skillMatrix[s.id] = mastery;
      strandMatrix[s.id] = strands;
      const lastActiveAt = at.reduce((a, x) => (new Date(x.updatedAt) > new Date(a || 0) ? x.updatedAt : a), null);
      const pcts = Object.values(strands).map((x) => x.pct).filter((p) => p != null);
      const growths = Object.values(mastery).map((m) => m.growth).filter((g) => g != null);
      const growth = growths.length ? Math.round(growths.reduce((a, b) => a + b, 0) / growths.length) : null;
      activityByStudent[s.id] = { lastActiveAt, growth };
      return {
        student: s,
        overall: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
        growth, lastActiveAt,
        activeThisWeek: !!lastActiveAt && new Date(lastActiveAt).getTime() > weekAgo,
        lessonsCompleted: Object.values(progress).filter((p) => p.completions > 0).length,
        seconds: Object.values(progress).reduce((a, p) => a + p.seconds, 0),
        questionsAnswered: rs.length,
        accuracy: rs.length ? Math.round((rs.filter((r) => r.isCorrect).length / rs.length) * 100) : null,
        skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
        strands,
      };
    });

    const assignments = assignmentRows.map(camel).map((a) => statsFor(a, roster, attByStudent, catalog));
    const { insights, weakSkills } = classInsights({ catalog, roster, skillMatrix, assignments, activityByStudent });
    const overallPcts = perStudent.map((p) => p.overall).filter((x) => x != null);

    return {
      class: { ...cls, studentCount: roster.length },
      roster, perStudent, skillMatrix, strandMatrix,
      classStrands: catalog.strands.map((strand) => {
        const pcts = perStudent.map((p) => p.strands[strand.id]?.pct).filter((x) => x != null);
        const levels = perStudent.map((p) => p.strands[strand.id]?.level || 'not_started');
        return {
          strand,
          pct: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
          counts: levels.reduce((a, l) => ({ ...a, [l]: (a[l] || 0) + 1 }), {}),
          n: pcts.length,
        };
      }),
      assignments, insights, weakSkills,
      goals: goalRows.map(camel).map((g) => ({ ...g, current: 0, pct: 0 })),
      activity: series(attempts, 14),
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
        needsAttention: perStudent.filter((p) => p.overall == null || p.overall < 60).length,
      },
    };
  }

  function statsFor(assignment, roster, attByStudent, catalog) {
    const lesson = catalog.lesson(assignment.lessonId);
    const threshold = assignment.minMastery ?? 80;
    const rows = roster.map((s) => {
      const progress = computeLessonProgress((attByStudent[s.id] || []).filter((a) => a.lessonId === assignment.lessonId));
      const met = progress.completions > 0 && (progress.bestScore ?? 0) >= threshold;
      return {
        student: s, progress, met,
        state: met ? 'met' : progress.completions > 0 ? 'needs_work' : progress.status === 'in_progress' ? 'in_progress' : 'not_started',
      };
    });
    const scores = rows.map((r) => r.progress.bestScore).filter((x) => x != null);
    return {
      ...assignment, lesson, lessonTitle: lesson?.title || assignment.lessonId, rows,
      stats: {
        assigned: rows.length,
        completed: rows.filter((r) => r.progress.completions > 0).length,
        mastered: rows.filter((r) => r.met).length,
        notStarted: rows.filter((r) => r.state === 'not_started').length,
        average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        needsAttention: rows.filter((r) => !r.met)
          .sort((a, b) => (a.progress.bestScore ?? -1) - (b.progress.bestScore ?? -1)).slice(0, 6)
          .map((r) => ({ id: r.student.id, name: r.student.displayName, score: r.progress.bestScore, state: r.state })),
      },
    };
  }

  async function getStudentDetail(classId, studentId) {
    const catalog = await loadCatalog();
    const [attempts, responses, student] = await Promise.all([
      fetchAttempts([studentId]),
      fetchResponses([studentId]),
      unwrap(await sb.from('profiles').select('*').eq('id', studentId).limit(1)).then((r) => camel(r[0])),
    ]);
    const progress = lessonProgressFrom(attempts);
    const mastery = skillMasteryFrom(responses);
    const strands = strandRollupFrom(catalog, mastery);
    const overallPcts = Object.values(strands).map((s) => s.pct).filter((p) => p != null);
    const growths = Object.values(mastery).map((m) => m.growth).filter((g) => g != null);

    return {
      student,
      overall: overallPcts.length ? Math.round(overallPcts.reduce((a, b) => a + b, 0) / overallPcts.length) : null,
      growth: growths.length ? Math.round(growths.reduce((a, b) => a + b, 0) / growths.length) : null,
      strands, mastery, progress,
      review: Object.entries(mastery).filter(([, m]) => m.evidence >= 3 && m.pct < 70)
        .sort((a, b) => a[1].pct - b[1].pct).slice(0, 5)
        .map(([skillId, m]) => ({
          skill: catalog.skill(skillId), mastery: m,
          suggestions: (catalog.lessonsBySkill.get(skillId) || []).filter((l) => l.difficulty <= 2).slice(0, 2)
            .map((l) => ({ id: l.id, title: l.title, estMinutes: l.estMinutes, format: l.format })),
        })).filter((r) => r.skill),
      strengths: Object.entries(mastery).filter(([, m]) => m.evidence >= 3 && m.pct >= 80)
        .sort((a, b) => b[1].pct - a[1].pct).slice(0, 5)
        .map(([skillId, m]) => ({ skill: catalog.skill(skillId), mastery: m })).filter((r) => r.skill),
      timeline: [...attempts].filter((a) => a.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, 25)
        .map((a) => ({
          lesson: catalog.lesson(a.lessonId),
          scorePct: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : null,
          at: a.completedAt, seconds: a.secondsSpent, assignmentId: a.assignmentId,
        })).filter((t) => t.lesson),
      activity: series(attempts, 28),
      assignments: [],
      totals: {
        lessonsCompleted: Object.values(progress).filter((p) => p.completions > 0).length,
        seconds: Object.values(progress).reduce((a, p) => a + p.seconds, 0),
        questionsAnswered: responses.length,
        accuracy: responses.length ? Math.round((responses.filter((r) => r.isCorrect).length / responses.length) * 100) : null,
        skillsMastered: Object.values(mastery).filter((m) => m.level === 'mastered').length,
        attempts: attempts.length,
        lastActiveAt: attempts.reduce((a, x) => (new Date(x.updatedAt) > new Date(a || 0) ? x.updatedAt : a), null),
      },
    };
  }

  const createAssignment = async ({ classId, lessonId, dueAt = null, minMastery = 80, required = true, note = null, title = null }) => {
    const u = await requireMe();
    return camel(unwrap(await sb.from('assignments').insert({
      class_id: classId, lesson_id: lessonId, teacher_id: u.id,
      due_at: dueAt, min_mastery: minMastery, required, note, title,
    }).select())[0]);
  };

  const listAssignments = async (classId) => (await getClassOverview(classId)).assignments;

  const getAssignment = async (assignmentId) => {
    const a = camel(unwrap(await sb.from('assignments').select('*').eq('id', assignmentId).limit(1))[0]
      || fail('not_found', 'Assignment not found.'));
    const overview = await getClassOverview(a.classId);
    return overview.assignments.find((x) => x.id === assignmentId) || a;
  };

  const updateAssignment = async (assignmentId, patch) => camel(unwrap(await sb.from('assignments').update({
    ...(patch.dueAt !== undefined ? { due_at: patch.dueAt } : null),
    ...(patch.minMastery !== undefined ? { min_mastery: patch.minMastery } : null),
    ...(patch.required !== undefined ? { required: patch.required } : null),
    ...(patch.note !== undefined ? { note: patch.note } : null),
    ...(patch.title !== undefined ? { title: patch.title } : null),
  }).eq('id', assignmentId).select())[0]);

  const archiveAssignment = async (assignmentId) => {
    unwrap(await sb.from('assignments').update({ archived_at: new Date().toISOString() }).eq('id', assignmentId));
    return true;
  };

  const createClassGoal = async ({ classId, title, metric, target, endsAt = null }) =>
    camel(unwrap(await sb.from('class_goals').insert({ class_id: classId, title, metric, target, ends_at: endsAt }).select())[0]);

  const deleteClassGoal = async (goalId) => {
    unwrap(await sb.from('class_goals').delete().eq('id', goalId));
    return true;
  };

  async function exportClassCsv(classId, kind = 'skills') {
    const { exportRows } = await import('./csv.js');
    return exportRows(await getClassOverview(classId), await loadCatalog(), kind);
  }

  return {
    getStudentOverview, getSkillDetail, getTimeline,
    getTeacherOverview, getClassOverview, getStudentDetail,
    createAssignment, listAssignments, getAssignment, updateAssignment, archiveAssignment,
    createClassGoal, deleteClassGoal, exportClassCsv,
  };
}
