import React from 'react';
import { Check, Mail } from 'lucide-react';
import { Button, Kicker } from '@/components/cq';
import Meta from '@/shell/Meta.jsx';

const EMAIL = 'curiosity.quest25@gmail.com';
const HOST_SUBJECT = 'Hosting a CuriosityQuest session';
const HOST_BODY = [
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
].join('\n');
const HOST_EMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(HOST_SUBJECT)}&body=${encodeURIComponent(HOST_BODY)}`;

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

export default function BringAnEvent() {
  return (
    <>
      <Meta
        title="Bring a CuriosityQuest event to you"
        description="Invite CuriosityQuest to lead a free hands-on STEM session at your library, community centre, or after-school club."
      />

      <section className="min-h-[calc(100vh-5rem)] bg-ink-950 text-white">
        <div className="cq-container cq-section">
          <div className="max-w-[64ch]">
            <Kicker onDark pill>Host a session</Kicker>
            <h1 className="mt-4 text-h1 text-white">Bring CuriosityQuest to your library.</h1>
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
              <h2 className="text-h3 text-white">One email is enough to start.</h2>
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
              <Button href={HOST_EMAIL_URL} size="lg" variant="onDark">
                <Mail size={16} aria-hidden="true" /> Email us about hosting
              </Button>
              <Button to="/get-involved" size="lg" variant="outlineOnDark">Other ways to help</Button>
              <p className="text-xs text-white/55">{EMAIL}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HostList({ title, items }) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.04] p-6 cb:p-7">
      <h2 className="text-micro font-semibold uppercase tracking-label text-white/60">{title}</h2>
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
