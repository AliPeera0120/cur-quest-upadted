/* ============================================================================
   Achievement evaluation.

   Rules only fire on things that took real learning: finishing lessons,
   answering correctly, reaching mastery, improving a score, covering breadth.
   There is deliberately nothing here for logging in, opening a page, keeping a
   streak alive, or spending time — those reward compliance, not understanding,
   and they are the mechanics that make a platform feel like it is farming
   children rather than teaching them.
   ========================================================================= */

import { computeMastery, computeLessonProgress } from './mastery.js';

/**
 * @param {string} studentId
 * @param {{catalog:object, attempts:Array, responses:Array, already:string[]}} ctx
 * @returns {Promise<Array>} newly earned achievement definitions
 */
export async function evaluateAchievements(studentId, { catalog, attempts, responses, already = [] }) {
  const earned = new Set(already);
  const defs = catalog.achievements || [];

  /* ---- facts, computed once ------------------------------------------- */
  const byLesson = new Map();
  for (const a of attempts) {
    if (!byLesson.has(a.lessonId)) byLesson.set(a.lessonId, []);
    byLesson.get(a.lessonId).push(a);
  }

  const completedByFormat = {};
  const strandsTouched = new Set();
  const strandsDeveloping = new Set();
  let bestImprovement = 0;
  let lessonsCompleted = 0;

  for (const [lessonId, list] of byLesson) {
    const lesson = catalog.lesson(lessonId);
    if (!lesson) continue;
    const p = computeLessonProgress(list);
    if (p.completions > 0) {
      lessonsCompleted += 1;
      completedByFormat[lesson.format] = (completedByFormat[lesson.format] || 0) + 1;
      if (lesson.strandId) strandsTouched.add(lesson.strandId);
    }
    if (p.growth != null && p.growth > bestImprovement) bestImprovement = p.growth;
  }

  const questionsCorrect = responses.filter((r) => r.isCorrect).length;

  /* Skill mastery, per skill, from all evidence. */
  const bySkill = new Map();
  for (const r of responses) {
    if (!r.skillId) continue;
    if (!bySkill.has(r.skillId)) bySkill.set(r.skillId, []);
    bySkill.get(r.skillId).push(r);
  }
  let skillsMastered = 0;
  let skillsProficient = 0;
  const strandSkillState = new Map();
  for (const [skillId, list] of bySkill) {
    const m = computeMastery(list);
    if (m.level === 'mastered') skillsMastered += 1;
    if (m.level === 'proficient' || m.level === 'mastered') skillsProficient += 1;
    const skill = catalog.skill(skillId);
    if (skill) {
      if (['developing', 'proficient', 'mastered'].includes(m.level)) strandsDeveloping.add(skill.strandId);
      if (!strandSkillState.has(skill.strandId)) strandSkillState.set(skill.strandId, []);
      strandSkillState.get(skill.strandId).push(m.level);
    }
  }

  /* A strand counts as fully mastered only when every skill in it that has any
     lesson coverage is mastered — not merely every skill the student happened
     to touch. */
  let strandsFullyMastered = 0;
  for (const strand of catalog.strands) {
    const skillIds = (catalog.skillsByStrand.get(strand.id) || [])
      .filter((s) => (catalog.lessonsBySkill.get(s.id) || []).length > 0)
      .map((s) => s.id);
    if (!skillIds.length) continue;
    const allMastered = skillIds.every((id) => {
      const list = bySkill.get(id);
      return list && computeMastery(list).level === 'mastered';
    });
    if (allMastered) strandsFullyMastered += 1;
  }

  const facts = {
    lessonsCompleted, questionsCorrect, skillsMastered, skillsProficient,
    strandsTouched: strandsTouched.size,
    strandsDeveloping: strandsDeveloping.size,
    strandMastered: strandsFullyMastered,
    improvement: bestImprovement,
    completedByFormat,
    completedByStrand: [...strandsTouched].reduce((acc, s) => {
      acc[s] = [...byLesson.keys()].filter((id) => {
        const l = catalog.lesson(id);
        return l?.strandId === s && computeLessonProgress(byLesson.get(id)).completions > 0;
      }).length;
      return acc;
    }, {}),
  };

  /* ---- test each definition ------------------------------------------- */
  const out = [];
  for (const def of defs) {
    if (earned.has(def.id)) continue;
    if (meets(def.criteria, facts)) out.push(def);
  }
  return out;
}

function meets(criteria = {}, f) {
  if (criteria.lessonsCompleted != null && f.lessonsCompleted < criteria.lessonsCompleted) return false;
  if (criteria.questionsCorrect != null && f.questionsCorrect < criteria.questionsCorrect) return false;
  if (criteria.skillsMastered != null && f.skillsMastered < criteria.skillsMastered) return false;
  if (criteria.skillsProficient != null && f.skillsProficient < criteria.skillsProficient) return false;
  if (criteria.strandsTouched != null && f.strandsTouched < criteria.strandsTouched) return false;
  if (criteria.strandsDeveloping != null && f.strandsDeveloping < criteria.strandsDeveloping) return false;
  if (criteria.strandMastered != null && f.strandMastered < criteria.strandMastered) return false;
  if (criteria.improvement != null && f.improvement < criteria.improvement) return false;
  if (criteria.format != null) {
    if ((f.completedByFormat[criteria.format] || 0) < (criteria.completed ?? 1)) return false;
  }
  if (criteria.strand != null) {
    if ((f.completedByStrand[criteria.strand] || 0) < (criteria.completed ?? 1)) return false;
  }
  return true;
}

/** Progress toward an unearned achievement, for the achievements screen. */
export function achievementProgress(def, facts) {
  const c = def.criteria || {};
  const pairs = [
    ['lessonsCompleted', facts.lessonsCompleted],
    ['questionsCorrect', facts.questionsCorrect],
    ['skillsMastered', facts.skillsMastered],
    ['skillsProficient', facts.skillsProficient],
    ['strandsTouched', facts.strandsTouched],
    ['strandsDeveloping', facts.strandsDeveloping],
    ['strandMastered', facts.strandMastered],
    ['improvement', facts.improvement],
  ];
  for (const [key, have] of pairs) {
    if (c[key] != null) return { have: have || 0, need: c[key] };
  }
  if (c.format != null) return { have: facts.completedByFormat?.[c.format] || 0, need: c.completed ?? 1 };
  if (c.strand != null) return { have: facts.completedByStrand?.[c.strand] || 0, need: c.completed ?? 1 };
  return null;
}
