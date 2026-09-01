import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Copy, Check, KeyRound, ShieldCheck, Clock } from 'lucide-react';
import { Button, Input, Callout, Badge, cn } from '@/components/cq';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import AuthFrame from './AuthFrame.jsx';

/**
 * Teacher sign-up.
 *
 * One screen, four fields, and then the recovery phrase — which is shown
 * exactly once and stored only as a hash. Teachers need password recovery
 * (students can ask their teacher; a teacher has nobody to ask), and a phrase
 * they can paste into a password manager is more dependable than a reset email
 * that a school mail filter may never deliver.
 */
export default function TeacherSignUp() {
  const { signUpTeacher } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', schoolName: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [phrase, setPhrase] = useState(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signUpTeacher(form);
      if (res.recoveryPhrase) setPhrase(res.recoveryPhrase);
      else navigate('/arena/teach', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not create that account.');
    } finally {
      setBusy(false);
    }
  };

  if (phrase) {
    return (
      <>
        <Meta title="Save your recovery phrase" />
        <AuthFrame
          title="Save this recovery phrase"
          lede="This is the only time it is shown. It is the only way to get back in if you forget your password."
        >
          <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-6">
            <p className="flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
              <KeyRound size={14} aria-hidden="true" /> Your recovery phrase
            </p>
            <p className="mt-3 select-all break-words font-display text-2xl font-bold tracking-tight text-ink-900">
              {phrase}
            </p>
            <Button
              variant="outline" size="sm" className="mt-4"
              onClick={() => {
                navigator.clipboard?.writeText(phrase).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                });
              }}
            >
              {copied ? <><Check size={14} aria-hidden="true" /> Copied</> : <><Copy size={14} aria-hidden="true" /> Copy</>}
            </Button>
          </div>

          <Callout tone="warning" title="We cannot recover this for you" className="mt-6">
            We store only a one-way hash of this phrase, so nobody — including us — can
            read it back. Put it in your password manager or somewhere you keep
            important notes.
          </Callout>

          <Button size="lg" block className="mt-8" onClick={() => navigate('/arena/teach', { replace: true })}>
            I&rsquo;ve saved it — take me to my dashboard <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </AuthFrame>
      </>
    );
  }

  return (
    <>
      <Meta title="Create a teacher account" description="Free teacher accounts for CuriosityQuest Science Arena — class codes, dashboards and assignments." />
      <AuthFrame
        title="Create a teacher account"
        lede="Free, permanently. No purchase order, no district approval, no trial period."
        footer={(
          <p className="text-sm text-ink-600">
            Already have an account? <Link to="/arena/sign-in" className="font-semibold">Sign in</Link>.
            {' '}A student? <Link to="/arena/join" className="font-semibold">Join with a class code</Link>.
          </p>
        )}
        aside={(
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-paper-2 p-6">
              <h2 className="flex items-center gap-2 text-h4">
                <Clock size={18} aria-hidden="true" className="text-blue-600" />
                What happens next
              </h2>
              <ol className="mt-4 space-y-3">
                {[
                  'You land on an empty dashboard.',
                  'Create a class — a name is all it needs.',
                  'The platform gives you a code like CQ-48291.',
                  'Students type it and appear on your roster.',
                  'Assign a lesson, or just let them explore.',
                ].map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm text-ink-700">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-blue-600 text-[0.6875rem] font-bold text-white">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm text-ink-500">
                Realistically about five minutes, most of which is students typing.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
              <h2 className="flex items-center gap-2 text-h4">
                <ShieldCheck size={18} aria-hidden="true" className="text-success-600" />
                Student data
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Student accounts hold a first name, a username and a password — no email,
                no birthdate, no school. You can see students in your own classes and
                nothing else. Another teacher cannot see your class.
              </p>
              <Link to="/privacy" className="mt-3 inline-block text-sm font-semibold">
                How we handle student data
              </Link>
            </div>
          </div>
        )}
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          {error ? <Callout tone="danger" title="Could not create the account">{error}</Callout> : null}

          <Input
            label="Your name"
            autoComplete="name"
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            hint="What your students will see. “Mrs. Smith” is fine."
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck="false"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            hint="Used to sign in. We do not send newsletters to it."
          />
          <Input
            label="School or organisation"
            autoComplete="organization"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            hint="Optional."
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="At least 10 characters."
          />

          <Button type="submit" size="lg" block loading={busy}>
            Create my account <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </form>
      </AuthFrame>
    </>
  );
}
