import React, { useEffect, useMemo, useState } from 'react';
import { Search, Clock, Target, Swords, Zap, FlaskConical, Terminal, BookOpen, Check } from 'lucide-react';
import {
  Modal, Button, Input, Select, Chip, Badge, Callout, Skeleton, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import { FORMATS, DIFFICULTY } from '@/content/index.js';
import { minutes, gradeLabel } from '@/lib/format.js';

/* ============================================================================
   Assign a mission.

   Two steps: find the lesson, set the terms. The search is the same faceted
   search students use, so a teacher browsing the catalog and a student
   browsing it see the same thing.

   The copy is careful about what an assignment is: guidance and a target, not
   a gate. Students can already open everything.
   ========================================================================= */

const FORMAT_ICON = {
  battle: Swords, mission: Target, quick: Zap, experiment: FlaskConical,
  course: Terminal, brief: BookOpen, assessment: Check,
};

const FORMAT_ORDER = ['mission', 'quick', 'battle', 'assessment', 'experiment', 'course', 'brief'];

export default function AssignModal({ open, classId, className, gradeBand, onClose, onAssigned }) {
  const [q, setQ] = useState('');
  const [format, setFormat] = useState('');
  const [strand, setStrand] = useState('');
  const [rows, setRows] = useState(null);
  const [strands, setStrands] = useState([]);
  const [picked, setPicked] = useState(null);
  const [terms, setTerms] = useState({ dueAt: '', minMastery: 80, note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const grades = useMemo(() => {
    if (!gradeBand) return [];
    const [lo, hi] = gradeBand.split('-').map(Number);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [gradeBand]);

  useEffect(() => {
    if (!open) return;
    api.getCatalog().then((c) => setStrands(c.strands)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setRows(null);
    const t = setTimeout(() => {
      api.listLessons({
        q,
        formats: format ? [format] : [],
        strands: strand ? [strand] : [],
        grades,
        limit: 40,
        sort: q ? 'relevance' : 'easiest',
      })
        .then((res) => { if (alive) setRows(res); })
        .catch(() => { if (alive) setRows({ rows: [], total: 0 }); });
    }, q ? 220 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [open, q, format, strand, grades]);

  const reset = () => { setPicked(null); setQ(''); setFormat(''); setStrand(''); setTerms({ dueAt: '', minMastery: 80, note: '' }); setError(null); };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.createAssignment({
        classId,
        lessonId: picked.id,
        dueAt: terms.dueAt ? new Date(`${terms.dueAt}T23:59:59`).toISOString() : null,
        minMastery: Number(terms.minMastery),
        note: terms.note.trim() || null,
      });
      reset();
      onAssigned?.({ ...created, lessonTitle: picked.title });
    } catch (err) {
      setError(err?.message || 'Could not assign that.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      size="xl"
      title={picked ? 'Set the terms' : 'Assign a mission'}
      description={picked
        ? `${picked.title} → ${className}`
        : `Pick any lesson. Students in ${className} can already play all of them — this sets a target and a due date.`}
      footer={picked ? (
        <>
          <Button variant="ghost" onClick={() => setPicked(null)}>Pick a different lesson</Button>
          <Button variant="primary" loading={busy} onClick={submit}>Assign to {className}</Button>
        </>
      ) : (
        <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
      )}
    >
      {error ? <Callout tone="danger" className="mb-4">{error}</Callout> : null}

      {!picked ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Search lessons"
              data-autofocus
              className="min-w-[14rem]"
              placeholder="forces, energy, cells…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select
              label="Type"
              placeholder="Any type"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-auto min-w-[9rem]"
              options={FORMAT_ORDER.map((f) => ({ value: f, label: FORMATS[f]?.label || f }))}
            />
            <Select
              label="Strand"
              placeholder="Any strand"
              value={strand}
              onChange={(e) => setStrand(e.target.value)}
              className="w-auto min-w-[11rem]"
              options={strands.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          {gradeBand ? (
            <p className="mt-3 text-xs text-ink-500">
              Filtered to grades {gradeBand} because that is this class&rsquo;s band. Clear
              the class grade band to see everything.
            </p>
          ) : null}

          <div className="mt-5 max-h-[26rem] overflow-y-auto rounded-md border border-line">
            {!rows ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-sm" />)}
              </div>
            ) : rows.rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-ink-500">
                Nothing matches that. Try a broader search.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {rows.rows.map((l) => {
                  const Icon = FORMAT_ICON[l.format] || Target;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(l)}
                        className="flex w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-blue-50"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-blue-50 text-blue-600">
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900">{l.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-ink-500">
                            {FORMATS[l.format]?.label} · {gradeLabel(l.gradeMin, l.gradeMax)} · {DIFFICULTY[l.difficulty]}
                          </span>
                        </span>
                        <span className="cq-data shrink-0 text-xs text-ink-500">{minutes(l.estMinutes)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {rows ? (
            <p className="mt-2.5 text-xs text-ink-500">
              Showing {rows.rows.length} of {rows.total} matching lessons.
            </p>
          ) : null}
        </>
      ) : (
        <div className="space-y-5">
          <div className="rounded-md border border-line bg-surface-2 p-4">
            <p className="font-display font-bold text-ink-900">{picked.title}</p>
            <p className="mt-1 text-sm text-ink-600">{picked.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="info">{FORMATS[picked.format]?.label}</Badge>
              <Badge>{gradeLabel(picked.gradeMin, picked.gradeMax)}</Badge>
              <Badge>{DIFFICULTY[picked.difficulty]}</Badge>
              <Badge icon={Clock}>{minutes(picked.estMinutes)}</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Due date"
              type="date"
              value={terms.dueAt}
              onChange={(e) => setTerms({ ...terms, dueAt: e.target.value })}
              hint="Optional. Overdue work is flagged, never blocked."
            />
            <Select
              label="Mastery target"
              value={String(terms.minMastery)}
              onChange={(e) => setTerms({ ...terms, minMastery: e.target.value })}
              options={[60, 70, 80, 90].map((n) => ({ value: String(n), label: `${n}%` }))}
              hint="The score you want them to reach."
            />
          </div>

          <Input
            label="Note for students"
            placeholder="Do this before Friday’s lab."
            value={terms.note}
            onChange={(e) => setTerms({ ...terms, note: e.target.value })}
            hint="Optional. Shown on their dashboard next to the mission."
          />

          <Callout tone="note" title="This does not lock anything">
            Every other lesson stays open. An assignment tells students what you want
            done and tells you who has done it — that is all it does.
          </Callout>
        </div>
      )}
    </Modal>
  );
}
