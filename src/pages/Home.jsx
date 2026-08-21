import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, FlaskConical, Users, GraduationCap, Building2, HeartHandshake,
  Target, Wrench, Microscope, BookOpen, Terminal, Swords, Sparkles, Check,
} from 'lucide-react';
import {
  Badge, Button, Kicker, Reveal, MasteryTag, Meter, MasteryLegend, CountUp, cn,
} from '@/components/cq';
import {
  Band, Ledger, FeatureGrid, FeatureCard, Statement, TextLink, Figure, Split, StatRow,
} from '@/components/marketing/Sections.jsx';
import TryOne from '@/components/marketing/TryOne.jsx';
import Meta from '@/shell/Meta.jsx';
import { CONTENT_SUMMARY, FORMATS } from '@/content/index.js';
import { minutes, gradeLabel } from '@/lib/format.js';

const { stats, featured } = CONTENT_SUMMARY;

export default function Home() {
  return (
    <>
      <Meta
        title="Hands-on STEM for curious young minds"
        description="CuriosityQuest is a student-founded nonprofit. Free hands-on experiments, coding courses, community workshops, and Science Arena — a classroom STEM platform where students explore freely and teachers see real mastery."
      />
      <Hero />
      <ActivityBands />
      <Statement
        cite="Why we built Science Arena"
        action={<Button to="/arena" variant="onDark">See how it works</Button>}
      >
        Most kids meet science as something they are told. It should be something they do.
      </Statement>
      <ArenaPreview />
      <ForStudents />
      <ForEducators />
      <Community />
      <GetInvolvedStrip />
    </>
  );
}

/* ---------------------------------------------------------------- hero ----- */
function Hero() {
  return (
    <section className="cq-wash relative overflow-hidden border-b border-line">
      <div className="cq-container relative">
        <div className="grid items-center gap-12 py-14 cb:grid-cols-[1.05fr_0.95fr] cb:gap-16 cb:py-24">
          <div className="min-w-0">
            <Kicker pill>Student-founded STEM nonprofit</Kicker>
            <h1 className="mt-6 max-w-[20ch] text-display">
              Curiosity starts with a&nbsp;question.
            </h1>
            <p className="mt-6 max-w-[48ch] text-lead text-ink-600">
              CuriosityQuest helps students turn that question into something they can
              explore, build, test and understand — with free experiments, a real
              classroom learning platform, and workshops in their own community.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/explore" size="lg" variant="accent">
                Explore Activities <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button to="/arena" size="lg" variant="outline">
                Enter Science Arena
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {[
                `${stats.experiments} hands-on experiments`,
                `${stats.lessons} Arena lessons`,
                'Free for every school',
              ].map((t) => (
                <li key={t} className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                  <Check size={16} aria-hidden="true" className="text-success-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <Reveal className="min-w-0">
            <TryOne />
            <p className="mt-4 max-w-[46ch] text-xs leading-relaxed text-ink-500">
              Every answer in the Arena is tagged to a science skill — that is how a
              teacher can see what a student actually understands, not just which
              games they clicked.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- what we do ------- */
function ActivityBands() {
  const items = [
    {
      title: 'Hands-on STEM you can actually run',
      body: `${stats.experiments} step-by-step experiments using materials already in a kitchen or a supply closet — with the science explained, not just the steps.`,
      detail: 'Physics · Chemistry · Biology · Engineering',
      to: '/explore/experiments',
      linkLabel: 'Browse experiments',
    },
    {
      title: 'Science Arena, a real classroom platform',
      body: `${stats.lessons} lessons a student can open in any order, while the platform tracks mastery across ${stats.skills} science skills and hands teachers the evidence.`,
      detail: 'Free accounts · Class codes · Teacher dashboards',
      to: '/arena',
      linkLabel: 'See how it works',
    },
    {
      title: 'Workshops where kids already are',
      body: 'Free sessions at public libraries and community centres, run by high-school students who remember being the curious kid in the room.',
      detail: 'Libraries · Community centres · School clubs',
      to: '/programs',
      linkLabel: 'Find an event',
    },
    {
      title: 'A five-minute read, every week',
      body: '"5 Minutes of STEM" answers one real question properly — how computers see, why ice floats — in language a fifth grader can follow and an adult still learns from.',
      detail: `${stats.briefs} published so far`,
      to: '/explore/briefs',
      linkLabel: 'Read the archive',
    },
  ];

  return (
    <Band
      kicker="What we do"
      title="Four ways in"
      lede="Different students meet science in different places — at a kitchen table, on a school Chromebook, at a library on a Saturday. We try to be good at all four rather than average at one."
    >
      <Ledger items={items} />
    </Band>
  );
}

/* ------------------------------------------------------- arena preview ----- */
function ArenaPreview() {
  return (
    <Band tone="tint">
      <Split
        ratio="text"
        visual={(
          <Reveal className="space-y-5">
            <MasteryPreviewPanel />
            <LessonStrip />
          </Reveal>
        )}
      >
        <Kicker pill>Science Arena</Kicker>
        <h2 className="mt-4 text-h2">Learn science by doing it.</h2>
        <p className="mt-4 text-lead text-ink-600">
          Students can open any lesson at any time — no locked levels, no forced
          order. The platform tracks what they understand underneath, so freedom for
          the student and evidence for the teacher stop being a trade-off.
        </p>

        <ul className="mt-8 space-y-5">
          {[
            { icon: Target, title: 'Access is never the reward', body: 'Nothing is gated behind finishing something else. Mastery is shown, not used as a lock.' },
            { icon: Microscope, title: 'Mastery, not completion', body: 'Evidence accumulates across lessons and sittings. One lucky 100% does not make a skill mastered.' },
            { icon: Users, title: 'Teachers get the picture', body: 'Class codes, a mastery matrix, and a straight answer to "who needs help, and with what?"' },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white text-blue-600 shadow-xs">
                <Icon size={19} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-h4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button to="/arena" variant="primary">See Science Arena</Button>
          <Button to="/arena/join" variant="outline">Join with a class code</Button>
        </div>
      </Split>
    </Band>
  );
}

const PREVIEW_ROWS = [
  { name: 'Forces & Energy', pct: 92, level: 'mastered', strand: 'forces' },
  { name: 'Matter & Waves', pct: 74, level: 'proficient', strand: 'matter' },
  { name: 'Life Science', pct: 61, level: 'developing', strand: 'life' },
  { name: 'Earth & Space', pct: 88, level: 'mastered', strand: 'earth' },
  { name: 'Engineering & Tech', pct: 43, level: 'beginning', strand: 'build' },
  { name: 'Science Practices', pct: null, level: 'not_started', strand: 'method' },
];

function MasteryPreviewPanel() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-lg">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-micro font-semibold uppercase tracking-label text-ink-500">Student view</p>
          <p className="mt-1 font-display font-bold">Alex · Science Passport</p>
        </div>
        <Badge tone="ember">Level 7 · 1,240 DP</Badge>
      </div>
      <ul className="divide-y divide-line">
        {PREVIEW_ROWS.map((r) => (
          <li key={r.name} className="flex items-center gap-4 px-5 py-3">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-pill"
              style={{ background: `var(--cq-strand-${r.strand})` }} />
            <span className="min-w-0 flex-1 text-sm font-medium">{r.name}</span>
            <span className="hidden w-20 shrink-0 cb:block">
              <Meter value={r.pct ?? 0} showValue={false} hideLabel size="sm"
                tone={r.pct == null ? 'ink' : `strand-${r.strand}`} label={r.name} />
            </span>
            <MasteryTag level={r.level} pct={r.pct} size="sm" className="w-[8.5rem] shrink-0 justify-end" />
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-paper-2 px-5 py-3">
        <MasteryLegend compact className="justify-between" />
      </div>
    </div>
  );
}

const FORMAT_ICON = { battle: Swords, mission: Target, quick: Sparkles, experiment: FlaskConical, course: Terminal, brief: BookOpen, assessment: Check };

function LessonStrip() {
  return (
    <div>
      <p className="mb-3 text-micro font-semibold uppercase tracking-label text-ink-500">
        Real lessons, opened in any order
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {featured.slice(0, 4).map((l) => {
          const Icon = FORMAT_ICON[l.format] || Target;
          return (
            <Link key={l.id} to="/arena"
              className="cq-panel cq-panel--action group block p-4 no-underline">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
                  <Icon size={13} aria-hidden="true" />
                  {FORMATS[l.format]?.label || l.format}
                </span>
                <span className="cq-data text-micro text-ink-500">{minutes(l.estMinutes)}</span>
              </div>
              <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-ink-900">{l.title}</p>
              <p className="mt-1 text-xs text-ink-500">{gradeLabel(l.gradeMin, l.gradeMax)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------- for students ------ */
function ForStudents() {
  return (
    <Band
      kicker="For students"
      title="Explore. Build. Experiment. Solve."
      lede="Four different things to do, because curiosity does not arrive in one shape."
    >
      <FeatureGrid>
        <FeatureCard span={4} to="/explore/experiments" image="/images/event-science-fun.png"
          imageAlt="Students running a hands-on chemistry demonstration">
          <Badge tone="ember">Experiment</Badge>
          <h3 className="mt-3 text-h3">Make something happen on your kitchen table</h3>
          <p className="mt-2.5 text-ink-600">
            {stats.experiments} experiments with real materials, real steps and an
            explanation of why it worked — balloon-powered cars, density towers,
            electromagnets, bridges that hold actual weight.
          </p>
          <TextLink to="/explore/experiments" className="mt-5">All {stats.experiments} experiments</TextLink>
        </FeatureCard>

        <FeatureCard span={2} tone="blue">
          <Badge tone="ember">Solve</Badge>
          <h3 className="mt-3 text-h3 text-white">Battle a boss with physics</h3>
          <p className="mt-2.5 text-sm text-white/75">
            In Arena battles, correct answers are the only thing that charges your
            elixir. Get the science right and your army moves. {stats.battles} campaigns,
            playable in any order.
          </p>
          <TextLink to="/arena" onDark className="mt-5">How the Arena works</TextLink>
        </FeatureCard>

        <FeatureCard span={2} to="/explore/coding">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
            <Terminal size={19} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-h4">Write your first real program</h3>
          <p className="mt-2 text-sm text-ink-600">
            Beginner tracks in Python, Java, and HTML &amp; CSS — {stats.codingLessons} lessons
            ending in projects you keep.
          </p>
          <TextLink to="/explore/coding" className="mt-4">Start coding</TextLink>
        </FeatureCard>

        <FeatureCard span={2} to="/explore/briefs" tone="tint">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-white text-orange-700 shadow-xs">
            <BookOpen size={19} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-h4">Five minutes, one good question</h3>
          <p className="mt-2 text-sm text-ink-600">
            How do self-driving cars see? Why does ice float? Short answers that
            do not talk down to you.
          </p>
          <TextLink to="/explore/briefs" className="mt-4">Read the archive</TextLink>
        </FeatureCard>

        <FeatureCard span={2} to="/explore/careers">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
            <Wrench size={19} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-h4">116 jobs you might not know exist</h3>
          <p className="mt-2 text-sm text-ink-600">
            What the work actually involves, who it suits, and where people doing
            it ended up.
          </p>
          <TextLink to="/explore/careers" className="mt-4">Explore careers</TextLink>
        </FeatureCard>
      </FeatureGrid>
    </Band>
  );
}

/* ------------------------------------------------------ for educators ------ */
const SETUP_STEPS = [
  { label: 'Make a free teacher account', detail: 'Name, email, password. No purchase order, no district approval.' },
  { label: 'Create a class', detail: '"5th Grade Science". Thirty seconds.' },
  { label: 'Share the code', detail: 'The platform generates something like CQ-48291. Write it on the board.' },
  { label: 'Students join', detail: 'They type the code and appear on your roster immediately.' },
  { label: 'Assign a first mission', detail: 'Pick a lesson, set a due date, set a mastery target. Done.' },
];

function ForEducators() {
  return (
    <Band tone="tint">
      <Split
        ratio="text"
        visual={(
          <Reveal>
            <div className="overflow-hidden rounded-lg border border-line bg-white shadow-lg">
              <div className="border-b border-line px-6 py-5">
                <p className="text-micro font-semibold uppercase tracking-label text-ink-500">Teacher view</p>
                <p className="mt-1.5 font-display text-h4 font-bold">5th Grade Science</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                {[
                  { label: 'Students', value: '24' },
                  { label: 'Class mastery', value: '72%' },
                  { label: 'Active this week', value: '21' },
                  { label: 'Lessons done', value: '184' },
                ].map((s) => (
                  <div key={s.label} className="bg-white px-4 py-4">
                    <p className="cq-data cq-data--md text-blue-700">{s.value}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-line p-6">
                <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
                  <Sparkles size={13} aria-hidden="true" /> Class insight
                </p>
                <p className="mt-2.5 font-display text-lg font-bold leading-snug">
                  Engineering Design is currently your class&rsquo;s weakest skill.
                </p>
                <p className="mt-2 text-sm text-ink-600">
                  Class average 54% across 19 students with enough evidence.
                  7 students are below 70%.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="cq-btn cq-btn--sm cq-btn--primary pointer-events-none">Assign a review</span>
                  <span className="cq-btn cq-btn--sm cq-btn--outline pointer-events-none">See which students</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              The insight a teacher actually needs — generated from evidence rather than typed in.
            </p>
          </Reveal>
        )}
      >
        <Kicker pill>For educators</Kicker>
        <h2 className="mt-4 text-h2">Bring hands-on STEM into your classroom without another prep period.</h2>
        <p className="mt-4 text-lead text-ink-600">
          Setup takes about five minutes. After that the platform does the tracking —
          completion, accuracy, mastery, growth, skill gaps — so you spend your time
          teaching rather than maintaining a spreadsheet.
        </p>

        <ol className="mt-8 space-y-3.5">
          {SETUP_STEPS.map((s, i) => (
            <li key={s.label} className="flex gap-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{s.label}</p>
                <p className="mt-0.5 text-sm text-ink-600">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button to="/arena/sign-up/teacher" variant="primary">Create a teacher account</Button>
          <Button to="/educators" variant="outline">What teachers get</Button>
        </div>
      </Split>
    </Band>
  );
}

/* ------------------------------------------------------------ community ---- */
const EVENTS = [
  {
    src: '/images/event-phoenixville-library.png',
    alt: 'CuriosityQuest volunteers running a session at Phoenixville Public Library',
    caption: 'Phoenixville Public Library — a Saturday morning circuits session. First time most of the room had closed a circuit.',
  },
  {
    src: '/images/event-earth-day.png',
    alt: 'CuriosityQuest booth at the Phoenixville Earth Day event',
    caption: 'Earth Day at Reservoir Park — water filtration and an oil-spill cleanup demo, outdoors, with families passing through all afternoon.',
  },
  {
    src: '/images/event-science-fun.png',
    alt: 'Students taking part in a hands-on chemistry demonstration',
    caption: 'Science Fun day — chemistry demos and a bridge-building competition that got competitive fast.',
  },
];

function Community() {
  return (
    <Band
      kicker="In the community"
      title="We show up in person, too."
      lede="CuriosityQuest is run by high-school students in Pennsylvania. These are our own events, not stock photography."
    >
      <div className="grid gap-7 cb:grid-cols-3">
        {EVENTS.map((e, i) => (
          <Reveal key={e.src} delay={i * 80}>
            <Figure caption={e.caption}>
              <img src={e.src} alt={e.alt} width="640" height="420" loading="lazy" decoding="async"
                className="aspect-[3/2] w-full object-cover" />
            </Figure>
          </Reveal>
        ))}
      </div>

      <div className="mt-14 grid gap-8 rounded-lg border border-line bg-paper-2 p-7 cb:grid-cols-[1fr_auto] cb:items-center cb:p-10">
        <div>
          <h3 className="text-h3">Run by students, for students</h3>
          <p className="mt-3 max-w-[62ch] text-ink-600">
            Four high-school students founded and run this: a biomedical-engineering
            hopeful, a quantitative-finance kid, an electrical engineer who writes the
            newsletter, and a science student who edits everything we film. We are
            fiscally hosted by Hack Club Bank, and everything we make is free.
          </p>
          <TextLink to="/about" className="mt-4">Meet the team</TextLink>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to="/programs" variant="outline">Upcoming events</Button>
          <Button href="https://hcb.hackclub.com/donations/start/curiosityquest" variant="accent">
            Support the work
          </Button>
        </div>
      </div>
    </Band>
  );
}

/* --------------------------------------------------------- get involved ---- */
const WAYS = [
  { icon: GraduationCap, title: 'Teachers', body: 'Free class accounts, dashboards and assignable lessons.', to: '/educators', cta: 'Set up a class' },
  { icon: Building2, title: 'Schools & libraries', body: 'Host a workshop, or run the Arena in a computer lab.', to: '/programs#host', cta: 'Invite us' },
  { icon: HeartHandshake, title: 'Volunteers', body: 'Help run events, write lessons or build the platform.', to: '/get-involved#volunteer', cta: 'Get involved' },
  { icon: Wrench, title: 'STEM partners', body: 'Bring your work to a room full of curious eleven-year-olds.', to: '/get-involved#partner', cta: 'Partner with us' },
  { icon: FlaskConical, title: 'Students', body: 'Start playing. You do not need a teacher or a class code.', to: '/arena/join', cta: 'Make an account' },
];

function GetInvolvedStrip() {
  return (
    <Band tone="ink"
      kicker="Get involved"
      title="There is a way in for you."
      lede="Everything we make is free. What we need is people willing to use it, run it, improve it, or help pay for it."
    >
      <ul className="grid gap-4 sm:grid-cols-2 cb:grid-cols-5">
        {WAYS.map(({ icon: Icon, title, body, to, cta }) => (
          <li key={title} className="flex flex-col rounded-lg border border-white/12 bg-white/[0.04] p-5">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-white/10 text-orange-300">
              <Icon size={19} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-h4 font-semibold text-white">{title}</h3>
            <p className="mt-2 flex-1 text-sm text-white/70">{body}</p>
            <TextLink to={to} onDark className="mt-5">{cta}</TextLink>
          </li>
        ))}
      </ul>
    </Band>
  );
}
