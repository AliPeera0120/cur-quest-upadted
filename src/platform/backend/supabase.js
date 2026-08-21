/* ============================================================================
   Postgres / Supabase backend.

   Implements the same interface as backend/local.js against the schema in
   supabase/migrations/0001_init.sql. The important difference is not the
   transport — it is that authorisation stops being advisory: every statement
   below runs under the row-level-security policies in that migration, so a
   crafted request cannot reach another student's rows even if this file had a
   bug in it.

   To switch a deployment over:

     1. create a Supabase project and run the migration
     2. run `npm run content:push` to load strands, skills, lessons and
        questions into the content tables
     3. set VITE_CQ_BACKEND=supabase, VITE_SUPABASE_URL and
        VITE_SUPABASE_ANON_KEY
     4. deploy — the frontend stays static, so GitHub Pages still works

   Student sign-in stays username-based. Supabase auth needs an email, so the
   username is mapped to `<username>@students.curiosity-quest.org`, which is
   never displayed, never mailed and never treated as a contact address. That
   keeps the child-data footprint to a display name and a username.
   ========================================================================= */

import { computeMastery, computeLessonProgress, rollUp, rankForXp, nextRank, xpForCompletion } from '../mastery.js';
import { loadCatalog } from '../../content/index.js';
import { recommendFor, classInsights } from '../recommend.js';

const STUDENT_EMAIL_DOMAIN = 'students.curiosity-quest.org';
const emailForUsername = (u) => `${String(u).trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

class SupabaseError extends Error {
  constructor(code, message) { super(message); this.code = code; this.name = 'PlatformError'; }
}
const fail = (code, msg) => { throw new SupabaseError(code, msg); };
const unwrap = ({ data, error }) => {
  if (error) fail(error.code || 'db_error', error.message);
  return data;
};

export async function createSupabaseBackend() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) fail('not_configured', 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');

  /* Imported dynamically so a local-only build never bundles the client. */
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  const me = async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const rows = unwrap(await sb.from('profiles').select('*').eq('id', user.id).is('deleted_at', null).limit(1));
    return rows?.[0] ? camel(rows[0]) : null;
  };

  const requireMe = async () => (await me()) || fail('unauthenticated', 'You need to be signed in.');

  /* ------------------------------------------------------------- auth ---- */
  async function signUpTeacher({ email, password, displayName, schoolName }) {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) fail('signup_failed', error.message);
    const id = data.user?.id;
    if (!id) fail('signup_failed', 'Check your email to confirm the account, then sign in.');
    unwrap(await sb.from('profiles').insert({
      id, role: 'teacher', username: email.toLowerCase(),
      display_name: displayName, school_name: schoolName || null, avatar_key: 'circuit',
    }));
    return { profile: await me(), recoveryPhrase: null };
  }

  async function signUpStudent({ username, password, displayName, joinCode, avatarKey = 'beaker', gradeBand }) {
    let target = null;
    if (joinCode) target = await lookupClassByCode(joinCode);
    const { data, error } = await sb.auth.signUp({ email: emailForUsername(username), password });
    if (error) fail(error.message.includes('already') ? 'taken' : 'signup_failed', error.message);
    const id = data.user?.id;
    if (!id) fail('signup_failed', 'Could not create that account.');
    unwrap(await sb.from('profiles').insert({
      id, role: 'student', username: username.toLowerCase(),
      display_name: displayName, avatar_key: avatarKey, grade_band: gradeBand || null,
    }));
    if (target) unwrap(await sb.from('class_members').insert({ class_id: target.classId, student_id: id }));
    return { profile: await me(), joinedClass: target };
  }

  async function signIn({ identifier, password }) {
    const email = identifier.includes('@') ? identifier.trim().toLowerCase() : emailForUsername(identifier);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) fail('bad_credentials', 'That username or password is not right.');
    const profile = await me();
    if (profile) await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', profile.id);
    return profile;
  }

  const signOut = async () => { await sb.auth.signOut(); return true; };

  async function changePassword({ newPassword }) {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) fail('weak_password', error.message);
    return true;
  }

  async function updateProfile(patch) {
    const u = await requireMe();
    const row = {};
    if ('displayName' in patch) row.display_name = patch.displayName;
    if ('avatarKey' in patch) row.avatar_key = patch.avatarKey;
    if ('title' in patch) row.title = patch.title;
    if ('gradeBand' in patch) row.grade_band = patch.gradeBand;
    if ('schoolName' in patch) row.school_name = patch.schoolName;
    if ('settings' in patch) row.settings = patch.settings;
    unwrap(await sb.from('profiles').update(row).eq('id', u.id));
    return me();
  }

  async function deleteOwnAccount() {
    unwrap(await sb.rpc('cq_delete_own_account'));
    await sb.auth.signOut();
    return true;
  }

  /* ---------------------------------------------------------- classes ---- */
  async function createClass({ name, gradeBand, subject }) {
    const u = await requireMe();
    const code = unwrap(await sb.rpc('cq_new_join_code'));
    const rows = unwrap(await sb.from('classes').insert({
      teacher_id: u.id, name, grade_band: gradeBand || null, subject: subject || null, join_code: code,
    }).select());
    return camel(rows[0]);
  }

  async function listMyClasses({ includeArchived = false } = {}) {
    const u = await requireMe();
    if (u.role === 'student') {
      const rows = unwrap(await sb.from('class_members')
        .select('joined_at, classes(id,name,grade_band,subject,archived_at,settings,teacher_id,profiles!classes_teacher_id_fkey(display_name))')
        .eq('student_id', u.id).is('removed_at', null));
      return rows.map((r) => ({
        id: r.classes.id, name: r.classes.name, gradeBand: r.classes.grade_band,
        subject: r.classes.subject, archivedAt: r.classes.archived_at,
        settings: r.classes.settings, joinedAt: r.joined_at,
        teacherName: r.classes.profiles?.display_name || 'Teacher',
      })).filter((c) => includeArchived || !c.archivedAt);
    }
    let q = sb.from('classes').select('*, class_members(count)').eq('teacher_id', u.id);
    if (!includeArchived) q = q.is('archived_at', null);
    return unwrap(await q).map((c) => ({ ...camel(c), studentCount: c.class_members?.[0]?.count ?? 0 }));
  }

  const updateClass = async (classId, patch) => camel(unwrap(await sb.from('classes')
    .update(snake(patch)).eq('id', classId).select())[0]);

  const archiveClass = async (classId, archived = true) => camel(unwrap(await sb.from('classes')
    .update({ archived_at: archived ? new Date().toISOString() : null, code_active: !archived })
    .eq('id', classId).select())[0]);

  async function regenerateJoinCode(classId) {
    const code = unwrap(await sb.rpc('cq_new_join_code'));
    unwrap(await sb.from('classes').update({ join_code: code, code_active: true }).eq('id', classId));
    return { joinCode: code };
  }

  /** Uses the security-definer lookup so a student cannot enumerate classes. */
  async function lookupClassByCode(rawCode) {
    const code = (rawCode || '').trim().toUpperCase().replace(/\s/g, '');
    const normalised = /^\d{5}$/.test(code) ? `CQ-${code}` : code;
    if (!/^CQ-\d{5}$/.test(normalised)) fail('invalid_code', 'Class codes look like CQ-48291.');
    const rows = unwrap(await sb.rpc('cq_lookup_class', { code: normalised }));
    if (!rows?.length) fail('unknown_code', 'No class matches that code. Check it with your teacher.');
    return { classId: rows[0].class_id, className: rows[0].class_name, teacherName: rows[0].teacher_name };
  }

  async function joinClass(rawCode) {
    const u = await requireMe();
    const target = await lookupClassByCode(rawCode);
    const existing = unwrap(await sb.from('class_members').select('id,removed_at')
      .eq('class_id', target.classId).eq('student_id', u.id).limit(1));
    if (existing?.length) {
      if (!existing[0].removed_at) return { ...target, alreadyMember: true };
      unwrap(await sb.from('class_members').update({ removed_at: null, joined_at: new Date().toISOString() }).eq('id', existing[0].id));
      return { ...target, alreadyMember: false };
    }
    unwrap(await sb.from('class_members').insert({ class_id: target.classId, student_id: u.id }));
    await sb.from('learning_events').insert({ student_id: u.id, class_id: target.classId, type: 'class_joined', payload: { className: target.className } });
    return { ...target, alreadyMember: false };
  }

  async function leaveClass(classId) {
    const u = await requireMe();
    unwrap(await sb.from('class_members').update({ removed_at: new Date().toISOString() })
      .eq('class_id', classId).eq('student_id', u.id).is('removed_at', null));
    return true;
  }

  async function removeStudent(classId, studentId) {
    unwrap(await sb.from('class_members').update({ removed_at: new Date().toISOString() })
      .eq('class_id', classId).eq('student_id', studentId).is('removed_at', null));
    return true;
  }

  async function listRoster(classId) {
    const rows = unwrap(await sb.from('class_members')
      .select('joined_at, profiles(id,display_name,avatar_key,username,xp_total,role,last_seen_at)')
      .eq('class_id', classId).is('removed_at', null));
    return rows.map((r) => ({ ...camel(r.profiles), joinedAt: r.joined_at }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /* -------------------------------------------------------------- play --- */
  async function startAttempt({ lessonId, assignmentId = null, restart = false }) {
    const u = await requireMe();
    const open = unwrap(await sb.from('attempts').select('*')
      .eq('student_id', u.id).eq('lesson_id', lessonId)
      .is('completed_at', null).is('abandoned_at', null)
      .order('updated_at', { ascending: false }).limit(1));
    if (open?.length && !restart) return { ...camel(open[0]), resumed: true };
    if (open?.length && restart) {
      await sb.from('attempts').update({ abandoned_at: new Date().toISOString() }).eq('id', open[0].id);
    }
    const rows = unwrap(await sb.from('attempts')
      .insert({ student_id: u.id, lesson_id: lessonId, assignment_id: assignmentId }).select());
    await sb.from('learning_events').insert({ student_id: u.id, type: 'lesson_started', lesson_id: lessonId });
    return { ...camel(rows[0]), resumed: false };
  }

  /** Grading happens in Postgres; the answer key never reaches the browser. */
  async function submitResponse({ attemptId, questionId, response, msElapsed = null }) {
    const rows = unwrap(await sb.rpc('cq_submit_response', {
      p_attempt: attemptId, p_question: questionId, p_response: response, p_ms: msElapsed,
    }));
    const r = rows?.[0] || {};
    return { isCorrect: !!r.is_correct, explanation: r.explanation, answer: r.answer };
  }

  async function saveCheckpoint({ attemptId, state, secondsSpent }) {
    const patch = { state, updated_at: new Date().toISOString() };
    if (secondsSpent != null) patch.seconds_spent = secondsSpent;
    unwrap(await sb.from('attempts').update(patch).eq('id', attemptId));
    return true;
  }

  async function completeAttempt({ attemptId, score, maxScore, secondsSpent, state }) {
    const u = await requireMe();
    const before = camel(unwrap(await sb.from('attempts').select('*').eq('id', attemptId).limit(1))[0]);
    const catalog = await loadCatalog();
    const lesson = catalog.lesson(before.lessonId);

    const prior = unwrap(await sb.from('attempts').select('*')
      .eq('student_id', u.id).eq('lesson_id', before.lessonId).neq('id', attemptId)).map(camel);
    const priorProgress = computeLessonProgress(prior);

    unwrap(await sb.from('attempts').update({
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      score, max_score: maxScore,
      ...(secondsSpent != null ? { seconds_spent: secondsSpent } : null),
      ...(state ? { state } : null),
    }).eq('id', attemptId));

    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const awards = xpForCompletion({
      scorePct: pct, previousBest: priorProgress.bestScore,
      isFirstCompletion: priorProgress.completions === 0,
      isChallenge: lesson?.format === 'battle',
    });

    /* Recompute mastery for the touched skills from the response history. */
    const skillIds = (lesson?.skills || []).map((s) => s.skillId);
    const masteryChanges = [];
    if (skillIds.length) {
      const rs = unwrap(await sb.from('responses').select('*')
        .eq('student_id', u.id).in('skill_id', skillIds)).map(camel);
      const beforeRows = unwrap(await sb.from('skill_mastery').select('*')
        .eq('student_id', u.id).in('skill_id', skillIds)).map(camel);
      const beforeBySkill = Object.fromEntries(beforeRows.map((r) => [r.skillId, r]));
      const ups = [];
      for (const skillId of skillIds) {
        const m = computeMastery(rs.filter((r) => r.skillId === skillId));
        ups.push({
          student_id: u.id, skill_id: skillId, level: m.level, pct: m.pct,
          evidence: m.evidence, sessions: m.sessions, first_pct: m.firstPct,
          latest_pct: m.latestPct, growth: m.growth, updated_at: new Date().toISOString(),
        });
        const prevLevel = beforeBySkill[skillId]?.level || 'not_started';
        if (prevLevel !== m.level) {
          masteryChanges.push({ skillId, skillName: catalog.skill(skillId)?.name, from: prevLevel, to: m.level, pct: m.pct, growth: m.growth });
          if (m.level === 'mastered') awards.push({ amount: 100, reason: `Mastered ${catalog.skill(skillId)?.name}` });
        }
      }
      unwrap(await sb.from('skill_mastery').upsert(ups, { onConflict: 'student_id,skill_id' }));
    }

    const totalXp = awards.reduce((a, x) => a + x.amount, 0);
    if (totalXp) {
      unwrap(await sb.from('xp_transactions').insert(awards.map((a) => ({
        student_id: u.id, amount: a.amount, reason: a.reason, ref_type: 'lesson', ref_id: before.lessonId,
      }))));
      unwrap(await sb.from('profiles').update({ xp_total: (u.xpTotal || 0) + totalXp }).eq('id', u.id));
    }
    await sb.from('learning_events').insert({
      student_id: u.id, type: 'lesson_completed', lesson_id: before.lessonId,
      payload: { scorePct: Math.round(pct), xp: totalXp },
    });

    const all = unwrap(await sb.from('attempts').select('*')
      .eq('student_id', u.id).eq('lesson_id', before.lessonId)).map(camel);
    const xpTotal = (u.xpTotal || 0) + totalXp;
    return {
      scorePct: Math.round(pct),
      progress: computeLessonProgress(all),
      previousBest: priorProgress.bestScore,
      isPersonalBest: priorProgress.bestScore != null && pct > priorProgress.bestScore,
      isFirstCompletion: priorProgress.completions === 0,
      awards, xpEarned: totalXp, xpTotal,
      rank: rankForXp(xpTotal), nextRank: nextRank(xpTotal),
      masteryChanges, achievements: [],
    };
  }

  const abandonAttempt = async (attemptId) => {
    unwrap(await sb.from('attempts').update({ abandoned_at: new Date().toISOString() }).eq('id', attemptId));
    return true;
  };

  /* --------------------------------------------------------- analytics ---
     The heavy dashboard aggregations are shared with the local backend by
     reading rows and running the same pure functions. When a deployment grows
     past a few hundred students these become Postgres views; the function
     signatures do not change. */
  const { buildAnalytics } = await import('./supabase-analytics.js');
  const analytics = buildAnalytics({ sb, unwrap, camel, requireMe, fail });

  const { contentApi } = await import('./local-content.js');

  return {
    name: 'supabase',
    signUpTeacher, signUpStudent, signIn, signOut, currentUser: me, changePassword,
    updateProfile, deleteOwnAccount,
    resetWithRecovery: async () => fail('unsupported', 'Use the "forgot password" email flow on this backend.'),
    resetStudentPassword: async () => fail('unsupported', 'Student password resets need the admin API on this backend.'),
    isMemoryOnly: () => false,
    createClass, listMyClasses, updateClass, archiveClass, regenerateJoinCode,
    lookupClassByCode, joinClass, leaveClass, removeStudent, listRoster,
    startAttempt, submitResponse, saveCheckpoint, completeAttempt, abandonAttempt,
    ...analytics,
    ...contentApi,
  };
}

/* --------------------------------------------------------- key mapping --- */
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (row) => (row && typeof row === 'object' && !Array.isArray(row)
  ? Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]))
  : row);
const snake = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [toSnake(k), v]));
