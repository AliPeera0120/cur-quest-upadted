import React from 'react';
import {
  ArrowRight, Instagram, Mail, Newspaper, Landmark, FlaskConical, Terminal,
  BookOpen, Users, School, Library, HeartHandshake, Check,
} from 'lucide-react';
import Meta from '@/shell/Meta.jsx';
import {
  Band, Split, Statement, TextLink, Figure, StatRow, Ledger,
} from '@/components/marketing/Sections.jsx';
import { Badge, Button, Kicker, Reveal } from '@/components/cq';
import { CONTENT_SUMMARY } from '@/content/index.js';
import team from '@/data/team.json';

const { stats } = CONTENT_SUMMARY;

const CONTACT = {
  email: 'curiosity.quest25@gmail.com',
  instagram: 'https://www.instagram.com/curiosityquest25',
  newsletter: 'https://curiosityquest25.substack.com/',
  donate: 'https://hcb.hackclub.com/donations/start/curiosityquest',
};

export default function About() {
  return (
    <>
      <Meta
        title="About CuriosityQuest"
        description="CuriosityQuest is a nonprofit run by high-school students in Pennsylvania. We make hands-on STEM free: experiments, coding courses, a classroom learning platform, and free workshops at libraries and community centres."
      />
      <Hero />
      <Mission />
      <Statement cite="What we are actually trying to do">
        Every child is naturally curious. Curiosity is the beginning of all discovery.
      </Statement>
      <Team />
      <Built />
      <WhoWeServe />
      <Events />
      <Support />
    </>
  );
}

/* ---------------------------------------------------------------- hero ----- */
function Hero() {
  return (
    <section className="cq-wash border-b border-line">
      <div className="cq-container">
        <div className="grid items-center gap-12 py-14 cb:grid-cols-[1fr_1fr] cb:gap-16 cb:py-24">
          <div className="min-w-0">
            <Kicker pill>About us</Kicker>
            <h1 className="mt-6 max-w-[22ch] text-display">
              A nonprofit run by high-school students.
            </h1>
            <p className="mt-6 max-w-[50ch] text-lead text-ink-600">
              CuriosityQuest exists to spark a love of learning through hands-on STEM.
              Three of us started it, all still in high school, and everything we make
              is free — {stats.experiments} experiments, {stats.lessons} lessons in
              Science Arena, a weekly newsletter, and workshops at libraries near us.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/explore" size="lg" variant="accent">
                See what we make <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button to="/get-involved" size="lg" variant="outline">Get involved</Button>
            </div>
          </div>
          <Reveal className="min-w-0">
            <Figure caption="Phoenixville Public Library, one of our Saturday sessions. Everything we run in the community is free and open to whoever turns up.">
              <img
                src="/images/event-phoenixville-library.png"
                alt="CuriosityQuest volunteers running a hands-on session with children at Phoenixville Public Library"
                width="720" height="480" loading="eager" decoding="async"
                className="aspect-[3/2] w-full object-cover"
              />
            </Figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- mission ----- */
function Mission() {
  return (
    <Band>
      <Split
        ratio="text"
        align="start"
        visual={(
          <Reveal>
            <div className="rounded-lg border border-line bg-paper-2 p-7 cb:p-8">
              <h3 className="text-h4 font-semibold">What that means in practice</h3>
              <ul className="mt-5 space-y-5">
                {[
                  {
                    title: 'Doing beats watching',
                    body: 'Build a circuit, mix a reaction, code a program, test a bridge until it fails. Reading about science is not the same experience and never has been.',
                  },
                  {
                    title: 'Free is not a discount, it is the model',
                    body: 'No paid tier, no trial, no school licence. A student with a library card and a Chromebook gets exactly what a well-funded district gets.',
                  },
                  {
                    title: 'Nothing is locked',
                    body: 'In Science Arena a student can open any lesson at any time. We measure understanding carefully so we never have to withhold anything to prove it.',
                  },
                  {
                    title: 'Written for a real age range',
                    body: 'Ages 8 to 16, with the safety notes an eight-year-old’s parent actually needs and without talking down to a fifteen-year-old.',
                  },
                ].map((p) => (
                  <li key={p.title} className="flex gap-3">
                    <Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-success-500" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{p.title}</p>
                      <p className="mt-1 text-sm text-ink-600">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      >
        <Kicker>Our mission</Kicker>
        <h2 className="mt-4 text-h2">Hands-on STEM, free, for any curious kid.</h2>
        <div className="mt-6 space-y-5 text-lead text-ink-600">
          <p>
            CuriosityQuest is a nonprofit programme designed to spark a love of learning
            in kids through hands-on STEM experiences. We believe every child is
            naturally curious — and that curiosity is the beginning of all discovery.
          </p>
          <p>
            Instead of just reading about science or watching videos, our activities let
            you <strong className="text-orange-800">actually do science</strong>. Build
            circuits, mix colourful chemistry experiments, code your first program, and
            explore how the world works.
          </p>
          <p>
            Whether you are at home, in a library, or at one of our community events,
            we want learning to feel like something you chose rather than something
            assigned to you.
          </p>
        </div>
      </Split>
    </Band>
  );
}

/* ---------------------------------------------------------------- team -----
   Editorial rows rather than a grid of round avatars: these are three named
   high-school students with real bios in their own words, and an avatar
   strip would flatten them into decoration. */
function Team() {
  return (
    <Band
      tone="tint"
      kicker="The team"
      title="Three students, three roles, one mission."
      lede="We are all still in high school. The bios below are in our own words."
    >
      <ul className="divide-y divide-line">
        {team.map((m, i) => (
          <Reveal as="li" key={m.id} delay={i * 60} className="py-10 first:pt-0 last:pb-0">
            <div className={`grid gap-7 cb:grid-cols-[16rem_1fr] cb:gap-12 ${i % 2 ? 'cb:grid-cols-[1fr_16rem]' : ''}`}>
              <div className={`min-w-0 ${i % 2 ? 'cb:order-2' : ''}`}>
                <img
                  src={m.image}
                  alt={`${m.name}, ${m.role} at CuriosityQuest`}
                  width="480" height="600" loading="lazy" decoding="async"
                  className="aspect-[4/5] w-full max-w-[16rem] rounded-lg border border-line bg-white object-cover shadow-xs"
                />
              </div>
              <div className={`min-w-0 ${i % 2 ? 'cb:order-1' : ''}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-h3">{m.name}</h3>
                  <Badge tone="info">{m.role}</Badge>
                </div>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink-500">
                  <School size={15} aria-hidden="true" />
                  {m.school}
                </p>
                <p className="mt-5 max-w-[62ch] text-ink-700">{m.bio}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>
    </Band>
  );
}

/* --------------------------------------------------------------- built ----- */
const BUILT = [
  {
    icon: FlaskConical,
    title: `${stats.experiments} hands-on experiments`,
    body: 'Step-by-step builds using materials from a kitchen or a supply closet, each with the science explained rather than just the instructions. Physics, chemistry, biology and engineering.',
    detail: 'Free to browse and run, no account needed',
    to: '/explore/experiments',
    linkLabel: 'Browse experiments',
  },
  {
    icon: Users,
    title: `Science Arena — ${stats.lessons} lessons`,
    body: `A full classroom platform: ${stats.questions} questions tagged to ${stats.skills} science skills across ${stats.strands} strands, ${stats.battles} battle campaigns, ${stats.byFormat.assessment} pre/post checks, teacher dashboards and class codes. Nothing in it is locked.`,
    detail: 'Free accounts for students and teachers',
    to: '/arena',
    linkLabel: 'How it works',
  },
  {
    icon: Terminal,
    title: `${stats.codingLessons} coding lessons`,
    body: 'Beginner tracks in Python, Java, and HTML & CSS, ending in projects a student keeps. Written for someone who has never opened an editor before.',
    detail: 'Python · Java · HTML & CSS',
    to: '/explore/coding',
    linkLabel: 'Start coding',
  },
  {
    icon: BookOpen,
    title: `${stats.briefs} issues of "5 Minutes of STEM"`,
    body: 'A weekly newsletter that answers one real question properly — how computers see, why ice floats — in language a fifth grader can follow and an adult still learns from.',
    detail: 'Written by Sparsh, our Director of Communications',
    to: '/explore/briefs',
    linkLabel: 'Read the archive',
  },
  {
    icon: Library,
    title: 'Free workshops in our community',
    body: 'Sessions at public libraries, community centres and local events in Pennsylvania — circuits, water filtration, chemistry demos and bridge-building competitions, run by us in person.',
    detail: 'Phoenixville Public Library · Earth Day at Reservoir Park · Science Fun day',
    to: '/programs',
    linkLabel: 'Find an event',
  },
];

function Built() {
  return (
    <Band
      kicker="What we've built so far"
      title="Started as one club idea. This is where it is now."
      lede="Every number on this page is a count of something that exists and works today, not a projection."
    >
      <StatRow
        items={[
          { value: stats.lessons, label: 'Arena lessons', hint: `${stats.activities} activities inside them` },
          { value: stats.experiments, label: 'Experiments', hint: 'Household materials' },
          { value: stats.codingLessons, label: 'Coding lessons', hint: 'Python, Java, HTML & CSS' },
          { value: stats.skills, label: 'Skills tracked', hint: `Across ${stats.strands} science strands` },
        ]}
      />
      <div className="mt-12">
        <Ledger items={BUILT} numbered={false} />
      </div>
    </Band>
  );
}

/* -------------------------------------------------------- who we serve ----- */
const AUDIENCES = [
  {
    icon: Users,
    title: 'Students, ages 8 to 16',
    body: 'The whole point. Everything is written to be readable by a third grader with help and interesting to an eleventh grader without it. Ages 8–16, grades 3–8 in the Arena catalog.',
  },
  {
    icon: HeartHandshake,
    title: 'Families',
    body: 'Experiments list their materials, their prep time and their safety notes up front, so a parent can decide in fifteen seconds whether this is a Saturday morning activity or not.',
  },
  {
    icon: Library,
    title: 'Libraries and community centres',
    body: 'We bring the materials and run the session. Free, no minimum audience, and we will happily do it for eight kids on a rainy Saturday.',
  },
  {
    icon: School,
    title: 'Educators',
    body: 'Free class accounts with a mastery matrix, assignment analytics and CSV export. Five minutes of setup, no purchase order, nothing to maintain afterwards.',
  },
];

function WhoWeServe() {
  return (
    <Band
      tone="ink"
      kicker="Who we serve"
      title="Four audiences, one set of materials."
      lede="We would rather make one thing that works for a kitchen table, a library table and a classroom than three things that each work in one place."
    >
      <ul className="grid gap-5 sm:grid-cols-2">
        {AUDIENCES.map((a) => (
          <li key={a.title} className="rounded-lg border border-white/12 bg-white/[0.04] p-6">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-white/10 text-orange-300">
              <a.icon size={19} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-h4 font-semibold text-white">{a.title}</h3>
            <p className="mt-2 text-sm text-white/70">{a.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button to="/educators" variant="onDark">For educators</Button>
        <Button to="/programs" variant="outlineOnDark">Host a workshop</Button>
      </div>
    </Band>
  );
}

/* -------------------------------------------------------------- events ----- */
const EVENT_PHOTOS = [
  {
    src: '/images/event-phoenixville-library.png',
    alt: 'Children and CuriosityQuest volunteers around a table of circuit components at Phoenixville Public Library',
    caption: 'Phoenixville Public Library. A Saturday morning circuits session — for most of the room it was the first circuit they had ever closed.',
  },
  {
    src: '/images/event-earth-day.png',
    alt: 'The CuriosityQuest booth at a community Earth Day event outdoors',
    caption: 'Earth Day at Reservoir Park. Water filtration and an oil-spill cleanup demo, outdoors, with families passing through all afternoon.',
  },
  {
    src: '/images/event-science-fun.png',
    alt: 'Students taking part in a hands-on chemistry demonstration at a Science Fun day',
    caption: 'Science Fun day. Chemistry demos and a bridge-building competition that got competitive faster than we expected.',
  },
];

function Events() {
  return (
    <Band
      kicker="In the community"
      title="Our own events, our own photographs."
      lede="These are three sessions we ran in Pennsylvania. No stock photography anywhere on this site."
    >
      <div className="grid gap-7 cb:grid-cols-3">
        {EVENT_PHOTOS.map((e, i) => (
          <Reveal key={e.src} delay={i * 80}>
            <Figure caption={e.caption}>
              <img src={e.src} alt={e.alt} width="640" height="420" loading="lazy" decoding="async"
                className="aspect-[3/2] w-full object-cover" />
            </Figure>
          </Reveal>
        ))}
      </div>
    </Band>
  );
}

/* ------------------------------------------------------------- support ----- */
function Support() {
  return (
    <Band tone="tint" kicker="Funding and contact" title="How this is paid for, and how to reach us.">
      <div className="grid gap-8 cb:grid-cols-[1.1fr_1fr] cb:gap-14">
        <div>
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white text-blue-600 shadow-xs">
              <Landmark size={22} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-h4 font-semibold">Fiscally hosted by Hack Club Bank</h3>
              <p className="mt-2 max-w-[62ch] text-ink-600">
                We are fiscally hosted by Hack Club Bank, which means donations are
                handled through a registered 501(c)(3) and our finances are transparent
                rather than sitting in a student’s bank account. Money goes to event
                materials, printing, and the domain — there are no salaries.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href={CONTACT.donate} variant="accent">Support the work</Button>
                <Button to="/get-involved" variant="outline">Other ways to help</Button>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid gap-3">
          {[
            {
              icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}`,
              hint: 'Workshops, partnerships, questions from teachers',
            },
            {
              icon: Instagram, label: 'Instagram', value: '@curiosityquest25', href: CONTACT.instagram,
              hint: 'Event photos and what we are building',
            },
            {
              icon: Newspaper, label: 'Newsletter', value: '5 Minutes of STEM', href: CONTACT.newsletter,
              hint: 'One good question, answered properly, every week',
            },
          ].map((c) => (
            <li key={c.label}>
              <a href={c.href}
                className="cq-panel cq-panel--action flex items-center gap-4 p-5 no-underline">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                  <c.icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-micro font-semibold uppercase tracking-label text-ink-500">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block truncate font-semibold text-ink-900">{c.value}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{c.hint}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-sm text-ink-600">
        Teachers looking for the classroom side can start at{' '}
        <TextLink to="/educators">what the dashboard gives you</TextLink>.
      </p>
    </Band>
  );
}
