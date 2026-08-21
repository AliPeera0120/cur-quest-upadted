import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { Button, cn } from '@/components/cq';
import { useAuth, homeFor } from '@/platform/auth.jsx';

/**
 * Public navigation.
 *
 * Keeps the site's established shape — Home plus three hub tabs, each with its
 * own sub-pages — so returning visitors are not made to relearn where things
 * live. The dropdowns open on click as well as hover, which is what makes them
 * usable on a touchscreen and from the keyboard; the old hover-only menus were
 * unreachable on an iPad.
 */
const NAV = [
  { label: 'Home', to: '/' },
  {
    label: 'About Us',
    to: '/about',
    items: [
      { label: 'Overview', to: '/about', hint: 'Our mission, team and story' },
      { label: 'Events', to: '/programs', hint: 'Free STEM events near you' },
      { label: 'Careers in STEM', to: '/explore/careers', hint: '116 real jobs and how to get there' },
      { label: 'Make an Impact', to: '/get-involved', hint: 'Volunteer, partner or donate' },
    ],
  },
  {
    label: 'Activities',
    to: '/explore',
    items: [
      { label: 'Hands-On Experiments', to: '/explore/experiments', hint: '72 to try with everyday materials' },
      { label: 'Coding Courses', to: '/explore/coding', hint: 'Python, Java, HTML & CSS' },
      { label: '5 Minutes of STEM', to: '/explore/briefs', hint: 'Short reads on one good question' },
    ],
  },
  {
    label: 'Interactive Play',
    to: '/arena',
    items: [
      { label: 'Science Arena', to: '/arena', hint: 'Play any lesson, in any order' },
      { label: 'My Progress', to: '/arena/progress', hint: 'Your skills, mastery and badges' },
      { label: 'For Teachers', to: '/educators', hint: 'Classes, dashboards and assignments' },
    ],
  },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => { setMobileOpen(false); setOpenMenu(null); }, [pathname]);

  useEffect(() => {
    if (!openMenu) return undefined;
    const onDoc = (e) => { if (!navRef.current?.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [openMenu]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* Hover opens the menu on pointer devices; a small close delay stops it
     flickering shut as the cursor travels from the tab to the panel. */
  const hoverOpen = (label) => {
    if (window.matchMedia('(hover: none)').matches) return;
    clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  const hoverClose = () => {
    if (window.matchMedia('(hover: none)').matches) return;
    closeTimer.current = setTimeout(() => setOpenMenu(null), 160);
  };

  const isActive = (item) => {
    if (item.to === '/') return pathname === '/';
    return pathname === item.to
      || pathname.startsWith(`${item.to}/`)
      || (item.items || []).some((s) => s.to !== '/' && (pathname === s.to || pathname.startsWith(`${s.to}/`)));
  };

  return (
    <header className="sticky top-0 z-header border-b border-line bg-white/92 backdrop-blur-md">
      <div className="cq-container">
        <div className="flex h-[4.5rem] items-center justify-between gap-4 cb:h-20">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 no-underline" aria-label="CuriosityQuest home">
            <img src="/images/logo.png" alt="" width="40" height="40"
              className="h-9 w-9 object-contain cb:h-10 cb:w-10" />
            <span className="font-display text-lg font-bold tracking-[-0.025em] text-ink-900 cb:text-xl">
              Curiosity<span className="text-blue-600">Quest</span>
            </span>
          </Link>

          {/* ------------------------------------------------ desktop nav */}
          <nav ref={navRef} className="hidden items-center gap-1 cb:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = isActive(item);
              if (!item.items) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex h-10 items-center whitespace-nowrap rounded-sm px-3 text-[0.9375rem] font-medium no-underline transition-colors duration-1',
                      active ? 'bg-blue-50 text-blue-700' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
                    )}
                  >
                    {item.label}
                  </NavLink>
                );
              }
              const open = openMenu === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hoverOpen(item.label)}
                  onMouseLeave={hoverClose}
                >
                  <button
                    type="button"
                    onClick={() => setOpenMenu(open ? null : item.label)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    className={cn(
                      'flex h-10 items-center gap-1 whitespace-nowrap rounded-sm px-3 text-[0.9375rem] font-medium transition-colors duration-1',
                      active || open ? 'bg-blue-50 text-blue-700' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
                    )}
                  >
                    {item.label}
                    <ChevronDown size={14} aria-hidden="true"
                      className={cn('transition-transform duration-2', open && 'rotate-180')} />
                  </button>
                  {open ? (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-dropdown w-[21rem] animate-rise overflow-hidden rounded-lg border border-line bg-white shadow-xl">
                      <ul className="p-2">
                        {item.items.map((sub) => (
                          <li key={sub.to + sub.label}>
                            <Link
                              to={sub.to}
                              onClick={() => setOpenMenu(null)}
                              className="block rounded-sm px-3 py-2.5 no-underline transition-colors duration-1 hover:bg-blue-50"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-ink-900">{sub.label}</span>
                                <ArrowRight size={13} aria-hidden="true" className="shrink-0 text-ink-400" />
                              </span>
                              <span className="mt-0.5 block text-xs text-ink-500">{sub.hint}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <Button to={homeFor(user)} variant="primary" size="sm" className="hidden sm:inline-flex">
                {user.role === 'teacher' ? 'My classes' : user.role === 'admin' ? 'Admin' : 'Keep playing'}
              </Button>
            ) : (
              <>
                <Link
                  to="/arena/sign-in"
                  className="hidden h-10 items-center rounded-sm px-3 text-[0.9375rem] font-medium text-ink-700 no-underline hover:text-ink-900 cb:flex"
                >
                  Sign in
                </Link>
                <Button to="/arena" variant="accent" size="sm" className="hidden sm:inline-flex">
                  Enter Science Arena
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="grid h-11 w-11 place-items-center rounded-sm border border-line bg-white text-ink-800 shadow-xs cb:hidden"
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- mobile nav */}
      {mobileOpen ? (
        <div id="mobile-nav"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-white shadow-lg cb:hidden">
          <nav className="cq-container py-3" aria-label="Main">
            <ul className="divide-y divide-line">
              {NAV.map((item) => (
                <li key={item.label} className="py-1.5">
                  <Link to={item.to}
                    className="flex min-h-[3rem] items-center justify-between text-base font-semibold text-ink-900 no-underline">
                    {item.label}
                    <ArrowRight size={16} aria-hidden="true" className="text-ink-400" />
                  </Link>
                  {item.items ? (
                    <ul className="mb-2 space-y-0.5">
                      {item.items.map((sub) => (
                        <li key={sub.to + sub.label}>
                          <Link to={sub.to}
                            className="flex min-h-[2.75rem] items-center rounded-sm px-3 text-sm text-ink-600 no-underline hover:bg-blue-50">
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-col gap-2 pb-4">
              {user ? (
                <Button to={homeFor(user)} variant="primary" size="lg" block>Back to my dashboard</Button>
              ) : (
                <>
                  <Button to="/arena" variant="accent" size="lg" block>Enter Science Arena</Button>
                  <Button to="/arena/sign-in" variant="outline" size="lg" block>Sign in</Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
