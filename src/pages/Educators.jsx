import React from 'react';
import {
  ArrowRight, Grid3x3, UserSearch, ClipboardList, Lightbulb, Download,
  Zap, Projector, Monitor, FlaskConical, Rabbit, Timer, House, Rocket,
  ShieldCheck, TriangleAlert, Check,
} from 'lucide-react';
import Meta from '@/shell/Meta.jsx';
import {
  Band, Split, Ledger, FeatureGrid, FeatureCard, Statement, TextLink, StatRow,
} from '@/components/marketing/Sections.jsx';
import {
  Badge, Button, Kicker, Reveal, MasteryCell, MasteryTag, MasteryLegend, Callout,
} from '@/components/cq';
import { levelForPct } from '@/platform/mastery.js';
import { CONTENT_SUMMARY } from '@/content/index.js';

const { stats, strands } = CONTENT_SUMMARY;

export default function Educators() {
  return (
    <>
      <Meta
        title="For educators — free class accounts and real mastery data"
        description={`Set up a class in five minutes and assign from ${stats.lessons} STEM lessons. Science Arena gives teachers a class mastery matrix, per-student detail, assignment analytics, generated insights and CSV export — free, with no gradebook to maintain.`}
      />
      <Hero />
      <Setup />
      <Statement
        cite="Why the dashboard exists"
        action={<Button to="/arena/sign-up/teacher" variant="onDark">Create a teacher account</Button>}
      >
        You should not have to build a spreadsheet to find out which four students are stuck.
      </Statement>
      <Dashboard />
      <WhatYouGet />
      <Scenarios />
      <Privacy />
      <NotThis />
      <FinalCta />
    </>
  );
}

/* ---------------------------------------------------------------- hero ----- */
function Hero() {
  return (
    <section className="cq-wash border-b border-line">
      <div className="cq-container">
        <div className="grid items-center gap-12 py-14 cb:grid-cols-[1fr_1.05fr] cb:gap-16 cb:py-24">
          <div className="min-w-0">
            <Kicker pill>For educators</Kicker>
            <h1 className="mt-6 max-w-[24ch] text-display">
              Real mastery data, five minutes of setup.
            </h1>
            <p className="mt-6 max-w-[50ch] text-lead text-ink-600">
              Make a free account, create a class, write the join code on the board.
              After that your students can open any of {stats.lessons} lessons, and you
              get a straight answer to the only question that matters on a Tuesday
              morning: who needs help, and with what?
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/arena/sign-up/teacher" size="lg" variant="accent">
                Create a teacher account <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button to="/arena" size="lg" variant="outline">How the Arena works</Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {['Free, no district purchase order', 'No student emails needed', 'Runs on a Chromebook'].map((t) => (
                <li key={t} className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                  <Check size={16} aria-hidden="true" className="text-success-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="min-w-0">
            <MatrixPreview />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* The preview uses the demo class that ships with the platform, so what a
   visitor sees here is the same data they will see if they click through with
   the demo account — not a mock-up drawn for the marketing page. */
const MATRIX_STRANDS = ['forces', 'matter', 'life', 'earth', 'build'];
const STRAND_NAME = Object.fromEntries(strands.map((s) => [s.id, s.name]));

const MATRIX_ROWS = [
  { name: 'Alex', pcts: [91, 78, 58, 88, 74] },
  { name: 'Mia', pcts: [76, 87, 89, 72, 61] },
  { name: 'James', pcts: [44, 47, 62, 55, 71] },
  { name: 'Chloe', pcts: [49, 63, 80, 58, 46] },
  { name: 'Tobias', pcts: [null, null, null, null, null] },
];

function MatrixPreview() {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
            Class mastery matrix
          </p>
          <p className="mt-1 font-display text-h4 font-bold">5th Grade Science</p>
        </div>
        <Badge tone="info">Demo class · 14 students</Badge>
      </div>

      {/* Six strand columns will not fit a phone, and a horizontally scrolling
          table nested in a hero is both awkward to use and a reliable way to
          make the whole page drag sideways. So the matrix is a table from the
          Chromebook breakpoint up, and a stacked per-student list below it. */}
      <div className="hidden cb:block">
        {/* table-fixed plus wrapping headers so the six strand columns
            compress into the hero's column instead of pushing past it —
            .cq-table sets white-space: nowrap on th, which is right for the
            real dashboard and wrong here. */}
        <table className="cq-table w-full table-fixed [&_th]:whitespace-normal">
          <caption className="cq-sr">
            Mastery by student and science strand for the demo class
          </caption>
          <thead>
            <tr>
              <th scope="col">Student</th>
              {MATRIX_STRANDS.map((id) => (
                <th key={id} scope="col" className="px-2 text-center align-bottom">
                  {/* Colour is reinforcement only: the strand name is the label. */}
                  <span className="inline-flex flex-col items-center gap-1">
                    <span aria-hidden="true" className="h-2 w-2 rounded-pill"
                      style={{ background: `var(--cq-strand-${id})` }} />
                    <span className="leading-tight">{STRAND_NAME[id]}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.name}>
                <th scope="row" className="cq-table__rowhead w-[6.5rem]">{row.name}</th>
                {row.pcts.map((pct, i) => (
                  <td key={MATRIX_STRANDS[i]} className="p-1">
                    <MasteryCell
                      pct={pct}
                      level={pct == null ? 'not_started' : levelForPct(pct)}
                      label={`${row.name}, ${STRAND_NAME[MATRIX_STRANDS[i]]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line cb:hidden">
        {MATRIX_ROWS.map((row) => (
          <li key={row.name} className="px-5 py-3.5">
            <p className="font-display font-semibold text-ink-900">{row.name}</p>
            <ul className="mt-2 space-y-1.5">
              {row.pcts.map((pct, i) => (
                <li key={MATRIX_STRANDS[i]} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-pill"
                    style={{ background: `var(--cq-strand-${MATRIX_STRANDS[i]})` }} />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-600">
                    {STRAND_NAME[MATRIX_STRANDS[i]]}
                  </span>
                  <MasteryTag
                    level={pct == null ? 'not_started' : levelForPct(pct)}
                    pct={pct}
                    size="sm"
                    className="shrink-0"
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="border-t border-line bg-paper-2 px-5 py-3.5">
        <MasteryLegend compact className="justify-between" />
      </div>
      <p className="border-t border-line px-5 py-3.5 text-xs leading-relaxed text-ink-500">
        Tobias joined and has never played. The matrix says so rather than showing a
        cheerful zero — a hatched cell means no evidence, not a bad score.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- setup ----- */
const SETUP = [
  {
    title: 'Make a free teacher account',
    body: 'Name, email, password, school. You get a recovery phrase shown once, because there is no IT helpdesk behind this and you may need to reset your own password.',
    detail: 'About 60 seconds',
  },
  {
    title: 'Create a class',
    body: 'A name, a grade band, a subject. "5th Grade Science", grades 3–5, General Science. You can have as many classes as you teach, and archive the ones that end.',
    detail: 'About 30 seconds',
  },
  {
    title: 'Get the join code',
    body: 'The platform generates a code like CQ-48291. You can regenerate it whenever you want, which is the fix for a code that escaped into a group chat.',
    detail: 'Instant',
  },
  {
    title: 'Students join',
    body: 'They pick a username and a display name, type the code, and appear on your roster immediately. No email addresses, no invitation links, no seat licences.',
    detail: 'A few minutes of class time',
  },
  {
    title: 'Assign a first mission',
    body: 'Pick a lesson, set a due date, set a mastery target, add a note. Assignment analytics start filling in as students finish it — and everything else in the catalog stays open the whole time.',
    detail: 'About 60 seconds',
  },
];

function Setup() {
  return (
    <Band
      kicker="Setup"
      title="Five steps, one prep period, done for the year."
      lede="Nothing here needs a district integration, a rostering sync, or a meeting with anyone."
    >
      <Ledger items={SETUP} />
      <div className="mt-10">
        <Button to="/arena/sign-up/teacher" variant="primary" size="lg">
          Start with step one <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </Band>
  );
}

/* ----------------------------------------------------------- dashboard ----- */
/* The four insight kinds are the real ones the platform generates — weakest
   skill, inactive students, a lagging assignment, and students who are clearly
   improving. Growth is surfaced as loudly as struggle on purpose. */
const INSIGHTS = [
  {
    tone: 'medium',
    title: "Engineering Design is your class's weakest skill right now",
    detail: 'Class average 54% across 19 students with enough evidence. 7 students are below 70%.',
    action: 'Assign a review',
  },
  {
    tone: 'low',
    title: '3 students have not played this week',
    detail: 'Noah, Tobias, Ethan',
    action: 'See who',
  },
  {
    tone: 'high',
    title: '9 of 24 finished "Ecosystems: Investigator"',
    detail: 'Due Friday. 15 still to go.',
    action: 'Open assignment',
  },
  {
    tone: 'good',
    title: '4 students are clearly improving',
    detail: 'Chloe +28 pts · Priya +19 pts · James +22 pts · Amara +15 pts',
    action: 'See who',
  },
];

const TONE_CLS = {
  high: 'border-l-danger-600',
  medium: 'border-l-warning-600',
  low: 'border-l-blue-600',
  good: 'border-l-success-600',
};

function Dashboard() {
  return (
    <Band tone="tint">
      <Split
        ratio="text"
        flip
        align="start"
        visual={(
          <Reveal>
            <div className="rounded-lg border border-line bg-white p-5 shadow-lg cb:p-6">
              <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
                <Lightbulb size={13} aria-hidden="true" /> Class insights
              </p>
              <ul className="mt-4 space-y-3">
                {INSIGHTS.map((i) => (
                  <li key={i.title} className={`rounded-sm border border-line border-l-2 bg-paper-2 px-4 py-3.5 ${TONE_CLS[i.tone]}`}>
                    <p className="font-display text-sm font-bold leading-snug text-ink-900">{i.title}</p>
                    <p className="mt-1.5 text-xs text-ink-600">{i.detail}</p>
                    <p className="mt-2.5 text-xs font-semibold text-blue-600">{i.action}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                Generated from evidence by plain, explainable rules — not typed in by
                you, and not a black box either.
              </p>
            </div>
          </Reveal>
        )}
      >
        <Kicker pill>The dashboard</Kicker>
        <h2 className="mt-4 text-h2">It tells you who needs help, and with what.</h2>
        <p className="mt-4 text-lead text-ink-600">
          Completion is easy to measure and mostly useless. The dashboard is built
          around mastery instead: every answer a student gives is tagged to one of
          {' '}{stats.skills} science skills, so a class average stops being a mystery
          number and becomes a list of names and topics.
        </p>
        <ul className="mt-8 space-y-4">
          {[
            'Weak skills are only reported where enough students have real evidence, so one student’s bad afternoon never becomes a class-wide alarm.',
            'A student who is improving shows up as loudly as a student who is struggling. "54% → 89%" is the headline, not "89%".',
            'Every figure can be traced to the answers behind it, which matters when a parent asks.',
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-success-500" />
              <p className="text-sm text-ink-700">{t}</p>
            </li>
          ))}
        </ul>
      </Split>
    </Band>
  );
}

/* --------------------------------------------------------- what you get ---- */
const CAPABILITIES = [
  {
    icon: Grid3x3, span: 3, title: 'Class mastery matrix',
    body: `Students down the side, skills or strands across the top, a level and a percentage in every cell. Hatched where there is no evidence yet, with a legend beside it. Sortable, and it fits on a Chromebook screen.`,
  },
  {
    icon: UserSearch, span: 3, title: 'Per-student detail',
    body: 'One student, everything: overall mastery, growth first-to-latest, strand breakdown, what to review, strengths, a timeline of attempts, and their assignment history.',
  },
  {
    icon: ClipboardList, span: 2, title: 'Assignment analytics',
    body: 'Who has finished, who has started, who has not opened it, scores against the mastery target you set, and whether it is due.',
  },
  {
    icon: Lightbulb, span: 2, title: 'Generated insights',
    body: 'Weakest class skill, students who have gone quiet, assignments that are lagging, students who are clearly improving. Each one links to the students it is about.',
  },
  {
    icon: Download, span: 2, title: 'CSV export',
    body: 'Skills, class summary or assignments, as a CSV you can open in Sheets, paste into your own gradebook, or send to a coordinator who wants a spreadsheet.',
  },
  {
    icon: Zap, span: 3, title: 'Quick play and exit tickets',
    body: 'Pick a topic, get a short set, project it or send it to devices. Built for the five minutes at the end of a lesson when you want to know whether it landed.',
  },
  {
    icon: Projector, span: 3, title: 'Classroom projection mode',
    body: 'A large-type view for the front of the room: one question at a time, readable from the back row, with your class roster and progress on screen instead of a tiny dashboard.',
  },
];

function WhatYouGet() {
  return (
    <Band
      kicker="What you get"
      title="Seven things, all of them useful on a normal school day."
      lede="No feature here exists to look impressive in a screenshot. Each one answers a question a teacher actually asks out loud."
    >
      <FeatureGrid>
        {CAPABILITIES.map((c) => (
          <FeatureCard key={c.title} span={c.span}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
              <c.icon size={19} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-h4 font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-ink-600">{c.body}</p>
          </FeatureCard>
        ))}
      </FeatureGrid>

      <StatRow
        className="mt-12"
        items={[
          { value: stats.lessons, label: 'Assignable lessons', hint: 'Nothing locked, nothing paid' },
          { value: stats.skills, label: 'Skills tracked', hint: `Grouped into ${stats.strands} strands` },
          { value: stats.byFormat.quick, label: 'Quick challenges', hint: 'Five questions each' },
          { value: stats.byFormat.assessment, label: 'Pre/post checks', hint: 'Physics, chemistry, biology, engineering' },
        ]}
      />
    </Band>
  );
}

/* ------------------------------------------------------------ scenarios ---- */
const SCENARIOS = [
  {
    icon: Monitor, title: 'Whole class on the smartboard',
    body: 'Projection mode, one question at a time, hands up and arguing about the answer. No devices needed, and nobody is quietly stuck at the back.',
  },
  {
    icon: FlaskConical, title: 'Independent lab work',
    body: 'Twenty-four Chromebooks, twenty-four different lessons. Because nothing is gated, the student who wants to build a bridge and the student who wants to write Python can both do that in the same period.',
  },
  {
    icon: Rabbit, title: 'Fast finishers and reviewers, at once',
    body: 'Point the students who finished early at an Investigator-tier mission or a battle, and the students who need another pass at the Explorer tier of the same topic. Same room, same lesson, different depth.',
  },
  {
    icon: Timer, title: 'A five-minute exit ticket',
    body: 'A quick challenge is five questions and about five minutes. Run one at the end of a lesson and the mastery matrix has updated before your next class walks in.',
  },
  {
    icon: House, title: 'Students at home',
    body: 'Accounts work anywhere, so an assignment is a link and a due date. No install, and no email address needed for a student to sign in from a kitchen table.',
  },
  {
    icon: Rocket, title: 'A STEM club',
    body: 'Make a second class for the club, set a class goal, and let members roam the catalog. The demo data ships with exactly this: a 5th grade science class and a smaller STEM club.',
  },
];

function Scenarios() {
  return (
    <Band
      tone="tint"
      kicker="In the room"
      title="Six ways teachers actually use it."
      lede="The platform makes no assumption about your timetable, your device cart or your internet filter. These are the situations it was designed around."
    >
      <Ledger items={SCENARIOS} numbered={false} />
    </Band>
  );
}

/* -------------------------------------------------------------- privacy ---- */
const PRIVACY_POINTS = [
  {
    title: 'The minimum, and nothing else',
    body: 'A student account is a username, a display name and a password. No email address, no home address, no phone number, no date of birth. Learning data — answers, scores, time on task, mastery — is the only thing collected, because it is the only thing needed.',
  },
  {
    title: 'Teachers see their own classes only',
    body: 'A teacher can see the roster, progress and answers of students in the classes they created. Not another teacher’s class, not a student who has left. This is enforced in the backend, not just hidden in the interface.',
  },
  {
    title: 'Students cannot see each other',
    body: 'There is no student-to-student progress view, no class leaderboard on by default, and no way for one child to browse another child’s mastery. The comparison a student sees is with their own earlier work.',
  },
  {
    title: 'Deletion means deletion',
    body: 'A student or teacher can delete their own account, and a teacher can remove a student from a class. Nothing is retained to build a profile, because there is no advertising, no resale and no third-party analytics on the platform.',
  },
];

function Privacy() {
  return (
    <Band tone="ink" kicker="Privacy" title="Student data, stated plainly.">
      <div className="grid gap-8 cb:grid-cols-[1.1fr_1fr] cb:gap-14">
        <ul className="space-y-7">
          {PRIVACY_POINTS.map((p) => (
            <li key={p.title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white/10 text-orange-300">
                <ShieldCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-h4 font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-white/70">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-white/12 bg-white/[0.04] p-6 cb:self-start">
          <h3 className="text-h4 font-semibold text-white">Before you put it in front of a class</h3>
          <p className="mt-3 text-sm text-white/70">
            Districts usually want the specifics in writing. The privacy notice lists
            exactly what is stored, who can see it, how long it is kept and how to
            delete it — in language you can forward to an administrator without
            translating it first.
          </p>
          <TextLink to="/privacy" onDark className="mt-5">Read the privacy notice</TextLink>
        </div>
      </div>
    </Band>
  );
}

/* --------------------------------------------------------- what it isn't --- */
function NotThis() {
  return (
    <Band dense>
      <div className="grid gap-8 cb:grid-cols-[auto_1fr] cb:gap-12">
        <div className="cb:max-w-[16rem]">
          <Kicker orange>Being honest</Kicker>
          <h2 className="mt-3.5 text-h3">What this is not.</h2>
          <p className="mt-3 text-sm text-ink-600">
            Knowing the edges before you start is worth more than a longer feature
            list.
          </p>
        </div>
        <ul className="grid gap-4 cb:grid-cols-3">
          {[
            { title: 'Not a gradebook', body: 'There are no grades, no weightings and no report-card export. Mastery describes understanding; turning that into a grade is your professional judgement, not ours. Use the CSV export if you want the numbers in your real gradebook.' },
            { title: 'Not an SIS integration', body: 'No Clever, no ClassLink, no Google Classroom roster sync. Students join with a code. That is a deliberate trade: setup takes five minutes instead of a term of district paperwork.' },
            { title: 'Not something you maintain', body: 'You do not write lessons, mark anything, or keep the platform up to date. The catalog is ours to grow. If you never log in again after assigning one mission, nothing breaks.' },
          ].map((n) => (
            <li key={n.title} className="rounded-md border border-line bg-paper-2 p-5">
              <TriangleAlert size={17} aria-hidden="true" className="text-orange-700" />
              <h3 className="mt-3 text-h4 font-semibold">{n.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{n.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------ final cta ---- */
function FinalCta() {
  return (
    <Band tone="tint" dense>
      <div className="grid gap-8 cb:grid-cols-[1fr_auto] cb:items-center">
        <div>
          <h2 className="text-h2">Set up a class this afternoon.</h2>
          <p className="mt-4 max-w-[62ch] text-lead text-ink-600">
            Free permanently, for any school, anywhere. We are a student-run nonprofit
            fiscally hosted by Hack Club Bank — there is no sales call, no trial period
            and no upgrade tier waiting behind the useful features.
          </p>
          <Callout tone="note" className="mt-6 max-w-[62ch]">
            Want to look around before committing? The Arena page walks through the
            mastery model and every lesson format in detail.
          </Callout>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to="/arena/sign-up/teacher" size="lg" variant="accent">
            Create a teacher account
          </Button>
          <Button to="/arena" size="lg" variant="outline">See the Arena</Button>
        </div>
      </div>
    </Band>
  );
}
