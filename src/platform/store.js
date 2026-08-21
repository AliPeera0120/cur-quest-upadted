/* ============================================================================
   Versioned JSON store for the local backend.

   One key in localStorage holds the whole database. Writes are debounced and
   batched so a fast quiz doesn't thrash storage, and a corrupt or full store
   degrades to an in-memory session rather than throwing the app away.
   ========================================================================= */

const KEY = 'cq_platform_v2';
const LEGACY_KEY = 'cq_quest_passport_v1';

export const EMPTY_DB = () => ({
  version: 2,
  profiles: {},          // id -> profile (includes secret {salt,hash})
  usernames: {},         // lowercased username -> profile id
  classes: {},           // id -> class
  joinCodes: {},         // code -> class id
  classMembers: [],      // { id, classId, studentId, joinedAt, removedAt }
  attempts: {},          // id -> attempt
  responses: [],         // flat list
  assignments: {},       // id -> assignment
  events: [],            // capped activity stream
  achievements: [],      // { studentId, achievementId, earnedAt }
  xp: [],                // { studentId, amount, reason, refType, refId, createdAt }
  classGoals: {},        // id -> goal
  contentOverrides: {},  // admin-authored / edited lessons keyed by lesson id
  session: null,         // { profileId, startedAt }
  meta: { seeded: false, migratedLegacy: false },
});

let cache = null;
let flushTimer = null;
let memoryOnly = false;

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 2) return null;
    return { ...EMPTY_DB(), ...parsed };
  } catch {
    return null;
  }
};

export function db() {
  if (cache) return cache;
  cache = read() || EMPTY_DB();
  return cache;
}

function writeNow() {
  flushTimer = null;
  if (memoryOnly || !cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (err) {
    /* Quota exceeded or storage disabled. Trim the least valuable data first
       — the event stream — and try once more before falling back to memory. */
    if (cache.events.length > 200) {
      cache.events = cache.events.slice(-200);
      try { localStorage.setItem(KEY, JSON.stringify(cache)); return; } catch { /* fall through */ }
    }
    memoryOnly = true;
    console.warn('[CuriosityQuest] Local storage unavailable — progress will only last for this session.', err);
  }
}

/** Mutate the database and schedule a flush. */
export function commit(mutator) {
  const d = db();
  const result = mutator(d);
  if (d.events.length > 4000) d.events = d.events.slice(-3000);
  if (d.responses.length > 60000) d.responses = d.responses.slice(-50000);
  if (!flushTimer) flushTimer = setTimeout(writeNow, 120);
  return result;
}

/** Force a synchronous flush — used before unload and after auth changes. */
export function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  writeNow();
}

export function resetStore() {
  cache = EMPTY_DB();
  flush();
}

export const isMemoryOnly = () => memoryOnly;

/** Read the pre-rebuild passport, so a returning visitor keeps their XP. */
export function readLegacyPassport() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  /* Keep tabs consistent on the same device. */
  window.addEventListener('storage', (e) => { if (e.key === KEY) cache = null; });
}
