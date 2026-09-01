/* ============================================================================
   The platform API.

   Every screen talks to this object and nothing else. Swapping the browser
   backend for Postgres is a change in this one file, because the two backends
   implement the same method names with the same shapes.

   Choose the backend with an env var at build time:

     VITE_CQ_BACKEND=local      (default)  browser storage, no infrastructure
     VITE_CQ_BACKEND=supabase              needs VITE_SUPABASE_URL and
                                           VITE_SUPABASE_ANON_KEY

   Errors are always PlatformError with a stable `code`, so the UI can show a
   useful message without string-matching.
   ========================================================================= */

import { authApi, classApi, playApi, PlatformError, _internal } from './backend/local.js';
import { analyticsApi } from './backend/local-analytics.js';
import { contentApi } from './backend/local-content.js';

const BACKEND = import.meta.env?.VITE_CQ_BACKEND || 'local';

const localBackend = {
  name: 'local',
  ...authApi,
  ...classApi,
  ...playApi,
  ...analyticsApi,
  ...contentApi,
};

let active = localBackend;

/**
 * Lazily swap in the server backend. Kept dynamic so a build with no Supabase
 * configured never pulls its client into the bundle.
 */
export async function initBackend() {
  if (BACKEND !== 'supabase') return active;
  try {
    const mod = await import('./backend/supabase.js');
    active = await mod.createSupabaseBackend();
    return active;
  } catch (err) {
    console.error('[CuriosityQuest] Supabase backend unavailable, staying on local storage.', err);
    return active;
  }
}

export const backendName = () => active.name;
export const isLocalBackend = () => active.name === 'local';

/**
 * A thin proxy so `api.whatever()` always hits the current backend, even if
 * initBackend() resolves after the first render.
 *
 * Every call is normalised to a Promise. The local backend can answer some
 * questions synchronously and Postgres never can, and callers should not have
 * to know which is which — without this, `api.saveCheckpoint(...).catch(...)`
 * works against one backend and throws against the other.
 */
export const api = new Proxy({}, {
  get(_t, key) {
    if (key === 'then') return undefined; /* the proxy is not itself a thenable */
    return (...args) => {
      const fn = active[key];
      if (typeof fn !== 'function') {
        return Promise.reject(
          new PlatformError('not_implemented', `${String(key)} is not available on the ${active.name} backend.`),
        );
      }
      try {
        return Promise.resolve(fn(...args));
      } catch (err) {
        return Promise.reject(err);
      }
    };
  },
});

/**
 * Synchronous escape hatch for the handful of pure predicates the UI needs
 * during render (storage availability, backend name). Never used for data.
 */
export const apiSync = {
  isMemoryOnly: () => {
    try { return !!active.isMemoryOnly?.(); } catch { return false; }
  },
};

export { PlatformError };
export const devTools = _internal;
