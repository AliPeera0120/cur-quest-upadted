import React from 'react';
import {
  ArrowRight, BookOpen, Briefcase, Check, FlaskConical, Terminal,
} from 'lucide-react';
import {
  Badge, Button, Callout, CountUp, DataTable, Kicker, Panel, Reveal, Stat, StatStrip,
} from '@/components/cq';
import { Band, Figure, Ledger, Split, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import { CONTENT_SUMMARY, DIFFICULTY } from '@/content/index.js';
import { gradeLabel, minutes } from '@/lib/format.js';

const { stats, featured } = CONTENT_SUMMARY;

/* Career profiles live in src/data/careers.json rather than the lesson
   catalog. Importing that 52 KB file here only to count its rows would pull
   the entire careers dataset into a page many visitors land on first, so the
   two figures this page needs are mirrored as constants instead. */
const CAREERS = { total: 116, fields: 7 };

/* summary.json ships one real published lesson per format, which is what lets
   this page show an actual activity rather than a mock-up of one. */
const sample = (format) => featured.find((l) => l.format === format) || null;

export default function ExploreHub() {
  return (
    <>
      <Meta
        title="Activities — experiments, coding, five-minute reads and STEM careers"
        description={`Four free ways to do STEM: ${stats.experiments} hands-on experiments, ${stats.codingLessons} coding lessons across Python, Java and HTML & CSS, ${stats.briefs} five-minute reads, and ${CAREERS.total} career profiles. Nothing is locked and you do not need an account to browse.`}
      />
      <Hero />
      <ExperimentsLead />
      <CodingSplit />
      <ReadAndResearch />
      <HowToPick />
      <ArenaStrip />
    </>
  );
}

/* ---------------------------------------------------------------- hero ----- */
function Hero() {
  return (
    <section className="cq-wash">
      <div className="cq-container">
        <div className="grid items-center gap-12 py-14 cb:grid-cols-[1.05fr_0.95fr] cb:gap-16 cb:pb-16 cb:pt-24">
          <div className="min-w-0">
            <Kicker pill>Activities</Kicker>
            <h1 className="mt-6 max-w-[21ch] text-display">
              Four kinds of activity. All of them open.
            </h1>
            <p className="mt-6 max-w-[50ch] text-lead text-ink-600">
              Something to build at the kitchen table, something to type on a school
              Chromebook, something to read in five minutes, and a straight look at the
              jobs any of it could turn into. Start wherever you like — nothing here is
              locked, and browsing needs no account.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/explore/experiments" size="lg" variant="accent">
                Browse {stats.experiments} experiments <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button to="/explore/coding" size="lg" variant="outline">
                Start a coding track
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {['Free, permanently', 'Written for grades 3–8', 'No order to follow'].map((t) => (
                <li key={t} className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                  <Check size={16} aria-hidden="true" className="text-success-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <Reveal className="min-w-0">
            <Figure caption="Phoenixville Public Library, Saturday morning. The experiments on this site are the ones we run in rooms like this.">
              <img
                src="/images/event-phoenixville-library.png"
                alt="CuriosityQuest volunteers running a hands-on session at Phoenixville Public Library"
                width="640" height="420" loading="eager" decoding="async"
                className="aspect-[3/2] w-full object-cover"
              />
            </Figure>
          </Reveal>
        </div>

        {/* The four counts sit in one divided strip rather than four cards, so
            the page opens with a set of numbers instead of a set of boxes. */}
        <StatStrip>
          <Stat label="Experiments" value={<CountUp to={stats.experiments} />} hint="Physics to engineering" />
          <Stat label="Coding lessons" value={<CountUp to={stats.codingLessons} />} hint="Across three tracks" />
          <Stat label="Five-minute reads" value={<CountUp to={stats.briefs} />} hint="One question each" />
          <Stat label="Career profiles" value={<CountUp to={CAREERS.total} />} hint={`${CAREERS.fields} fields of work`} />
        </StatStrip>
      </div>
    </section>
  );
}

/* -------------------------------------------------- lead: experiments ------ */

/* Every experiment in the catalog is assembled from the same four activities
   in this order, so describing the shape once describes all 72. */
const EXPERIMENT_SHAPE = [
  { title: 'Before you start', body: 'The materials list, and what the experiment is actually teaching — read it before anyone opens a cupboard.' },
  { title: 'Run the experiment', body: 'Five to seven numbered steps. No step assumes a lab, a kit, or a parent who already knows the answer.' },
  { title: 'What happened?', body: 'Three questions to talk through: what you saw, what surprised you, what you would change next time.' },
  { title: 'Check your thinking', body: 'Three quiz questions in Science Arena, each tagged to a real science skill.' },
];

function ExperimentsLead() {
  const ex = sample('experiment');
  return (
    <Band
      kicker="Hands-on experiments"
      title={`${stats.experiments} experiments you can run with what is already in the kitchen`}
      lede="Balloon-powered cars, density towers, pH indicators made from cabbage, bridges that hold real weight. Physics, chemistry, biology and engineering, at three difficulty levels, 15 to 35 minutes each."
      actions={<Button to="/explore/experiments" variant="primary">Browse all {stats.experiments}</Button>}
    >
      <Split
        ratio="text"
        align="start"
        visual={ex ? (
          <Reveal>
            <p className="mb-3 text-micro font-semibold uppercase tracking-label text-ink-500">
              For example
            </p>
            <ExampleCard lesson={ex} to={`/explore/experiments/${ex.id}`} icon={FlaskConical} />
            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              A balloon, a straw, four bottle caps and a piece of cardboard. The car
              moves because the escaping air pushes back — Newton&rsquo;s third law,
              running across a kitchen floor.
            </p>
          </Reveal>
        ) : null}
      >
        <h3 className="text-h3">What one experiment actually contains</h3>
        <ol className="mt-7 space-y-5">
          {EXPERIMENT_SHAPE.map((s, i) => (
            <li key={s.title} className="flex gap-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                <p className="mt-0.5 max-w-[52ch] text-sm text-ink-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Split>
    </Band>
  );
}

/* --------------------------------------------------------- coding split ---- */
const CODING_TRACKS = [
  { name: 'Python', body: 'The longest track. Printing and variables through to error handling and a command-line task manager you build yourself.' },
  { name: 'Java', body: 'Typed, verbose, and the language most first computer-science classes use. Ends in a text adventure game.' },
  { name: 'HTML & CSS', body: 'Make a page, then make it look deliberate. Box model, Flexbox, media queries, and a multi-page site for a cause you choose.' },
];

const CODING_KINDS = [
  { label: 'Lesson', body: 'Read it, then try the code.' },
  { label: 'Program', body: 'Build one working thing.' },
  { label: 'Project', body: 'The capstone that closes a track.' },
];

function CodingSplit() {
  const first = sample('course');
  return (
    <Band tone="tint">
      <Split
        ratio="text"
        flip
        visual={first ? (
          <Reveal>
            <p className="mb-3 text-micro font-semibold uppercase tracking-label text-ink-500">
              Lesson one of the Python track
            </p>
            <ExampleCard lesson={first} to={`/explore/coding/${first.id}`} icon={Terminal} />
            <ul className="mt-5 divide-y divide-line rounded-md border border-line bg-white">
              {CODING_KINDS.map((k) => (
                <li key={k.label} className="flex items-center gap-3 px-4 py-2.5">
                  <Badge tone={k.label === 'Project' ? 'ember' : 'info'} className="w-[4.9rem] justify-center">
                    {k.label}
                  </Badge>
                  <span className="text-xs text-ink-600">{k.body}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      >
        <Kicker pill>Coding courses</Kicker>
        <h2 className="mt-4 text-h2">Three tracks, {stats.codingLessons} lessons, and code you keep.</h2>
        <p className="mt-4 text-lead text-ink-600">
          Each track runs in order, because you cannot write a loop before you have a
          variable. Everything else on this site opens in any order — this is the one
          place where a sequence genuinely helps.
        </p>

        <ul className="mt-8 space-y-5">
          {CODING_TRACKS.map((t) => (
            <li key={t.name} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white text-blue-600 shadow-xs">
                <Terminal size={19} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-h4 font-semibold">{t.name}</h3>
                <p className="mt-1 max-w-[52ch] text-sm text-ink-600">{t.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button to="/explore/coding" variant="primary">See the tracks</Button>
          <Button to="/arena/join" variant="outline">Keep your progress</Button>
        </div>
      </Split>
    </Band>
  );
}

/* ------------------------------------------------ editorial: read and look - */
function ReadAndResearch() {
  const brief = sample('brief');
  return (
    <Band
      kicker="Read and look ahead"
      title="Two things to do when you cannot get your hands on anything."
      lede="On a bus, in a waiting room, or in the last five minutes of a lesson."
    >
      <Ledger
        numbered={false}
        items={[
          {
            icon: BookOpen,
            title: '5 Minutes of STEM',
            body: `${stats.briefs} short reads that each answer one real question properly — how self-driving cars see the road, why ice floats — in language a fifth grader can follow and an adult still learns something from.`,
            detail: brief ? `For example: ${brief.title} · ${minutes(brief.estMinutes)}` : `${stats.briefs} published so far`,
            to: '/explore/briefs',
            linkLabel: 'Read the archive',
          },
          {
            icon: Briefcase,
            title: `${CAREERS.total} STEM careers`,
            body: `What the work actually involves, who it tends to suit, and the kinds of places people doing it end up. ${CAREERS.fields} fields, from biomedical engineering to environmental science — including plenty of jobs most eleven-year-olds have never heard of.`,
            detail: 'No degree talk, no salary hype — just what the day looks like',
            to: '/explore/careers',
            linkLabel: 'Explore careers',
          },
        ]}
      />
    </Band>
  );
}

/* ------------------------------------------------------------ how to pick -- */
const PICK_ROWS = [
  {
    what: 'Experiments',
    count: stats.experiments,
    best: 'A kid who wants to make something happen, right now',
    need: 'Kitchen or supply-closet materials, plus an adult nearby for heat or chemicals',
    time: '15–35 min',
    to: '/explore/experiments',
  },
  {
    what: 'Coding courses',
    count: stats.codingLessons,
    best: 'A patient reader with a computer, working through a track',
    need: 'A laptop or Chromebook. Lesson one covers installing everything',
    time: '15–45 min',
    to: '/explore/coding',
  },
  {
    what: '5 Minutes of STEM',
    count: stats.briefs,
    best: 'A short gap, or a warm-up before a lesson',
    need: 'Nothing at all',
    time: '5 min',
    to: '/explore/briefs',
  },
  {
    what: 'Career profiles',
    count: CAREERS.total,
    best: '"What could I actually be?", asked seriously',
    need: 'Nothing at all',
    time: 'A few minutes each',
    to: '/explore/careers',
  },
];

function HowToPick() {
  return (
    <Band
      tone="tint"
      dense
      kicker="For parents and teachers"
      title="How to pick, in about ten seconds."
      lede="The honest version: match the activity to the time and the materials you actually have, not to the one that sounds most impressive."
    >
      <Panel pad="none" className="overflow-hidden">
        <DataTable
          caption="The four activity types compared by who they suit, what they need and how long they take"
          head={(
            <tr>
              <th scope="col">Activity</th>
              <th scope="col">Best for</th>
              <th scope="col">What you need</th>
              <th scope="col">Time each</th>
            </tr>
          )}
        >
          {PICK_ROWS.map((r) => (
            <tr key={r.what}>
              <th scope="row" className="cq-table__rowhead whitespace-nowrap align-top">
                <TextLink to={r.to}>{r.what}</TextLink>
                <span className="mt-0.5 block text-micro font-normal text-ink-500">
                  <span className="cq-data">{r.count}</span> available
                </span>
              </th>
              <td className="min-w-[18ch] align-top text-ink-700">{r.best}</td>
              <td className="min-w-[24ch] align-top text-ink-700">{r.need}</td>
              <td className="cq-data whitespace-nowrap align-top text-ink-800">{r.time}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Callout tone="note" title="Two things worth knowing before handing this to a child" className="mt-6">
        Experiments are written for grades 3–8, and several involve heat, small parts or
        household chemicals — the materials list flags what needs an adult in the room.
        And nothing on this site is gated: no activity has to be finished before another
        one opens, so a child who wants to start with bridge-building can.
      </Callout>
    </Band>
  );
}

/* -------------------------------------------------------------- arena ------ */
function ArenaStrip() {
  return (
    <Band tone="ink" dense>
      <div className="grid gap-8 cb:grid-cols-[1.4fr_auto] cb:items-center">
        <div>
          <Kicker onDark pill>Science Arena</Kicker>
          <h2 className="mt-4 max-w-[34ch] text-h2 text-white">
            Every activity here is also playable, with the progress kept.
          </h2>
          <p className="mt-4 max-w-[62ch] text-lead text-white/75">
            Browsing needs nothing. A free account adds the part a printed worksheet
            cannot do: answers tagged to {stats.skills} science skills across{' '}
            {stats.lessons} lessons, so a student can see what they understand and a
            teacher can see who needs help with what.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to="/arena" variant="onDark">How the Arena works</Button>
          <Button to="/arena/join" variant="outlineOnDark">Make an account</Button>
        </div>
      </div>
    </Band>
  );
}

/* --------------------------------------------------------------- shared ---- */

/** One real catalog lesson, shown as the linked card it appears as elsewhere. */
function ExampleCard({ lesson, to, icon: Icon }) {
  return (
    <Panel to={to} lift className="p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
          <Icon size={13} aria-hidden="true" />
          {lesson.subject}
        </span>
        <span className="cq-data text-micro text-ink-500">{minutes(lesson.estMinutes)}</span>
      </div>
      <h3 className="mt-3 text-h4 font-semibold text-ink-900">{lesson.title}</h3>
      <p className="mt-2 text-sm text-ink-600">{lesson.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="info">{DIFFICULTY[lesson.difficulty]}</Badge>
        <Badge>{gradeLabel(lesson.gradeMin, lesson.gradeMax)}</Badge>
      </div>
    </Panel>
  );
}
