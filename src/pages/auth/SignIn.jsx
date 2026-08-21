import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Users, GraduationCap } from 'lucide-react';
import { Button, Input, Callout, cn } from '@/components/cq';
import { useAuth, homeFor } from '@/platform/auth.jsx';
import { api } from '@/platform/api.js';
import { seedDemo, credentials, isSeeded } from '@/platform/seed.js';
import Meta from '@/shell/Meta.jsx';
import AuthFrame from './AuthFrame.jsx';

/**
 * One sign-in screen for students and teachers.
 *
 * Students sign in with a username, teachers with an email — the same field
 * accepts both, because asking a nine-year-old to pick "I am a student" before
 * they can type their name is a step that exists only for the database's
 * benefit.
 */
export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = await signIn(form);
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  /* The demo class exists so a teacher can evaluate the dashboards without
     first recruiting twenty-four children. */
  const loadDemo = async (which) => {
    setDemoBusy(true);
    setError(null);
    try {
      const creds = await seedDemo();
      const pick = creds[which];
      const user = await signIn({ identifier: pick.identifier, password: pick.password });
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not load the demo class.');
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <>
      <Meta title="Sign in" description="Sign in to CuriosityQuest Science Arena." />
      <AuthFrame
        title="Sign in"
        lede="Students use their username. Teachers use their email."
        footer={(
          <div className="space-y-3 text-sm">
            <p className="text-ink-600">
              New here?{' '}
              <Link to="/arena/join" className="font-semibold">Make a student account</Link>
              {' '}or{' '}
              <Link to="/arena/sign-up/teacher" className="font-semibold">a teacher account</Link>.
            </p>
            <p className="text-ink-500">
              Forgot your password? Students should ask their teacher, who can set a new
              one. Teachers can{' '}
              <Link to="/arena/sign-in#recover" className="font-medium">use their recovery phrase</Link>.
            </p>
          </div>
        )}
        aside={(
          <div className="rounded-lg border border-line bg-paper-2 p-6">
            <h2 className="text-h4">Just looking around?</h2>
            <p className="mt-2 text-sm text-ink-600">
              Load a fully populated demo class — Mrs. Smith, 5th Grade Science,
              twenty students with real answer histories, assignments part-finished,
              and one student who has never logged in. Nothing here is real data.
            </p>
            <div className="mt-5 space-y-2.5">
              <Button variant="primary" block loading={demoBusy}
                onClick={() => loadDemo('teacher')}>
                <GraduationCap size={16} aria-hidden="true" /> Open the teacher dashboard
              </Button>
              <Button variant="outline" block loading={demoBusy}
                onClick={() => loadDemo('student')}>
                <Users size={16} aria-hidden="true" /> Open a student account
              </Button>
              <Button variant="ghost" block loading={demoBusy}
                onClick={() => loadDemo('strugglingStudent')}>
                Open a student who needs help
              </Button>
            </div>
            {isSeeded() ? (
              <p className="mt-4 text-xs text-ink-500">
                Demo class code: <strong>{credentials().classCode}</strong>
              </p>
            ) : null}
          </div>
        )}
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          {error ? <Callout tone="danger" title="Could not sign in">{error}</Callout> : null}

          <Input
            label="Username or email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            required
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            placeholder="alex  ·  or  ·  you@school.org"
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Button type="submit" size="lg" block loading={busy}>
            Sign in <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </form>

        <div id="recover" className="mt-10 rounded-md border border-line bg-surface-2 p-5">
          <h2 className="flex items-center gap-2 text-h4">
            <KeyRound size={17} aria-hidden="true" className="text-ink-500" />
            Teacher password recovery
          </h2>
          <RecoveryForm />
        </div>
      </AuthFrame>
    </>
  );
}

/**
 * Recovery uses the phrase issued at sign-up rather than an emailed link.
 * The project has no mail server, and a phrase a teacher can save in their
 * password manager is more reliable than a reset email a school filter eats.
 */
function RecoveryForm() {
  const [form, setForm] = useState({ email: '', phrase: '', newPassword: '' });
  const [state, setState] = useState({ status: 'idle' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'busy' });
    try {
      await api.resetWithRecovery(form);
      setState({ status: 'done' });
    } catch (err) {
      setState({ status: 'error', message: err?.message || 'Could not reset that password.' });
    }
  };

  if (state.status === 'done') {
    return (
      <Callout tone="success" title="Password changed" className="mt-4">
        Sign in above with your new password.
      </Callout>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      {state.status === 'error' ? <Callout tone="danger">{state.message}</Callout> : null}
      <Input label="Your email" type="email" required value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input label="Recovery phrase" required value={form.phrase}
        placeholder="atom-lever-prism-torque"
        hint="The four words shown once when you created your account."
        onChange={(e) => setForm({ ...form, phrase: e.target.value })} />
      <Input label="New password" type="password" required autoComplete="new-password"
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      <Button type="submit" variant="outline" loading={state.status === 'busy'}>
        Set a new password
      </Button>
    </form>
  );
}
