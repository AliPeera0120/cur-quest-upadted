import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal, Button, Callout, Skeleton, cn } from '@/components/cq';
import { api } from '@/platform/api.js';
import { DIFFICULTY } from '@/content/index.js';

/* ============================================================================
   The answer key.

   Teachers and admins are the only roles `getLessonForReview` answers for —
   the player endpoint strips answers before they ever reach a browser. So this
   dialog is the one place in the product that shows a correct answer next to
   its question, and it says so, because a teacher projecting their screen
   needs to know what is on it.
   ========================================================================= */

export default function AnswerKeyModal({ lesson, onClose }) {
  const [content, setContent] = useState(null);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    if (!lesson) { setContent(null); setFailed(null); return undefined; }
    let alive = true;
    api.getLessonForReview(lesson.id)
      .then((c) => { if (alive) setContent(c); })
      .catch((e) => { if (alive) setFailed(e?.message || 'Could not load those questions.'); });
    return () => { alive = false; };
  }, [lesson]);

  const questions = useMemo(
    () => (content?.activities || []).flatMap((a) => a.questions.map((q) => ({ ...q, activity: a.title }))),
    [content],
  );

  return (
    <Modal
      open={!!lesson}
      onClose={onClose}
      size="xl"
      title={lesson ? `Answer key — ${lesson.title}` : 'Answer key'}
      description="Correct answers are marked. Students never receive this payload."
      footer={<Button variant="ghost" onClick={onClose}>Close</Button>}
    >
      {failed ? <Callout tone="danger">{failed}</Callout> : null}
      {!content && !failed ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
      ) : null}
      {content && !questions.length ? (
        <Callout tone="note" title="No questions in this one">
          This lesson is a read or a hands-on activity — there is no question bank behind
          it, so there is nothing to mark.
        </Callout>
      ) : null}
      {questions.length ? (
        <ol className="space-y-4">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-md border border-line bg-white p-4">
              <div className="flex items-baseline gap-2.5">
                <span className="cq-data shrink-0 text-sm text-ink-500">{i + 1}</span>
                <p className="font-medium text-ink-900">{q.prompt}</p>
              </div>
              {Array.isArray(q.choices) ? (
                <ul className="mt-3 space-y-1.5">
                  {q.choices.map((choice, ci) => {
                    const correct = ci === q.answer;
                    return (
                      <li key={choice} className={cn(
                        'flex items-start gap-2.5 rounded-sm border px-3 py-2 text-sm',
                        correct ? 'border-[#C7EBDD] bg-success-50 font-medium text-ink-900' : 'border-line text-ink-700',
                      )}>
                        {correct
                          ? <Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" />
                          : <span aria-hidden="true" className="mt-0.5 w-[15px] shrink-0" />}
                        <span>{choice}</span>
                        {correct ? <span className="cq-sr">Correct answer</span> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-800">
                  Expected answer: <strong>{String(q.answer)}</strong>
                </p>
              )}
              {q.explanation ? (
                <p className="mt-3 border-l-2 border-blue-200 pl-3 text-sm text-ink-700">{q.explanation}</p>
              ) : null}
              <p className="mt-2.5 text-micro text-ink-500">
                {q.activity ? `${q.activity} · ` : ''}
                {q.topic ? `${q.topic} · ` : ''}
                {DIFFICULTY[q.difficulty] || 'Unrated'}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </Modal>
  );
}
