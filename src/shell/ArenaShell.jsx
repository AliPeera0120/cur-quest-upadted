import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home, Compass, TrendingUp, ClipboardList, Award, LogOut, Menu, X,
  LayoutDashboard, Users, Lightbulb, Zap, Library, Settings, BookOpen,
  ChevronRight, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { Avatar, Badge, Button, cn } from '@/components/cq';
import { useAuth } from '@/platform/auth.jsx';
import { apiSync } from '@/platform/api.js';
import { rankForXp } from '@/platform/mastery.js';

/**
 * The platform shell.
 *
 * Students, teachers and admins share the design system but get genuinely
 * different navigation, because they are doing different jobs: the student's is
 * short and verb-led, the teacher's is organised around classes and evidence,
 * the admin's around content.
 *
 * Only the lesson player goes dark and full-bleed — that is a game screen. The
 * rest of the platform stays on the same light surfaces as the public site so
 * moving between them feels like one product.
 */
const STUDENT_NAV = [
  { to: '/arena/home',         label: 'Home',      icon: Home },
  { to: '/arena/explore',      label: 'Explore',   icon: Compass },
  { to: '/arena/assignments',  label: 'Missions',  icon: ClipboardList },
  { to: '/arena/progress',     label: 'Progress',  icon: TrendingUp },
  { to: '/arena/achievements', label: 'Badges',    icon: Award },
];

const TEACHER_NAV = [
  { to: '/arena/teach',             label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/arena/teach/classes',     label: 'Classes',     icon: Users },
  { to: '/arena/teach/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/arena/teach/library',     label: 'Lessons',     icon: Library },
  { to: '/arena/teach/quick',       label: 'Quick play',  icon: Zap },
];

const ADMIN_NAV = [
  { to: '/arena/admin',         label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/arena/admin/lessons', label: 'Lessons',  icon: BookOpen },
  { to: '/arena/admin/skills',  label: 'Skills',   icon: Lightbulb },
  { to: '/arena/admin/content', label: 'Export',   icon: Settings },
];

export default function ArenaShell() {
  const { user, signOut, isLocal } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryOnly, setMemoryOnly] = useState(false);

  const nav = user?.role === 'teacher' ? TEACHER_NAV : user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
  const isStudent = user?.role === 'student';

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    setMemoryOnly(apiSync.isMemoryOnly());
  }, [user]);

  /* The lesson player and classroom projection take over the viewport. */
  const immersive = /\/arena\/(play|teach\/classroom)\//.test(pathname);
  if (immersive) {
    return (
      <div className="min-h-dvh">
        <a href="#main" className="cq-skip">Skip to content</a>
        <main id="main"><Outlet /></main>
      </div>
    );
  }

  const rank = isStudent ? rankForXp(user?.xpTotal || 0) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-paper-2">
      <a href="#main" className="cq-skip">Skip to content</a>

      <header className="sticky top-0 z-header border-b border-line bg-white/92 backdrop-blur-md">
        <div className="cq-container cq-container--wide">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link to={user ? '/arena/home' : '/arena'} className="flex shrink-0 items-center gap-2 no-underline">
                <img src="/images/logo.png" alt="" width="32" height="32" className="h-8 w-8 object-contain" />
                <span className="hidden font-display text-[0.9375rem] font-bold tracking-[-0.02em] text-ink-900 sm:inline">
                  Science <span className="text-blue-600">Arena</span>
                </span>
              </Link>
              <span aria-hidden="true" className="hidden h-6 w-px bg-line cb:block" />
              <nav className="hidden items-center gap-0.5 cb:flex" aria-label={`${user?.role || 'student'} navigation`}>
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => cn(
                      'flex h-9 items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-sm font-medium no-underline transition-colors duration-1',
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                    )}
                  >
                    <item.icon size={15} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isStudent ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge tone="ember" title={`${user.xpTotal} discovery points`}>
                    {(user.xpTotal || 0).toLocaleString()} DP
                  </Badge>
                  <span className="hidden text-xs font-medium text-ink-500 cb:inline">{rank.title}</span>
                </div>
              ) : null}
              <Link
                to="/arena/profile"
                className="flex h-10 items-center gap-2 rounded-sm px-1.5 no-underline hover:bg-ink-50"
              >
                <Avatar name={user?.displayName || '?'} avatarKey={user?.avatarKey} size={30} />
                <span className="hidden max-w-[9rem] truncate text-sm font-medium text-ink-900 cb:inline">
                  {user?.displayName}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="arena-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="grid h-10 w-10 place-items-center rounded-sm border border-line bg-white text-ink-700 shadow-xs cb:hidden"
              >
                {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
              <Button variant="ghost" size="sm" iconOnly className="hidden cb:inline-flex"
                onClick={signOut} aria-label="Sign out" title="Sign out">
                <LogOut size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {menuOpen ? (
          <div id="arena-menu" className="border-t border-line bg-white shadow-lg cb:hidden">
            <nav className="cq-container cq-container--wide py-2" aria-label="Menu">
              <ul className="divide-y divide-line">
                {nav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => cn(
                        'flex min-h-[3.25rem] items-center gap-3 text-base font-medium no-underline',
                        isActive ? 'text-blue-600' : 'text-ink-800',
                      )}
                    >
                      <item.icon size={18} aria-hidden="true" />
                      {item.label}
                      <ChevronRight size={16} aria-hidden="true" className="ml-auto text-ink-400" />
                    </NavLink>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={signOut}
                    className="flex min-h-[3.25rem] w-full items-center gap-3 text-base font-medium text-ink-800">
                    <LogOut size={18} aria-hidden="true" /> Sign out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Storage limits are stated plainly rather than hidden — a teacher
          deciding whether to rely on this deserves to know. */}
      {memoryOnly ? (
        <div role="status" className="border-b border-[#F5CDCA] bg-danger-50 px-gutter py-2.5 text-center text-xs font-medium text-danger-700">
          <AlertTriangle size={13} className="mr-1.5 inline" aria-hidden="true" />
          This browser is blocking storage, so progress will not be saved when the tab closes.
        </div>
      ) : null}

      <main id="main" className="flex-1 pb-16">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white py-5">
        <div className="cq-container cq-container--wide flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-ink-500">CuriosityQuest · Science Arena</p>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/" className="inline-flex items-center gap-1 text-ink-500 no-underline hover:text-blue-600">
              Main site <ExternalLink size={11} aria-hidden="true" />
            </Link>
            <Link to="/privacy" className="text-ink-500 no-underline hover:text-blue-600">Privacy</Link>
            <Link to="/arena/profile" className="text-ink-500 no-underline hover:text-blue-600">Account</Link>
            {isLocal ? (
              <span className="text-ink-400" title="Progress is stored in this browser only">Local mode</span>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
