import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, ArrowRight, ClipboardList, Compass, Award, TrendingUp, Clock,
  Sparkles, Users, Check, Target, Swords, FlaskConical, Terminal, BookOpen, Zap,
} from 'lucide-react';
import {
  Button, Badge, Panel, Meter, MasteryTag, MasteryLegend, SegmentGauge,
  ActivityColumns, EmptyState, ErrorState, Skeleton, Avatar, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { FORMATS } from '@/content/index.js';
import { minutes, duration, ago, dueLabel, plural } from '@/lib/format.js';

/* ============================================================================
   Student home.

   The order of this page is the order of the four questions a student actually
   has when they open it:

     1. What was I doing?          → Continue
     2. What does my teacher want? → Assigned missions
     3. What should I try?         → Recommended, with the reason stated
     4. How am I doing?            → Strand progress and badges

   It is deliberately not a gradebook. There is no ranking against classmates,
   no streak to protect, and no red numbers. Growth is shown; failure is not
   dramatised.
   ========================================================================= */

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: Check,
};

export default function StudentHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getStudentOverview()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load your progress.'); });
    return () => { alive = false; };
  }, [user?.id]);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load your dashboard" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!data) return <LoadingHome />;

  const firstName = (data.profile?.displayName || 'Scientist').split(' ')[0];
  const openAssignments = data.assignments.filter((a) => a.state !== 'met');

  return (
    <>
      <Meta title="Home" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        {/* ------------------------------------------------------- greeting */}
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-micro font-semibold uppercase tracking-label text-blue-600">
              {data.rank.title}
            </p>
            <h1 className="mt-2 text-h1">Welcome back, {firstName}.</h1>
            <p className="mt-2.5 text-ink-600">
              {data.totals.lessonsCompleted > 0
                ? `${plural(data.totals.lessonsCompleted, 'lesson')} finished · ${plural(data.totals.skillsMastered, 'skill')} mastered · ${duration(data.totals.seconds)} of science so far.`
                : `All ${data.totals.catalogSize} lessons are open. Pick anything that looks interesting.`}
            </p>
          </div>
          <RankProgress data={data} />
        </header>

        {/* ------------------------------------------------------- continue */}
        <section className="mt-8">
          {data.continueCard ? (
            <ContinueCard card={data.continueCard} />
          ) : (
            <StartCard recommendation={data.recommendations[0]} />
          )}
        </section>

        <div className="mt-10 grid gap-10 cb:grid-cols-[1.35fr_1fr] cb:gap-12">
          <div className="min-w-0 space-y-10">
            {/* ------------------------------------------------ assignments */}
            <section aria-labelledby="assigned-h">
              <SectionHead
                id="assigned-h"
                icon={ClipboardList}
                title="Assigned to you"
                sub={openAssignments.length
                  ? `${plural(openAssignments.length, 'mission')} your teacher has set`
                  : 'Nothing outstanding'}
                action={data.assignments.length ? <Link to="/arena/assignments" className="text-sm font-semibold no-underline">See all</Link> : null}
              />
              {data.assignments.length === 0 ? (
                <EmptyState
                  compact
                  icon={Users}
                  title="No missions set"
                  action={<Button to="/arena/join" variant="outline" size="sm">Join a class with a code</Button>}
                >
                  When you join a teacher&rsquo;s class, anything they assign shows up here.
                  You can still play everything without one.
                </EmptyState>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.assignments.slice(0, 4).map((a) => (
                    <AssignmentRow key={a.assignment.id} item={a} />
                  ))}
                </ul>
              )}
            </section>

            {/* --------------------------------------------- recommendations */}
            <section aria-labelledby="rec-h">
              <SectionHead
                id="rec-h"
                icon={Sparkles}
                title="Recommended for you"
                sub="Chosen from what you have practised — the reason is always shown"
                action={<Link to="/arena/explore" className="text-sm font-semibold no-underline">Explore all</Link>}
              />
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.recommendations.slice(0, 4).map((r) => (
                  <RecommendationCard key={r.lesson.id} rec={r} />
                ))}
              </ul>
            </section>

            {/* ------------------------------------------------- recent play */}
            {data.recent.length ? (
              <section aria-labelledby="recent-h">
                <SectionHead id="recent-h" icon={Clock} title="Recently played" />
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
                  {data.recent.slice(0, 6).map((r) => (
                    <li key={r.lesson.id + r.at}>
                      <Link
                        to={`/arena/lesson/${r.lesson.id}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-3.5 no-underline hover:bg-blue-50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">{r.lesson.title}</span>
                          <span className="mt-0.5 block text-xs text-ink-500">
                            {FORMATS[r.lesson.format]?.label} · {ago(r.at)}
                          </span>
                        </span>
                        {r.scorePct != null ? (
                          <span className="cq-data shrink-0 text-sm text-ink-900">{r.scorePct}%</span>
                        ) : null}
                        {r.progress ? (
                          <span className="shrink-0">
                            <StatusPill status={r.progress.status} />
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* ------------------------------------------------------ sidebar */}
          <aside className="min-w-0 space-y-8">
            <PassportPanel strands={data.strands} />
            <ActivityPanel activity={data.activity} totals={data.totals} />
            <BadgePanel achievements={data.achievements} />
            <ClassPanel classes={data.classes} />
          </aside>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

function SectionHead({ id, icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="flex items-center gap-2 text-h3">
          {Icon ? <Icon size={19} aria-hidden="true" className="text-blue-600" /> : null}
          {title}
        </h2>
        {sub ? <p className="mt-1 text-sm text-ink-500">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

function RankProgress({ data }) {
  const { rank, nextRank, profile } = data;
  const span = nextRank ? nextRank.minXp - rank.minXp : 1;
  const into = Math.max(0, (profile.xpTotal || 0) - rank.minXp);
  return (
    <div className="w-full max-w-xs rounded-md border border-line bg-white p-4 shadow-xs">
      <div className="flex items-baseline justify-between gap-3">
        <span className="cq-data cq-data--md text-blue-700">{(profile.xpTotal || 0).toLocaleString()} DP</span>
        <span className="text-xs text-ink-500">Level {rank.level}</span>
      </div>
      <Meter
        value={nextRank ? (into / span) * 100 : 100}
        showValue={false} hideLabel size="sm" className="mt-2.5"
        label={`Progress to ${nextRank?.title || 'the top rank'}`}
      />
      <p className="mt-2 text-xs text-ink-500">
        {nextRank
          ? `${(nextRank.minXp - (profile.xpTotal || 0)).toLocaleString()} points to ${nextRank.title}`
          : 'Top rank reached.'}
      </p>
    </div>
  );
}

function ContinueCard({ card }) {
  const Icon = FORMAT_ICON[card.lesson.format] || Target;
  return (
    <div className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50">
      <div className="flex flex-wrap items-center gap-6 p-6 cb:p-7">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
          <Icon size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-micro font-semibold uppercase tracking-label text-blue-700">
            Pick up where you left off
          </p>
          <h2 className="mt-1.5 truncate text-h3">{card.lesson.title}</h2>
          <p className="mt-1 text-sm text-ink-600">
            {card.label} · last played {ago(card.updatedAt)}
          </p>
        </div>
        <Button to={`/arena/play/${card.lesson.id}`} size="lg" variant="primary" className="shrink-0">
          <Play size={17} aria-hidden="true" /> Continue
        </Button>
      </div>
      {card.totalQuestions ? (
        <Meter
          value={(card.questionIndex / card.totalQuestions) * 100}
          showValue={false} hideLabel size="sm"
          barClassName="rounded-none"
          label={`${card.questionIndex} of ${card.totalQuestions} questions answered`}
        />
      ) : null}
    </div>
  );
}

function StartCard({ recommendation }) {
  if (!recommendation) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 shadow-xs">
        <h2 className="text-h3">Ready when you are.</h2>
        <p className="mt-2 max-w-[52ch] text-ink-600">
          Every lesson is open — physics, biology, engineering, space, chemistry, earth
          science. Nothing has to be unlocked.
        </p>
        <Button to="/arena/explore" size="lg" className="mt-5">
          <Compass size={17} aria-hidden="true" /> Browse lessons
        </Button>
      </div>
    );
  }
  const Icon = FORMAT_ICON[recommendation.lesson.format] || Target;
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg border border-blue-200 bg-blue-50 p-6 cb:p-7">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-micro font-semibold uppercase tracking-label text-blue-700">Start here</p>
        <h2 className="mt-1.5 truncate text-h3">{recommendation.lesson.title}</h2>
        <p className="mt-1 text-sm text-ink-600">{recommendation.reason}</p>
      </div>
      <Button to={`/arena/play/${recommendation.lesson.id}`} size="lg" className="shrink-0">
        <Play size={17} aria-hidden="true" /> Start
      </Button>
    </div>
  );
}

const STATE_LABEL = {
  met: { label: 'Target met', tone: 'success' },
  needs_work: { label: 'Below target', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  not_started: { label: 'Not started', tone: 'default' },
};

function AssignmentRow({ item }) {
  const { assignment, lesson, progress, state, threshold, overdue } = item;
  const due = dueLabel(assignment.dueAt);
  const meta = STATE_LABEL[state];
  return (
    <li>
      <div className={cn('flex flex-wrap items-center gap-4 rounded-md border bg-white p-4 shadow-xs',
        overdue ? 'border-[#F5CDCA]' : 'border-line')}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className={cn('text-xs font-medium',
              due.tone === 'danger' ? 'text-danger-700' : due.tone === 'warning' ? 'text-warning-700' : 'text-ink-500')}>
              {due.text}
            </span>
          </div>
          <p className="mt-2 truncate font-display font-semibold text-ink-900">{lesson.title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {assignment.className ? `${assignment.className} · ` : ''}
            Target {threshold}%
            {progress?.bestScore != null ? ` · your best ${Math.round(progress.bestScore)}%` : ''}
          </p>
          {assignment.note ? (
            <p className="mt-1.5 text-xs italic text-ink-600">&ldquo;{assignment.note}&rdquo;</p>
          ) : null}
        </div>
        <Button
          to={`/arena/play/${lesson.id}?assignment=${assignment.id}`}
          size="sm"
          variant={state === 'met' ? 'outline' : 'primary'}
          className="shrink-0"
        >
          {state === 'not_started' ? 'Start' : state === 'in_progress' ? 'Continue' : state === 'met' ? 'Play again' : 'Try again'}
        </Button>
      </div>
    </li>
  );
}

function RecommendationCard({ rec }) {
  const Icon = FORMAT_ICON[rec.lesson.format] || Target;
  return (
    <li>
      <Link
        to={`/arena/play/${rec.lesson.id}`}
        className="cq-panel cq-panel--action flex h-full flex-col p-4 no-underline"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-blue-600">
            <Icon size={13} aria-hidden="true" /> {FORMATS[rec.lesson.format]?.label}
          </span>
          <span className="cq-data text-micro text-ink-500">{minutes(rec.lesson.estMinutes)}</span>
        </div>
        <p className="mt-2.5 font-display font-semibold leading-snug text-ink-900">{rec.lesson.title}</p>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-600">{rec.reason}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
          Play <ArrowRight size={13} aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

function StatusPill({ status }) {
  const map = {
    mastered: { label: 'Mastered', tone: 'success' },
    completed: { label: 'Complete', tone: 'info' },
    in_progress: { label: 'In progress', tone: 'warning' },
    not_started: { label: 'Not started', tone: 'default' },
  };
  const m = map[status] || map.not_started;
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function PassportPanel({ strands }) {
  return (
    <Panel pad="none" lift>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-h4">
          <TrendingUp size={17} aria-hidden="true" className="text-blue-600" />
          Science passport
        </h2>
        <Link to="/arena/progress" className="text-xs font-semibold no-underline">Details</Link>
      </div>
      <ul className="divide-y divide-line">
        {Object.entries(strands).map(([id, s]) => (
          <li key={id} className="px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-pill"
                style={{ background: `var(--cq-strand-${id})` }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{STRAND_NAME[id] || id}</span>
              <MasteryTag level={s.level} pct={s.pct} size="sm" showPct={s.pct != null} />
            </div>
            <div className="mt-2 pl-5">
              <SegmentGauge value={s.pct ?? 0} tone={`strand-${id}`} label={STRAND_NAME[id]} />
              <p className="mt-1 text-micro text-ink-500">
                {s.touchedSkills === 0
                  ? `${s.totalSkills} skills to try`
                  : `${s.pct}% across ${s.touchedSkills} of ${s.totalSkills} skills`}
                {s.mastered ? ` · ${s.mastered} mastered` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-surface-2 px-5 py-3">
        <MasteryLegend compact className="justify-between" />
      </div>
    </Panel>
  );
}

const STRAND_NAME = {
  forces: 'Forces & Energy',
  matter: 'Matter & Waves',
  life: 'Life Science',
  earth: 'Earth & Space',
  build: 'Engineering & Tech',
  method: 'Science Practices',
};

function ActivityPanel({ activity, totals }) {
  const played = activity.some((a) => a.value > 0);
  return (
    <Panel pad="md" lift>
      <h2 className="text-h4">Last two weeks</h2>
      {played ? (
        <ActivityColumns data={activity} label="Lessons finished per day" className="mt-4" />
      ) : (
        <p className="mt-3 text-sm text-ink-500">
          Nothing finished in the last fortnight. There is no streak to lose — start
          whenever you like.
        </p>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
        {[
          ['Questions answered', totals.questionsAnswered],
          ['Accuracy', totals.accuracy != null ? `${totals.accuracy}%` : '—'],
          ['Skills mastered', totals.skillsMastered],
          ['Time on science', duration(totals.seconds)],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="cq-data text-base text-ink-900">{value}</dd>
            <dt className="text-micro text-ink-500">{label}</dt>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function BadgePanel({ achievements }) {
  const earned = achievements.filter((a) => a.earned);
  const next = achievements
    .filter((a) => !a.earned && a.progress && a.progress.have > 0)
    .sort((a, b) => (b.progress.have / b.progress.need) - (a.progress.have / a.progress.need))[0]
    || achievements.find((a) => !a.earned);

  return (
    <Panel pad="md" lift>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4">
          <Award size={17} aria-hidden="true" className="text-warning-600" />
          Badges
        </h2>
        <Link to="/arena/achievements" className="text-xs font-semibold no-underline">All {achievements.length}</Link>
      </div>
      <p className="mt-2 text-sm text-ink-600">
        {earned.length} earned of {achievements.length}
      </p>
      {earned.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {earned.slice(0, 6).map((a) => (
            <li key={a.id}>
              <Badge tone="warning" title={a.description}>{a.name}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      {next ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-xs font-semibold text-ink-900">Closest one: {next.name}</p>
          <p className="mt-0.5 text-xs text-ink-600">{next.description}</p>
          {next.progress ? (
            <>
              <Meter
                value={Math.min(100, (next.progress.have / Math.max(1, next.progress.need)) * 100)}
                showValue={false} hideLabel size="sm" className="mt-2"
                label={`${Math.min(next.progress.have, next.progress.need)} of ${next.progress.need}`}
              />
              <p className="mt-1 text-micro text-ink-500">
                {Math.min(next.progress.have, next.progress.need)} of {next.progress.need}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function ClassPanel({ classes }) {
  return (
    <Panel pad="md" lift>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4">
          <Users size={17} aria-hidden="true" className="text-blue-600" />
          Your classes
        </h2>
        <Link to="/arena/join" className="text-xs font-semibold no-underline">Join</Link>
      </div>
      {classes.length ? (
        <ul className="mt-3 space-y-2.5">
          {classes.map((c) => (
            <li key={c.id} className="rounded-sm border border-line bg-surface-2 px-3.5 py-2.5">
              <p className="text-sm font-medium text-ink-900">{c.name}</p>
              <p className="mt-0.5 text-xs text-ink-500">{c.teacherName} · joined {ago(c.joinedAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-500">
          Not in a class yet. You do not need one — a code just lets a teacher
          see how you are getting on.
        </p>
      )}
    </Panel>
  );
}

function LoadingHome() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-8 h-28 w-full rounded-lg" />
      <div className="mt-10 grid gap-8 cb:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
        <div className="space-y-4">
          {[0, 1].map((i) => <Skeleton key={i} className="h-56 w-full rounded-md" />)}
        </div>
      </div>
      <p className="cq-sr" role="status">Loading your dashboard</p>
    </div>
  );
}
