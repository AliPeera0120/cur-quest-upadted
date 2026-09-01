/* ============================================================================
   Recommendations.

   Because everything is open, the platform owes the student an answer to
   "what should I do next?". This is a small, explainable ranker rather than a
   model: every suggestion carries the reason it was chosen, in words a
   ten-year-old can read, and the same reason is what a teacher sees. No
   opaque scores in the UI.

   Priority order, highest first:
     1. an assignment that is due and not finished
     2. a lesson already in progress
     3. the next step on a skill the student is close to mastering
     4. a shore-up on the weakest skill with real evidence
     5. a lesson that builds on what they just practised
     6. somewhere new — a strand they have never touched
   ========================================================================= */

const REASONS = {
  assignment: 'Your teacher assigned this.',
  dueSoon: 'Assigned by your teacher — due soon.',
  inProgress: 'You started this and stopped partway.',
  almostThere: (s) => `You're close to mastering ${s}. This should tip it over.`,
  shoreUp: (s) => `${s} is your trickiest skill right now. This one focuses on it.`,
  buildsOn: (s) => `Builds on the ${s} you just practised.`,
  newGround: (s) => `You haven't tried ${s} yet.`,
  quickWin: 'Short — about five minutes.',
  retry: (n) => `You scored ${n}% last time. A second run usually goes better.`,
};

/**
 * @param {object} args
 * @param {object} args.catalog          indexed catalog
 * @param {object} args.lessonProgress   lessonId -> progress record
 * @param {object} args.skillMastery     skillId  -> mastery record
 * @param {Array}  args.assignments      open assignments for this student
 * @param {Array}  args.recentSkillIds   skills touched in the last few sessions
 * @param {number} args.limit
 */
export function recommendFor({
  catalog, lessonProgress = {}, skillMastery = {}, assignments = [],
  recentSkillIds = [], limit = 6,
}) {
  const out = [];
  const taken = new Set();

  const push = (lesson, reason, priority, extra = {}) => {
    if (!lesson || taken.has(lesson.id) || out.length >= limit * 3) return;
    taken.add(lesson.id);
    out.push({ lesson, reason, priority, ...extra });
  };

  const status = (id) => lessonProgress[id]?.status || 'not_started';
  const isDone = (id) => ['completed', 'mastered'].includes(status(id));

  /* 1 — unfinished assignments, soonest due first */
  const openAssignments = assignments
    .filter((a) => !a.archivedAt)
    .filter((a) => {
      const p = lessonProgress[a.lessonId];
      const threshold = a.minMastery ?? 80;
      return !p || p.completions === 0 || (p.bestScore ?? 0) < threshold;
    })
    .sort((a, b) => new Date(a.dueAt || '2999-01-01') - new Date(b.dueAt || '2999-01-01'));

  for (const a of openAssignments) {
    const lesson = catalog.lesson(a.lessonId);
    const soon = a.dueAt && (new Date(a.dueAt) - Date.now()) < 1000 * 60 * 60 * 72;
    push(lesson, soon ? REASONS.dueSoon : REASONS.assignment, 100, { assignment: a });
  }

  /* 2 — resume anything left open */
  for (const [lessonId, p] of Object.entries(lessonProgress)) {
    if (p.status === 'in_progress' && p.resumable) push(catalog.lesson(lessonId), REASONS.inProgress, 90, { resume: p.resumable });
  }

  /* 3 — skills one step from mastery */
  const nearMastery = Object.entries(skillMastery)
    .filter(([, m]) => m.level === 'proficient' && m.pct >= 78)
    .sort((a, b) => b[1].pct - a[1].pct);
  for (const [skillId, m] of nearMastery.slice(0, 3)) {
    const name = catalog.skill(skillId)?.name || skillId;
    const candidates = (catalog.lessonsBySkill.get(skillId) || [])
      .filter((l) => l.status === 'published')
      .sort((a, b) => (isDone(a.id) ? 1 : 0) - (isDone(b.id) ? 1 : 0) || a.estMinutes - b.estMinutes);
    push(candidates[0], REASONS.almostThere(name), 80, { skillId, skillPct: m.pct });
  }

  /* 4 — weakest skill that has real evidence behind it */
  const weakest = Object.entries(skillMastery)
    .filter(([, m]) => m.evidence >= 3 && ['beginning', 'developing'].includes(m.level))
    .sort((a, b) => a[1].pct - b[1].pct);
  for (const [skillId] of weakest.slice(0, 3)) {
    const name = catalog.skill(skillId)?.name || skillId;
    const candidates = (catalog.lessonsBySkill.get(skillId) || [])
      .filter((l) => l.status === 'published' && l.difficulty <= 2)
      .sort((a, b) => a.difficulty - b.difficulty || a.estMinutes - b.estMinutes);
    push(candidates.find((l) => !isDone(l.id)) || candidates[0], REASONS.shoreUp(name), 70, { skillId });
  }

  /* 5 — adjacency: same strand as something just practised */
  const recentStrands = [...new Set(recentSkillIds.map((s) => catalog.skill(s)?.strandId).filter(Boolean))];
  for (const strandId of recentStrands.slice(0, 2)) {
    const strandName = catalog.strand(strandId)?.name || strandId;
    const candidates = catalog.lessons
      .filter((l) => l.strandId === strandId && l.status === 'published' && !isDone(l.id))
      .sort((a, b) => a.difficulty - b.difficulty);
    push(candidates[0], REASONS.buildsOn(strandName), 60, { strandId });
  }

  /* 6 — a strand they have never touched at all */
  const touched = new Set(
    Object.keys(skillMastery)
      .filter((id) => skillMastery[id].evidence > 0)
      .map((id) => catalog.skill(id)?.strandId)
      .filter(Boolean),
  );
  for (const strand of catalog.strands) {
    if (touched.has(strand.id)) continue;
    const candidates = catalog.lessons
      .filter((l) => l.strandId === strand.id && l.status === 'published' && l.difficulty === 1)
      .sort((a, b) => a.estMinutes - b.estMinutes);
    push(candidates[0], REASONS.newGround(strand.name), 50, { strandId: strand.id });
  }

  /* 7 — worthwhile retry: a real attempt that fell short */
  const retryable = Object.entries(lessonProgress)
    .filter(([, p]) => p.completions > 0 && p.bestScore != null && p.bestScore < 70)
    .sort((a, b) => a[1].bestScore - b[1].bestScore);
  for (const [lessonId, p] of retryable.slice(0, 2)) {
    push(catalog.lesson(lessonId), REASONS.retry(Math.round(p.bestScore)), 40, { retry: true });
  }

  /* 8 — a genuinely short option, always offered */
  const quick = catalog.lessons.find((l) => l.format === 'quick' && !isDone(l.id));
  push(quick, REASONS.quickWin, 20);

  return out
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * The teacher-facing counterpart: what is this class weakest at, and who
 * should be looked at. Also plain rules, also explainable.
 */
export function classInsights({ catalog, roster = [], skillMatrix = {}, assignments = [], activityByStudent = {} }) {
  const insights = [];

  /* Class-wide weak skills, only where enough students have real evidence. */
  const perSkill = {};
  for (const student of roster) {
    const row = skillMatrix[student.id] || {};
    for (const [skillId, m] of Object.entries(row)) {
      if (!m || m.evidence < 3) continue;
      (perSkill[skillId] ||= []).push(m.pct);
    }
  }
  const weak = Object.entries(perSkill)
    .filter(([, arr]) => arr.length >= Math.max(3, Math.ceil(roster.length * 0.3)))
    .map(([skillId, arr]) => ({
      skillId,
      name: catalog.skill(skillId)?.name || skillId,
      strandId: catalog.skill(skillId)?.strandId,
      avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
      belowCount: arr.filter((p) => p < 70).length,
      n: arr.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  if (weak.length && weak[0].avg < 75) {
    const w = weak[0];
    insights.push({
      id: `weak-skill-${w.skillId}`,
      kind: 'weak_skill',
      severity: w.avg < 55 ? 'high' : 'medium',
      title: `${w.name} is your class's weakest skill right now`,
      detail: `Class average ${w.avg}% across ${w.n} students with enough evidence. ${w.belowCount} ${w.belowCount === 1 ? 'student is' : 'students are'} below 70%.`,
      action: { type: 'review_skill', skillId: w.skillId, label: 'Assign a review' },
    });
  }

  /* Students who have not shown up this week. */
  const weekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const inactive = roster.filter((s) => {
    const last = activityByStudent[s.id]?.lastActiveAt;
    return !last || new Date(last).getTime() < weekAgo;
  });
  if (inactive.length) {
    insights.push({
      id: 'inactive',
      kind: 'inactive',
      severity: inactive.length > roster.length / 3 ? 'medium' : 'low',
      title: `${inactive.length} ${inactive.length === 1 ? 'student has' : 'students have'} not played this week`,
      detail: inactive.slice(0, 5).map((s) => s.displayName).join(', ') + (inactive.length > 5 ? `, +${inactive.length - 5} more` : ''),
      action: { type: 'view_students', studentIds: inactive.map((s) => s.id), label: 'See who' },
    });
  }

  /* Assignments with meaningful non-completion. */
  for (const a of assignments) {
    if (a.archivedAt || !a.stats) continue;
    const { assigned, completed } = a.stats;
    if (assigned >= 3 && completed / assigned < 0.6) {
      insights.push({
        id: `assignment-${a.id}`,
        kind: 'assignment_lagging',
        severity: a.dueAt && new Date(a.dueAt) < new Date() ? 'high' : 'low',
        title: `${completed} of ${assigned} finished "${a.lessonTitle}"`,
        detail: a.dueAt
          ? `Due ${new Date(a.dueAt).toLocaleDateString()}. ${assigned - completed} still to go.`
          : `${assigned - completed} students have not finished it yet.`,
        action: { type: 'view_assignment', assignmentId: a.id, label: 'Open assignment' },
      });
    }
  }

  /* Growth is worth surfacing as loudly as struggle. */
  const improving = roster
    .map((s) => ({ s, growth: activityByStudent[s.id]?.growth }))
    .filter((x) => x.growth != null && x.growth >= 15)
    .sort((a, b) => b.growth - a.growth);
  if (improving.length) {
    insights.push({
      id: 'improving',
      kind: 'improving',
      severity: 'good',
      title: `${improving.length} ${improving.length === 1 ? 'student is' : 'students are'} clearly improving`,
      detail: improving.slice(0, 4).map((x) => `${x.s.displayName} +${Math.round(x.growth)} pts`).join(' · '),
      action: { type: 'view_students', studentIds: improving.map((x) => x.s.id), label: 'See who' },
    });
  }

  return { insights, weakSkills: weak.slice(0, 6) };
}
