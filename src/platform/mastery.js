/* ============================================================================
   The mastery engine.

   This is the heart of the product, and it is deliberately a pure module: no
   React, no storage, no network. Every input is data, every output is data,
   so the rules can be reasoned about, unit-tested, and re-run over historical
   events without touching the UI.

   Design commitments, in order of importance:

   1. Mastery is evidence-based, not attempt-based. A single lucky 100% never
      produces "Mastered" — the model requires enough questions, across more
      than one sitting, with the most recent sittings holding up.
   2. Recent evidence counts for more than old evidence, but old evidence is
      never thrown away. A student who improves should see it; a student who
      regresses should not keep a stale badge.
   3. Harder questions carry more weight than easy ones.
   4. Growth is a first-class output, not a derived afterthought. "54% → 89%"
      says more about learning than "89%".
   5. Access is never gated on any of this. Mastery describes; it never locks.
   ========================================================================= */

export const LEVELS = ['not_started', 'beginning', 'developing', 'proficient', 'mastered'];

export const LEVEL_RANK = LEVELS.reduce((acc, l, i) => ({ ...acc, [l]: i }), {});

/** Thresholds live in one object so a school could tune them later. */
export const MASTERY_RULES = {
  /* Percentage floors */
  developingPct: 45,
  proficientPct: 70,
  masteredPct: 85,
  /* Evidence floors — how many scored questions before we'll claim a level */
  proficientEvidence: 5,
  masteredEvidence: 8,
  /* Mastered additionally needs corroboration across sittings */
  masteredSessions: 2,
  masteredRecentFloor: 75,
  /* Recency: how many sessions back before a session's weight halves */
  halfLifeSessions: 3,
  /* Anti-farming. Some skills are backed by only a handful of questions, so
     replaying the same two items must not add up to "Mastered". Only the most
     recent few responses to any single question count, and mastery needs
     evidence from several distinct questions. */
  maxRepeatsPerQuestion: 3,
  masteredDistinctQuestions: 4,
  /* Strand-level coverage floors. A strand's headline level should reflect
     breadth as well as accuracy — see rollUp(). */
  strandDevelopingCoverage: 0.2,
  strandProficientCoverage: 0.5,
  strandMasteredCoverage: 0.8,
  /* Difficulty multipliers, keyed by question difficulty 1..3 */
  difficultyWeight: { 1: 1, 2: 1.25, 3: 1.6 },
};

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const round = (n) => Math.round(n * 10) / 10;

/**
 * Group flat responses into sessions (one per attempt), newest last.
 *
 * @param {Array<{attemptId:string, isCorrect:boolean, difficulty?:number, answeredAt:number|string}>} responses
 */
export function toSessions(responses = []) {
  const byAttempt = new Map();
  for (const r of responses) {
    const key = r.attemptId || 'loose';
    if (!byAttempt.has(key)) byAttempt.set(key, []);
    byAttempt.get(key).push(r);
  }
  const sessions = [];
  for (const [attemptId, items] of byAttempt) {
    let weighted = 0;
    let weight = 0;
    let correct = 0;
    let at = 0;
    for (const r of items) {
      const w = MASTERY_RULES.difficultyWeight[r.difficulty] ?? 1;
      weight += w;
      if (r.isCorrect) { weighted += w; correct += 1; }
      const ts = new Date(r.answeredAt || 0).getTime() || 0;
      if (ts > at) at = ts;
    }
    sessions.push({
      attemptId,
      at,
      count: items.length,
      correct,
      weight,
      pct: weight > 0 ? clamp((weighted / weight) * 100) : 0,
    });
  }
  return sessions.sort((a, b) => a.at - b.at);
}

/**
 * Compute a mastery record for one skill from its raw responses.
 *
 * Returns everything the UI and the teacher reports need, so no screen has to
 * re-derive a rule and risk disagreeing with another screen.
 */
export function computeMastery(rawResponses = []) {
  /* Trim repeated exposures to the same question, newest kept. */
  const seen = new Map();
  const responses = [...rawResponses]
    .sort((a, b) => new Date(b.answeredAt || 0) - new Date(a.answeredAt || 0))
    .filter((r) => {
      const key = r.questionId || `anon:${r.attemptId}:${r.id ?? Math.random()}`;
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      return n <= MASTERY_RULES.maxRepeatsPerQuestion;
    })
    .reverse();

  const distinctQuestions = new Set(responses.map((r) => r.questionId).filter(Boolean)).size;
  const sessions = toSessions(responses);
  const evidence = responses.length;

  if (!evidence) {
    return {
      level: 'not_started', pct: 0, evidence: 0, sessions: 0, distinctQuestions: 0,
      correct: 0, firstPct: null, latestPct: null, bestPct: null,
      growth: null, trend: 'flat', needsEvidence: MASTERY_RULES.proficientEvidence,
      lastAt: null,
    };
  }

  /* Recency-weighted mean across sessions. The newest session has weight 1;
     each step back multiplies by 0.5^(1/halfLife). Session size still matters,
     so a 20-question session outweighs a 2-question one at the same age. */
  const decay = 0.5 ** (1 / MASTERY_RULES.halfLifeSessions);
  const n = sessions.length;
  let num = 0;
  let den = 0;
  sessions.forEach((s, i) => {
    const age = n - 1 - i;
    const w = decay ** age * Math.max(1, s.weight);
    num += s.pct * w;
    den += w;
  });
  const weightedPct = den > 0 ? clamp(num / den) : 0;

  const pcts = sessions.map((s) => s.pct);

  /* Corroborated-current level.
     The recency-weighted mean alone is too harsh on a student who started
     badly and then genuinely learned the thing — 60/80/90 would read
     "Proficient" forever because of a first attempt from three weeks ago.
     So we also compute the mean of the most recent `masteredSessions`
     sittings and take whichever is kinder.

     This still cannot be gamed by one lucky run: the recent window needs at
     least two separate sittings, and the mastered rules below independently
     require enough total questions and a floor under EVERY recent sitting. A
     student who scores 90, 90, 50 sees their figure fall, because the recent
     window now contains the 50. Growth is rewarded; a stale badge is not. */
  const window = sessions.slice(-MASTERY_RULES.masteredSessions);
  let wNum = 0;
  let wDen = 0;
  for (const s of window) { const w = Math.max(1, s.weight); wNum += s.pct * w; wDen += w; }
  const recentPct = wDen > 0 ? clamp(wNum / wDen) : 0;
  const pct = n >= MASTERY_RULES.masteredSessions ? Math.max(weightedPct, recentPct) : weightedPct;
  const firstPct = round(pcts[0]);
  const latestPct = round(pcts[pcts.length - 1]);
  const bestPct = round(Math.max(...pcts));
  const recent = pcts.slice(-MASTERY_RULES.masteredSessions);
  const recentHoldsUp = recent.length >= MASTERY_RULES.masteredSessions
    && recent.every((p) => p >= MASTERY_RULES.masteredRecentFloor);

  let level = 'beginning';
  if (pct >= MASTERY_RULES.masteredPct
      && evidence >= MASTERY_RULES.masteredEvidence
      && n >= MASTERY_RULES.masteredSessions
      && (distinctQuestions === 0 || distinctQuestions >= MASTERY_RULES.masteredDistinctQuestions)
      && recentHoldsUp) {
    level = 'mastered';
  } else if (pct >= MASTERY_RULES.proficientPct && evidence >= MASTERY_RULES.proficientEvidence) {
    level = 'proficient';
  } else if (pct >= MASTERY_RULES.developingPct) {
    level = 'developing';
  }

  /* What is standing between this student and the next level? The dashboards
     use this to say "2 more questions" instead of leaving it a mystery. */
  let needsEvidence = 0;
  if (level === 'developing' && pct >= MASTERY_RULES.proficientPct) {
    needsEvidence = Math.max(0, MASTERY_RULES.proficientEvidence - evidence);
  } else if (level === 'proficient' && pct >= MASTERY_RULES.masteredPct) {
    needsEvidence = Math.max(0, MASTERY_RULES.masteredEvidence - evidence);
  }

  const growth = n >= 2 ? round(latestPct - firstPct) : null;
  const trend = growth == null ? 'flat' : growth >= 5 ? 'up' : growth <= -5 ? 'down' : 'flat';

  return {
    level,
    pct: round(pct),
    weightedPct: round(weightedPct),
    recentPct: n >= MASTERY_RULES.masteredSessions ? round(recentPct) : null,
    evidence,
    distinctQuestions,
    sessions: n,
    correct: responses.filter((r) => r.isCorrect).length,
    firstPct, latestPct, bestPct,
    growth, trend,
    needsEvidence,
    needsSessions: level === 'proficient' && pct >= MASTERY_RULES.masteredPct
      ? Math.max(0, MASTERY_RULES.masteredSessions - n) : 0,
    lastAt: sessions[n - 1].at || null,
  };
}

/**
 * Lesson-level status. Kept separate from skill mastery on purpose: finishing
 * a lesson is an activity fact, mastering its skills is a learning fact, and
 * the product shows both rather than conflating them.
 */
export function computeLessonProgress(attempts = []) {
  const done = attempts.filter((a) => a.completedAt);
  const scores = done.map((a) => (a.maxScore ? (a.score / a.maxScore) * 100 : 0));
  const inFlight = attempts.find((a) => !a.completedAt && a.startedAt);

  if (!attempts.length) {
    return {
      status: 'not_started', attempts: 0, completions: 0,
      bestScore: null, latestScore: null, avgScore: null, firstScore: null,
      growth: null, seconds: 0, questionsAnswered: 0, questionsCorrect: 0,
      accuracy: null, lastPlayedAt: null, resumable: null,
    };
  }

  const seconds = attempts.reduce((a, x) => a + (x.secondsSpent || 0), 0);
  const questionsAnswered = attempts.reduce((a, x) => a + (x.questionsAnswered || 0), 0);
  const questionsCorrect = attempts.reduce((a, x) => a + (x.questionsCorrect || 0), 0);
  const lastPlayedAt = attempts.reduce(
    (a, x) => Math.max(a, new Date(x.updatedAt || x.startedAt || 0).getTime() || 0), 0,
  );

  const best = scores.length ? round(Math.max(...scores)) : null;
  const latest = scores.length ? round(scores[scores.length - 1]) : null;
  const first = scores.length ? round(scores[0]) : null;
  const avg = scores.length ? round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  let status = 'not_started';
  if (inFlight) status = 'in_progress';
  else if (done.length) status = 'completed';
  if (done.length && best != null && best >= MASTERY_RULES.masteredPct && done.length >= 2) status = 'mastered';
  else if (done.length && best != null && best >= 95) status = 'mastered';

  return {
    status,
    attempts: attempts.length,
    completions: done.length,
    bestScore: best, latestScore: latest, avgScore: avg, firstScore: first,
    growth: scores.length >= 2 ? round(latest - first) : null,
    seconds,
    questionsAnswered,
    questionsCorrect,
    accuracy: questionsAnswered ? round((questionsCorrect / questionsAnswered) * 100) : null,
    lastPlayedAt: lastPlayedAt || null,
    resumable: inFlight ? { attemptId: inFlight.id, state: inFlight.state || null } : null,
  };
}

/**
 * Roll skill records up to a strand.
 *
 * Two things are being reported at once and they must not be conflated:
 * how well the student did on what they have attempted, and how much of the
 * strand they have attempted at all. A student who scored 100% on two of a
 * strand's ten skills has not reached "Proficient in Earth & Space", and
 * showing them that would be flattering them rather than teaching them.
 *
 * So `pct` stays an honest average over attempted skills, and the LEVEL is
 * additionally gated on coverage. `coverage` is returned so the UI can always
 * say "2 of 10 skills" next to the figure.
 *
 * @param records  mastery records for the strand's skills (may include nulls)
 * @param totalSkills  how many skills the strand has that lessons actually
 *                     cover; defaults to the number of records passed in
 */
export function rollUp(records = [], totalSkills = null) {
  const present = records.filter(Boolean);
  const withEvidence = present.filter((r) => r.evidence > 0);
  const total = totalSkills ?? present.length ?? 0;

  if (!withEvidence.length) {
    return {
      level: 'not_started', pct: null, evidence: 0,
      skills: total, touched: 0, coverage: 0, mastered: 0,
    };
  }

  let num = 0;
  let den = 0;
  for (const r of withEvidence) {
    const w = Math.sqrt(r.evidence); // diminishing returns, so one huge skill can't dominate
    num += r.pct * w;
    den += w;
  }
  const pct = round(num / den);
  const coverage = total > 0 ? withEvidence.length / total : 1;

  let level;
  if (pct >= MASTERY_RULES.masteredPct
      && coverage >= MASTERY_RULES.strandMasteredCoverage
      && withEvidence.every((r) => r.level === 'mastered')) {
    level = 'mastered';
  } else if (pct >= MASTERY_RULES.proficientPct && coverage >= MASTERY_RULES.strandProficientCoverage) {
    level = 'proficient';
  } else if (pct >= MASTERY_RULES.developingPct && coverage >= MASTERY_RULES.strandDevelopingCoverage) {
    level = 'developing';
  } else {
    level = 'beginning';
  }

  return {
    level,
    pct,
    evidence: withEvidence.reduce((a, r) => a + r.evidence, 0),
    skills: total,
    touched: withEvidence.length,
    coverage: round(coverage * 100),
    mastered: withEvidence.filter((r) => r.level === 'mastered').length,
  };
}

/** Level for a bare percentage, used where evidence counts aren't available. */
export function levelForPct(pct, evidence = Infinity) {
  if (pct == null) return 'not_started';
  if (pct >= MASTERY_RULES.masteredPct && evidence >= MASTERY_RULES.masteredEvidence) return 'mastered';
  if (pct >= MASTERY_RULES.proficientPct && evidence >= MASTERY_RULES.proficientEvidence) return 'proficient';
  if (pct >= MASTERY_RULES.developingPct) return 'developing';
  return 'beginning';
}

/* -------------------------------------------------------------------- XP ---
   Points reward learning, not clicking. There is no XP for opening a lesson,
   no daily-login bonus, and no way to farm points by replaying something
   already mastered. */
export const XP = {
  lessonCompleted: 50,
  lessonMastered: 60,
  skillMastered: 100,
  significantImprovement: 50,   // +15 points or more on a retry
  challengeCleared: 75,
  firstAttemptOnNewSkill: 15,
  improvementThreshold: 15,
};

export function xpForCompletion({ scorePct, previousBest, isFirstCompletion, isChallenge }) {
  const out = [];
  if (isFirstCompletion) {
    out.push({ amount: isChallenge ? XP.challengeCleared : XP.lessonCompleted, reason: 'Lesson completed' });
  }
  if (previousBest != null && scorePct - previousBest >= XP.improvementThreshold) {
    out.push({ amount: XP.significantImprovement, reason: `Improved by ${Math.round(scorePct - previousBest)} points` });
  }
  if (!isFirstCompletion && scorePct >= MASTERY_RULES.masteredPct && (previousBest ?? 0) < MASTERY_RULES.masteredPct) {
    out.push({ amount: XP.lessonMastered, reason: 'Lesson mastered' });
  }
  return out;
}

/** Rank titles. Thresholds widen so later ranks stay meaningful. */
export const RANKS = [
  { level: 1,  title: 'Curious Cadet',        minXp: 0 },
  { level: 2,  title: 'Junior Scientist',     minXp: 150 },
  { level: 3,  title: 'Lab Explorer',         minXp: 400 },
  { level: 4,  title: 'Field Researcher',     minXp: 800 },
  { level: 5,  title: 'STEM Investigator',    minXp: 1400 },
  { level: 6,  title: 'Systems Thinker',      minXp: 2200 },
  { level: 7,  title: 'Senior Researcher',    minXp: 3200 },
  { level: 8,  title: 'Principal Scientist',  minXp: 4600 },
  { level: 9,  title: 'Lead Engineer',        minXp: 6400 },
  { level: 10, title: 'Chief Scientist',      minXp: 8800 },
];

export const rankForXp = (xp = 0) => [...RANKS].reverse().find((r) => xp >= r.minXp) || RANKS[0];
export const nextRank = (xp = 0) => RANKS.find((r) => r.minXp > xp) || null;
