import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, Info, Compass, Play, HelpCircle, Clock, Target,
} from 'lucide-react';
import {
  Button, Panel, SegmentGauge, MasteryTag, MasteryLegend,
  ActivityColumns, Sparkline, ErrorState, Skeleton, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { MASTERY_RULES } from '@/platform/mastery.js';
import { minutes, duration, ago, plural } from '@/lib/format.js';

/* ============================================================================
   The Science Passport.

   This is the honest version of a progress screen. It does not average
   everything into one number and call it 87%, because that number would be
   flattering and useless. Instead it says, per skill: how much evidence there
   is, across how many sittings, where the student started, where they are now,
   and — if a level is within reach — exactly what is still missing.

   Two data sources on purpose. getSkillDetail() gives the per-skill records;
   its strand rollup only counts skills the student has already touched, so the
   headline figures come from getStudentOverview().strands instead, where
   coverage is measured against every skill a published lesson actually covers.
   ========================================================================= */

export default function StudentProgress() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.getSkillDetail(),
      api.getStudentOverview(),
      api.getCatalog(),
      api.getTimeline(null, 400),
    ])
      .then(([strands, overview, catalog, timeline]) => {
        if (!alive) return;
        setData({ strands, overview, catalog, activity: dailySeries(timeline, 28) });
        /* Open the strand they have done most in, so the page is never a wall
           of collapsed rows on first visit. */
        const best = [...strands]
          .filter((s) => overview.strands[s.strand.id]?.evidence > 0)
          .sort((a, b) => (overview.strands[b.strand.id]?.evidence || 0) - (overview.strands[a.strand.id]?.evidence || 0))[0];
        if (best) setOpen({ [best.strand.id]: true });
      })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load your passport.'); });
    return () => { alive = false; };
  }, [user?.id]);

  const weakest = useMemo(() => {
    if (!data) return [];
    const { overview, catalog } = data;
    return Object.entries(overview.mastery)
      .filter(([, m]) => m.evidence >= 3 && m.pct < MASTERY_RULES.proficientPct)
      .sort((a, b) => a[1].pct - b[1].pct)
      .slice(0, 3)
      .map(([skillId, mastery]) => ({
        skill: catalog.skill(skillId),
        mastery,
        lessons: (catalog.lessonsBySkill.get(skillId) || [])
          .filter((l) => l.status === 'published' && l.difficulty <= 2)
          .slice(0, 2),
      }))
      .filter((r) => r.skill);
  }, [data]);

  if (error) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Meta title="Progress" />
        <ErrorState title="Could not load your passport" detail={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!data) return <LoadingProgress />;

  const { overview, strands, activity, catalog } = data;
  const { totals } = overview;
  const growths = Object.values(overview.mastery).map((m) => m.growth).filter((g) => g != null);
  const growth = growths.length ? Math.round(growths.reduce((a, b) => a + b, 0) / growths.length) : null;
  const anyEvidence = totals.skillsTouched > 0;

  return (
    <>
      <Meta
        title="Progress"
        description="Your Science Passport: skill-by-skill evidence of what you have learned across the six CuriosityQuest strands."
      />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header>
          <p className="text-micro font-semibold uppercase tracking-label text-blue-600">Science passport</p>
          <h1 className="mt-2 text-h1">What you have learned.</h1>
          <p className="mt-2.5 max-w-measure text-ink-600">
            {anyEvidence
              ? `Evidence from ${plural(totals.questionsAnswered, 'question')} across ${plural(totals.skillsTouched, 'skill')}. Nothing here is a grade — it describes where you are, and it changes as you practise.`
              : 'Nothing recorded yet. Play any lesson and this page starts filling in, skill by skill.'}
          </p>
        </header>

        {/* ------------------------------------------------------ headline */}
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 cb:grid-cols-6">
          {[
            { label: 'Strands touched', value: `${totals.strandsTouched}/6`, hint: 'Of the six science strands' },
            { label: 'Skills mastered', value: totals.skillsMastered, hint: `Of ${catalog.skills.length} skills` },
            { label: 'Questions', value: totals.questionsAnswered.toLocaleString(), hint: `${totals.questionsCorrect} right` },
            { label: 'Accuracy', value: totals.accuracy != null ? `${totals.accuracy}%` : '—', hint: 'All questions, all time' },
            { label: 'Time on science', value: duration(totals.seconds), hint: `${plural(totals.lessonsCompleted, 'lesson')} finished` },
            { label: 'Average growth', value: growth != null ? `${growth > 0 ? '+' : ''}${growth} pts` : '—', hint: 'First try to latest try' },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-line bg-white p-4 shadow-xs">
              <dd className="cq-data cq-data--md text-blue-700">{s.value}</dd>
              <dt className="mt-0.5 text-sm font-medium text-ink-800">{s.label}</dt>
              <p className="mt-0.5 text-micro text-ink-500">{s.hint}</p>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 cb:grid-cols-[1.55fr_1fr] cb:gap-12">
          <div className="min-w-0">
            {/* -------------------------------------------- mastery model */}
            <div className="rounded-md border border-line bg-surface-2 p-5">
              <button
                type="button"
                onClick={() => setModelOpen((v) => !v)}
                aria-expanded={modelOpen}
                aria-controls="mastery-model"
                className="flex w-full items-center gap-2 text-left font-display text-h4 font-semibold text-ink-900"
              >
                <HelpCircle size={17} aria-hidden="true" className="shrink-0 text-blue-600" />
                <span className="flex-1">How these levels are worked out</span>
                <ChevronDown size={17} aria-hidden="true" className={cn('shrink-0 text-ink-500 transition-transform duration-1', modelOpen && 'rotate-180')} />
              </button>
              {modelOpen ? (
                <div id="mastery-model" className="mt-4 space-y-3 text-sm text-ink-700">
                  <p>
                    <strong className="font-semibold text-ink-900">Evidence, not luck.</strong>{' '}
                    A skill reaches Mastered only with at least {MASTERY_RULES.masteredEvidence} scored
                    questions, on {MASTERY_RULES.masteredDistinctQuestions} or more different questions,
                    spread over at least {MASTERY_RULES.masteredSessions} separate sittings — and every
                    one of those recent sittings has to be {MASTERY_RULES.masteredRecentFloor}% or better.
                    One lucky perfect round is not enough.
                  </p>
                  <p>
                    <strong className="font-semibold text-ink-900">Replaying the same question does not count twice.</strong>{' '}
                    Only your {MASTERY_RULES.maxRepeatsPerQuestion} most recent answers to any single
                    question are used, so there is nothing to farm here.
                  </p>
                  <p>
                    <strong className="font-semibold text-ink-900">Recent work matters more.</strong>{' '}
                    Older sittings still count, but they weigh less, so improving shows up
                    quickly — and a level you have stopped being able to hit will slide back.
                    Harder questions carry more weight than easy ones.
                  </p>
                  <p>
                    <strong className="font-semibold text-ink-900">A strand needs breadth too.</strong>{' '}
                    A whole strand only reads Proficient once you have evidence in at least
                    half its skills, and Mastered at {Math.round(MASTERY_RULES.strandMasteredCoverage * 100)}%.
                    Scoring well on two skills out of twelve is not the same as knowing the strand.
                  </p>
                  <p className="text-ink-600">
                    None of this locks anything. It is a description of where you are, and every
                    lesson stays open whatever it says.
                  </p>
                </div>
              ) : null}
            </div>

            {/* ------------------------------------------------- strands */}
            <section className="mt-8" aria-labelledby="strands-h">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="strands-h" className="text-h3">The six strands</h2>
                <MasteryLegend compact className="text-micro" />
              </div>
              <div className="mt-4 space-y-3">
                {strands.map((entry) => (
                  <StrandSection
                    key={entry.strand.id}
                    entry={entry}
                    rollup={overview.strands[entry.strand.id]}
                    open={!!open[entry.strand.id]}
                    onToggle={() => setOpen((o) => ({ ...o, [entry.strand.id]: !o[entry.strand.id] }))}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* ------------------------------------------------------ aside */}
          <aside className="min-w-0 space-y-8">
            <Panel pad="md" lift>
              <h2 className="flex items-center gap-2 text-h4">
                <Clock size={17} aria-hidden="true" className="text-blue-600" />
                Last four weeks
              </h2>
              {activity.some((a) => a.value > 0) ? (
                <ActivityColumns data={activity} label="Lessons finished per day" height={84} className="mt-4" />
              ) : (
                <p className="mt-3 text-sm text-ink-500">
                  Nothing finished in the last four weeks. There is no streak here to keep
                  alive — pick something up whenever you want to.
                </p>
              )}
              <p className="mt-4 max-w-none border-t border-line pt-3 text-xs text-ink-500">
                Last played {overview.recent[0] ? ago(overview.recent[0].at) : 'never'}.
              </p>
            </Panel>

            <Panel pad="md" lift>
              <h2 className="flex items-center gap-2 text-h4">
                <Target size={17} aria-hidden="true" className="text-orange-600" />
                Worth another look
              </h2>
              {weakest.length ? (
                <>
                  <p className="mt-1.5 text-sm text-ink-600">
                    Your three lowest skills that have enough evidence to judge fairly.
                  </p>
                  <ul className="mt-4 space-y-4">
                    {weakest.map(({ skill, mastery, lessons }) => (
                      <li key={skill.id} className="border-t border-line pt-3.5 first:border-0 first:pt-0">
                        <p className="text-sm font-semibold text-ink-900">{skill.name}</p>
                        <div className="mt-1.5">
                          <MasteryTag level={mastery.level} pct={mastery.pct} size="sm" />
                        </div>
                        {lessons.length ? (
                          <ul className="mt-2.5 space-y-1.5">
                            {lessons.map((l) => (
                              <li key={l.id}>
                                <Link to={`/arena/lesson/${l.id}`}
                                  className="inline-flex items-start gap-1.5 text-xs font-medium no-underline hover:underline">
                                  <Play size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
                                  <span>{l.title} <span className="cq-data text-ink-500">{minutes(l.estMinutes)}</span></span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-ink-500">No easier lesson covers this one yet.</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-600">
                  {anyEvidence
                    ? 'Nothing is standing out as weak. Suggestions appear here once a skill has at least three answers behind it.'
                    : 'Play a few lessons and this fills with the skills most worth revisiting.'}
                </p>
              )}
            </Panel>

            <Panel pad="md" lift>
              <h2 className="text-h4">Where to next</h2>
              <p className="mt-1.5 text-sm text-ink-600">
                All {totals.catalogSize} lessons are open. Filtering by &ldquo;not tried yet&rdquo;
                is the fastest way to widen a strand.
              </p>
              <Button to="/arena/explore" variant="outline" block className="mt-4">
                <Compass size={16} aria-hidden="true" /> Explore lessons
              </Button>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fragments --- */

function StrandSection({ entry, rollup, open, onToggle }) {
  const { strand, skills } = entry;
  const roll = rollup || { level: 'not_started', pct: null, touchedSkills: 0, totalSkills: skills.length, mastered: 0 };
  const panelId = `strand-panel-${strand.id}`;
  const teachable = skills.filter((s) => s.lessonCount > 0);

  return (
    <div className="overflow-hidden rounded-md border border-line bg-white shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full min-h-[2.75rem] items-center gap-3.5 p-4 text-left hover:bg-blue-50/40"
      >
        <span aria-hidden="true" className="h-9 w-1.5 shrink-0 rounded-pill"
          style={{ background: `var(--cq-strand-${strand.id})` }} />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-h4 font-semibold text-ink-900">{strand.name}</span>
          <span className="mt-1 block text-xs text-ink-500">
            {roll.touchedSkills === 0
              ? `${plural(teachable.length, 'skill')} waiting — nothing tried yet`
              : `${roll.touchedSkills} of ${roll.totalSkills} skills with evidence · ${roll.mastered || 0} mastered`}
          </span>
        </span>
        <span className="hidden w-40 shrink-0 sm:block">
          <SegmentGauge value={roll.pct ?? 0} tone={`strand-${strand.id}`} label={strand.name} />
        </span>
        <MasteryTag level={roll.level} pct={roll.pct} size="sm" showPct={roll.pct != null} className="shrink-0" />
        <ChevronDown size={18} aria-hidden="true"
          className={cn('shrink-0 text-ink-500 transition-transform duration-1', open && 'rotate-180')} />
      </button>

      {open ? (
        <div id={panelId} className="border-t border-line">
          <p className="bg-surface-2 px-4 py-2.5 text-xs text-ink-600">
            {strand.blurb}
          </p>
          <ul className="divide-y divide-line">
            {skills.map((s) => <SkillRow key={s.skill.id} row={s} />)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SkillRow({ row }) {
  const { skill, mastery, lessonCount } = row;
  const m = mastery;
  const hasTrend = !!m && m.sessions >= 2;

  return (
    <li className="grid gap-3 px-4 py-3.5 cb:grid-cols-[1.4fr_auto_9rem] cb:items-center">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{skill.name}</p>
        <p className="mt-0.5 text-micro text-ink-500">
          {m && m.evidence > 0
            ? `${plural(m.evidence, 'answer')} over ${plural(m.sessions, 'sitting')} · ${m.correct} right`
            : `${plural(lessonCount, 'lesson')} practise this`}
        </p>
        {m ? <NeedsNote mastery={m} /> : null}
      </div>

      <div className="cb:justify-self-end">
        <MasteryTag level={m?.level || 'not_started'} pct={m?.pct} size="sm" showPct={!!m && m.evidence > 0} />
      </div>

      <div className="min-w-0">
        {hasTrend ? (
          <Sparkline
            points={[m.firstPct, m.latestPct]}
            label={`${skill.name} first to latest`}
            height={30}
          />
        ) : m && m.evidence > 0 ? (
          <p className="text-micro text-ink-500">
            One sitting so far — {Math.round(m.latestPct)}%.
          </p>
        ) : (
          <p className="text-micro text-ink-500">No evidence yet</p>
        )}
      </div>
    </li>
  );
}

/** Says exactly what is missing, rather than leaving the next level a mystery. */
function NeedsNote({ mastery }) {
  const bits = [];
  if (mastery.needsEvidence > 0) bits.push(plural(mastery.needsEvidence, 'more question'));
  if (mastery.needsSessions > 0) bits.push(plural(mastery.needsSessions, 'more sitting'));
  if (!bits.length) return null;
  return (
    <p className="mt-1 inline-flex items-start gap-1.5 text-micro text-blue-700">
      <Info size={11} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{bits.join(' and ')} to confirm the next level</span>
    </p>
  );
}

/** Daily completions for the last n days, built from the event timeline. */
function dailySeries(events, days) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const buckets = [];
  const index = new Map();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    index.set(key, buckets.length);
    buckets.push({
      key,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      short: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      value: 0,
    });
  }
  for (const e of events || []) {
    if (e.type !== 'lesson_completed' || !e.createdAt) continue;
    const i = index.get(String(e.createdAt).slice(0, 10));
    if (i != null) buckets[i].value += 1;
  }
  return buckets;
}

function LoadingProgress() {
  return (
    <div className="cq-container cq-container--wide py-10">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-3 h-9 w-72" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3 cb:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
      </div>
      <div className="mt-10 grid gap-10 cb:grid-cols-[1.55fr_1fr]">
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
        </div>
        <div className="space-y-6">
          {[0, 1].map((i) => <Skeleton key={i} className="h-52 w-full rounded-md" />)}
        </div>
      </div>
      <p className="cq-sr" role="status">Loading your science passport</p>
    </div>
  );
}
