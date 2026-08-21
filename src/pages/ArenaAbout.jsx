import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Target, Zap, Swords, FlaskConical, Terminal, ClipboardCheck,
  BookOpen, LockOpen, Users, GraduationCap, KeyRound, ShieldCheck, Check,
} from 'lucide-react';
import Meta from '@/shell/Meta.jsx';
import {
  Band, Split, Statement, TextLink, StatRow, FeatureGrid, FeatureCard,
} from '@/components/marketing/Sections.jsx';
import {
  Badge, Button, Kicker, Reveal, MasteryTag, MasteryLegend, MASTERY, MASTERY_LEVELS,
} from '@/components/cq';
import { useAuth, homeFor } from '@/platform/auth.jsx';
import { MASTERY_RULES, computeMastery, rankForXp } from '@/platform/mastery.js';
import { CONTENT_SUMMARY, FORMATS } from '@/content/index.js';
import { minutes, gradeLabel } from '@/lib/format.js';

const { stats, strands, featured } = CONTENT_SUMMARY;
const R = MASTERY_RULES;

export default function ArenaAbout() {
  return (
    <>
      <Meta
        title="Science Arena — open any lesson, any time"
        description={`Science Arena is a free classroom STEM platform: ${stats.lessons} lessons across ${stats.skills} science skills, nothing locked, with mastery tracked from real evidence so teachers can see what students actually understand.`}
      />
      <Hero />
      <Statement cite="The one rule the whole platform is built around">
        Access is never the reward. Nothing is locked behind finishing something else.
      </Statement>
      <WhatsInside />
      <Formats />
      <HowMasteryWorks />
      <Battles />
      <WaysIn />
      <AccountNote />
    </>
  );
}

/* ---------------------------------------------------------------- hero -----
   This page is both a pitch and a front door. A signed-in visitor has already
   been pitched to, so the marketing column is replaced outright with a route
   back into the product rather than having a small link bolted on top. */
function Hero() {
  const { user, ready } = useAuth();
  return (
    <section className="cq-wash border-b border-line">
      <div className="cq-container">
        <div className="grid items-center gap-12 py-14 cb:grid-cols-[1.05fr_0.95fr] cb:gap-16 cb:py-24">
          {ready && user ? <ContinueColumn user={user} /> : <PitchColumn />}
          <Reveal className="min-w-0">
            <LessonStrip />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PitchColumn() {
  return (
    <div className="min-w-0">
      <Kicker pill>Science Arena</Kicker>
      <h1 className="mt-6 max-w-[22ch] text-display">Open any lesson. Any time.</h1>
      <p className="mt-6 max-w-[50ch] text-lead text-ink-600">
        {stats.lessons} science lessons, {stats.questions} questions, {stats.skills} skills.
        A student picks whatever looks interesting and starts — no levels to grind, no
        prerequisite chain. Underneath, the platform builds a picture of what they
        actually understand, and hands that picture to their teacher.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Button to="/arena/join" size="lg" variant="accent">
          Start playing <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <Button to="/arena/sign-up/teacher" size="lg" variant="outline">
          I&rsquo;m a teacher
        </Button>
      </div>
      <p className="mt-5 text-sm text-ink-600">
        Already have an account? <TextLink to="/arena/sign-in" className="align-middle">Sign in</TextLink>
      </p>
      <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
        {['Free, permanently', 'No email needed for students', 'Works on a school Chromebook'].map((t) => (
          <li key={t} className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
            <Check size={16} aria-hidden="true" className="text-success-500" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContinueColumn({ user }) {
  const isTeacher = user.role === 'teacher' || user.role === 'admin';
  const rank = isTeacher ? null : rankForXp(user.xpTotal || 0);
  return (
    <div className="min-w-0">
      <Kicker pill>Science Arena</Kicker>
      <h1 className="mt-6 max-w-[24ch] text-h1">
        Welcome back, {user.displayName || user.username}.
      </h1>
      <p className="mt-5 max-w-[46ch] text-lead text-ink-600">
        {isTeacher
          ? 'Your classes, assignments and mastery matrix are where you left them.'
          : 'Pick up whatever you were in the middle of, or start something completely different.'}
      </p>

      <div className="mt-8 rounded-lg border border-line bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
            {isTeacher ? 'Teacher dashboard' : 'Your Arena'}
          </p>
          {rank ? (
            <Badge tone="ember" title={`${user.xpTotal || 0} discovery points`}>
              {rank.title} · {(user.xpTotal || 0).toLocaleString()} DP
            </Badge>
          ) : (
            <Badge tone="info">{user.schoolName || 'Signed in'}</Badge>
          )}
        </div>
        <p className="mt-3 font-display text-h4 font-bold">
          {isTeacher ? 'Go to your classes' : 'Continue where you left off'}
        </p>
        <p className="mt-2 text-sm text-ink-600">
          {isTeacher
            ? 'Open a class to see per-student mastery, assignment progress and the week’s insights.'
            : 'Your unfinished lessons, assigned missions and recommendations are all on your Arena home.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to={homeFor(user)} size="lg" variant="primary">
            {isTeacher ? 'Open the dashboard' : 'Continue in the Arena'}
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <Button to={isTeacher ? '/arena/teach/library' : '/arena/explore'} size="lg" variant="outline">
            {isTeacher ? 'Browse lessons' : 'Browse all lessons'}
          </Button>
        </div>
      </div>

      <p className="mt-5 text-sm text-ink-600">
        Or read on — the rest of this page explains exactly how mastery is calculated.
      </p>
    </div>
  );
}

const FORMAT_ICON = {
  mission: Target, quick: Zap, battle: Swords, experiment: FlaskConical,
  course: Terminal, assessment: ClipboardCheck, brief: BookOpen,
};

/** Real featured lessons, shown mixed up on purpose: that is the argument. */
function LessonStrip() {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-lg cb:p-6">
      <div className="flex items-center gap-2">
        <LockOpen size={15} aria-hidden="true" className="text-blue-600" />
        <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
          All open right now
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {featured.slice(0, 6).map((l) => {
          const Icon = FORMAT_ICON[l.format] || Target;
          return (
            <Link key={l.id} to="/arena/join"
              className="cq-panel cq-panel--action block p-4 no-underline">
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
      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Six of {stats.lessons}. A ten-year-old can open the Python course and a
        fourteen-year-old can open the balloon-car experiment. The catalog does not
        have an opinion about the order.
      </p>
    </div>
  );
}

/* -------------------------------------------------------- what's inside ---- */
function WhatsInside() {
  return (
    <Band
      kicker="What's inside"
      title="One catalog, six strands, everything published."
      lede={`${stats.lessons} lessons and ${stats.activities} activities, written for grades 3–8 and available from the moment an account exists.`}
    >
      <StatRow
        items={[
          { value: stats.lessons, label: 'Lessons', hint: 'Every one playable today' },
          { value: stats.questions, label: 'Questions', hint: 'Each tagged to a science skill' },
          { value: stats.skills, label: 'Skills tracked', hint: `Across ${stats.strands} strands` },
          { value: stats.experiments, label: 'Experiments', hint: 'Hands-on, real materials' },
        ]}
      />

      <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line cb:grid-cols-2">
        {strands.map((s) => (
          <li key={s.id} className="bg-white p-6">
            {/* The strand colour always travels with the strand name — colour
                alone never carries meaning anywhere in this product. */}
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-pill"
                style={{ background: `var(--cq-strand-${s.id})` }} />
              <h3 className="text-h4 font-semibold">{s.name}</h3>
            </div>
            <p className="mt-2 text-sm text-ink-600">{s.blurb}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 text-xs font-medium text-ink-500">
              <span><span className="cq-data text-ink-800">{s.skillCount}</span> skills</span>
              <span><span className="cq-data text-ink-800">{s.lessonCount}</span> lessons</span>
            </p>
          </li>
        ))}
      </ul>
    </Band>
  );
}

/* ------------------------------------------------------------- formats ----- */
const FORMAT_NOTES = {
  mission: { span: 2, body: 'The backbone. Eight to ten guided questions on one topic, with an explanation after every answer. Explorer tier builds the ideas; Investigator tier uses the harder ones.' },
  experiment: { span: 2, body: 'Step-by-step builds using materials from a kitchen or a supply closet — balloon cars, density towers, electromagnets — then questions about what happened and why.' },
  battle: { span: 2, body: 'A boss fight where science is the fuel. Correct answers charge elixir, elixir buys units, units bring down the tower. There is no other way to get elixir.' },
  course: { span: 3, body: 'Beginner programming in Python, Java and HTML/CSS — 26, 12 and 12 lessons. Read a short explanation, then write code that does something.' },
  quick: { span: 3, body: 'Five questions, about five minutes. One for each topic plus an all-star mix. Good as a warm-up, a bell-ringer, or a filler with four minutes left in the period.' },
  assessment: { span: 3, body: 'Pre- and post-checks for Physics, Chemistry, Biology and Engineering. The same questions before and after a unit, so growth is measured rather than assumed.' },
  brief: { span: 3, body: 'A five-minute read answering one real question properly — how self-driving cars see, why ice floats — then a couple of questions to make it stick.' },
};

const FORMAT_ORDER = ['mission', 'experiment', 'battle', 'course', 'quick', 'assessment', 'brief'];

function Formats() {
  return (
    <Band
      tone="tint"
      kicker="Lesson formats"
      title="Seven shapes a lesson can take."
      lede="Curiosity does not arrive in one form, so a lesson does not either. Every format feeds the same skill model, which means a battle and an assessment are equally valid evidence."
    >
      <FeatureGrid>
        {FORMAT_ORDER.map((key) => {
          const f = FORMATS[key];
          const note = FORMAT_NOTES[key];
          const Icon = FORMAT_ICON[key];
          return (
            <FeatureCard key={key} span={note.span}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="cq-data cq-data--md text-ink-400">{stats.byFormat[key]}</span>
              </div>
              <h3 className="mt-4 text-h4 font-semibold">{f.label}</h3>
              <p className="mt-2 text-sm text-ink-600">{note.body}</p>
            </FeatureCard>
          );
        })}
      </FeatureGrid>
    </Band>
  );
}

/* ------------------------------------------------------------- mastery -----
   The worked examples below are run through the real engine at module load
   rather than typed in as prose, so this page physically cannot drift away
   from the rules it claims to describe. */
function example(sittingPcts) {
  const responses = [];
  sittingPcts.forEach((pct, s) => {
    const total = 10;
    const correct = Math.round((pct / 100) * total);
    for (let i = 0; i < total; i += 1) {
      responses.push({
        attemptId: `sitting-${s}`,
        questionId: `question-${i}`,
        difficulty: 1,
        isCorrect: i < correct,
        answeredAt: new Date(2026, 0, 6 + s * 7).toISOString(),
      });
    }
  });
  return { sittings: sittingPcts, ...computeMastery(responses) };
}

const IMPROVER = example([60, 80, 90]);
const SLIPPED = example([90, 90, 50]);

const LEVEL_RULE = {
  not_started: 'No answers recorded yet. Not a judgement — just an absence.',
  beginning: `Some evidence, below ${R.developingPct}%.`,
  developing: `At or above ${R.developingPct}%.`,
  proficient: `At or above ${R.proficientPct}%, from at least ${R.proficientEvidence} scored questions.`,
  mastered: `At or above ${R.masteredPct}%, from at least ${R.masteredEvidence} questions and ${R.masteredDistinctQuestions} distinct questions, across ${R.masteredSessions} or more separate sittings, with every recent sitting at ${R.masteredRecentFloor}% or better.`,
};

const MASTERY_STEPS = [
  {
    title: 'Every answer is tagged to a skill',
    body: `Not to a lesson — to one of ${stats.skills} skills. Friction, food webs, structures and materials, fair testing. A battle question about inertia and a mission question about inertia are the same evidence.`,
  },
  {
    title: 'Evidence accumulates across lessons and sittings',
    body: 'A skill is not scored per lesson. Every response a student has ever given on that skill goes into one calculation, whichever lesson it came from and however long ago.',
  },
  {
    title: 'Recent work counts for more, old work still counts',
    body: `Sittings are weighted by recency — a sitting's weight halves roughly every ${R.halfLifeSessions} sittings — and harder questions carry more weight than easy ones, up to ${R.difficultyWeight[3]}×.`,
  },
  {
    title: 'One lucky 100% is not "Mastered"',
    body: `Mastered needs ${R.masteredEvidence}+ questions from ${R.masteredDistinctQuestions}+ distinct questions across ${R.masteredSessions}+ separate sittings, with every recent sitting holding at ${R.masteredRecentFloor}%. Replaying the same two questions cannot get you there: only the ${R.maxRepeatsPerQuestion} most recent answers to any one question count.`,
  },
  {
    title: 'Growth is reported as first → latest',
    body: '"54% → 89%" says more about learning than "89%" does, so the student passport and the teacher dashboard both show the journey rather than only the endpoint.',
  },
];

function HowMasteryWorks() {
  return (
    <Band
      kicker="How mastery works"
      title="A number you can actually trust."
      lede="This is the part that makes the freedom possible. If mastery is measured properly, nothing has to be locked to prove a student learned something."
    >
      <Split
        ratio="text"
        align="start"
        visual={(
          <Reveal className="space-y-5">
            <WorkedExample
              title="Learns it over three sittings"
              caption="Growth is rewarded. The weak first attempt is not thrown away, but it stops being the headline."
              record={IMPROVER}
            />
            <WorkedExample
              title="Had it, then lost it"
              caption="A stale badge is not protected. The recent window now contains a 50, so the level steps back."
              record={SLIPPED}
            />
          </Reveal>
        )}
      >
        <ol className="space-y-6">
          {MASTERY_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-blue-50 text-sm font-bold text-blue-700">
                {i + 1}
              </span>
              <div>
                <h3 className="text-h4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Split>

      {/* The five levels with their actual thresholds. Nobody should have to
          guess what "Proficient" means, least of all the student it describes. */}
      <div className="mt-14 overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper-2 px-6 py-4">
          <h3 className="text-h4 font-semibold">The five levels</h3>
          <MasteryLegend compact />
        </div>
        <ul className="divide-y divide-line bg-white">
          {MASTERY_LEVELS.map((level) => (
            <li key={level} className="grid gap-2 px-6 py-4 cb:grid-cols-[12rem_1fr] cb:items-baseline cb:gap-6">
              <MasteryTag level={level} showPct={false} />
              <div>
                <p className="text-sm text-ink-700">{LEVEL_RULE[level]}</p>
                <p className="mt-0.5 text-xs text-ink-500">{MASTERY[level].hint}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-line bg-paper-2 px-6 py-4 text-xs leading-relaxed text-ink-600">
          A level never restricts anything. A student sitting at Beginning on Friction
          can open the hardest friction lesson in the catalog immediately, and probably
          should.
        </p>
      </div>
    </Band>
  );
}

function WorkedExample({ title, caption, record }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="font-display font-bold">{title}</p>
        <MasteryTag level={record.level} pct={record.pct} />
      </div>
      <div className="flex items-stretch divide-x divide-line">
        {record.sittings.map((p, i) => (
          <div key={i} className="flex-1 px-3 py-4 text-center">
            <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
              Sitting {i + 1}
            </p>
            <p className="cq-data cq-data--md mt-1.5 text-ink-900">{p}%</p>
          </div>
        ))}
        <div className="flex-1 bg-paper-2 px-3 py-4 text-center">
          <p className="text-micro font-semibold uppercase tracking-label text-ink-500">Growth</p>
          <p className="cq-data cq-data--md mt-1.5 text-ink-900">
            {record.growth > 0 ? '+' : ''}{record.growth}
          </p>
        </div>
      </div>
      <p className="border-t border-line px-5 py-4 text-xs leading-relaxed text-ink-600">
        {record.evidence} answers, {record.distinctQuestions} distinct questions,
        {' '}{record.sittings.length} sittings. The engine returns{' '}
        <span className="font-semibold text-ink-900">{record.pct}%</span> and{' '}
        <span className="font-semibold text-ink-900">{MASTERY[record.level].label}</span>. {caption}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- battles ----- */
const BATTLES = [
  { name: 'Inertia Imp', strand: 'forces' },
  { name: 'Friction Fiend', strand: 'forces' },
  { name: 'Energy Ogre', strand: 'forces' },
  { name: 'Static Specter', strand: 'matter' },
  { name: 'Magneto Marauder', strand: 'matter' },
  { name: 'Prism Phantom', strand: 'matter' },
  { name: 'Fungal Fiend', strand: 'life' },
  { name: 'Ecosystem Overlord', strand: 'life' },
  { name: 'Tectonic Titan', strand: 'earth' },
  { name: 'Cosmic Corsair', strand: 'earth' },
  { name: 'Machine Mastermind', strand: 'build' },
  { name: 'The Grand Examiner', strand: 'method' },
];

const STRAND_NAME = Object.fromEntries(strands.map((s) => [s.id, s.name]));

const BATTLE_STEPS = [
  'A science question appears. Get it right and your elixir charges — harder questions pay more.',
  'Spend elixir to deploy units. Nothing else generates elixir, so nothing else wins the fight.',
  'Your units advance on the boss’s tower while it sends its own down the lane at you.',
  'Bring the tower down before it brings down yours. Every answer along the way still counts as skill evidence.',
];

function Battles() {
  return (
    <Band tone="ink">
      <Split
        ratio="text"
        visual={(
          <Reveal>
            <div className="rounded-lg border border-white/12 bg-white/[0.04] p-6">
              <p className="text-micro font-semibold uppercase tracking-label text-white/60">
                {stats.battles} campaigns
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {BATTLES.map((b) => (
                  <li key={b.name} className="flex items-center gap-2.5 text-sm text-white/85">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-pill"
                      style={{ background: `var(--cq-strand-${b.strand})` }} />
                    <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                    <span className="hidden shrink-0 text-xs text-white/50 cb:inline">
                      {STRAND_NAME[b.strand]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      >
        <Kicker onDark pill>Battles</Kicker>
        <h2 className="mt-4 text-h2 text-white">Science is the only ammunition.</h2>
        <p className="mt-4 text-lead text-white/75">
          A battle looks like a tower-defence game and works like a quiz students
          actually want to finish. Answer the physics question correctly and your army
          moves. Guess wrong and you stand still while the boss builds up.
        </p>
        <ol className="mt-8 space-y-4">
          {BATTLE_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-white/12 text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm text-white/80">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-9">
          <Button to="/arena/join" variant="onDark">Pick a battle</Button>
        </div>
      </Split>
    </Band>
  );
}

/* -------------------------------------------------------------- ways in ---- */
const ENTRIES = [
  {
    icon: Users,
    badge: 'Students',
    title: 'Make an account and start',
    body: 'Pick a username, a display name and a password. If your teacher gave you a class code, type it in and you appear on their roster. If not, join anyway — the whole catalog is open either way.',
    cta: 'Start playing',
    to: '/arena/join',
    variant: 'accent',
  },
  {
    icon: GraduationCap,
    badge: 'Teachers',
    title: 'Create a class in about five minutes',
    body: 'Make an account, create a class, share the join code. Then you get a class mastery matrix, per-student detail, assignment analytics and CSV export — with nothing to maintain.',
    cta: 'Create a teacher account',
    to: '/arena/sign-up/teacher',
    variant: 'primary',
  },
];

function WaysIn() {
  return (
    <Band
      tone="tint"
      kicker="Two ways in"
      title="Start as a student, or set up a class."
      lede="Both are free, and neither needs a purchase order."
    >
      <div className="grid gap-6 cb:grid-cols-2">
        {ENTRIES.map((c) => (
          <div key={c.badge} className="flex flex-col rounded-lg border border-line bg-white p-7 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
                <c.icon size={19} aria-hidden="true" />
              </span>
              <Badge tone="info">{c.badge}</Badge>
            </div>
            <h3 className="mt-5 text-h3">{c.title}</h3>
            <p className="mt-3 flex-1 text-ink-600">{c.body}</p>
            <div className="mt-7">
              <Button to={c.to} variant={c.variant} size="lg">{c.cta}</Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-600">
        <span>Coming back?</span>
        <TextLink to="/arena/sign-in">Sign in to the Arena</TextLink>
        <span aria-hidden="true">·</span>
        <TextLink to="/educators">What the teacher dashboard gives you</TextLink>
      </p>
    </Band>
  );
}

/* -------------------------------------------------------- account honesty -- */
const ACCOUNT_FACTS = [
  'No email required for a student account',
  'No home address, phone number or date of birth',
  'Learning data only: answers, scores, time on task, mastery',
  'A teacher sees only the students in their own classes',
];

function AccountNote() {
  return (
    <Band dense>
      <div className="grid gap-6 rounded-lg border border-line bg-paper-2 p-7 cb:grid-cols-[auto_1fr] cb:gap-8 cb:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-md bg-white text-blue-600 shadow-xs">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-h3">What an account actually stores</h2>
          <p className="mt-3 max-w-[68ch] text-ink-600">
            A display name, a username, and a password. That is the account. Students
            do not need an email address at all — usernames exist precisely so a
            ten-year-old can have an account without having an inbox. Teachers give an
            email because they need a way to recover a password.
          </p>
          <ul className="mt-5 grid gap-2.5 cb:grid-cols-2">
            {ACCOUNT_FACTS.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-ink-700">
                <KeyRound size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-400" />
                {t}
              </li>
            ))}
          </ul>
          <TextLink to="/privacy" className="mt-6">Read the privacy notice</TextLink>
        </div>
      </div>
    </Band>
  );
}
