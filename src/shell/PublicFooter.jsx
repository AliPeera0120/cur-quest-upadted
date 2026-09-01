import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail, ArrowUpRight, Heart } from 'lucide-react';
import { CONTENT_SUMMARY } from '@/content/index.js';

const COLUMNS = [
  {
    title: 'Activities',
    links: [
      { label: 'Hands-on experiments', to: '/explore/experiments' },
      { label: 'Coding courses', to: '/explore/coding' },
      { label: '5 Minutes of STEM', to: '/explore/briefs' },
      { label: 'Careers in STEM', to: '/explore/careers' },
    ],
  },
  {
    title: 'Interactive Play',
    links: [
      { label: 'Science Arena', to: '/arena' },
      { label: 'Sign in', to: '/arena/sign-in' },
      { label: 'Join with a class code', to: '/arena/join' },
      { label: 'For teachers', to: '/educators' },
    ],
  },
  {
    title: 'About Us',
    links: [
      { label: 'Our mission and team', to: '/about' },
      { label: 'Events', to: '/programs' },
      { label: 'Make an impact', to: '/get-involved' },
      { label: 'Privacy & student data', to: '/privacy' },
    ],
  },
];

export default function PublicFooter() {
  const year = new Date().getFullYear();
  const { stats } = CONTENT_SUMMARY;
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="cq-container">
        <div className="grid gap-10 py-14 cb:grid-cols-[1.5fr_repeat(3,1fr)] cb:gap-10">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/images/logo.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
              <span className="font-display text-lg font-bold tracking-[-0.025em] text-ink-900">
                Curiosity<span className="text-blue-600">Quest</span>
              </span>
            </div>
            <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-ink-600">
              A student-founded nonprofit making hands-on STEM free and accessible —
              at home, in libraries, and in classrooms.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="https://www.instagram.com/curiosityquest25"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-line bg-white px-3 text-sm font-medium text-ink-700 no-underline shadow-xs hover:border-ink-300 hover:text-ink-900">
                <Instagram size={15} aria-hidden="true" /> Instagram
              </a>
              <a href="https://curiosityquest25.substack.com/"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-line bg-white px-3 text-sm font-medium text-ink-700 no-underline shadow-xs hover:border-ink-300 hover:text-ink-900">
                Newsletter <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a href="mailto:curiosity.quest25@gmail.com"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-line bg-white px-3 text-sm font-medium text-ink-700 no-underline shadow-xs hover:border-ink-300 hover:text-ink-900">
                <Mail size={15} aria-hidden="true" /> Email
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-micro font-semibold uppercase tracking-label text-ink-500">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link to={l.to} className="text-sm text-ink-600 no-underline transition-colors duration-1 hover:text-blue-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-6 border-t border-line py-8 sm:grid-cols-2 cb:grid-cols-4">
          {[
            { label: 'Experiments', value: stats.experiments },
            { label: 'Arena lessons', value: stats.lessons },
            { label: 'Science skills tracked', value: stats.skills },
            { label: 'Cost to schools', value: '$0' },
          ].map((s) => (
            <div key={s.label}>
              <p className="cq-data cq-data--md text-blue-700">{s.value}</p>
              <p className="mt-0.5 text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500">
            © {year} CuriosityQuest · Fiscally hosted by Hack Club Bank
          </p>
          <a href="https://hcb.hackclub.com/donations/start/curiosityquest" className="cq-btn cq-btn--sm cq-btn--accent">
            <Heart size={14} aria-hidden="true" /> Donate
          </a>
        </div>
      </div>
    </footer>
  );
}
