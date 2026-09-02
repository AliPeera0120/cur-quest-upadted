import React, { useMemo } from 'react';
import {
  ArrowRight, CalendarDays, Check, Clock, Mail, MapPin, Users,
} from 'lucide-react';
import { Badge, Button, Callout, EmptyState, Kicker, Reveal } from '@/components/cq';
import { Band, Ledger, Split, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import EVENTS from '@/data/events.json';
import { CONTENT_SUMMARY } from '@/content/index.js';

const EXPERIMENTS = CONTENT_SUMMARY.stats.experiments;

const EMAIL = 'curiosity.quest25@gmail.com';

/**
 * A pre-filled mailto, because the difference between "email us" and a librarian
 * actually emailing us is usually the blank subject line. The four questions in
 * the body are the four we would have to ask anyway.
 */
const HOST_MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent('Hosting a CuriosityQuest session')}&body=${encodeURIComponent(
  [
    'Hi CuriosityQuest,',
    '',
    'We would like to host a session.',
    '',
    'Where: ',
    'Possible dates: ',
    'Ages and rough head count: ',
    'Room and water access: ',
    '',
    'Thanks,',
  ].join('\n'),
)}`;

/**
 * Event dates are written the way a poster writes them — "June 17th, 2026" —
 * which Date.parse cannot read until the ordinal suffix comes off. Anything
 * still unparseable sorts last rather than throwing the list away.
 */
function eventTime(dateText) {
  const t = Date.parse(String(dateText || '').replace(/(\d+)(st|nd|rd|th)/i, '$1'));
  return Number.isNaN(t) ? -Infinity : t;
}

export default function Programs() {
  const { upcoming, past } = useMemo(() => ({
    upcoming: EVENTS.filter((e) => e.upcoming),
    past: EVENTS.filter((e) => !e.upcoming).sort((a, b) => eventTime(b.date) - eventTime(a.date)),
  }), []);

  return (
    <>
      <Meta
        title="Events and community programs"
        description="Free hands-on STEM sessions at libraries and community events around Phoenixville, run by high-school students. See what is coming up, or invite us to your library."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <Kicker pill>Programs and events</Kicker>
          <h1 className="mt-6 max-w-[24ch] text-h1">Free STEM sessions where kids already are.</h1>
          <p className="mt-6 max-w-[54ch] text-lead text-ink-600">
            We run hands-on experiments at public libraries and community events around
            Phoenixville — the kind where every kid does the experiment themselves
            instead of watching an adult do it at the front of the room.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="#upcoming" size="lg" variant="primary">See what is coming up</Button>
            <Button href="#host" size="lg" variant="accent">
              Bring us to your library <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {['Always free', 'About 45 minutes', 'Ages 8–11 works best', 'We bring the materials'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                <Check size={16} aria-hidden="true" className="text-success-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="upcoming" className="scroll-mt-24 bg-white">
        <div className="cq-container cq-section">
          <Kicker pill>Upcoming</Kicker>
          <h2 className="mt-4 text-h2">
            {upcoming.length ? 'Next time we are out' : 'Nothing on the calendar right now'}
          </h2>

          {upcoming.length ? (
            <div className="mt-12 space-y-10">
              {upcoming.map((e) => <UpcomingEvent key={e.id} event={e} />)}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              className="mt-10"
              title="No sessions scheduled at the moment"
              action={<Button href={HOST_MAILTO} variant="primary"><Mail size={15} aria-hidden="true" /> Invite us to host one</Button>}
            >
              New dates get added when a library confirms one. The fastest way to make a
              session happen near you is to ask your library to host it — or to run an
              experiment at home in the meantime.
            </EmptyState>
          )}
        </div>
      </section>

      <Band
        tone="tint"
        kicker="Past events"
        title="Where we have been"
        lede="Every poster below is one of our own sessions. The experiments come out of the same library anyone can browse on this site."
      >
        <ul className="divide-y divide-line">
          {past.map((e, i) => <PastEvent key={e.id} event={e} delay={i * 60} />)}
        </ul>
      </Band>

      <SessionShape />

      <HostSection />
    </>
  );
}

/* ------------------------------------------------------------- upcoming --- */

function UpcomingEvent({ event }) {
  return (
    <Reveal className="overflow-hidden rounded-lg border border-line bg-white shadow-lg">
      <div className="grid cb:grid-cols-[minmax(0,22rem)_1fr]">
        {/* The posters are portrait artwork with text on them, so they are
            contained on a tinted panel rather than cropped to a card ratio. */}
        <div className={`flex items-center justify-center bg-paper-2 ${event.imageType === 'photo' ? '' : 'p-6 cb:p-8'}`}>
          <img
            src={event.image}
            alt={event.imageAlt || `Event poster for ${event.title}`}
            width="791"
            height="1024"
            loading="eager"
            decoding="async"
            className={event.imageType === 'photo'
              ? 'aspect-[4/3] h-full w-full object-cover'
              : 'w-full max-w-[18rem] rounded-md object-contain shadow-sm'}
          />
        </div>

        <div className="p-7 cb:p-10">
          <Badge tone="success" icon={CalendarDays}>Upcoming</Badge>
          <h3 className="mt-4 text-h3">{event.title}</h3>
          <p className="mt-2 font-display text-lg font-bold text-orange-800">{event.date}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <Detail icon={Clock} label="Time">{event.time}</Detail>
            <Detail icon={MapPin} label="Where">{event.location}</Detail>
            <Detail icon={Users} label="Who it is for">{event.ageGroup}</Detail>
          </dl>

          <p className="mt-6 max-w-[62ch] text-ink-600">{event.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Question about ${event.title}`)}`} variant="outline">
              <Mail size={15} aria-hidden="true" /> Ask us a question
            </Button>
            <TextLink to="/explore/experiments">See the experiments we run</TextLink>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div>
      <dt className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-ink-500">
        <Icon size={12} aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{children}</dd>
    </div>
  );
}

/* ----------------------------------------------------------------- past --- */

function PastEvent({ event, delay }) {
  return (
    <Reveal as="li" delay={delay} className="grid gap-5 py-7 cb:grid-cols-[7rem_1fr] cb:gap-8">
      <img
        src={event.image}
        alt={`Event poster for ${event.title}`}
        width="791"
        height="1024"
        loading="lazy"
        decoding="async"
        className="w-24 rounded-md border border-line bg-white object-contain shadow-xs cb:w-28"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-h4 font-semibold">{event.title}</h3>
          <span className="cq-data text-sm text-ink-500">{event.date}</span>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={12} aria-hidden="true" /> {event.location}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={12} aria-hidden="true" /> {event.time}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={12} aria-hidden="true" /> {event.ageGroup}</span>
        </p>
        <p className="mt-3 max-w-[76ch] text-sm leading-relaxed text-ink-600">{event.description}</p>
      </div>
    </Reveal>
  );
}

/* -------------------------------------------------------- what happens ---- */

const SESSION_STEPS = [
  {
    title: 'We start with the question, not the answer',
    body: 'Why does foam shoot out of the bottle? Why does the oil sit on top? Two minutes, no lecture — then everyone gets their hands on it.',
    detail: 'About 5 minutes',
  },
  {
    title: 'Every kid runs the experiment themselves',
    body: 'Not a demonstration at the front of the room. Everyone gets their own cup, their own bottle, their own mess. Volunteers move around the tables instead of standing at the board.',
    detail: 'About 25 minutes',
  },
  {
    title: 'Then we explain what actually happened',
    body: 'Reaction, density, pressure, filtration — in the words a nine-year-old already has. This is the part that turns a fun mess into something they can explain to somebody else at dinner.',
    detail: 'About 10 minutes',
  },
  {
    title: 'They leave with something, and a way to keep going',
    body: 'Usually the thing they built, and the same experiment written up on this site so they can run it again at home with a parent.',
    detail: 'About 5 minutes',
    to: '/explore/experiments',
    linkLabel: 'The experiment library',
  },
];

function SessionShape() {
  return (
    <Band>
      <Split
        ratio="text"
        align="start"
        visual={(
          <Reveal className="cq-panel cq-panel--lg cq-panel--lift p-6 cb:p-8">
            <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
              Experiments we have actually run
            </p>
            <ul className="mt-5 space-y-4">
              {[
                ['Elephant toothpaste', 'Hydrogen peroxide, soap and yeast. A reaction fast enough to see, and foam everywhere.'],
                ['Lava lamps', 'Water, oil, food colouring and an Alka-Seltzer tablet. Density you can watch.'],
                ['Oil-spill cleanup', 'Run outdoors at Earth Day — the same problem an environmental engineer gets paid to solve.'],
              ].map(([name, body]) => (
                <li key={name} className="border-l-2 border-orange-300 pl-4">
                  <p className="text-sm font-semibold text-ink-900">{name}</p>
                  <p className="mt-1 text-sm text-ink-600">{body}</p>
                </li>
              ))}
            </ul>
            <Callout tone="note" className="mt-6">
              All three come from the same set of {EXPERIMENTS} experiments on this site, with the
              steps and the science written out.
            </Callout>
            <div className="mt-5">
              <TextLink to="/explore/experiments">Browse all {EXPERIMENTS} experiments</TextLink>
            </div>
          </Reveal>
        )}
      >
        <Kicker pill>What happens at a session</Kicker>
        <h2 className="mt-4 text-h2">Forty-five minutes, one experiment, everybody doing it.</h2>
        <p className="mt-4 text-lead text-ink-600">
          A session is deliberately small: one experiment done properly beats four
          rushed. We pick it from the experiment library on this site, which means
          nothing depends on equipment a library does not have.
        </p>
        <Ledger className="mt-8" numbered items={SESSION_STEPS} />
      </Split>
    </Band>
  );
}

/* ----------------------------------------------------------------- host --- */

const HOST_PROVIDES = [
  ['A room with tables', 'Somewhere kids can stand or sit around a surface. A program room, a meeting room, or a shaded patch outside.'],
  ['Water nearby', 'A sink or a jug. Most of our experiments involve liquid, and all of them involve cleanup.'],
  ['A rough head count', 'A few days ahead, so we pack materials for the right number of kids instead of guessing.'],
  ['A slot on your calendar', 'You know your regulars better than we do. Weekend afternoons have worked well for us.'],
];

const WE_BRING = [
  ['The materials', 'Enough for every kid to run the experiment themselves, not to watch one.'],
  ['Volunteers who run it', 'Two to four of us. We set up, run the session, and clean up afterwards.'],
  ['The plan and the science', 'A chosen experiment from our library, with the explanation pitched at the age group.'],
  ['A poster and a description', 'Ready to drop into your events listing, so promoting it is not extra work for you.'],
];

function HostSection() {
  return (
    <section id="host" className="scroll-mt-24 bg-ink-950 text-white">
      <div className="cq-container cq-section">
        <div className="max-w-[64ch]">
          <Kicker onDark pill>Host a session</Kicker>
          <h2 className="mt-4 text-h2 text-white">Bring CuriosityQuest to your library.</h2>
          <p className="mt-4 text-lead text-white/75">
            If you run programming at a library, community centre or after-school club
            near Phoenixville, we would like to come. It is free, it takes about
            45 minutes, and the setup on your end is a room and a head count.
          </p>
        </div>

        <div className="mt-12 grid gap-5 cb:grid-cols-2">
          <HostList title="What you provide" items={HOST_PROVIDES} />
          <HostList title="What we bring" items={WE_BRING} />
        </div>

        <div className="mt-10 grid gap-8 rounded-lg border border-white/12 bg-white/[0.04] p-7 cb:grid-cols-[1fr_auto] cb:items-center cb:p-9">
          <div>
            <h3 className="text-h3 text-white">One email is enough to start.</h3>
            <p className="mt-3 max-w-[62ch] text-white/70">
              Tell us where you are, a couple of dates that could work, the ages and
              rough number of kids, and whether there is a sink in the room. We will
              come back with an experiment suggestion and a poster. If the date does not
              work for us we will say so straight away rather than leave you waiting.
            </p>
            <p className="mt-4 text-sm text-white/55">
              Ages 8&ndash;11 is where our sessions land best. All-ages works too when it is
              a booth at a community event rather than a sit-down session.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button href={HOST_MAILTO} size="lg" variant="onDark">
              <Mail size={16} aria-hidden="true" /> Email us about hosting
            </Button>
            <Button to="/get-involved" size="lg" variant="outlineOnDark">Other ways to help</Button>
            <p className="text-xs text-white/55">{EMAIL}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HostList({ title, items }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.04] p-6 cb:p-7">
      <h3 className="text-micro font-semibold uppercase tracking-label text-white/60">{title}</h3>
      <ul className="mt-5 space-y-5">
        {items.map(([label, body]) => (
          <li key={label} className="flex gap-3.5">
            <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-orange-300" />
            <div>
              <p className="font-semibold text-white">{label}</p>
              <p className="mt-1 text-sm text-white/70">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
