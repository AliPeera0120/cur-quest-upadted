import React, { useEffect, useState } from 'react';
import { Check, RefreshCw, ArrowRight, Presentation } from 'lucide-react';
import { Button, Panel, PanelHead, Skeleton } from '@/components/cq';
import { api } from '@/platform/api.js';

/* ============================================================================
   One assignment's results, live.

   Shown straight after assigning something, so the teacher never has to go
   looking for the page that tells them whether it worked. It re-reads the
   assignment on demand rather than polling: the numbers only move when
   students finish, and a teacher watching the room knows when that is.
   ========================================================================= */

export default function AssignmentResult({ assignmentId, title, sub, cls, onAgain }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(null);

  const load = () => api.getAssignment(assignmentId)
    .then((a) => { setData(a); setFailed(null); })
    .catch((e) => setFailed(e?.message || 'Could not load the results.'));

  useEffect(() => { load(); }, [assignmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel pad="none" lift>
      <PanelHead
        title={title}
        sub={sub}
        icon={Check}
        action={(
          <Button size="sm" variant="ghost" onClick={load}>
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </Button>
        )}
      />
      {failed ? (
        <p className="p-5 text-sm text-danger-700">{failed}</p>
      ) : !data ? (
        <div className="space-y-2 p-5">
          {[0, 1].map((i) => <Skeleton key={i} className="h-14 w-full rounded-sm" />)}
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {[
              { label: 'Assigned', value: data.stats.assigned },
              { label: 'Completed', value: `${data.stats.completed}/${data.stats.assigned}` },
              { label: `Hit ${data.minMastery ?? 80}%`, value: `${data.stats.mastered}/${data.stats.assigned}` },
              { label: 'Class average', value: data.stats.average != null ? `${data.stats.average}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-3.5">
                <dd className="cq-data text-base text-ink-900">{s.value}</dd>
                <dt className="text-micro text-ink-500">{s.label}</dt>
              </div>
            ))}
          </dl>
          <div className="p-5">
            <p className="text-sm text-ink-600">
              Numbers fill in as students finish — refresh while they work, or watch it on
              the projected screen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button to={`/arena/teach/classes/${cls?.id}`} variant="primary">
                Open {cls?.name} <ArrowRight size={15} aria-hidden="true" />
              </Button>
              <Button to={`/arena/teach/classroom/${cls?.id}`} variant="outline">
                <Presentation size={15} aria-hidden="true" /> Project it
              </Button>
              {onAgain ? <Button variant="ghost" onClick={onAgain}>Set another</Button> : null}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
