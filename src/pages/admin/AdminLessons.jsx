import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Eye, Copy, Archive, Send, Undo2, Pencil, ArrowUpDown,
} from 'lucide-react';
import {
  Button, Badge, Panel, Input, Select, Chip, DataTable, SortableTh, Modal,
  Callout, EmptyState, ErrorState, Skeleton, Menu, MenuItem, MenuLabel,
  useToast, cn,
} from '@/components/cq';
import { api } from '@/platform/api.js';
import Meta from '@/shell/Meta.jsx';
import { FORMATS, DIFFICULTY } from '@/content/index.js';
import { gradeLabel, minutes, plural, ago } from '@/lib/format.js';

/* ============================================================================
   Lesson management.

   A real table, because that is what this job is: 204 rows, find the one you
   want, change its state. Filters narrow; the row menu acts.

   Status is the only genuinely destructive axis here, so unpublishing and
   archiving both confirm and both explain what happens to student history
   (nothing — attempts record the version they ran against).
   ========================================================================= */

const STATUSES = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export default function AdminLessons() {
  const toast = useToast();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [err, setErr] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [strand, setStrand] = useState('');
  const [sort, setSort] = useState({ key: 'title', dir: 'asc' });
  const [confirm, setConfirm] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.getCatalog().then((c) => { setCatalog(c); setErr(null); }).catch(setErr);
  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    if (!catalog) return null;
    const needle = q.trim().toLowerCase();
    let list = catalog.lessons.filter((l) => {
      if (status && l.status !== status) return false;
      if (format && l.format !== format) return false;
      if (strand && l.strandId !== strand) return false;
      if (needle && !`${l.title} ${l.summary} ${l.id}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let d = 0;
      switch (sort.key) {
        case 'format': d = a.format.localeCompare(b.format); break;
        case 'strand': d = (a.strandId || '').localeCompare(b.strandId || ''); break;
        case 'grade': d = a.gradeMin - b.gradeMin; break;
        case 'difficulty': d = a.difficulty - b.difficulty; break;
        case 'minutes': d = a.estMinutes - b.estMinutes; break;
        case 'skills': d = (a.skills?.length || 0) - (b.skills?.length || 0); break;
        case 'status': d = a.status.localeCompare(b.status); break;
        default: d = a.title.localeCompare(b.title);
      }
      return sort.dir === 'asc' ? d : -d;
    });
    return list;
  }, [catalog, q, status, format, strand, sort]);

  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const act = async (fn, message) => {
    try { await fn(); toast.success(message); await load(); }
    catch (e) { toast.error('That did not work', e?.message); }
  };

  if (err) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not load the catalog" detail={err.message} onRetry={load} />
      </div>
    );
  }

  return (
    <>
      <Meta title="Lessons" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-h1">Lessons</h1>
            <p className="mt-2.5 text-ink-600">
              {rows ? `${rows.length} of ${catalog.lessons.length} shown` : 'Loading…'}
            </p>
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden="true" /> New lesson
          </Button>
        </header>

        <Panel pad="md" className="mt-7">
          <div className="grid gap-4 cb:grid-cols-[minmax(0,20rem)_repeat(3,minmax(0,11rem))]">
            <Input label="Search" placeholder="title, summary or id"
              value={q} onChange={(e) => setQ(e.target.value)} />
            <Select label="Status" placeholder="Any status" value={status}
              onChange={(e) => setStatus(e.target.value)} options={STATUSES} />
            <Select label="Format" placeholder="Any format" value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={Object.entries(FORMATS).map(([k, v]) => ({ value: k, label: v.label }))} />
            <Select label="Strand" placeholder="Any strand" value={strand}
              onChange={(e) => setStrand(e.target.value)}
              options={(catalog?.strands || []).map((s) => ({ value: s.id, label: s.name }))} />
          </div>
        </Panel>

        {!rows ? (
          <div className="mt-7 space-y-2">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-sm" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState className="mt-7" icon={Search} title="Nothing matches"
            action={<Button variant="outline" onClick={() => { setQ(''); setStatus(''); setFormat(''); setStrand(''); }}>Clear filters</Button>}>
            Try a shorter search or clear a filter.
          </EmptyState>
        ) : (
          <Panel pad="none" className="mt-7 overflow-hidden">
            <DataTable
              sticky
              caption="All lessons in the catalog"
              wrapClassName="max-h-[70vh]"
              head={(
                <tr>
                  <SortableTh label="Title" active={sort.key === 'title'} dir={sort.dir} onSort={() => toggle('title')} />
                  <SortableTh label="Format" active={sort.key === 'format'} dir={sort.dir} onSort={() => toggle('format')} />
                  <SortableTh label="Strand" active={sort.key === 'strand'} dir={sort.dir} onSort={() => toggle('strand')} />
                  <SortableTh label="Grades" active={sort.key === 'grade'} dir={sort.dir} onSort={() => toggle('grade')} />
                  <SortableTh label="Level" active={sort.key === 'difficulty'} dir={sort.dir} onSort={() => toggle('difficulty')} />
                  <SortableTh label="Mins" active={sort.key === 'minutes'} dir={sort.dir} onSort={() => toggle('minutes')} align="right" />
                  <SortableTh label="Skills" active={sort.key === 'skills'} dir={sort.dir} onSort={() => toggle('skills')} align="right" />
                  <SortableTh label="Status" active={sort.key === 'status'} dir={sort.dir} onSort={() => toggle('status')} />
                  <th scope="col"><span className="cq-sr">Actions</span></th>
                </tr>
              )}
            >
              {rows.map((l) => (
                <tr key={l.id}>
                  <td className="max-w-[22rem]">
                    <Link to={`/arena/admin/lessons/${encodeURIComponent(l.id)}`}
                      className="block truncate font-medium no-underline">
                      {l.title}
                    </Link>
                    <span className="mt-0.5 block truncate text-micro text-ink-500">{l.id}</span>
                  </td>
                  <td><Badge>{FORMATS[l.format]?.label || l.format}</Badge></td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span aria-hidden="true" className="h-2 w-2 rounded-pill"
                        style={{ background: `var(--cq-strand-${l.strandId})` }} />
                      {catalog.strand(l.strandId)?.name || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs">{gradeLabel(l.gradeMin, l.gradeMax)}</td>
                  <td className="text-xs">{DIFFICULTY[l.difficulty]}</td>
                  <td className="text-right"><span className="cq-data text-xs">{l.estMinutes}</span></td>
                  <td className="text-right"><span className="cq-data text-xs">{l.skills?.length || 0}</span></td>
                  <td>
                    <Badge tone={l.status === 'published' ? 'success' : l.status === 'draft' ? 'warning' : 'default'}>
                      {l.status}
                    </Badge>
                    {l.version > 1 ? <span className="ml-1.5 text-micro text-ink-500">v{l.version}</span> : null}
                  </td>
                  <td className="text-right">
                    <Menu label={`Actions for ${l.title}`}
                      trigger={<Button variant="ghost" size="sm" iconOnly aria-label={`Actions for ${l.title}`}>⋯</Button>}>
                      <MenuLabel>{l.title}</MenuLabel>
                      <MenuItem icon={Pencil} to={`/arena/admin/lessons/${encodeURIComponent(l.id)}`}>Edit</MenuItem>
                      <MenuItem icon={Eye} to={`/arena/lesson/${encodeURIComponent(l.id)}`}>Preview as a student</MenuItem>
                      <MenuItem icon={Copy} onClick={async () => {
                        try {
                          const copy = await api.duplicateLesson(l.id);
                          toast.success('Duplicated', 'Opening the copy as a draft.');
                          navigate(`/arena/admin/lessons/${encodeURIComponent(copy.id)}`);
                        } catch (e) { toast.error('Could not duplicate', e?.message); }
                      }}>Duplicate as a draft</MenuItem>
                      {l.status !== 'published' ? (
                        <MenuItem icon={Send} onClick={() => act(() => api.setLessonStatus(l.id, 'published'), 'Published')}>
                          Publish
                        </MenuItem>
                      ) : (
                        <MenuItem icon={Undo2} onClick={() => setConfirm({ lesson: l, to: 'draft' })}>
                          Unpublish
                        </MenuItem>
                      )}
                      {l.status !== 'archived' ? (
                        <MenuItem icon={Archive} danger onClick={() => setConfirm({ lesson: l, to: 'archived' })}>
                          Archive
                        </MenuItem>
                      ) : (
                        <MenuItem icon={Undo2} onClick={() => act(() => api.setLessonStatus(l.id, 'draft'), 'Restored as a draft')}>
                          Restore as a draft
                        </MenuItem>
                      )}
                    </Menu>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        )}
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.to === 'archived' ? `Archive “${confirm?.lesson.title}”?` : `Unpublish “${confirm?.lesson.title}”?`}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.to === 'archived' ? 'danger' : 'primary'}
              onClick={async () => {
                await act(() => api.setLessonStatus(confirm.lesson.id, confirm.to),
                  confirm.to === 'archived' ? 'Archived' : 'Unpublished');
                setConfirm(null);
              }}
            >
              {confirm?.to === 'archived' ? 'Archive' : 'Unpublish'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          Students will no longer find it in search or be able to open it.
        </p>
        <Callout tone="note" className="mt-4">
          Nothing that has already been learned is lost. Attempts record the lesson
          version they ran against, and skill mastery is computed from the answers
          themselves — so a student who mastered a skill here keeps it.
        </Callout>
      </Modal>

      <NewLessonModal
        open={creating}
        strands={catalog?.strands || []}
        onClose={() => setCreating(false)}
        onCreated={(l) => { setCreating(false); navigate(`/arena/admin/lessons/${encodeURIComponent(l.id)}`); }}
        toast={toast}
      />
    </>
  );
}

function NewLessonModal({ open, strands, onClose, onCreated, toast }) {
  const [form, setForm] = useState({ title: '', format: 'mission', strandId: 'forces', gradeMin: 3, gradeMax: 5 });
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New lesson"
      description="This creates a draft. Nothing is visible to students until you publish it."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const created = await api.createLesson({
                  ...form,
                  gradeMin: Number(form.gradeMin),
                  gradeMax: Number(form.gradeMax),
                  summary: '',
                  status: 'draft',
                });
                toast.success('Draft created');
                onCreated(created);
              } catch (e) { toast.error('Could not create it', e?.message); }
              finally { setBusy(false); }
            }}
          >
            Create draft
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <Input label="Title" required data-autofocus value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Forces & Motion: Explorer" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Format" value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value })}
            options={Object.entries(FORMATS).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Select label="Strand" value={form.strandId}
            onChange={(e) => setForm({ ...form, strandId: e.target.value })}
            options={strands.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Lowest grade" value={String(form.gradeMin)}
            onChange={(e) => setForm({ ...form, gradeMin: e.target.value })}
            options={[3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `Grade ${n}` }))} />
          <Select label="Highest grade" value={String(form.gradeMax)}
            onChange={(e) => setForm({ ...form, gradeMax: e.target.value })}
            options={[3, 4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `Grade ${n}` }))} />
        </div>
        <Callout tone="note" title="Next step">
          After this you will land in the editor, where the important work happens:
          tagging the skills it practises and adding questions with real explanations.
        </Callout>
      </div>
    </Modal>
  );
}
