import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Check, X, Mail, Trash2, Eye, Database, Server } from 'lucide-react';
import { Button, Callout, Kicker } from '@/components/cq';
import { Band, Ledger, Split, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';

/* ============================================================================
   Privacy and student data.

   Written to be read by a parent or a school administrator who is deciding
   whether to let children use this, so it is specific rather than reassuring.
   Where something is a limitation, it says so.
   ========================================================================= */

const STORED = [
  'A first name, chosen by the student',
  'A username, chosen by the student',
  'A password, stored only as a salted PBKDF2-SHA-256 hash',
  'An avatar choice from eight abstract shapes',
  'An optional coarse grade band (3–5 or 6–8)',
  'Which lessons they opened, what they answered, and when',
  'Which classes they joined',
];

const NOT_STORED = [
  'Email address (students are never asked for one)',
  'Surname',
  'Date of birth or age',
  'School or address',
  'Photographs or uploads of any kind',
  'Free-text profile or "about me" field',
  'Location, device identifiers or advertising identifiers',
];

export default function Privacy() {
  return (
    <>
      <Meta
        title="Privacy and student data"
        description="Exactly what CuriosityQuest stores about students, who can see it, and how to delete it. Written for parents, teachers and school administrators."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <Kicker pill>Privacy</Kicker>
          <h1 className="mt-5 max-w-[26ch] text-display">What we store, and what we don&rsquo;t.</h1>
          <p className="mt-6 max-w-[60ch] text-lead text-ink-600">
            Science Arena is built for children, so the honest answer to &ldquo;what data do you
            hold?&rdquo; has to be short. This page is that answer, in specifics rather than
            reassurances.
          </p>
          <p className="mt-4 text-sm text-ink-500">
            Plain-language summary, not a legal document. Questions go to{' '}
            <a href="mailto:curiosity.quest25@gmail.com">curiosity.quest25@gmail.com</a>.
          </p>
        </div>
      </section>

      <Band kicker="Student accounts" title="A name, a username, a password.">
        <div className="grid gap-6 cb:grid-cols-2">
          <div className="rounded-lg border border-[#C7EBDD] bg-success-50 p-6">
            <h3 className="flex items-center gap-2 text-h4 text-success-700">
              <Check size={19} aria-hidden="true" /> What a student account holds
            </h3>
            <ul className="mt-4 space-y-2.5">
              {STORED.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
            <h3 className="flex items-center gap-2 text-h4">
              <X size={19} aria-hidden="true" className="text-ink-500" /> What it does not
            </h3>
            <ul className="mt-4 space-y-2.5">
              {NOT_STORED.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <X size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Callout tone="note" title="Why students have no email address" className="mt-7">
          Requiring an email from a nine-year-old means either collecting a child&rsquo;s
          contact details or collecting a parent&rsquo;s. We do neither. Students sign in with
          a username, and a teacher can reset a forgotten password for students in their
          own class. Teachers do use an email, because they need to recover their own
          account and have nobody to ask.
        </Callout>
      </Band>

      <Band tone="tint" kicker="Who can see what" title="Visibility is narrow on purpose.">
        <Ledger
          numbered={false}
          items={[
            {
              icon: Eye,
              title: 'A student sees their own record, and nobody else’s',
              body: 'There is no way for a student to look up a classmate. Class leaderboards are off by default, and when a teacher turns one on it is scoped to that class.',
            },
            {
              icon: Eye,
              title: 'A teacher sees students in their own classes',
              body: 'Class membership is what grants visibility. A teacher cannot see a student who is not on one of their rosters, and cannot see another teacher’s class at all. Removing a student from a roster ends that visibility immediately.',
            },
            {
              icon: Server,
              title: 'This is enforced on the server, not in the interface',
              body: 'Authorisation lives in row-level security policies on the database, so a crafted request cannot reach data the interface would have hidden. The policies are in the repository, in supabase/migrations/0001_init.sql, and can be read by anyone evaluating the platform.',
            },
            {
              icon: Database,
              title: 'Reflection notes are private',
              body: 'When a lesson asks a student to write down what they noticed, that text stays in their own attempt record. It is not shown to teachers and not used for analytics.',
            },
          ]}
        />
      </Band>

      <Band kicker="Where the data lives" title="Two configurations, stated plainly.">
        <Split
          ratio="text"
          visual={(
            <div className="space-y-5">
              <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
                <h3 className="text-h4">Local mode</h3>
                <p className="mt-2 text-sm text-ink-600">
                  Accounts and progress are stored in the browser on that one device.
                  Nothing is transmitted anywhere, because there is nowhere for it to go.
                  Clearing the browser&rsquo;s storage erases it. Good for a single classroom
                  or for evaluating the platform; not suitable if students move between
                  devices.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
                <h3 className="text-h4">Hosted mode</h3>
                <p className="mt-2 text-sm text-ink-600">
                  Accounts and progress live in a Postgres database with row-level security.
                  Students can sign in from any device. Answers are graded on the server, so
                  the answer key never reaches the browser.
                </p>
              </div>
            </div>
          )}
        >
          <p className="text-lead text-ink-600">
            The platform can run entirely in the browser or against a hosted database, and
            which one you are using changes the answer to &ldquo;where is my data&rdquo;. The Arena
            footer says which mode you are in.
          </p>
          <p className="mt-4 text-ink-600">
            We do not sell data, do not run advertising, do not use third-party analytics
            or tracking pixels, and do not embed social media widgets that would let
            another company observe a child using the site. Fonts are self-hosted so that
            loading a page does not tell anyone else you visited it.
          </p>
        </Split>
      </Band>

      <Band tone="tint" kicker="Control" title="Deleting an account actually deletes it.">
        <div className="grid gap-6 cb:grid-cols-3">
          {[
            {
              icon: Trash2,
              title: 'Student or teacher',
              body: 'Account settings has a Delete account action. It removes the learning record — every attempt, answer, event, badge and point — permanently, and blanks the profile. It is not a soft flag or a 30-day grace period.',
            },
            {
              icon: Mail,
              title: 'Parent or guardian',
              body: 'Email us and we will delete a child’s account and record. Tell us the username; we will not ask for anything that identifies the child further.',
            },
            {
              icon: ShieldCheck,
              title: 'School or district',
              body: 'A teacher can remove a student from a roster at any time, which ends all visibility. For a wholesale deletion, or for a data-processing agreement, email us.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-line bg-white p-6 shadow-xs">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-600">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-h4">{title}</h3>
              <p className="mt-2 text-sm text-ink-600">{body}</p>
            </div>
          ))}
        </div>

        <Callout tone="warning" title="What we cannot promise" className="mt-8">
          CuriosityQuest is run by high-school students and is not a company with a legal
          department. We have not been through a formal COPPA or FERPA audit, and we will
          not claim otherwise. What we can point to is the design: the data footprint is
          deliberately tiny, the authorisation rules are in a public repository, and there
          is no advertising or tracking anywhere in the product. If your district requires
          a signed agreement before students can use a platform, talk to us first.
        </Callout>
      </Band>

      <Band tone="ink" align="center"
        kicker="Questions"
        title="Ask us anything about this."
        lede="We would rather answer a specific question than have a school not use something free because they were unsure."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Button href="mailto:curiosity.quest25@gmail.com" variant="onDark" size="lg">
            <Mail size={17} aria-hidden="true" /> Email us
          </Button>
          <Button to="/educators" variant="outlineOnDark" size="lg">What teachers get</Button>
        </div>
      </Band>
    </>
  );
}
