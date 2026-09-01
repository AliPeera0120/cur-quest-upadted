import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  X, ArrowRight, Award, TrendingUp, Sparkles, Repeat, Home, Check,
} from 'lucide-react';
import { Button, Badge, Meter, MasteryTag, Modal, Spinner, ErrorState, cn } from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { FORMATS, DIFFICULTY } from '@/content/index.js';
import { minutes, duration } from '@/lib/format.js';
import QuizActivity from '@/components/player/QuizActivity.jsx';
import BattleActivity from '@/components/player/BattleActivity.jsx';
import {
  IntroActivity, ExplainActivity, BuildActivity, ReflectActivity,
} from '@/components/player/ReadActivity.jsx';

/* ============================================================================
   The lesson player.

   One screen runs every kind of lesson: a mission, a five-minute challenge, a
   battle, a hands-on experiment, a coding lesson, a brief. It walks the
   lesson's activity list in order and renders whichever component that
   activity's `kind` maps to, so adding a new activity type later means adding
   one renderer here and one entry in the content build — not rebuilding the
   player.

   Three things it takes seriously:

   · Losing work. The attempt is checkpointed after every single answer and on
     every activity change, so a closed lid, a dropped Wi-Fi connection or a
     bell ringing costs at most one question.
   · Leaving. Exiting is always one obvious button, and it never destroys the
     attempt — it saves and returns, so the lesson appears under "Continue".
   · Ending well. The result screen leads with what was learned and what
     improved, not with a score and a confetti cannon.
   ========================================================================= */

const SCORED = new Set(['quiz', 'battle']);

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [state, setState] = useState({ status: 'loading' });
  const [step, setStep] = useState(0);
  const [quizStart, setQuizStart] = useState(0);
  const [buildChecked, setBuildChecked] = useState([]);
  const [reflections, setReflections] = useState({});
  const [confirmExit, setConfirmExit] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState(null);

  const tally = useRef({ asked: 0, correct: 0 });
  const startedAt = useRef(Date.now());
  const attemptRef = useRef(null);

  /* ------------------------------------------------------------- load ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const content = await api.getLessonForPlay(lessonId);
        if (!content) { if (alive) setState({ status: 'missing' }); return; }
        const attempt = await api.startAttempt({
          lessonId,
          assignmentId: params.get('assignment') || null,
          restart: params.get('restart') === '1',
        });
        if (!alive) return;
        attemptRef.current = attempt;

        /* Restore position from the checkpoint if this is a resume. */
        const s = attempt.state || {};
        setStep(Math.min(s.activityIndex ?? 0, Math.max(0, content.activities.length - 1)));
        setQuizStart(s.questionIndex ?? 0);
        setBuildChecked(Array.isArray(s.buildChecked) ? s.buildChecked : []);
        setReflections(s.reflections || {});
        tally.current = { asked: attempt.questionsAnswered || 0, correct: attempt.questionsCorrect || 0 };
        startedAt.current = Date.now() - (attempt.secondsSpent || 0) * 1000;
        setState({ status: 'ready', content, attempt, resumed: !!attempt.resumed });
      } catch (err) {
        if (alive) setState({ status: 'error', message: err?.message || 'Could not open that lesson.' });
      }
    })();
    return () => { alive = false; };
  }, [lessonId, params]);

  const content = state.content;
  const activities = content?.activities || [];
  const activity = activities[step];

  const totalQuestions = useMemo(
    () => activities.filter((a) => a.kind === 'quiz').reduce((n, a) => n + (a.questions?.length || 0), 0),
    [activities],
  );

  const secondsSpent = () => Math.round((Date.now() - startedAt.current) / 1000);

  /* ------------------------------------------------------ checkpointing --- */
  const checkpoint = useCallback((patch = {}) => {
    const attempt = attemptRef.current;
    if (!attempt) return;
    api.saveCheckpoint({
      attemptId: attempt.id,
      secondsSpent: secondsSpent(),
      state: {
        activityIndex: step,
        questionIndex: quizStart,
        totalQuestions,
        buildChecked,
        reflections,
        ...patch,
      },
    }).catch(() => { /* a failed checkpoint must never interrupt play */ });
  }, [step, quizStart, totalQuestions, buildChecked, reflections]);

  useEffect(() => { if (state.status === 'ready') checkpoint(); }, [step, state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Save on the way out of the tab, too. */
  useEffect(() => {
    const onHide = () => checkpoint();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); onHide(); };
  }, [checkpoint]);

  /* ------------------------------------------------------------ answers --- */
  const handleAnswer = useCallback(async (question, choice, msElapsed) => {
    const attempt = attemptRef.current;
    const res = await api.submitResponse({
      attemptId: attempt.id,
      questionId: question.id,
      response: choice,
      msElapsed,
    });
    tally.current.asked += 1;
    if (res.isCorrect) tally.current.correct += 1;
    return res;
  }, []);

  const handleProgress = useCallback((questionIndex) => {
    setQuizStart(questionIndex);
    checkpoint({ questionIndex });
  }, [checkpoint]);

  /* ------------------------------------------------------------- finish --- */
  const advance = useCallback(() => {
    if (step < activities.length - 1) {
      setStep((s) => s + 1);
      setQuizStart(0);
      return;
    }
    finishLesson();
  }, [step, activities.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishLesson = useCallback(async () => {
    const attempt = attemptRef.current;
    if (!attempt || finishing) return;
    setFinishing(true);
    try {
      const { asked, correct } = tally.current;
      const res = await api.completeAttempt({
        attemptId: attempt.id,
        score: correct,
        /* Score out of what was actually asked, so a battle (which serves
           questions until the tower falls) and a fixed quiz both produce a
           comparable percentage. */
        maxScore: Math.max(asked, 1),
        secondsSpent: secondsSpent(),
        state: { activityIndex: activities.length, questionIndex: 0, totalQuestions, completed: true },
      });
      setResult({ ...res, asked, correct, unscored: asked === 0 });
    } catch (err) {
      setResult({ error: err?.message || 'Could not save your result.' });
    } finally {
      setFinishing(false);
    }
  }, [finishing, activities.length, totalQuestions]);

  const leave = () => {
    checkpoint();
    navigate(user?.role === 'student' ? '/arena/home' : '/arena/teach', { replace: true });
  };

  /* -------------------------------------------------------------- render -- */
  if (state.status === 'loading') {
    return (
      <div data-skin="arena" className="grid min-h-dvh place-items-center bg-paper">
        <div className="text-center text-ink-500">
          <Spinner label="Opening lesson" />
          <p className="mt-3 text-sm">Opening the lesson…</p>
        </div>
      </div>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    return (
      <div data-skin="arena" className="grid min-h-dvh place-items-center bg-paper px-gutter">
        <div className="w-full max-w-md">
          <ErrorState
            title={state.status === 'missing' ? 'That lesson is not here' : 'Could not start the lesson'}
            detail={state.message || 'It may have been renamed or unpublished. The rest of the catalog is still open.'}
          />
          <div className="mt-5 flex justify-center gap-3">
            <Button to="/arena/explore" variant="primary">Browse lessons</Button>
            <Button to="/arena/home" variant="outline">Back home</Button>
          </div>
        </div>
      </div>
    );
  }

  const lesson = content.lesson;
  const format = FORMATS[lesson.format];

  if (result) {
    return <ResultScreen lesson={lesson} result={result} onRetry={() => window.location.reload()} />;
  }

  return (
    <div data-skin="arena" className="flex min-h-dvh flex-col bg-paper text-ink-900">
      <Meta title={lesson.title} />

      {/* Player chrome: title, progress through the activities, and one exit. */}
      <header className="sticky top-0 z-header border-b border-line bg-paper/95 backdrop-blur">
        <div className="cq-container flex h-16 items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge tone="info">{format?.label || lesson.format}</Badge>
              <span className="truncate text-sm font-semibold">{lesson.title}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1" role="group" aria-label="Lesson progress">
                {activities.map((a, i) => (
                  <span
                    key={a.id}
                    title={a.title || a.kind}
                    className={cn('h-1 flex-1 rounded-pill transition-colors duration-2',
                      i < step ? 'bg-success-700' : i === step ? 'bg-blue-600' : 'bg-ink-200')}
                  />
                ))}
              </div>
              <span className="cq-data shrink-0 text-micro text-ink-500">
                {step + 1}/{activities.length}
              </span>
            </div>
          </div>
          <Button
            variant="ghost" size="sm" iconOnly
            onClick={() => (tally.current.asked > 0 ? setConfirmExit(true) : leave())}
            aria-label="Leave the lesson"
            title="Leave — your place is saved"
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </div>
      </header>

      {state.resumed && step > 0 ? (
        <div role="status" className="border-b border-line bg-blue-50 px-gutter py-2.5 text-center text-xs font-medium text-blue-700">
          Picked up where you left off.
        </div>
      ) : null}

      <main className="flex-1 px-gutter py-8 cb:py-12">
        <ActivityRenderer
          activity={activity}
          lesson={lesson}
          quizStart={quizStart}
          buildChecked={buildChecked}
          reflections={reflections}
          onAnswer={handleAnswer}
          onProgress={handleProgress}
          onToggleStep={(i) => {
            setBuildChecked((prev) => {
              const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
              checkpoint({ buildChecked: next });
              return next;
            });
          }}
          onReflect={(next) => { setReflections(next); checkpoint({ reflections: next }); }}
          onDone={advance}
          busy={finishing}
        />
      </main>

      <Modal
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="Leave this lesson?"
        description="Your answers so far are saved. You can pick it up from the same place."
        size="sm"
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmExit(false)}>Keep going</Button>
            <Button variant="primary" onClick={leave}>Save and leave</Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          You have answered {tally.current.asked} {tally.current.asked === 1 ? 'question' : 'questions'} so far.
          Everything you got right still counts toward your skills.
        </p>
      </Modal>
    </div>
  );
}

/* --------------------------------------------------- activity dispatch ---- */
function ActivityRenderer({
  activity, lesson, quizStart, buildChecked, reflections,
  onAnswer, onProgress, onToggleStep, onReflect, onDone, busy,
}) {
  if (!activity) return null;
  if (busy) {
    return (
      <div className="grid place-items-center py-20 text-ink-500">
        <Spinner label="Saving your result" />
        <p className="mt-3 text-sm">Working out what you learned…</p>
      </div>
    );
  }

  switch (activity.kind) {
    case 'intro':
      return <IntroActivity activity={activity} lesson={lesson} onDone={onDone} />;
    case 'explain':
      return (
        <ExplainActivity
          activity={activity}
          onDone={onDone}
          doneLabel={lesson.format === 'brief' ? 'Mark as read' : 'Continue'}
        />
      );
    case 'build':
      return (
        <BuildActivity
          activity={activity}
          checked={buildChecked}
          onToggle={onToggleStep}
          onDone={onDone}
        />
      );
    case 'reflect':
      return (
        <ReflectActivity
          activity={activity}
          answers={reflections}
          onChange={onReflect}
          onDone={onDone}
        />
      );
    case 'battle':
      return (
        <BattleActivity
          activity={activity}
          onAnswer={onAnswer}
          onProgress={onProgress}
          onDone={onDone}
        />
      );
    case 'quiz':
    default:
      return (
        <QuizActivity
          activity={activity}
          startIndex={quizStart}
          onAnswer={onAnswer}
          onProgress={onProgress}
          onDone={onDone}
          showExplanations={activity.config?.showExplanations !== false}
        />
      );
  }
}

/* ------------------------------------------------------------- result ----- */
function ResultScreen({ lesson, result, onRetry }) {
  if (result.error) {
    return (
      <div data-skin="arena" className="grid min-h-dvh place-items-center bg-paper px-gutter">
        <div className="w-full max-w-md">
          <ErrorState title="Could not save your result" detail={result.error} onRetry={onRetry} />
          <div className="mt-5 flex justify-center">
            <Button to="/arena/home" variant="outline">Back home</Button>
          </div>
        </div>
      </div>
    );
  }

  const { scorePct, asked, correct, isPersonalBest, isFirstCompletion, previousBest,
    awards = [], xpEarned, masteryChanges = [], achievements = [], progress, unscored } = result;

  /* The headline is deliberately about learning, not the number. */
  const headline = unscored ? 'Done.'
    : masteryChanges.some((c) => c.to === 'mastered') ? 'Skill mastered.'
    : isPersonalBest ? 'New personal best.'
    : isFirstCompletion ? 'Lesson complete.'
    : scorePct >= 80 ? 'Strong run.'
    : 'Progress made.';

  return (
    <div data-skin="arena" className="min-h-dvh bg-paper text-ink-900">
      <Meta title={`${lesson.title} — complete`} />
      <div className="cq-container cq-container--narrow py-12 cb:py-16">
        <p className="text-micro font-semibold uppercase tracking-label text-blue-600">{lesson.title}</p>
        <h1 className="mt-3 text-h1">{headline}</h1>

        {!unscored ? (
          <div className="mt-8 rounded-lg border border-line bg-surface p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="cq-data cq-data--xl text-ink-900">{scorePct}%</p>
                <p className="mt-1 text-sm text-ink-500">
                  {correct} of {asked} correct
                </p>
              </div>
              {previousBest != null ? (
                <p className="text-right text-sm text-ink-600">
                  Previous best <span className="cq-data text-ink-900">{Math.round(previousBest)}%</span>
                  {scorePct > previousBest ? (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-success-700">
                      <TrendingUp size={14} aria-hidden="true" />+{Math.round(scorePct - previousBest)}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            <Meter value={scorePct} showValue={false} hideLabel size="lg" className="mt-4"
              label={`Score ${scorePct} percent`}
              tone={scorePct >= 80 ? 'success' : scorePct >= 60 ? 'blue' : 'ember'} />
          </div>
        ) : (
          <p className="mt-6 text-lead text-ink-600">
            Nothing to score here — but it is logged, and it counts toward your
            exploration across the six science strands.
          </p>
        )}

        {/* What moved in the learning record. This is the part that matters. */}
        {masteryChanges.length ? (
          <section className="mt-8">
            <h2 className="text-h4">What changed in your skills</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
              {masteryChanges.map((c) => (
                <li key={c.skillId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <span className="text-sm font-medium">{c.skillName}</span>
                  <span className="flex items-center gap-2.5">
                    <MasteryTag level={c.from} size="sm" showPct={false} />
                    <ArrowRight size={14} aria-hidden="true" className="text-ink-400" />
                    <MasteryTag level={c.to} pct={c.pct} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {achievements.length ? (
          <section className="mt-8">
            <h2 className="text-h4">Badges earned</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-md border border-line bg-surface p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-warning-100 text-warning-700">
                    <Award size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{a.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">{a.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {awards.length ? (
          <section className="mt-8 rounded-md border border-line bg-surface-2 p-5">
            <h2 className="flex items-center gap-2 text-h4">
              <Sparkles size={17} aria-hidden="true" className="text-orange-700" />
              +{xpEarned} discovery points
            </h2>
            <ul className="mt-3 space-y-1.5">
              {awards.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-600">{a.reason}</span>
                  <span className="cq-data text-ink-900">+{a.amount}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {progress ? (
          <p className="mt-8 text-sm text-ink-500">
            {progress.attempts === 1
              ? 'First time through this one.'
              : `Attempt ${progress.attempts}. Best so far ${Math.round(progress.bestScore ?? 0)}%, total time ${duration(progress.seconds)}.`}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button to="/arena/home" size="lg" variant="primary">
            <Home size={17} aria-hidden="true" /> Back to home
          </Button>
          <Button to={`/arena/play/${lesson.id}?restart=1`} size="lg" variant="outline" reloadDocument>
            <Repeat size={17} aria-hidden="true" /> Play again
          </Button>
          <Button to="/arena/explore" size="lg" variant="ghost">Find something new</Button>
        </div>
      </div>
    </div>
  );
}
