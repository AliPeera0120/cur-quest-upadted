import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, Briefcase, Building2, ChevronDown, Search, Sparkles, UserRound, X,
} from 'lucide-react';
import { Badge, Button, Chip, EmptyState, Input, Kicker, Reveal, cn } from '@/components/cq';
import { Band, Split, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import CAREERS from '@/data/careers.json';
import { CONTENT_SUMMARY } from '@/content/index.js';

const { experiments, codingLessons } = CONTENT_SUMMARY.stats;

/** The seven categories in the order we want them read, not alphabetical. */
const CATEGORY_ORDER = [
  'Design & UX',
  'Engineering',
  'Robotics & AI',
  'Computer Science & Coding',
  'Environmental Science',
  'Space & Physics',
  'Biomedical & Health',
];

/* Nothing in the list is invented: the spotlight is looked up by title, so if a
   row ever leaves the data file the card disappears instead of lying. */
const SPOTLIGHT_TITLES = [
  'Space Weather Analyst',
  'Acoustical Engineer',
  'Voice UX Designer',
  'Soil Scientist',
  'Human-Robot Interaction Engineer',
  'Medical Imaging Scientist',
];

const PAGE_SIZE = 24;

const haystack = (c) => `${c.title} ${c.category} ${c.description} ${c.good_fit_for} ${c.employers}`.toLowerCase();

/* Built once at module load — 116 rows, searched on every keystroke. */
const INDEXED = CAREERS.map((c) => ({ ...c, _search: haystack(c) }));

/* Any category that appears in the data but not in CATEGORY_ORDER is appended,
   so adding a new one to careers.json never silently hides those rows. */
const CATEGORIES = [
  ...CATEGORY_ORDER,
  ...[...new Set(CAREERS.map((c) => c.category))].filter((c) => !CATEGORY_ORDER.includes(c)),
];

const SPOTLIGHT = SPOTLIGHT_TITLES
  .map((t) => CAREERS.find((c) => c.title === t))
  .filter(Boolean);

export default function Careers() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const browseRef = useRef(null);

  /* A new search or category is a new list, so paging starts over — otherwise
     you can end up looking at result 90 of 12. */
  useEffect(() => { setVisible(PAGE_SIZE); }, [query, category]);

  const q = query.trim().toLowerCase();
  const searched = useMemo(
    () => (q ? INDEXED.filter((c) => c._search.includes(q)) : INDEXED),
    [q],
  );

  /* Chip counts come from the search results rather than the whole file, so the
     numbers on the chips are the number of cards a click will actually show. */
  const counts = useMemo(() => {
    const map = new Map();
    for (const c of searched) map.set(c.category, (map.get(c.category) || 0) + 1);
    return map;
  }, [searched]);

  const results = useMemo(
    () => (category === 'all' ? searched : searched.filter((c) => c.category === category)),
    [searched, category],
  );

  /** Jumping from the spotlight into the browser with that title pre-searched. */
  const showCareer = (title) => {
    setCategory('all');
    setQuery(title);
    browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const shown = results.slice(0, visible);
  const filtered = q !== '' || category !== 'all';

  return (
    <>
      <Meta
        title="Careers in STEM"
        description={`${CAREERS.length} real STEM jobs across seven fields — what the work actually involves, who it suits, and the kinds of places that hire for it.`}
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <Kicker pill>Careers in STEM</Kicker>
          <h1 className="mt-6 max-w-[26ch] text-h1">
            {CAREERS.length} jobs, and hardly any of them come up at school.
          </h1>
          <p className="mt-6 max-w-[56ch] text-lead text-ink-600">
            Every one of these is a real job that real people go to on Monday. For each
            one: what the work actually involves, the kind of person it tends to suit,
            and where people doing it ended up working.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" variant="accent" onClick={() => browseRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              Start browsing <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button to="/explore/experiments" size="lg" variant="outline">Try the work instead</Button>
          </div>
        </div>
      </section>

      <Band>
        <Split
          ratio="text"
          align="start"
          visual={(
            <Reveal className="cq-panel cq-panel--lg cq-panel--lift p-6 cb:p-7">
              <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
                <Sparkles size={13} aria-hidden="true" /> Six you have probably never heard of
              </p>
              <ul className="mt-5 divide-y divide-line">
                {SPOTLIGHT.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => showCareer(c.title)}
                      className="group flex min-h-[2.75rem] w-full items-center justify-between gap-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-900 group-hover:text-blue-600">
                          {c.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500">{c.category}</span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true"
                        className="shrink-0 text-blue-600 transition-transform duration-2 group-hover:translate-x-0.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        >
          <Kicker pill>Why this page exists</Kicker>
          <h2 className="mt-4 text-h2">Most of these jobs are invisible from a classroom.</h2>
          <div className="mt-5 space-y-4 text-lead text-ink-600">
            <p>
              Think about the jobs you have actually watched someone do: teacher,
              doctor, nurse, dentist, vet, maybe an engineer if a parent is one. That is
              a short list, and it is not because the rest are rare. It is because
              nobody walks into a middle school to explain what a plasma physicist does
              all day.
            </p>
            <p>
              So the list below is the boring, useful thing instead: a plain description
              of {CAREERS.length} jobs. You are not supposed to pick one. You are
              supposed to find three that sound interesting and remember they exist.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ['What the work involves', 'What you would actually do on a normal day, not a job title.'],
              ['Who it tends to suit', 'The kind of thinking the job rewards — useful even if you never take it.'],
              ['Where people work', 'Real employers, so you can tell whether the field is big or specialised.'],
              ['Seven fields', 'From bridges and rockets to accessibility, soil and sleep.'],
            ].map(([h, body]) => (
              <li key={h} className="rounded-md border border-line bg-paper-2 p-4">
                <p className="text-sm font-semibold text-ink-900">{h}</p>
                <p className="mt-1 text-sm text-ink-600">{body}</p>
              </li>
            ))}
          </ul>
        </Split>
      </Band>

      <section ref={browseRef} id="browse" className="bg-paper-2 scroll-mt-24">
        <div className="cq-container cq-section">
          <div className="max-w-[64ch]">
            <Kicker pill>Browse</Kicker>
            <h2 className="mt-4 text-h2">Find one that sounds like you.</h2>
            <p className="mt-4 text-lead text-ink-600">
              Filter by field or search for a word — &ldquo;water&rdquo;, &ldquo;space&rdquo;,
              &ldquo;drawing&rdquo;, &ldquo;games&rdquo;. Open a card to see the whole entry.
            </p>
          </div>

          <div className="mt-10 rounded-lg border border-line bg-white p-5 shadow-xs cb:p-6">
            <div className="grid gap-5 cb:grid-cols-[minmax(0,20rem)_1fr] cb:items-start">
              <div className="relative">
                <Input
                  label="Search careers"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="robots, water, drawing, space…"
                  className="pl-9"
                />
                <Search size={15} aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-[2.35rem] text-ink-400" />
              </div>

              <div>
                <p id="field-filter-label" className="cq-label">Field</p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="field-filter-label">
                  <Chip active={category === 'all'} count={searched.length} onClick={() => setCategory('all')}>
                    All fields
                  </Chip>
                  {CATEGORIES.map((c) => (
                    <Chip key={c} active={category === c} count={counts.get(c) || 0} onClick={() => setCategory(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
              <p className="text-sm text-ink-600">
                <span className="cq-data text-ink-900">{results.length}</span>
                {' '}of {CAREERS.length} careers
                {category === 'all' ? '' : ` in ${category}`}
                {q ? ` matching “${query.trim()}”` : ''}
              </p>
              {filtered ? (
                <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setCategory('all'); }}>
                  <X size={14} aria-hidden="true" /> Clear filters
                </Button>
              ) : null}
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={Search}
              className="mt-8 bg-white"
              title="Nothing matches that yet"
              action={<Button variant="primary" onClick={() => { setQuery(''); setCategory('all'); }}>Show all {CAREERS.length}</Button>}
            >
              Try a shorter word — the search looks at job titles, descriptions and
              employers, so &ldquo;space&rdquo; finds more than &ldquo;space engineering jobs&rdquo;.
            </EmptyState>
          ) : (
            <>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 cb:grid-cols-3">
                {shown.map((c) => <CareerCard key={c.id} career={c} />)}
              </ul>

              {shown.length < results.length ? (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show {Math.min(PAGE_SIZE, results.length - shown.length)} more
                  </Button>
                  <p aria-live="polite" className="text-xs text-ink-500">
                    Showing {shown.length} of {results.length}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <Band
        kicker="Next"
        title="The fastest way to find out if you would like a job is to do a small piece of it."
        lede="Nobody decides this from a description. Build something, break it, and notice whether you enjoyed the part where it went wrong."
      >
        <div className="grid gap-4 cb:grid-cols-3">
          {[
            {
              to: '/explore/experiments',
              title: 'Run an experiment tonight',
              body: `${experiments} experiments with materials you already have. Bridges, circuits, density towers, electromagnets.`,
              cta: 'Browse experiments',
            },
            {
              to: '/explore/coding',
              title: 'Write your first program',
              body: `Python, Java, and HTML & CSS from the beginning — ${codingLessons} lessons that end in something you keep.`,
              cta: 'Start coding',
            },
            {
              to: '/explore/briefs',
              title: 'Read five minutes about one',
              body: 'How self-driving cars see, how bionic limbs work, what a black hole actually is.',
              cta: '5 Minutes of STEM',
            },
          ].map((card) => (
            <div key={card.to} className="cq-panel cq-panel--pad flex flex-col">
              <h3 className="text-h4 font-semibold">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-600">{card.body}</p>
              <TextLink to={card.to} className="mt-5">{card.cta}</TextLink>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-[70ch] text-sm text-ink-500">
          If one of these is your job and you would come talk to a room of eleven-year-olds
          about it for twenty minutes, email{' '}
          <a href="mailto:curiosity.quest25@gmail.com" className="font-semibold text-blue-600 no-underline hover:text-blue-500">
            curiosity.quest25@gmail.com
          </a>
          . That is the version of this page we cannot write ourselves.
        </p>
      </Band>
    </>
  );
}

/**
 * A native <details> disclosure rather than a modal: it expands in place, it is
 * keyboard-operable with no JavaScript, it is findable with the browser's own
 * find-in-page once open, and on a Chromebook it never traps focus.
 */
function CareerCard({ career }) {
  return (
    <li className="min-w-0">
      <details className="group cq-panel cq-panel--action h-full overflow-hidden">
        <summary
          className="flex min-h-[2.75rem] cursor-pointer list-none items-start justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden"
        >
          <span className="min-w-0">
            <Badge tone="info" className="max-w-full">{career.category}</Badge>
            <span className="mt-2.5 block font-display text-h4 font-semibold leading-snug text-ink-900">
              {career.title}
            </span>
            <span className="mt-1.5 block text-xs font-semibold text-blue-600 group-open:hidden">
              What this job is
            </span>
          </span>
          <ChevronDown size={18} aria-hidden="true"
            className="mt-1 shrink-0 text-ink-500 transition-transform duration-2 group-open:rotate-180" />
        </summary>

        <div className="border-t border-line bg-paper-2 px-5 py-5">
          <Row icon={Briefcase} label="What the work involves">{career.description}</Row>
          <Row icon={UserRound} label="Good fit for" className="mt-4">{career.good_fit_for}</Row>
          <Row icon={Building2} label="Typical employers" className="mt-4">{career.employers}</Row>
        </div>
      </details>
    </li>
  );
}

function Row({ icon: Icon, label, children, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-ink-500">
        <Icon size={12} aria-hidden="true" /> {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{children}</p>
    </div>
  );
}
