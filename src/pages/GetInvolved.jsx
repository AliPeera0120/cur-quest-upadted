import React from 'react';
import {
  Heart, GraduationCap, Building2, HandHeart, Wrench, FlaskConical,
  Mail, Instagram, ArrowUpRight, Check, Github,
} from 'lucide-react';
import { Button, Kicker, Callout, Badge } from '@/components/cq';
import { Band, Ledger, Split, Statement, TextLink, StatRow } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import { CONTENT_SUMMARY } from '@/content/index.js';

/* ============================================================================
   Get involved.

   Five audiences, each with one specific thing to do next. Vague "support our
   mission" asks get ignored; "we need someone who can write six biology
   questions" gets answered.
   ========================================================================= */

const { stats } = CONTENT_SUMMARY;

const DONATE_URL = 'https://hcb.hackclub.com/donations/start/curiosityquest';
const EMAIL = 'curiosity.quest25@gmail.com';

export default function GetInvolved() {
  return (
    <>
      <Meta
        title="Get involved"
        description="Volunteer, partner, host a workshop, or help fund free STEM education. Specific ways to help CuriosityQuest, a student-run nonprofit."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <div className="grid items-center gap-12 cb:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Kicker pill>Get involved</Kicker>
              <h1 className="mt-5 max-w-[24ch] text-display">Everything we make is free. That has a cost.</h1>
              <p className="mt-6 max-w-[52ch] text-lead text-ink-600">
                {stats.experiments} experiments, {stats.lessons} Arena lessons and a
                classroom platform, all at no charge to schools or families. What that
                needs is materials for events, people to run them, and hands to keep
                building.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button href={DONATE_URL} size="lg" variant="accent">
                  <Heart size={17} aria-hidden="true" /> Donate
                </Button>
                <Button href={`mailto:${EMAIL}`} size="lg" variant="outline">
                  <Mail size={17} aria-hidden="true" /> Email us
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-line bg-white p-6 shadow-lg">
              <h2 className="text-h4">Where money actually goes</h2>
              <ul className="mt-4 space-y-3.5">
                {[
                  ['Experiment materials', 'Baking soda, balloons, magnets, LEDs, cardboard — the consumables a library workshop burns through in an afternoon.'],
                  ['Event costs', 'Printing, tables, transport to libraries and community centres.'],
                  ['Kits for families', 'Take-home materials so a child can run an experiment again at home.'],
                  ['Nothing to salaries', 'Nobody here is paid. We are all high-school students.'],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" />
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">{t}</span>
                      <span className="mt-0.5 block text-sm text-ink-600">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-500">
                We are fiscally hosted by Hack Club Bank, so donations are handled through
                a 501(c)(3) and the ledger is transparent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Band kicker="Volunteers" title="Specific things we need doing." id="volunteer">
        <Ledger
          items={[
            {
              title: 'Run a library workshop',
              body: 'Two hours on a Saturday, an experiment we give you, and a room of eight-to-eleven-year-olds. No teaching experience needed — we will pair you with someone who has done it.',
              detail: 'Chester and Montgomery County, Pennsylvania',
              linkLabel: 'Volunteer',
              to: '/get-involved#contact',
            },
            {
              title: 'Write questions or review the bank',
              body: `We have ${stats.questions} questions across 48 skills, and some skills only have two or three. If you know a science area well, writing six good multiple-choice questions with real explanations is the single highest-leverage thing you can give us.`,
              detail: 'Remote · a couple of hours',
              linkLabel: 'Get in touch',
              to: '/get-involved#contact',
            },
            {
              title: 'Build the platform',
              body: 'The site is React and Vite, open in a public repository, with the data model and mastery engine documented. If you write code, there is plenty to do — more activity types, better recommendations, a real content editor.',
              detail: 'Remote · React, Vite, Tailwind, Postgres',
              linkLabel: 'See the code',
              to: '/get-involved#contact',
            },
            {
              title: 'Photograph and film events',
              body: 'We would rather show real sessions than stock photography, and we are usually too busy running the activity to document it.',
              detail: 'At events',
              linkLabel: 'Offer to help',
              to: '/get-involved#contact',
            },
          ]}
        />
      </Band>

      <Band kicker="Teachers" title="The most useful thing you can do is use it." id="teachers"
        lede="Genuinely — a teacher running this with a real class of twenty-four eleven-year-olds tells us more than any amount of planning.">
        <Split
          ratio="text"
          visual={(
            <div className="rounded-lg border border-line bg-paper-2 p-6">
              <h3 className="text-h4">And then tell us what broke</h3>
              <p className="mt-2 text-sm text-ink-600">
                What confused students. What you needed and could not find. Which lesson
                was too easy. Which question was badly worded. That feedback is the only
                way this gets good.
              </p>
              <div className="mt-5 space-y-2.5">
                <Button to="/arena/sign-up/teacher" variant="primary" block>Create a free teacher account</Button>
                <Button href={`mailto:${EMAIL}?subject=Classroom%20feedback`} variant="outline" block>
                  Send us feedback
                </Button>
              </div>
            </div>
          )}
        >
          <ul className="space-y-5">
            {[
              { t: 'Run it with one class for two weeks', d: 'Free account, class code, done. No procurement, no trial period, no card.' },
              { t: 'Use a 5-question exit ticket', d: 'Quick Play gives you a five-minute formative check you can project or assign.' },
              { t: 'Try one experiment as a station', d: 'The 72 hands-on experiments list their materials up front so you can see instantly whether you already have them.' },
            ].map(({ t, d }) => (
              <li key={t}>
                <p className="font-display font-semibold text-ink-900">{t}</p>
                <p className="mt-1 text-ink-600">{d}</p>
              </li>
            ))}
          </ul>
        </Split>
      </Band>

      <Statement cite="What we are actually short of">
        Time, materials, and people who can write a good science question.
      </Statement>

      <Band tone="tint" kicker="Libraries, schools and community groups" title="Invite us." id="host">
        <div className="grid gap-6 cb:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-7 shadow-xs">
            <Badge tone="info">We come to you</Badge>
            <h3 className="mt-3 text-h3">A free hands-on session</h3>
            <p className="mt-2.5 text-ink-600">
              Forty-five minutes to two hours, ages roughly 8–14, materials included.
              We have run circuits, chemical reactions, water filtration, bridge-building
              and oil-spill cleanup. You provide a room and some tables.
            </p>
            <ul className="mt-5 space-y-2">
              {['No cost to the venue', 'We bring all materials', 'Insurance and safety handled through Hack Club Bank', 'Typically 15–80 children depending on format'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" /> {t}
                </li>
              ))}
            </ul>
            <Button href={`mailto:${EMAIL}?subject=Workshop%20request`} className="mt-6" variant="primary">
              Request a session
            </Button>
          </div>

          <div className="rounded-lg border border-line bg-white p-7 shadow-xs">
            <Badge tone="ember">Or run it yourself</Badge>
            <h3 className="mt-3 text-h3">Use the Arena in a computer lab</h3>
            <p className="mt-2.5 text-ink-600">
              Everything on this site is free to use without asking us. If you run a
              coding club, a homework club or a summer program, make a teacher account,
              generate a class code, and go.
            </p>
            <ul className="mt-5 space-y-2">
              {['Works on school Chromebooks and iPads', 'No email needed for student accounts', 'Classroom projection mode for whole-group teaching', 'Quick 5-minute challenges for short sessions'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" /> {t}
                </li>
              ))}
            </ul>
            <Button to="/educators" className="mt-6" variant="outline">What teachers get</Button>
          </div>
        </div>
      </Band>

      <Band kicker="STEM partners" title="Bring your actual work into the room." id="partner"
        lede="Engineers, researchers, technicians, makers — a twenty-minute conversation about what you really do lands harder than any lesson we can write.">
        <div className="grid gap-6 cb:grid-cols-3">
          {[
            { icon: Wrench, t: 'Show your work', d: 'Bring something you built or something you measure with. Children ask far better questions of a real object than of a slide.' },
            { icon: Building2, t: 'Host a visit', d: 'A lab, a workshop, a fabrication floor. Even a short tour changes what a child thinks a scientist looks like.' },
            { icon: FlaskConical, t: 'Sponsor materials', d: 'A company covering a term of experiment consumables funds a lot of Saturdays.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-lg border border-line bg-white p-6 shadow-xs">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-h4">{t}</h3>
              <p className="mt-2 text-sm text-ink-600">{d}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band tone="ink" id="contact" kicker="Contact" title="Get in touch."
        lede="We are students, so replies come in the evening — but they come.">
        <div className="grid gap-5 sm:grid-cols-2 cb:grid-cols-4">
          {[
            { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
            { icon: Instagram, label: 'Instagram', value: '@curiosityquest25', href: 'https://www.instagram.com/curiosityquest25' },
            { icon: ArrowUpRight, label: 'Newsletter', value: '5 Minutes of STEM', href: 'https://curiosityquest25.substack.com/' },
            { icon: Heart, label: 'Donate', value: 'Hack Club Bank', href: DONATE_URL },
          ].map(({ icon: Icon, label, value, href }) => (
            <a key={label} href={href}
              className="group rounded-lg border border-white/12 bg-white/[0.04] p-5 no-underline transition-colors duration-2 hover:bg-white/[0.09]">
              <Icon size={19} aria-hidden="true" className="text-orange-300" />
              <p className="mt-3.5 text-micro font-semibold uppercase tracking-label text-white/50">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-white">{value}</p>
            </a>
          ))}
        </div>
      </Band>
    </>
  );
}
