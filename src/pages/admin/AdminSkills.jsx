import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, Check, Search, FileCode2, Terminal } from 'lucide-react';
import {
  Button, Badge, Panel, Input, Callout, ErrorState, Skeleton, Meter, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { plural } from '@/lib/format.js';
import { MASTERY_RULES } from '@/platform/mastery.js';

/* ============================================================================
   Skill taxonomy.

   Read-and-diagnose, deliberately not an editor.

   The taxonomy is generated: `scripts/taxonomy.mjs` defines six strands, the
   sixteen topics from the original question bank, and forty-eight skills with
   explicit ordered keyword rules that assign every question to exactly one
   skill. `scripts/build-content.mjs` asserts at build time that no question
   falls through, so a new question can never land in an untracked bucket.

   Putting an "edit skill" button here would be a lie: the rules live in a file
   that has to be re-run, and pretending otherwise would let someone make an
   edit that silently vanished on the next deploy. So this screen shows the
   taxonomy, shows where it is thin, and says exactly which file to change.
   ========================================================================= */

export default function AdminSkills() {
  const [state, setState] = useState({ catalog: null, bank: null, err: null });
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([api.getCatalog(), import('@/content/bank.json').then((m) => m.default)])
      .then(([catalog, bank]) => { if (alive) setState({ catalog, bank, err: null }); })
      .catch((err) => { if (alive) setState({ catalog: null, bank: null, err }); });
    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    const { catalog, bank } = state;
    if (!catalog || !bank) return null;

    const questionsBySkill = {};
    for (const x of Object.values(bank.questions)) {
      if (x.skillId) (questionsBySkill[x.skillId] ||= []).push(x);
    }
    const needle = q.trim().toLowerCase();

    return catalog.strands.map((strand) => {
      const skills = (catalog.skillsByStrand.get(strand.id) || [])
        .map((s) => {
          const qs = questionsBySkill[s.id] || [];
          return {
            ...s,
            lessons: (catalog.lessonsBySkill.get(s.id) || []),
            questions: qs.length,
            byLevel: [1, 2, 3].map((d) => qs.filter((x) => x.difficulty === d).length),
          };
        })
        .filter((s) => !needle || `${s.name} ${s.blurb} ${s.topic || ''}`.toLowerCase().includes(needle));
      return { strand, skills };
    }).filter((g) => g.skills.length);
  }, [state, q]);

  if (state.err) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load the taxonomy" detail={state.err.message} onRetry={() => window.location.reload()} />
      </div>
    );
  }
  if (!grouped) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-md" />)}</div>
        <p className="cq-sr" role="status">Loading skills</p>
      </div>
    );
  }

  const all = grouped.flatMap((g) => g.skills);
  const thin = all.filter((s) => s.lessons.length > 0 && s.questions > 0 && s.questions < 3);
  const uncovered = all.filter((s) => s.lessons.length === 0);

  return (
    <>
      <Meta title="Skills" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Skills</h1>
            <p className="mt-2.5 max-w-[70ch] text-ink-600">
              Six strands, {all.length} skills. Skills are the spine of the learning
              record: lessons come and go, but a skill accumulates evidence from every
              lesson that touches it.
            </p>
          </div>
          <Input label="Filter" className="w-full max-w-xs" placeholder="friction, cells…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </header>

        <Callout tone="info" title="This screen is read-only, on purpose" className="mt-7" icon={FileCode2}>
          The taxonomy is generated from <code>scripts/taxonomy.mjs</code>, which holds the
          strand list, the sixteen source topics and an ordered set of keyword rules that
          assign every question to exactly one skill. <code>scripts/build-content.mjs</code>{' '}
          asserts that nothing falls through, so a new question cannot silently land in an
          untracked bucket. To change a skill, split one, or re-route a question, edit that
          file and run <code>npm run content</code> — then commit the regenerated catalog.
          A button here that appeared to edit it would just lose your work on the next deploy.
        </Callout>

        {(thin.length || uncovered.length) ? (
          <div className="mt-6 grid gap-4 cb:grid-cols-2">
            {uncovered.length ? (
              <div className="rounded-md border border-[#F1DEB0] bg-warning-50 p-5">
                <p className="flex items-center gap-2 font-display font-semibold">
                  <AlertTriangle size={16} aria-hidden="true" className="text-warning-600" />
                  {plural(uncovered.length, 'skill')} no lesson covers
                </p>
                <p className="mt-1.5 text-sm text-ink-700">
                  These can never gather evidence, so they sit at Not started and reduce
                  their strand&rsquo;s coverage figure for every student.
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {uncovered.map((s) => <li key={s.id}><Badge>{s.name}</Badge></li>)}
                </ul>
              </div>
            ) : null}
            {thin.length ? (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-5">
                <p className="flex items-center gap-2 font-display font-semibold">
                  <AlertTriangle size={16} aria-hidden="true" className="text-blue-600" />
                  {plural(thin.length, 'skill')} with fewer than 3 questions
                </p>
                <p className="mt-1.5 text-sm text-ink-700">
                  Mastered needs {MASTERY_RULES.masteredEvidence} pieces of evidence from at
                  least {MASTERY_RULES.masteredDistinctQuestions} distinct questions, and only
                  the {MASTERY_RULES.maxRepeatsPerQuestion} most recent answers to any single
                  question count. These skills therefore cap at Proficient.
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {thin.map((s) => <li key={s.id}><Badge>{s.name} · {s.questions}q</Badge></li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 space-y-10">
          {grouped.map(({ strand, skills }) => (
            <section key={strand.id} aria-labelledby={`strand-${strand.id}`}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`strand-${strand.id}`} className="flex items-center gap-2.5 text-h3">
                    <span aria-hidden="true" className="h-3 w-3 rounded-pill"
                      style={{ background: `var(--cq-strand-${strand.id})` }} />
                    {strand.name}
                  </h2>
                  <p className="mt-1 max-w-[70ch] text-sm text-ink-600">{strand.blurb}</p>
                </div>
                <p className="text-sm text-ink-500">
                  {plural(skills.length, 'skill')} ·{' '}
                  {plural(skills.reduce((n, s) => n + s.questions, 0), 'question')}
                </p>
              </div>

              <ul className="mt-4 grid gap-3 cb:grid-cols-2">
                {skills.map((s) => (
                  <li key={s.id}>
                    <Panel pad="md" className="h-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-ink-900">{s.name}</h3>
                          <p className="mt-0.5 text-micro text-ink-500">
                            <code>{s.id}</code>
                            {s.topic ? ` · from “${s.topic}”` : ' · authored'}
                          </p>
                        </div>
                        {s.lessons.length === 0 ? (
                          <Badge tone="warning">No lessons</Badge>
                        ) : s.questions === 0 ? (
                          <Badge tone="info">No questions</Badge>
                        ) : s.questions < 3 ? (
                          <Badge tone="info">Thin</Badge>
                        ) : (
                          <Badge tone="success" icon={Check}>OK</Badge>
                        )}
                      </div>

                      <p className="mt-2.5 text-sm text-ink-600">{s.blurb}</p>

                      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5">
                        <div>
                          <dd className="cq-data text-base text-ink-900">{s.lessons.length}</dd>
                          <dt className="text-micro text-ink-500">lessons</dt>
                        </div>
                        <div>
                          <dd className="cq-data text-base text-ink-900">{s.questions}</dd>
                          <dt className="text-micro text-ink-500">
                            questions {s.questions ? `(${s.byLevel.join('/')} by level)` : ''}
                          </dt>
                        </div>
                      </dl>

                      {s.lessons.length ? (
                        <details className="mt-3.5">
                          <summary className="cursor-pointer text-xs font-semibold text-blue-600">
                            Lessons covering this
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {s.lessons.slice(0, 8).map((l) => (
                              <li key={l.id}>
                                <Link to={`/arena/admin/lessons/${encodeURIComponent(l.id)}`}
                                  className="text-xs no-underline hover:underline">
                                  {l.title}
                                </Link>
                              </li>
                            ))}
                            {s.lessons.length > 8 ? (
                              <li className="text-xs text-ink-500">+{s.lessons.length - 8} more</li>
                            ) : null}
                          </ul>
                        </details>
                      ) : null}
                    </Panel>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <Panel pad="lg" className="mt-12">
          <h2 className="flex items-center gap-2 text-h4">
            <Terminal size={17} aria-hidden="true" className="text-ink-500" />
            Changing the taxonomy
          </h2>
          <ol className="mt-4 space-y-3 text-sm text-ink-700">
            {[
              <>Edit <code>scripts/taxonomy.mjs</code> — add a skill to <code>SKILLS_BY_TOPIC</code>, or adjust a keyword rule. The last entry for each topic is its default, so coverage stays total by construction.</>,
              <>Run <code>npm run content</code>. The build fails loudly if a question no longer matches a rule, if a lesson references a missing skill, or if any legacy content would be dropped.</>,
              <>Check the reported per-skill question counts, then commit the regenerated <code>src/content/*.json</code>.</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-blue-600 text-[0.6875rem] font-bold text-white">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
