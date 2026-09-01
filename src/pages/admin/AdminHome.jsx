import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Lightbulb, Plus, AlertTriangle, Settings, Database, FileWarning, Check,
} from 'lucide-react';
import {
  Button, Badge, Panel, Meter, Callout, ErrorState, Skeleton, RankedBars, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { FORMATS } from '@/content/index.js';
import { plural } from '@/lib/format.js';
import { MASTERY_RULES } from '@/platform/mastery.js';

/* ============================================================================
   Admin overview.

   This is a diagnostics screen, not a vanity dashboard. It exists to surface
   the two content problems that actually degrade the product:

     · a skill no lesson covers — students can never build evidence for it;
     · a skill with too few questions — the mastery model needs several
       distinct questions across sittings, so a thin skill can never reach
       Mastered no matter how well a student does.

   Both are stated with their consequence attached, because "3 skills have
   fewer than 3 questions" means nothing on its own.
   ========================================================================= */

export default function AdminHome() {
  const { backend, isLocal } = useAuth();
  const [state, setState] = useState({ catalog: null, bank: null, err: null, overrides: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [catalog, bank] = await Promise.all([
          api.getCatalog(),
          import('@/content/bank.json').then((m) => m.default),
        ]);
        let overrides = 0;
        try { overrides = Object.keys(JSON.parse(await api.exportOverrides())).length; } catch { /* none */ }
        if (alive) setState({ catalog, bank, err: null, overrides });
      } catch (err) {
        if (alive) setState({ catalog: null, bank: null, err, overrides: 0 });
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const { catalog, bank } = state;
    if (!catalog || !bank) return null;

    const questionsBySkill = {};
    for (const q of Object.values(bank.questions)) {
      if (q.skillId) questionsBySkill[q.skillId] = (questionsBySkill[q.skillId] || 0) + 1;
    }

    const skills = catalog.skills.map((s) => ({
      ...s,
      lessons: (catalog.lessonsBySkill.get(s.id) || []).length,
      questions: questionsBySkill[s.id] || 0,
    }));

    const byFormat = {};
    const byStatus = {};
    const byStrand = {};
    for (const l of catalog.lessons) {
      byFormat[l.format] = (byFormat[l.format] || 0) + 1;
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      if (l.strandId) byStrand[l.strandId] = (byStrand[l.strandId] || 0) + 1;
    }

    return {
      lessons: catalog.lessons.length,
      questions: Object.keys(bank.questions).length,
      activities: bank.activities.length,
      skills: skills.length,
      byFormat, byStatus, byStrand,
      uncovered: skills.filter((s) => s.lessons === 0),
      thin: skills.filter((s) => s.lessons > 0 && s.questions > 0 && s.questions < 3),
      noQuestions: skills.filter((s) => s.lessons > 0 && s.questions === 0),
      strands: catalog.strands,
    };
  }, [state]);

  if (state.err) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load the catalog" detail={state.err.message} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 grid gap-4 cb:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
        </div>
        <Skeleton className="mt-8 h-80 w-full rounded-md" />
        <p className="cq-sr" role="status">Loading catalog</p>
      </div>
    );
  }

  return (
    <>
      <Meta title="Content admin" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Content</h1>
            <p className="mt-2.5 text-ink-600">
              {plural(stats.lessons, 'lesson')} · {plural(stats.questions, 'question')} ·{' '}
              {plural(stats.skills, 'skill')} · {plural(stats.activities, 'activity', 'activities')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button to="/arena/admin/lessons" variant="primary">
              <BookOpen size={16} aria-hidden="true" /> Manage lessons
            </Button>
            <Button to="/arena/admin/skills" variant="outline">
              <Lightbulb size={16} aria-hidden="true" /> Skills
            </Button>
          </div>
        </header>

        {/* Where content lives right now — the thing an admin most needs to
            understand before they start editing. */}
        <Callout
          tone={isLocal ? 'warning' : 'info'}
          title={isLocal ? 'Edits are local to this browser' : `Connected to the ${backend} backend`}
          className="mt-7"
        >
          {isLocal ? (
            <>
              The catalog that ships with the build is read-only. Anything you create or
              edit here is stored as an override in this browser&rsquo;s storage.{' '}
              {stats && state.overrides > 0
                ? <><strong>{plural(state.overrides, 'lesson')}</strong> currently ha{state.overrides === 1 ? 's' : 've'} unsaved local edits. </>
                : 'There are no local edits yet. '}
              Export them from{' '}
              <Link to="/arena/admin/content" className="font-semibold">the export page</Link>{' '}
              and commit the JSON to make them permanent for everyone.
            </>
          ) : (
            <>Lessons, activities and questions are stored in the database and are live for
              everyone as soon as you publish them.</>
          )}
        </Callout>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 cb:grid-cols-4">
          {[
            { label: 'Published', value: stats.byStatus.published || 0, hint: 'Visible to students' },
            { label: 'Drafts', value: stats.byStatus.draft || 0, hint: 'Only visible to admins' },
            { label: 'Archived', value: stats.byStatus.archived || 0, hint: 'Hidden, history kept' },
            { label: 'Local edits', value: state.overrides, hint: isLocal ? 'Not yet committed' : 'n/a on this backend' },
          ].map((s) => (
            <div key={s.label} className="rounded-md border border-line bg-white p-4 shadow-xs">
              <dd className="cq-data cq-data--md text-blue-700">{s.value}</dd>
              <dt className="mt-0.5 text-sm font-medium text-ink-800">{s.label}</dt>
              <p className="mt-0.5 text-micro text-ink-500">{s.hint}</p>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-8 cb:grid-cols-[1fr_1fr]">
          <Panel pad="md" lift>
            <h2 className="text-h4">Lessons by format</h2>
            <RankedBars
              className="mt-4"
              suffix=""
              max={Math.max(...Object.values(stats.byFormat))}
              rows={Object.entries(stats.byFormat).map(([k, v]) => ({
                key: k, label: FORMATS[k]?.label || k, value: v,
                hint: FORMATS[k]?.blurb,
              }))}
            />
          </Panel>

          <Panel pad="md" lift>
            <h2 className="text-h4">Lessons by strand</h2>
            <RankedBars
              className="mt-4"
              suffix=""
              max={Math.max(...Object.values(stats.byStrand))}
              rows={stats.strands.map((s) => ({
                key: s.id, label: s.name, value: stats.byStrand[s.id] || 0,
                swatch: `var(--cq-strand-${s.id})`,
              }))}
            />
          </Panel>
        </div>

        {/* Content gaps, with the consequence spelled out. */}
        <section className="mt-10" aria-labelledby="gaps-h">
          <h2 id="gaps-h" className="flex items-center gap-2 text-h3">
            <FileWarning size={19} aria-hidden="true" className="text-warning-600" />
            Content gaps worth fixing
          </h2>

          <div className="mt-5 space-y-4">
            <GapCard
              tone={stats.uncovered.length ? 'warning' : 'ok'}
              title={stats.uncovered.length
                ? `${plural(stats.uncovered.length, 'skill')} no lesson covers`
                : 'Every skill is covered by at least one lesson'}
              consequence="A skill with no lessons can never accumulate evidence, so it sits at Not started forever and quietly drags down its strand's coverage figure."
              items={stats.uncovered}
              render={(s) => `${s.name} (${s.strandId})`}
            />

            <GapCard
              tone={stats.noQuestions.length ? 'warning' : 'ok'}
              title={stats.noQuestions.length
                ? `${plural(stats.noQuestions.length, 'skill')} attached to lessons but with no questions`
                : 'Every covered skill has questions behind it'}
              consequence="These skills are tagged on lessons that never ask a scored question about them — usually hands-on or reading lessons. They record activity but generate no mastery evidence."
              items={stats.noQuestions}
              render={(s) => `${s.name} — ${plural(s.lessons, 'lesson')}`}
            />

            <GapCard
              tone={stats.thin.length ? 'info' : 'ok'}
              title={stats.thin.length
                ? `${plural(stats.thin.length, 'skill')} with fewer than 3 questions`
                : 'No skill is short of questions'}
              consequence={`Mastered needs ${MASTERY_RULES.masteredEvidence} pieces of evidence from at least ${MASTERY_RULES.masteredDistinctQuestions} distinct questions across ${MASTERY_RULES.masteredSessions} sittings — and only the ${MASTERY_RULES.maxRepeatsPerQuestion} most recent answers to any single question count. A skill with two questions therefore caps out at Proficient however well a student does. Writing four more questions for each of these unlocks Mastered for them.`}
              items={stats.thin}
              render={(s) => `${s.name} — ${plural(s.questions, 'question')}`}
            />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-8">
          <Button to="/arena/admin/lessons" variant="primary">
            <Plus size={16} aria-hidden="true" /> Create a lesson
          </Button>
          <Button to="/arena/admin/content" variant="outline">
            <Settings size={16} aria-hidden="true" /> Export local edits
          </Button>
          <Button to="/arena/explore" variant="ghost">See the student view</Button>
        </div>
      </div>
    </>
  );
}

function GapCard({ tone, title, consequence, items, render }) {
  const ok = tone === 'ok';
  return (
    <div className={cn('rounded-lg border p-5',
      ok ? 'border-[#C7EBDD] bg-success-50'
        : tone === 'warning' ? 'border-[#F1DEB0] bg-warning-50' : 'border-blue-100 bg-blue-50')}>
      <p className="flex items-start gap-2.5 font-display font-semibold text-ink-900">
        {ok
          ? <Check size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-success-600" />
          : <AlertTriangle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-warning-600" />}
        {title}
      </p>
      <p className="mt-2 max-w-[80ch] text-sm text-ink-700">{consequence}</p>
      {items.length ? (
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {items.map((s) => (
            <li key={s.id}>
              <Badge>{render(s)}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
