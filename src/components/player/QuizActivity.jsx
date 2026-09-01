import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, ArrowRight, Info } from 'lucide-react';
import { Button, Meter, cn } from '@/components/cq';

/* ============================================================================
   The question activity.

   Three things matter more than looking clever here:

   1. Feedback teaches. Every answer — right or wrong — gets the explanation,
      phrased as a nudge rather than a verdict. "Not quite" beats "Incorrect".
   2. Nothing is lost. The parent player checkpoints after every single answer,
      so a closed Chromebook lid costs one question at most.
   3. It works with a finger and with a keyboard. Options are 48px minimum,
      1–9 select an answer, Enter advances.
   ========================================================================= */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizActivity({
  activity,
  startIndex = 0,
  onAnswer,          // async (question, choiceIndex) => { isCorrect, explanation }
  onProgress,        // (index) => void — fires after each answer, for checkpointing
  onDone,            // ({ asked, correct }) => void
  showExplanations = true,
}) {
  const questions = activity.questions || [];
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, questions.length - 1)));
  const [picked, setPicked] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [busy, setBusy] = useState(false);
  const tally = useRef({ asked: 0, correct: 0 });
  const shownAt = useRef(Date.now());
  const advanceRef = useRef(null);

  const q = questions[index];
  const isLast = index >= questions.length - 1;

  useEffect(() => { shownAt.current = Date.now(); }, [index]);

  const submit = useCallback(async (choice) => {
    if (picked !== null || busy || !q) return;
    setBusy(true);
    setPicked(choice);
    try {
      const res = await onAnswer(q, choice, Date.now() - shownAt.current);
      tally.current.asked += 1;
      if (res?.isCorrect) tally.current.correct += 1;
      setVerdict(res);
      onProgress?.(index + 1, tally.current);
    } catch (err) {
      /* A failed write must not eat the child's answer. Show it locally and
         let them continue; the parent surfaces the error. */
      setVerdict({ isCorrect: null, explanation: 'Could not save that answer. Your place is kept — carry on.' });
    } finally {
      setBusy(false);
    }
  }, [picked, busy, q, onAnswer, onProgress, index]);

  const next = useCallback(() => {
    if (isLast) { onDone?.({ ...tally.current }); return; }
    setIndex((i) => i + 1);
    setPicked(null);
    setVerdict(null);
  }, [isLast, onDone]);

  /* Keyboard: number keys pick, Enter advances. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (picked === null) {
        const n = Number(e.key);
        if (n >= 1 && n <= (q?.choices?.length || 0)) { e.preventDefault(); submit(n - 1); }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, q, submit, next]);

  /* Move focus to the feedback so a screen-reader user hears it immediately. */
  useEffect(() => { if (verdict) advanceRef.current?.focus(); }, [verdict]);

  if (!q) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-ink-600">This activity has no questions yet.</p>
        <Button className="mt-5" onClick={() => onDone?.({ asked: 0, correct: 0 })}>Continue</Button>
      </div>
    );
  }

  const answered = picked !== null;
  const correct = verdict?.isCorrect === true;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-600">
          Question <span className="cq-data text-ink-900">{index + 1}</span> of {questions.length}
        </p>
        <p className="text-sm text-ink-600">
          <span className="cq-data text-success-600">{tally.current.correct}</span> right so far
        </p>
      </div>
      <Meter
        value={((index + (answered ? 1 : 0)) / questions.length) * 100}
        showValue={false} hideLabel size="sm" className="mt-2.5"
        label={`Progress: question ${index + 1} of ${questions.length}`}
      />

      <h2 className="mt-8 font-display text-h3 font-bold leading-snug">{q.prompt}</h2>

      <div role="group" aria-label="Answer choices" className="mt-6 grid gap-3">
        {q.choices.map((choice, i) => {
          const isPicked = i === picked;
          const isAnswer = answered && verdict?.isCorrect !== null
            && (correct ? isPicked : verdict?.answer === i);
          return (
            <button
              key={choice}
              type="button"
              disabled={answered}
              aria-pressed={isPicked}
              onClick={() => submit(i)}
              className={cn(
                'flex min-h-[3.25rem] w-full items-center gap-3.5 rounded-md border px-4 py-3 text-left transition-all duration-1',
                !answered && 'border-line bg-surface shadow-xs hover:-translate-y-px hover:border-blue-400 hover:shadow-sm',
                answered && isPicked && correct && 'border-success-500 bg-success-50',
                answered && isPicked && !correct && 'border-danger-600 bg-danger-50',
                answered && !isPicked && isAnswer && 'border-success-500 bg-success-50',
                answered && !isPicked && !isAnswer && 'border-line opacity-55',
              )}
            >
              <span className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-sm text-sm font-bold',
                answered && isPicked && correct ? 'bg-success-500 text-white'
                  : answered && isPicked && !correct ? 'bg-danger-600 text-white'
                  : answered && isAnswer ? 'bg-success-500 text-white'
                  : 'bg-blue-50 text-blue-700',
              )}>
                {answered && isPicked && correct ? <Check size={16} aria-hidden="true" />
                  : answered && isPicked && !correct ? <X size={16} aria-hidden="true" />
                  : LETTERS[i]}
              </span>
              <span className="text-[0.9375rem] font-medium leading-snug">{choice}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {answered && verdict ? (
          <div className={cn('mt-6 rounded-md p-4',
            verdict.isCorrect === null ? 'bg-warning-50 text-warning-700'
              : correct ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-900')}>
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 opacity-70" />
              <span>
                <strong className="font-semibold">
                  {verdict.isCorrect === null ? '' : correct ? 'Correct. ' : 'Not quite. '}
                </strong>
                {showExplanations ? (verdict.explanation || q.explanation || '') : ''}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      {answered ? (
        <div className="mt-7">
          <Button ref={advanceRef} size="lg" onClick={next} data-autofocus>
            {isLast ? 'Finish' : 'Next question'} <ArrowRight size={17} aria-hidden="true" />
          </Button>
          <p className="mt-2.5 text-xs text-ink-500">Press Enter to continue</p>
        </div>
      ) : (
        <p className="mt-6 text-xs text-ink-500">
          Pick an answer — or press {q.choices.map((_, i) => i + 1).join(', ')} on the keyboard.
        </p>
      )}
    </div>
  );
}
