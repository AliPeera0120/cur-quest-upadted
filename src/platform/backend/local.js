/* ============================================================================
   Local backend.

   A complete implementation of the platform API against browser storage, so
   the whole product — accounts, classes, class codes, assignments, mastery,
   dashboards — runs with zero infrastructure. That matters for three reasons:
   the site currently deploys to GitHub Pages, which cannot run a server; a
   teacher can trial the platform without anyone provisioning anything; and
   every screen can be built and tested against real data today.

   Its limits are honest and stated in the UI: data lives on one device and one
   browser profile. `backend/supabase.js` implements the same interface against
   Postgres, where the authorisation below is additionally enforced by the RLS
   policies in supabase/migrations/0001_init.sql.

   IMPORTANT: the guards in this file are written as if they were server-side.
   Nothing here trusts a caller-supplied id — every read of another person's
   data goes through `assertCanReadStudent`. Keeping the shapes identical is
   what makes swapping in the server backend a configuration change rather
   than a rewrite.
   ========================================================================= */

import { commit, db, flush, resetStore, readLegacyPassport, isMemoryOnly } from '../store.js';
import {
  randomId, randomJoinCode, hashSecret, verifySecret, recoveryPhrase,
  checkPassword, checkUsername,
} from '../crypto.js';
import { computeMastery, computeLessonProgress, rollUp, xpForCompletion, rankForXp, nextRank } from '../mastery.js';
import { loadCatalog, loadLessonContent } from '../../content/index.js';
import { evaluateAchievements } from '../achievements.js';
import { recommendFor } from '../recommend.js';

/* --------------------------------------------------------------- errors --- */
export class PlatformError extends Error {
  constructor(code, message) { super(message); this.code = code; this.name = 'PlatformError'; }
}
const fail = (code, message) => { throw new PlatformError(code, message); };

const now = () => new Date().toISOString();

/* ------------------------------------------------------------- identity --- */
function session() {
  const d = db();
  if (!d.session?.profileId) return null;
  const p = d.profiles[d.session.profileId];
  if (!p || p.deletedAt) return null;
  return p;
}

function requireUser() {
  const p = session();
  if (!p) fail('unauthenticated', 'You need to be signed in to do that.');
  return p;
}

function requireRole(...roles) {
  const p = requireUser();
  if (!roles.includes(p.role)) fail('forbidden', 'Your account does not have access to that.');
  return p;
}

/** Public shape of a profile — never leaks the password material. */
const publicProfile = (p) => p && ({
  id: p.id, role: p.role, username: p.username, displayName: p.displayName,
  avatarKey: p.avatarKey, title: p.title || null, gradeBand: p.gradeBand || null,
  schoolName: p.schoolName || null, xpTotal: p.xpTotal || 0,
  settings: p.settings || {}, createdAt: p.createdAt, lastSeenAt: p.lastSeenAt || null,
});

/* --------------------------------------------------------- authorisation ---
   Mirrors cq_teaches_student() / cq_in_class() / cq_owns_class() from the SQL
   schema. Every cross-account read funnels through here. */
const activeMemberships = (studentId) =>
  db().classMembers.filter((m) => m.studentId === studentId && !m.removedAt);

function teachesStudent(teacherId, studentId) {
  const d = db();
  return activeMemberships(studentId).some((m) => {
    const c = d.classes[m.classId];
    return c && c.teacherId === teacherId && !c.archivedAt;
  });
}

const ownsClass = (userId, classId) => db().classes[classId]?.teacherId === userId;
const inClass = (userId, classId) =>
  db().classMembers.some((m) => m.classId === classId && m.studentId === userId && !m.removedAt);

function assertCanReadStudent(studentId) {
  const me = requireUser();
  if (me.id === studentId) return me;
  if (me.role === 'admin') return me;
  if (me.role === 'teacher' && teachesStudent(me.id, studentId)) return me;
  return fail('forbidden', 'You can only view students in your own classes.');
}

function assertOwnsClass(classId) {
  const me = requireUser();
  const cls = db().classes[classId];
  if (!cls) fail('not_found', 'That class no longer exists.');
  if (me.role === 'admin' || cls.teacherId === me.id) return cls;
  return fail('forbidden', 'That class belongs to another teacher.');
}

function assertCanReadClass(classId) {
  const me = requireUser();
  const cls = db().classes[classId];
  if (!cls) fail('not_found', 'That class no longer exists.');
  if (me.role === 'admin' || cls.teacherId === me.id || inClass(me.id, classId)) return cls;
  return fail('forbidden', 'You do not have access to that class.');
}

/* ================================================================= AUTH === */

async function signUpTeacher({ email, password, displayName, schoolName }) {
  const uname = (email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(uname)) fail('invalid_email', 'Enter a valid email address.');
  const pwErr = checkPassword(password, { min: 10 });
  if (pwErr) fail('weak_password', pwErr);
  if (!displayName?.trim()) fail('invalid_name', 'Enter the name your students will see.');
  if (db().usernames[uname]) fail('taken', 'An account already uses that email.');

  const secret = await hashSecret(password);
  const phrase = recoveryPhrase();
  const recovery = await hashSecret(phrase);
  const id = randomId('u');
  const profile = {
    id, role: 'teacher', username: uname, displayName: displayName.trim(),
    avatarKey: 'circuit', schoolName: schoolName?.trim() || null,
    xpTotal: 0, settings: {}, createdAt: now(), lastSeenAt: now(),
    secret, recovery,
  };
  commit((d) => {
    d.profiles[id] = profile;
    d.usernames[uname] = id;
    d.session = { profileId: id, startedAt: now() };
  });
  flush();
  /* The phrase is returned exactly once. We store only its hash. */
  return { profile: publicProfile(profile), recoveryPhrase: phrase };
}

async function signUpStudent({ username, password, displayName, joinCode, avatarKey = 'beaker', gradeBand }) {
  const uname = (username || '').trim().toLowerCase();
  const unErr = checkUsername(uname);
  if (unErr) fail('invalid_username', unErr);
  const pwErr = checkPassword(password);
  if (pwErr) fail('weak_password', pwErr);
  if (!displayName?.trim()) fail('invalid_name', 'Enter your first name.');
  if (db().usernames[uname]) fail('taken', 'That username is already taken. Try adding a number.');

  /* If a code was supplied it must be valid BEFORE we create the account, so a
     mistyped code never leaves a half-made profile behind. */
  let target = null;
  if (joinCode) target = lookupClassByCode(joinCode);

  const secret = await hashSecret(password);
  const id = randomId('u');
  const profile = {
    id, role: 'student', username: uname, displayName: displayName.trim().slice(0, 40),
    avatarKey, gradeBand: gradeBand || null, title: null,
    xpTotal: 0, settings: {}, createdAt: now(), lastSeenAt: now(), secret,
  };
  commit((d) => {
    d.profiles[id] = profile;
    d.usernames[uname] = id;
    d.session = { profileId: id, startedAt: now() };
  });
  if (target) {
    commit((d) => {
      d.classMembers.push({ id: randomId('m'), classId: target.classId, studentId: id, joinedAt: now(), removedAt: null });
      d.events.push({ id: randomId('e'), studentId: id, classId: target.classId, type: 'class_joined', payload: { className: target.className }, createdAt: now() });
    });
  }
  await migrateLegacyPassport(id);
  flush();
  return { profile: publicProfile(profile), joinedClass: target };
}

async function signIn({ identifier, password }) {
  const uname = (identifier || '').trim().toLowerCase();
  const d = db();
  const id = d.usernames[uname];
  const p = id ? d.profiles[id] : null;
  /* Same message and similar timing whether the account exists or not. */
  const ok = p && !p.deletedAt ? await verifySecret(password, p.secret) : await verifySecret(password, { salt: 'x', hash: 'y'.repeat(64) });
  if (!p || p.deletedAt || !ok) fail('bad_credentials', 'That username or password is not right.');
  commit((dd) => {
    dd.profiles[p.id].lastSeenAt = now();
    dd.session = { profileId: p.id, startedAt: now() };
  });
  flush();
  return publicProfile(p);
}

function signOut() {
  commit((d) => { d.session = null; });
  flush();
  return true;
}

const currentUser = () => publicProfile(session());

async function changePassword({ currentPassword, newPassword }) {
  const me = requireUser();
  const raw = db().profiles[me.id];
  if (!(await verifySecret(currentPassword, raw.secret))) fail('bad_credentials', 'Your current password is not right.');
  const err = checkPassword(newPassword, { min: me.role === 'teacher' ? 10 : 8 });
  if (err) fail('weak_password', err);
  const secret = await hashSecret(newPassword);
  commit((d) => { d.profiles[me.id].secret = secret; });
  flush();
  return true;
}

/** Teacher self-service reset using the phrase issued at sign-up. */
async function resetWithRecovery({ email, phrase, newPassword }) {
  const uname = (email || '').trim().toLowerCase();
  const d = db();
  const p = d.profiles[d.usernames[uname]];
  if (!p?.recovery) fail('not_found', 'No account with a recovery phrase matches that email.');
  if (!(await verifySecret((phrase || '').trim().toLowerCase(), p.recovery))) fail('bad_credentials', 'That recovery phrase is not right.');
  const err = checkPassword(newPassword, { min: 10 });
  if (err) fail('weak_password', err);
  const secret = await hashSecret(newPassword);
  commit((dd) => { dd.profiles[p.id].secret = secret; });
  flush();
  return true;
}

/**
 * Teacher-issued student password reset.
 *
 * Deliberately narrow: a teacher may set a new password for a student in their
 * own class — which is what actually happens in a computer lab — but cannot
 * read anything else about that student's account, and the action is written
 * to the event stream.
 */
async function resetStudentPassword({ classId, studentId, newPassword }) {
  assertOwnsClass(classId);
  if (!inClass(studentId, classId)) fail('not_found', 'That student is not in this class.');
  const err = checkPassword(newPassword);
  if (err) fail('weak_password', err);
  const secret = await hashSecret(newPassword);
  const me = requireUser();
  commit((d) => {
    d.profiles[studentId].secret = secret;
    d.events.push({ id: randomId('e'), studentId, classId, type: 'password_reset_by_teacher', payload: { teacherId: me.id }, createdAt: now() });
  });
  flush();
  return true;
}

async function updateProfile(patch) {
  const me = requireUser();
  const allowed = ['displayName', 'avatarKey', 'title', 'gradeBand', 'schoolName', 'settings'];
  commit((d) => {
    const p = d.profiles[me.id];
    for (const k of allowed) if (k in patch) p[k] = patch[k];
    if (p.displayName) p.displayName = String(p.displayName).slice(0, 40);
  });
  flush();
  return publicProfile(db().profiles[me.id]);
}

/** Deletes the learning record outright; keeps a tombstone so rosters hold. */
function deleteOwnAccount() {
  const me = requireUser();
  commit((d) => {
    d.responses = d.responses.filter((r) => r.studentId !== me.id);
    for (const [id, a] of Object.entries(d.attempts)) if (a.studentId === me.id) delete d.attempts[id];
    d.events = d.events.filter((e) => e.studentId !== me.id);
    d.achievements = d.achievements.filter((a) => a.studentId !== me.id);
    d.xp = d.xp.filter((x) => x.studentId !== me.id);
    d.classMembers = d.classMembers.map((m) => (m.studentId === me.id ? { ...m, removedAt: now() } : m));
    if (me.role === 'teacher') {
      for (const [id, c] of Object.entries(d.classes)) if (c.teacherId === me.id) d.classes[id].archivedAt = now();
    }
    delete d.usernames[me.username];
    d.profiles[me.id] = {
      ...d.profiles[me.id],
      deletedAt: now(), displayName: 'Removed account',
      username: `deleted-${me.id.slice(0, 8)}`, secret: null, recovery: null,
    };
    d.session = null;
  });
  flush();
  return true;
}

/* =============================================================== CLASSES === */

function newCode(d) {
  for (let i = 0; i < 60; i += 1) {
    const c = randomJoinCode();
    if (!d.joinCodes[c]) return c;
  }
  return fail('exhausted', 'Could not allocate a class code. Try again.');
}

function createClass({ name, gradeBand, subject }) {
  const me = requireRole('teacher', 'admin');
  if (!name?.trim()) fail('invalid_name', 'Give the class a name.');
  const id = randomId('c');
  return commit((d) => {
    const code = newCode(d);
    d.classes[id] = {
      id, teacherId: me.id, name: name.trim().slice(0, 60),
      gradeBand: gradeBand || null, subject: subject || null,
      joinCode: code, codeActive: true, codeExpiresAt: null,
      settings: {
        masteryThreshold: 80, allowRetry: true, showAnswers: true,
        xpEnabled: true, achievementsEnabled: true, classGoalsEnabled: true,
        leaderboardEnabled: false,
      },
      createdAt: now(), archivedAt: null,
    };
    d.joinCodes[code] = id;
    return { ...d.classes[id] };
  });
}

function listMyClasses({ includeArchived = false } = {}) {
  const me = requireUser();
  const d = db();
  if (me.role === 'student') {
    return activeMemberships(me.id)
      .map((m) => d.classes[m.classId])
      .filter((c) => c && (includeArchived || !c.archivedAt))
      .map((c) => ({
        id: c.id, name: c.name, gradeBand: c.gradeBand, subject: c.subject,
        teacherName: d.profiles[c.teacherId]?.displayName || 'Teacher',
        archivedAt: c.archivedAt, settings: c.settings,
      }));
  }
  return Object.values(d.classes)
    .filter((c) => (me.role === 'admin' || c.teacherId === me.id) && (includeArchived || !c.archivedAt))
    .sort((a, b) => (a.archivedAt ? 1 : 0) - (b.archivedAt ? 1 : 0) || a.name.localeCompare(b.name))
    .map((c) => ({ ...c, studentCount: db().classMembers.filter((m) => m.classId === c.id && !m.removedAt).length }));
}

function updateClass(classId, patch) {
  assertOwnsClass(classId);
  const allowed = ['name', 'gradeBand', 'subject', 'settings', 'codeActive', 'codeExpiresAt'];
  return commit((d) => {
    const c = d.classes[classId];
    for (const k of allowed) if (k in patch) c[k] = patch[k];
    if (patch.settings) c.settings = { ...c.settings, ...patch.settings };
    return { ...c };
  });
}

function archiveClass(classId, archived = true) {
  assertOwnsClass(classId);
  return commit((d) => {
    d.classes[classId].archivedAt = archived ? now() : null;
    /* Archiving retires the code so nobody joins a dormant class. */
    d.classes[classId].codeActive = !archived;
    return { ...d.classes[classId] };
  });
}

function regenerateJoinCode(classId) {
  assertOwnsClass(classId);
  return commit((d) => {
    const c = d.classes[classId];
    delete d.joinCodes[c.joinCode];
    const code = newCode(d);
    c.joinCode = code;
    c.codeActive = true;
    d.joinCodes[code] = classId;
    return { joinCode: code };
  });
}

/**
 * Validate one typed code.
 *
 * A function rather than a query on purpose: a student can check the single
 * code in front of them, and cannot enumerate every class in the database.
 */
function lookupClassByCode(rawCode) {
  const code = (rawCode || '').trim().toUpperCase().replace(/\s/g, '');
  const normalised = /^\d{5}$/.test(code) ? `CQ-${code}` : code;
  if (!/^CQ-\d{5}$/.test(normalised)) fail('invalid_code', 'Class codes look like CQ-48291.');
  const d = db();
  const classId = d.joinCodes[normalised];
  const cls = classId ? d.classes[classId] : null;
  if (!cls) fail('unknown_code', 'No class matches that code. Check it with your teacher.');
  if (cls.archivedAt) fail('archived_code', 'That class has been archived by the teacher.');
  if (!cls.codeActive) fail('inactive_code', 'That code has been turned off. Ask your teacher for the new one.');
  if (cls.codeExpiresAt && new Date(cls.codeExpiresAt) < new Date()) fail('expired_code', 'That code has expired. Ask your teacher for a new one.');
  return {
    classId: cls.id,
    className: cls.name,
    teacherName: d.profiles[cls.teacherId]?.displayName || 'Teacher',
    gradeBand: cls.gradeBand,
  };
}

function joinClass(rawCode) {
  const me = requireRole('student');
  const target = lookupClassByCode(rawCode);
  const d = db();
  const existing = d.classMembers.find((m) => m.classId === target.classId && m.studentId === me.id);
  if (existing && !existing.removedAt) {
    return { ...target, alreadyMember: true };
  }
  commit((dd) => {
    if (existing) {
      /* Re-joining after removal reactivates the original membership, so the
         teacher's history for this student stays in one row. */
      existing.removedAt = null;
      existing.joinedAt = now();
    } else {
      dd.classMembers.push({ id: randomId('m'), classId: target.classId, studentId: me.id, joinedAt: now(), removedAt: null });
    }
    dd.events.push({ id: randomId('e'), studentId: me.id, classId: target.classId, type: 'class_joined', payload: { className: target.className }, createdAt: now() });
  });
  flush();
  return { ...target, alreadyMember: false };
}

function leaveClass(classId) {
  const me = requireRole('student');
  commit((d) => {
    const m = d.classMembers.find((x) => x.classId === classId && x.studentId === me.id && !x.removedAt);
    if (m) m.removedAt = now();
  });
  return true;
}

function removeStudent(classId, studentId) {
  assertOwnsClass(classId);
  commit((d) => {
    const m = d.classMembers.find((x) => x.classId === classId && x.studentId === studentId && !x.removedAt);
    if (!m) fail('not_found', 'That student is not in this class.');
    m.removedAt = now();
  });
  return true;
}

function listRoster(classId) {
  assertCanReadClass(classId);
  const d = db();
  return d.classMembers
    .filter((m) => m.classId === classId && !m.removedAt)
    .map((m) => ({ ...publicProfile(d.profiles[m.studentId]), joinedAt: m.joinedAt }))
    .filter((p) => p.id)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/* ================================================================= PLAY === */

const attemptsFor = (studentId, lessonId = null) =>
  Object.values(db().attempts)
    .filter((a) => a.studentId === studentId && (!lessonId || a.lessonId === lessonId))
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

const responsesFor = (studentId) => db().responses.filter((r) => r.studentId === studentId);

function logEvent(type, payload = {}) {
  const me = session();
  if (!me) return;
  commit((d) => {
    d.events.push({
      id: randomId('e'), studentId: me.id, classId: payload.classId || null,
      type, lessonId: payload.lessonId || null, skillId: payload.skillId || null,
      payload, createdAt: now(),
    });
  });
}

/**
 * Start or resume an attempt.
 *
 * An open attempt on the same lesson is always resumed rather than replaced —
 * that is what makes "Continue playing" reliable across a closed laptop, a
 * refreshed tab or a different class period.
 */
function startAttempt({ lessonId, assignmentId = null, restart = false }) {
  const me = requireRole('student', 'teacher', 'admin');
  const open = attemptsFor(me.id, lessonId).find((a) => !a.completedAt && !a.abandonedAt);
  if (open && !restart) {
    logEvent('lesson_resumed', { lessonId, attemptId: open.id });
    return { ...open, resumed: true };
  }
  if (open && restart) commit((d) => { d.attempts[open.id].abandonedAt = now(); });

  const id = randomId('at');
  const attempt = {
    id, studentId: me.id, lessonId, lessonVersion: 1, assignmentId,
    startedAt: now(), updatedAt: now(), completedAt: null, abandonedAt: null,
    score: 0, maxScore: 0, questionsAnswered: 0, questionsCorrect: 0,
    secondsSpent: 0, state: {},
  };
  commit((d) => { d.attempts[id] = attempt; });
  logEvent('lesson_started', { lessonId, attemptId: id, assignmentId });
  return { ...attempt, resumed: false };
}

/**
 * Grade one answer and record it.
 *
 * The correct answer is compared here and only the verdict plus explanation go
 * back, mirroring cq_submit_response() in the SQL schema — so the client-side
 * code path is already the one that works when grading moves to the server.
 */
async function submitResponse({ attemptId, questionId, response, msElapsed = null }) {
  const me = requireUser();
  const attempt = db().attempts[attemptId];
  if (!attempt || attempt.studentId !== me.id) fail('not_found', 'That attempt is not yours.');
  if (attempt.completedAt) fail('closed', 'That attempt has already been submitted.');

  const { questions } = await import('../../content/bank.json').then((m) => m.default);
  const q = questions[questionId];
  if (!q) fail('not_found', 'That question no longer exists.');

  const isCorrect = JSON.stringify(q.answer) === JSON.stringify(response);
  commit((d) => {
    d.responses.push({
      id: randomId('r'), attemptId, studentId: me.id, questionId,
      lessonId: attempt.lessonId, skillId: q.skillId, isCorrect,
      difficulty: q.difficulty, response, msElapsed,
      attemptNo: attempt.questionsAnswered + 1, answeredAt: now(),
    });
    const a = d.attempts[attemptId];
    a.questionsAnswered += 1;
    if (isCorrect) a.questionsCorrect += 1;
    a.updatedAt = now();
  });
  logEvent(isCorrect ? 'question_correct' : 'question_incorrect', {
    lessonId: attempt.lessonId, skillId: q.skillId, questionId, difficulty: q.difficulty,
  });
  return { isCorrect, explanation: q.explanation, answer: isCorrect ? q.answer : null, skillId: q.skillId };
}

/** Checkpoint. Written after every answer so a drop costs at most one question. */
function saveCheckpoint({ attemptId, state, secondsSpent }) {
  const me = requireUser();
  const a = db().attempts[attemptId];
  if (!a || a.studentId !== me.id) fail('not_found', 'That attempt is not yours.');
  commit((d) => {
    const at = d.attempts[attemptId];
    at.state = { ...at.state, ...state };
    if (secondsSpent != null) at.secondsSpent = secondsSpent;
    at.updatedAt = now();
  });
  return true;
}

/**
 * Close an attempt out, then recompute everything that depends on it: lesson
 * progress, skill mastery, XP and achievements. Returns exactly what changed
 * so the UI can celebrate the right things and nothing else.
 */
async function completeAttempt({ attemptId, score, maxScore, secondsSpent, state }) {
  const me = requireUser();
  const raw = db().attempts[attemptId];
  if (!raw || raw.studentId !== me.id) fail('not_found', 'That attempt is not yours.');
  if (raw.completedAt) return { alreadyComplete: true };

  const catalog = await loadCatalog();
  const lesson = catalog.lesson(raw.lessonId);
  const priorAttempts = attemptsFor(me.id, raw.lessonId).filter((a) => a.id !== attemptId);
  const priorProgress = computeLessonProgress(priorAttempts);
  const priorSkill = {};
  for (const s of lesson?.skills || []) {
    priorSkill[s.skillId] = computeMastery(responsesFor(me.id).filter((r) => r.skillId === s.skillId));
  }

  const finalScore = Number(score) || 0;
  const finalMax = Number(maxScore) || 0;
  const pct = finalMax > 0 ? (finalScore / finalMax) * 100 : 0;

  commit((d) => {
    const a = d.attempts[attemptId];
    a.completedAt = now();
    a.updatedAt = now();
    a.score = finalScore;
    a.maxScore = finalMax;
    if (secondsSpent != null) a.secondsSpent = secondsSpent;
    if (state) a.state = { ...a.state, ...state };
  });

  /* --- XP ---------------------------------------------------------------- */
  const awards = xpForCompletion({
    scorePct: pct,
    previousBest: priorProgress.bestScore,
    isFirstCompletion: priorProgress.completions === 0,
    isChallenge: lesson?.format === 'battle',
  });
  if (lesson?.format === 'brief' && priorProgress.completions === 0) {
    awards.length = 0;
    awards.push({ amount: lesson.xpAward, reason: 'Brief read' });
  }

  /* --- skill mastery, recomputed from all evidence ----------------------- */
  const masteryChanges = [];
  const allResponses = responsesFor(me.id);
  for (const s of lesson?.skills || []) {
    const after = computeMastery(allResponses.filter((r) => r.skillId === s.skillId));
    const before = priorSkill[s.skillId];
    if (after.level !== before.level) {
      masteryChanges.push({
        skillId: s.skillId,
        skillName: catalog.skill(s.skillId)?.name || s.skillId,
        from: before.level, to: after.level, pct: after.pct, growth: after.growth,
      });
      if (after.level === 'mastered') awards.push({ amount: 100, reason: `Mastered ${catalog.skill(s.skillId)?.name}` });
    }
  }

  const totalXp = awards.reduce((a, x) => a + x.amount, 0);
  if (totalXp) {
    commit((d) => {
      d.profiles[me.id].xpTotal = (d.profiles[me.id].xpTotal || 0) + totalXp;
      for (const a of awards) {
        d.xp.push({ id: randomId('x'), studentId: me.id, amount: a.amount, reason: a.reason, refType: 'lesson', refId: raw.lessonId, createdAt: now() });
      }
    });
  }

  logEvent('lesson_completed', {
    lessonId: raw.lessonId, attemptId, scorePct: Math.round(pct),
    xp: totalXp, assignmentId: raw.assignmentId,
  });
  for (const c of masteryChanges) {
    if (c.to === 'mastered') logEvent('skill_mastered', { skillId: c.skillId, lessonId: raw.lessonId });
  }

  /* --- achievements ----------------------------------------------------- */
  const earned = await evaluateAchievements(me.id, {
    catalog,
    attempts: attemptsFor(me.id),
    responses: allResponses,
    already: db().achievements.filter((a) => a.studentId === me.id).map((a) => a.achievementId),
  });
  if (earned.length) {
    commit((d) => {
      for (const a of earned) {
        d.achievements.push({ studentId: me.id, achievementId: a.id, earnedAt: now() });
        d.profiles[me.id].xpTotal = (d.profiles[me.id].xpTotal || 0) + (a.xp || 0);
        if (a.xp) d.xp.push({ id: randomId('x'), studentId: me.id, amount: a.xp, reason: `Achievement: ${a.name}`, refType: 'achievement', refId: a.id, createdAt: now() });
      }
    });
    for (const a of earned) logEvent('achievement_earned', { achievementId: a.id });
  }

  flush();
  const xpTotal = db().profiles[me.id].xpTotal;
  const progress = computeLessonProgress(attemptsFor(me.id, raw.lessonId));
  return {
    scorePct: Math.round(pct),
    progress,
    previousBest: priorProgress.bestScore,
    isPersonalBest: priorProgress.bestScore != null && pct > priorProgress.bestScore,
    isFirstCompletion: priorProgress.completions === 0,
    awards, xpEarned: totalXp, xpTotal,
    rank: rankForXp(xpTotal), nextRank: nextRank(xpTotal),
    masteryChanges, achievements: earned,
  };
}

function abandonAttempt(attemptId) {
  const me = requireUser();
  const a = db().attempts[attemptId];
  if (!a || a.studentId !== me.id) return false;
  commit((d) => { d.attempts[attemptId].abandonedAt = now(); });
  return true;
}

export {
  PlatformError as _PlatformError,
  session as _session, requireUser as _requireUser, publicProfile as _publicProfile,
  teachesStudent as _teachesStudent, assertCanReadStudent as _assertCanReadStudent,
  assertOwnsClass as _assertOwnsClass, assertCanReadClass as _assertCanReadClass,
  inClass as _inClass, activeMemberships as _activeMemberships,
  attemptsFor as _attemptsFor, responsesFor as _responsesFor, logEvent as _logEvent,
  fail as _fail, now as _now,
};

export const authApi = {
  signUpTeacher, signUpStudent, signIn, signOut, currentUser, changePassword,
  resetWithRecovery, resetStudentPassword, updateProfile, deleteOwnAccount,
  isMemoryOnly,
};

export const classApi = {
  createClass, listMyClasses, updateClass, archiveClass, regenerateJoinCode,
  lookupClassByCode, joinClass, leaveClass, removeStudent, listRoster,
};

export const playApi = {
  startAttempt, submitResponse, saveCheckpoint, completeAttempt, abandonAttempt,
};

/* --------------------------------------------------- legacy XP migration --- */
/** Carries over XP and coins from the pre-rebuild browser passport, once. */
async function migrateLegacyPassport(profileId) {
  const legacy = readLegacyPassport();
  if (!legacy || db().meta.migratedLegacy) return false;
  const xp = Number(legacy.xp) || 0;
  if (xp <= 0) {
    commit((d) => { d.meta.migratedLegacy = true; });
    return false;
  }
  commit((d) => {
    d.profiles[profileId].xpTotal = (d.profiles[profileId].xpTotal || 0) + xp;
    d.xp.push({
      id: randomId('x'), studentId: profileId, amount: xp,
      reason: 'Carried over from your old Quest Passport', refType: 'migration', refId: 'v1',
      createdAt: now(),
    });
    d.meta.migratedLegacy = true;
  });
  return true;
}

export const _internal = { migrateLegacyPassport, resetStore, db, commit, flush };
