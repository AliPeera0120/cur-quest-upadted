import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, initBackend, backendName, isLocalBackend } from './api.js';

/* ============================================================================
   Session state and route guards.

   The guards here are convenience, not security: they decide what to render.
   Authorisation is enforced in the backend — the local backend throws from its
   assert helpers, and the Postgres backend is additionally protected by the
   row-level-security policies in the migration. A student who edits the URL
   sees an error, not another child's data.
   ========================================================================= */

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await initBackend();
      if (!alive) return;
      try { setUser(await api.currentUser()); } catch { setUser(null); }
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const refresh = useCallback(async () => {
    const u = await api.currentUser();
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    backend: backendName(),
    isLocal: isLocalBackend(),
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isAdmin: user?.role === 'admin',
    refresh,
    async signIn(creds) { const u = await api.signIn(creds); setUser(u); return u; },
    async signUpStudent(input) { const r = await api.signUpStudent(input); setUser(r.profile); return r; },
    async signUpTeacher(input) { const r = await api.signUpTeacher(input); setUser(r.profile); return r; },
    async signOut() { await api.signOut(); setUser(null); },
    async updateProfile(patch) { const u = await api.updateProfile(patch); setUser(u); return u; },
    async deleteAccount() { await api.deleteOwnAccount(); setUser(null); },
  }), [user, ready, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Where a signed-in user belongs. */
export const homeFor = (user) =>
  user?.role === 'teacher' ? '/arena/teach'
  : user?.role === 'admin' ? '/arena/admin'
  : '/arena/home';

export function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <RouteSpinner />;
  if (!user) return <Navigate to="/arena/sign-in" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return children;
}

/** Sends an already-signed-in visitor away from the sign-in screens. */
export function RedirectIfSignedIn({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <RouteSpinner />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export function RouteSpinner({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <div className="text-center">
        <svg viewBox="0 0 24 24" width="26" height="26" className="mx-auto animate-spin text-ink-400" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="mt-3 font-mono text-micro uppercase tracking-label text-ink-600">{label}</p>
      </div>
    </div>
  );
}
