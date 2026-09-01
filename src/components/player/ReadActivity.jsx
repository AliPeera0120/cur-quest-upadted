import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Check, ArrowRight, ListChecks, TriangleAlert, Lightbulb, Sparkles } from 'lucide-react';
import { Button, Callout, cn } from '@/components/cq';

/* ============================================================================
   The reading and doing activities: intro, explain, build, reflect.

   These carry no score. That is deliberate — a student following a build
   procedure or writing down what they noticed is doing real work, and turning
   it into a number would either be fake or would push the lesson toward
   whatever is easiest to grade.

   Reflection answers stay in the attempt's own checkpoint. They are never sent
   anywhere else and never shown to a teacher, because a private note a child
   writes to themselves is not evidence to be surveilled.
   ========================================================================= */

export function IntroActivity({ activity, lesson, onDone }) {
  const { materials, learn, safety } = activity.config || {};
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-h2">{activity.title || 'Before you start'}</h2>
      {learn ? <p className="mt-4 text-lead text-ink-600">{learn}</p> : null}

      {materials ? (
        <section className="mt-8">
          <h3 className="flex items-center gap-2 text-h4">
            <ListChecks size={18} aria-hidden="true" className="text-blue-600" />
            What you need
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {String(materials).split(/\s*[,;]\s*/).filter(Boolean).map((m) => (
              <li key={m} className="flex items-start gap-2 rounded-sm border border-line bg-white px-3 py-2.5 text-sm">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-orange-500" />
                {m}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {safety ? (
        <Callout tone="warning" title="Get a grown-up" className="mt-6" icon={TriangleAlert}>
          Check with an adult before you start, especially if this uses heat, anything
          sharp, or household chemicals. Wear eye protection if you have it.
        </Callout>
      ) : null}

      <div className="mt-9">
        <Button size="lg" onClick={onDone}>
          I&rsquo;ve got everything <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** Markdown content — used for coding lessons, briefs and explanations. */
export function ExplainActivity({ activity, onDone, doneLabel = 'Continue' }) {
  const { markdown, realWorld, funFact, note, skills } = activity.config || {};
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-h2">{activity.title}</h2>

      {note ? <p className="mt-4 text-lead text-ink-600">{note}</p> : null}

      {skills?.length ? (
        <div className="mt-6 rounded-md border border-line bg-white p-4">
          <p className="text-micro font-semibold uppercase tracking-label text-ink-500">
            Skills this practises
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s} className="cq-badge cq-badge--info">{s.split('.').pop().replace(/-/g, ' ')}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {markdown ? (
        <div className="cq-prose mt-7">
          <Markdown>{markdown}</Markdown>
        </div>
      ) : null}

      {realWorld ? (
        <Callout tone="info" title="Where you meet this in real life" className="mt-7">
          {realWorld}
        </Callout>
      ) : null}

      {funFact ? (
        <Callout tone="note" title="One more thing" icon={Sparkles} className="mt-4">
          {funFact}
        </Callout>
      ) : null}

      <div className="mt-9">
        <Button size="lg" onClick={onDone}>
          {doneLabel} <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/**
 * The build procedure. Steps are checkable so a student can put the tablet
 * down mid-experiment and come back without losing their place — the checked
 * set is written into the attempt checkpoint by the player.
 */
export function BuildActivity({ activity, checked = [], onToggle, onDone }) {
  const steps = activity.config?.steps || [];
  const allDone = steps.length > 0 && checked.length >= steps.length;
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-h2">{activity.title || 'Run the experiment'}</h2>
      <p className="mt-3 text-ink-600">
        Tick each step as you go. Nothing is timed, and you can come back to this.
      </p>

      <ol className="mt-8 space-y-3">
        {steps.map((step, i) => {
          const isChecked = checked.includes(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onToggle(i)}
                aria-pressed={isChecked}
                className={cn(
                  'flex w-full items-start gap-3.5 rounded-md border p-4 text-left transition-colors duration-1',
                  isChecked
                    ? 'border-success-500 bg-success-50'
                    : 'border-line bg-white shadow-xs hover:border-blue-300',
                )}
              >
                <span className={cn(
                  'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-pill text-xs font-bold',
                  isChecked ? 'bg-success-500 text-white' : 'bg-blue-50 text-blue-700',
                )}>
                  {isChecked ? <Check size={15} aria-hidden="true" /> : i + 1}
                </span>
                <span className={cn('text-sm leading-relaxed', isChecked ? 'text-success-700' : 'text-ink-800')}>
                  {step}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onDone}>
          {allDone ? 'Done — what happened?' : 'Skip ahead'} <ArrowRight size={17} aria-hidden="true" />
        </Button>
        {!allDone && steps.length ? (
          <p className="text-xs text-ink-500">
            {checked.length} of {steps.length} steps ticked
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Free-response reflection. Private to the student. */
export function ReflectActivity({ activity, answers = {}, onChange, onDone }) {
  const prompts = activity.config?.prompts || [];
  const [local, setLocal] = useState(answers);

  const set = (i, v) => {
    const next = { ...local, [i]: v };
    setLocal(next);
    onChange?.(next);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-h2">{activity.title || 'What happened?'}</h2>
      <p className="mt-3 text-ink-600">
        These notes are just for you — nobody else sees them, not even your teacher.
      </p>

      <div className="mt-8 space-y-6">
        {prompts.map((prompt, i) => (
          <div key={prompt}>
            <label htmlFor={`reflect-${i}`} className="cq-label">{prompt}</label>
            <textarea
              id={`reflect-${i}`}
              rows={3}
              value={local[i] || ''}
              onChange={(e) => set(i, e.target.value)}
              placeholder="Write as much or as little as you like"
              className="cq-field resize-y"
            />
          </div>
        ))}
      </div>

      <div className="mt-9">
        <Button size="lg" onClick={onDone}>
          Finish <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
