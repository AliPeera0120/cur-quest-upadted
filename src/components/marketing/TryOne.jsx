import React, { useState } from 'react';
import { Check, X, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { Badge, Button, cn } from '@/components/cq';
import { CONTENT_SUMMARY } from '@/content/index.js';

/**
 * A real question from the real bank, answerable on the homepage.
 *
 * Most nonprofit sites describe their product. This hands you a piece of it in
 * the first screenful — same question text, same feedback copy, same skill
 * tagging the Arena uses. It is the shortest honest answer to "what is this?".
 */
export default function TryOne({ className }) {
  const pool = CONTENT_SUMMARY.sampleQuestions || [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const q = pool[index % pool.length];
  if (!q) return null;

  const answered = picked !== null;
  const correct = answered && picked === q.answer;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-line bg-white shadow-lg', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-5 py-3.5">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-600">
          <Sparkles size={14} aria-hidden="true" className="text-orange-500" />
          Try a real Arena question
        </p>
        <Badge tone="info">{q.skillName}</Badge>
      </div>

      <div className="p-5 cb:p-6">
        <p className="font-display text-lg font-bold leading-snug text-ink-900">{q.prompt}</p>

        <div role="group" aria-label="Answer choices" className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {q.choices.map((choice, i) => {
            const isAnswer = i === q.answer;
            const isPicked = i === picked;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => !answered && setPicked(i)}
                disabled={answered}
                aria-pressed={isPicked}
                className={cn(
                  'flex min-h-[3rem] items-center justify-between gap-2 rounded-sm border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-1',
                  !answered && 'border-ink-200 bg-white shadow-xs hover:-translate-y-px hover:border-blue-300 hover:shadow-sm',
                  answered && isAnswer && 'border-success-500 bg-success-50 text-success-700',
                  answered && isPicked && !isAnswer && 'border-danger-600 bg-danger-50 text-danger-700',
                  answered && !isAnswer && !isPicked && 'border-line text-ink-400',
                )}
              >
                <span>{choice}</span>
                {answered && isAnswer ? <Check size={16} aria-hidden="true" className="shrink-0" /> : null}
                {answered && isPicked && !isAnswer ? <X size={16} aria-hidden="true" className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>

        {/* Feedback explains the science rather than just scoring the child. */}
        <div aria-live="polite">
          {answered ? (
            <div className={cn('mt-4 rounded-md p-4 text-sm leading-relaxed',
              correct ? 'bg-success-50 text-success-700' : 'bg-orange-50 text-orange-900')}>
              <strong className="font-semibold">{correct ? 'That’s it. ' : 'Not quite. '}</strong>
              {q.explanation}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper-2 px-5 py-3.5">
        <p className="text-xs text-ink-500">
          {answered ? 'One of 234 questions in the Arena' : `Sample ${index + 1} of ${pool.length}`}
        </p>
        <div className="flex items-center gap-2">
          {answered ? (
            <Button variant="ghost" size="sm"
              onClick={() => { setPicked(null); setIndex((i) => (i + 1) % pool.length); }}>
              <RotateCcw size={14} aria-hidden="true" /> Another
            </Button>
          ) : null}
          <Button to="/arena" variant="primary" size="sm">
            Enter the Arena <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
