import React, { useEffect, useMemo, useState } from 'react';
import {
  Award, Flag, FlaskConical, Target, TrendingUp, Compass, Wrench, Swords,
  Trophy, Terminal, BookOpen, Map, Layers, Check, Play,
} from 'lucide-react';
import {
  Button, Badge, Panel, Meter, Callout, EmptyState, ErrorState, Skeleton, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { RANKS, rankForXp, nextRank } from '@/platform/mastery.js';
import { longDate, plural } from '@/lib/format.js';

/* ============================================================================
   Badges and ranks.

   Every badge on this page is attached to something a student actually did:
   finished lessons, correct answers, skills mastered, a score improved,
   breadth across the strands. There is deliberately nothing for logging in,
   nothing for a streak, and nothing for time spent — those reward turning up,
   not learning, and a child who is ill for a week should not lose anything.

   That claim is made out loud in the copy, because it is a promise about how
   the product treats them rather than a detail of the implementation.
   ========================================================================= */

const BADGE_ICON = {
  flag: Flag, flask: FlaskConical, target: Target, award: Award, trending: TrendingUp,
  compass: Compass, wrench: Wrench, swords: Swords, trophy: Trophy, terminal: Terminal,
  book: BookOpen, map: Map, layers: Layers,
};

const CATEGORY = {
  starting: { label: 'Getting going', blurb: 'The first steps.' },
  practice: { label: 'Practice', blurb: 'Answering questions, right, over and over.' },
  mastery: { label: 'Mastery', blurb: 'Skills held across several sittings.' },
  breadth: { label: 'Breadth', blurb: 'Covering more than one corner of science.' },
  'hands-on': { label: 'Hands-on', blurb: 'Real experiments with real materials.' },
  arena: { label: 'Arena', blurb: 'Battles won by answering correctly.' },
  growth: { label: 'Growth', blurb: 'Coming back and doing better.' },
};

const CATEGORY_ORDER = ['starting', 'practice', 'mastery', 'breadth', 'hands-on', 'arena', 'growth'];

export default function StudentBadges() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getStudentOverview()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load your badges.'); });
    return () => { alive = false; };
  }, [user?.id]);

  const groups = useMemo(() => {
    if (!data) return { earned: [], pending: [] };
    const earned = data.achievements.filter((a) => a.earned)
      .sort((a, b) => new Date(b.earnedAt || 0) - new Date(a.earnedAt || 0));
    const pending = data.achievements.filter((a) => !a.earned)
      .sort((a, b) => share(b) - share(a));
    return { earned, pending };
  }, [data]);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Meta title="Badges" />
        <ErrorState title="Could not load your badges" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!data) return <LoadingBadges />;

  const { earned, pending } = groups;
  const xp = data.profile.xpTotal || 0;
  const rank = rankForXp(xp);
  const next = nextRank(xp);
  const earnedXp = earned.reduce((n, a) => n + (a.xp || 0), 0);

  return (
    <>
      <Meta
        title="Badges"
        description="Badges you have earned on CuriosityQuest, and how close you are to the next ones. Earned by learning, never by logging in."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-micro font-semibold uppercase tracking-label text-blue-600">{rank.title}</p>
            <h1 className="mt-2 text-h1">Badges and rank.</h1>
            <p className="mt-2.5 max-w-measure text-ink-600">
              {earned.length
                ? `${earned.length} of ${data.achievements.length} earned, worth ${earnedXp.toLocaleString()} discovery points of your total.`
                : `None earned yet — there are ${data.achievements.length} to find, and the first one only needs a single finished lesson.`}
            </p>
          </div>
          <div className="w-full max-w-xs rounded-md border border-line bg-white p-4 shadow-xs">
            <div className="flex items-baseline justify-between gap-3">
              <span className="cq-data cq-data--lg text-blue-700">{xp.toLocaleString()}</span>
              <span className="text-xs text-ink-500">discovery points</span>
            </div>
            <Meter
              value={next ? ((xp - rank.minXp) / (next.minXp - rank.minXp)) * 100 : 100}
              showValue={false} hideLabel size="sm" className="mt-3"
              label={`Progress to ${next?.title || 'the top rank'}`}
            />
            <p className="mt-2 text-xs text-ink-500">
              {next
                ? `${(next.minXp - xp).toLocaleString()} points to ${next.title}`
                : 'Top rank reached. Nothing left to climb.'}
            </p>
          </div>
        </header>

        <Callout tone="note" title="Where badges come from" className="mt-7 max-w-measure">
          Every badge here is for something you did with the science: lessons finished,
          questions answered correctly, skills held across more than one sitting, a score
          you came back and improved. There are no badges for logging in, no daily check-in
          rewards and no streaks to protect — take a fortnight off and you lose nothing.
        </Callout>

        <div className="mt-10 grid gap-10 cb:grid-cols-[1.5fr_1fr] cb:gap-12">
          <div className="min-w-0 space-y-10">
            {/* ---------------------------------------------------- earned */}
            <section aria-labelledby="earned-h">
              <SectionHead
                id="earned-h"
                icon={Award}
                title="Earned"
                sub={earned.length ? `${plural(earned.length, 'badge')}, newest first` : null}
              />
              {earned.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  compact
                  icon={Play}
                  title="No badges yet"
                  action={<Button to="/arena/explore" variant="primary" size="sm">Find a lesson</Button>}
                >
                  Finish any lesson and &ldquo;First Mission&rdquo; is yours. Nothing here needs
                  to be bought, unlocked or waited for.
                </EmptyState>
              ) : (
                <ByCategory items={earned} render={(a) => <EarnedCard key={a.id} badge={a} />} />
              )}
            </section>

            {/* ----------------------------------------------- in progress */}
            {pending.length ? (
              <section aria-labelledby="pending-h">
                <SectionHead
                  id="pending-h"
                  icon={Target}
                  title="Still to find"
                  sub={`${plural(pending.length, 'badge')} — closest first`}
                />
                <ByCategory items={pending} render={(a) => <PendingCard key={a.id} badge={a} />} />
              </section>
            ) : (
              <Callout tone="success" title="Every badge earned">
                All {data.achievements.length} of them. There is nothing left on this page to chase.
              </Callout>
            )}
          </div>

          {/* --------------------------------------------------- rank ladder */}
          <aside className="min-w-0">
            <Panel pad="none" lift>
              <div className="border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 text-h4">
                  <TrendingUp size={17} aria-hidden="true" className="text-blue-600" />
                  The rank ladder
                </h2>
                <p className="mt-1 text-xs text-ink-600">
                  Points come from finishing lessons, mastering skills and improving scores.
                </p>
              </div>
              <ol className="divide-y divide-line">
                {RANKS.map((r) => {
                  const reached = xp >= r.minXp;
                  const current = r.level === rank.level;
                  return (
                    <li key={r.level} className={cn('flex items-center gap-3 px-5 py-3', current && 'bg-blue-50')}>
                      <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-pill text-[0.6875rem] font-bold',
                        current ? 'bg-blue-600 text-white'
                        : reached ? 'bg-success-500 text-white' : 'bg-ink-100 text-ink-500')}>
                        {reached && !current ? <Check size={12} aria-hidden="true" /> : r.level}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-sm', current ? 'font-semibold text-ink-900' : 'text-ink-800')}>
                          {r.title}
                        </span>
                        <span className="cq-data block text-micro text-ink-500">
                          {r.minXp.toLocaleString()} points
                        </span>
                      </span>
                      {current ? <Badge tone="info">You are here</Badge> : null}
                    </li>
                  );
                })}
              </ol>
              <p className="max-w-none border-t border-line bg-surface-2 px-5 py-3 text-micro text-ink-600">
                Ranks are a nickname for your points total, nothing more. They do not change
                what you can play — every lesson is open at every rank.
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

const share = (a) => (a.progress && a.progress.need ? Math.min(1, a.progress.have / a.progress.need) : 0);

function SectionHead({ id, icon: Icon, title, sub }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <h2 id={id} className="flex items-center gap-2 text-h3">
          <Icon size={19} aria-hidden="true" className="text-blue-600" />
          {title}
        </h2>
        {sub ? <p className="mt-1 text-sm text-ink-500">{sub}</p> : null}
      </div>
    </div>
  );
}

/** Groups a badge list by category, in a fixed order so the page never jumps. */
function ByCategory({ items, render }) {
  const grouped = CATEGORY_ORDER
    .map((key) => ({ key, meta: CATEGORY[key], items: items.filter((a) => a.category === key) }))
    .filter((g) => g.items.length);
  const other = items.filter((a) => !CATEGORY_ORDER.includes(a.category));
  if (other.length) grouped.push({ key: 'other', meta: { label: 'Other', blurb: '' }, items: other });

  return (
    <div className="mt-5 space-y-7">
      {grouped.map((g) => (
        <div key={g.key}>
          <div className="flex flex-wrap items-baseline gap-x-2.5">
            <h3 className="text-micro font-semibold uppercase tracking-label text-ink-600">{g.meta.label}</h3>
            <p className="text-xs text-ink-500">{g.meta.blurb}</p>
          </div>
          {/* One column at Chromebook width — two 260px cards side by side
              wrapped every badge name onto three lines. */}
          <ul className="mt-3 grid gap-3 xl:grid-cols-2">
            {g.items.map(render)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EarnedCard({ badge }) {
  const Icon = BADGE_ICON[badge.icon] || Award;
  return (
    <li className="flex gap-3.5 rounded-md border border-[#EDD9A8] bg-warning-50 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-orange-500 text-white">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-display font-semibold text-ink-900">{badge.name}</p>
        <p className="mt-0.5 text-xs text-ink-700">{badge.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-ink-600">
          <Check size={11} aria-hidden="true" className="text-success-600" />
          <span>Earned {badge.earnedAt ? longDate(badge.earnedAt) : 'earlier'}</span>
          {badge.xp ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="cq-data">+{badge.xp} points</span>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}

function PendingCard({ badge }) {
  const Icon = BADGE_ICON[badge.icon] || Award;
  const p = badge.progress;
  /* Progress facts can run past the requirement (25 experiments done, badge
     needed 10) so both the bar and the caption are clamped to the target. */
  const have = p ? Math.min(p.have, p.need) : null;
  const value = p && p.need ? Math.min(100, (p.have / p.need) * 100) : 0;

  return (
    <li className="flex gap-3.5 rounded-md border border-line bg-white p-4 shadow-xs">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line bg-surface-2 text-ink-500">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-ink-900">{badge.name}</p>
        <p className="mt-0.5 text-xs text-ink-600">{badge.description}</p>
        {p ? (
          <div className="mt-2.5">
            <Meter value={value} showValue={false} hideLabel size="sm"
              label={`${badge.name}: ${have} of ${p.need}`} />
            <p className="mt-1 text-micro text-ink-600">
              <span className="cq-data text-ink-900">{have}</span> of{' '}
              <span className="cq-data">{p.need}</span>
              {p.need - have > 0 ? ` · ${p.need - have} to go` : ' · nearly there'}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-micro text-ink-500">
            Keep playing — this one is awarded the moment you meet it.
          </p>
        )}
      </div>
      {badge.xp ? <span className="cq-data shrink-0 text-micro text-ink-500">+{badge.xp}</span> : null}
    </li>
  );
}

function LoadingBadges() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-64" />
      <Skeleton className="mt-7 h-20 w-full max-w-measure rounded-md" />
      <div className="mt-10 grid gap-10 cb:grid-cols-[1.5fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-md" />
      </div>
      <p className="cq-sr" role="status">Loading your badges</p>
    </div>
  );
}
