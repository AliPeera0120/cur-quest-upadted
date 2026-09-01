import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { Button, Input, Callout, Avatar, AVATAR_KEYS, Badge, cn } from '@/components/cq';
import { useAuth, homeFor } from '@/platform/auth.jsx';
import { api } from '@/platform/api.js';
import { checkUsername } from '@/platform/crypto.js';
import Meta from '@/shell/Meta.jsx';
import AuthFrame from './AuthFrame.jsx';

/* ============================================================================
   Student sign-up.

   Four short steps, and only one of them is a form:

     1. class code  (optional — a student without a teacher can skip it)
     2. name + username + password
     3. pick an avatar
     4. in

   What we deliberately do NOT ask for: email, surname, birthdate, school,
   address, photo. A student account is a display name, a username and a
   password. That is the whole footprint, and it is the reason a nine-year-old
   can be handed this without a consent form.

   The class code is validated before the account is created, so a mistyped
   code never leaves a half-made profile behind.
   ========================================================================= */

const STEPS = ['Class code', 'Your account', 'Your avatar'];

export default function JoinClass() {
  const { user, signUpStudent } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState('');
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ displayName: '', username: '', password: '', gradeBand: '' });
  const [avatar, setAvatar] = useState(AVATAR_KEYS[0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  /* An already-signed-in student joining an extra class only needs step 1. */
  const joiningExisting = !!user && user.role === 'student';

  const checkCode = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const found = await api.lookupClassByCode(code);
      setTarget(found);
      if (joiningExisting) {
        await api.joinClass(code);
        navigate('/arena/home', { replace: true });
        return;
      }
      setStep(1);
    } catch (err) {
      setError(err?.message || 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  const skipCode = () => { setTarget(null); setError(null); setStep(1); };

  const createAccount = async (e) => {
    e.preventDefault();
    const unErr = checkUsername(form.username);
    if (unErr) { setError(unErr); return; }
    if (!form.displayName.trim()) { setError('Tell us your first name so your teacher can find you.'); return; }
    setError(null);
    setStep(2);
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await signUpStudent({
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        gradeBand: form.gradeBand || null,
        joinCode: target ? code : null,
        avatarKey: avatar,
      });
      navigate(homeFor(res.profile), { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not create that account.');
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Meta title="Join a class" description="Make a free CuriosityQuest student account and join your class with a code." />
      <AuthFrame
        wide
        title={joiningExisting ? 'Join another class' : step === 0 ? 'Got a class code?' : step === 1 ? 'Make your account' : 'Pick your look'}
        lede={
          joiningExisting ? 'Enter the code your teacher gave you.'
          : step === 0 ? 'Your teacher will have written it on the board. It looks like CQ-48291. No code? You can still play everything.'
          : step === 1 ? 'Three things, and none of them is an email address.'
          : 'This is what your teacher and classmates see next to your name.'
        }
        footer={step === 0 && !joiningExisting ? (
          <p className="text-sm text-ink-600">
            Already have an account? <Link to="/arena/sign-in" className="font-semibold">Sign in</Link>.
            {' '}Teacher? <Link to="/arena/sign-up/teacher" className="font-semibold">Start here instead</Link>.
          </p>
        ) : null}
        aside={<JoinAside target={target} step={step} />}
      >
        {!joiningExisting ? (
          <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs" aria-label="Progress">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className={cn('grid h-6 w-6 place-items-center rounded-pill text-[0.6875rem] font-bold',
                  i < step ? 'bg-success-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-ink-100 text-ink-500')}>
                  {i < step ? <Check size={12} aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn('font-medium', i === step ? 'text-ink-900' : 'text-ink-500')}>{label}</span>
                {i < STEPS.length - 1 ? <span aria-hidden="true" className="text-ink-300">›</span> : null}
              </li>
            ))}
          </ol>
        ) : null}

        {error ? <Callout tone="danger" className="mb-6">{error}</Callout> : null}

        {step === 0 ? (
          <form onSubmit={checkCode} className="space-y-5" noValidate>
            <Input
              label="Class code"
              code
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              inputMode="text"
              placeholder="CQ-48291"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              hint="You can type just the five digits if that is easier."
            />
            <Button type="submit" size="lg" block loading={busy} disabled={!code.trim()}>
              Check the code <ArrowRight size={17} aria-hidden="true" />
            </Button>
            {!joiningExisting ? (
              <Button type="button" variant="ghost" block onClick={skipCode}>
                I don&rsquo;t have a code — let me just play
              </Button>
            ) : null}
          </form>
        ) : null}

        {step === 1 ? (
          <form onSubmit={createAccount} className="space-y-5" noValidate>
            {target ? (
              <Callout tone="success" title={`Joining ${target.className}`}>
                {target.teacherName}&rsquo;s class. You will show up on their roster straight away.
              </Callout>
            ) : (
              <Callout tone="note" title="Playing on your own">
                That is completely fine — everything is open. You can join a class later
                from your profile.
              </Callout>
            )}

            <Input
              label="First name"
              autoComplete="given-name"
              required
              maxLength={40}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              hint="Just your first name. This is what your teacher sees."
            />
            <Input
              label="Username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              hint="Letters and numbers. This is what you type to sign in."
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="At least 8 characters. Pick something only you would think of."
            />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg">
                Next <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setStep(0)}>
                <ArrowLeft size={17} aria-hidden="true" /> Back
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div>
            <fieldset>
              <legend className="cq-label">Choose an avatar</legend>
              <div className="mt-2 grid grid-cols-4 gap-3">
                {AVATAR_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={avatar === key}
                    onClick={() => setAvatar(key)}
                    className={cn(
                      'grid min-h-[5rem] place-items-center rounded-md border-2 p-3 transition-all duration-1',
                      avatar === key
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-line bg-white hover:border-ink-300',
                    )}
                  >
                    <Avatar name={form.displayName || '?'} avatarKey={key} size={40} />
                    <span className="mt-1.5 text-[0.6875rem] capitalize text-ink-500">{key}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={finish} loading={busy}>
                Start playing <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                <ArrowLeft size={17} aria-hidden="true" /> Back
              </Button>
            </div>
          </div>
        ) : null}
      </AuthFrame>
    </>
  );
}

function JoinAside({ target, step }) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-line bg-paper-2 p-6">
        <h2 className="flex items-center gap-2 text-h4">
          <ShieldCheck size={18} aria-hidden="true" className="text-success-600" />
          What a student account stores
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[
            'Your first name',
            'A username you pick',
            'A password',
            'Which lessons you have played and how you did',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-ink-700">
              <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-semibold text-ink-900">And what it does not:</p>
        <p className="mt-1.5 text-sm text-ink-600">
          No email address, no surname, no birthdate, no school, no photo. Your progress
          is visible to you and to teachers of classes you join — never to other students.
        </p>
        <Link to="/privacy" className="mt-4 inline-block text-sm font-semibold">
          Read the privacy page
        </Link>
      </div>

      {step === 0 ? (
        <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
          <h2 className="flex items-center gap-2 text-h4">
            <Sparkles size={18} aria-hidden="true" className="text-orange-600" />
            You do not need a class
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            All 204 lessons are open to anyone with an account. A class code just
            means your teacher can see how you are getting on and set you missions.
          </p>
        </div>
      ) : null}

      {target ? (
        <div className="rounded-lg border border-success-500 bg-success-50 p-6">
          <Badge tone="success">Code checked</Badge>
          <p className="mt-3 font-display text-h4 font-bold text-success-700">{target.className}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-success-700">
            <Users size={14} aria-hidden="true" /> {target.teacherName}
          </p>
        </div>
      ) : null}
    </div>
  );
}
