import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, Upload, Copy, Check, Trash2, Database, Server, AlertTriangle, GitBranch,
} from 'lucide-react';
import {
  Button, Badge, Panel, Textarea, Input, Callout, ErrorState, Skeleton, Modal,
  useToast, cn,
} from '@/components/cq';
import { api, backendName, isLocalBackend } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
import Meta from '@/shell/Meta.jsx';
import { downloadText, plural } from '@/lib/format.js';

/* ============================================================================
   Export and import.

   The honest explanation of where authored content lives, and how to make it
   permanent. Getting this page wrong means someone spends an afternoon writing
   lessons that disappear when they clear their browser — so it leads with the
   limitation rather than burying it.
   ========================================================================= */

export default function AdminContent() {
  const { backend, isLocal } = useAuth();
  const toast = useToast();
  const [json, setJson] = useState(null);
  const [err, setErr] = useState(null);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const load = () => api.exportOverrides()
    .then((s) => { setJson(s); setErr(null); })
    .catch(setErr);

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    if (!json) return null;
    try {
      const parsed = JSON.parse(json);
      const entries = Object.entries(parsed);
      return {
        count: entries.length,
        created: entries.filter(([, v]) => v.isNew).length,
        edited: entries.filter(([, v]) => !v.isNew).length,
        bytes: new Blob([json]).size,
        titles: entries.map(([k, v]) => v.lesson?.title || k).slice(0, 12),
      };
    } catch { return null; }
  }, [json]);

  if (err) {
    return (
      <div className="cq-container cq-container--wide py-10">
        <ErrorState title="Could not read local edits" detail={err.message} onRetry={load} />
      </div>
    );
  }

  return (
    <>
      <Meta title="Export content" />
      <div className="cq-container cq-container--wide py-8 cb:py-10">
        <h1 className="text-h1">Export &amp; import</h1>
        <p className="mt-2.5 max-w-[70ch] text-ink-600">
          Where the lessons you author actually live, and how to make them permanent for
          everyone rather than just for this browser.
        </p>

        {/* The current storage situation, stated first. */}
        <div className="mt-8 grid gap-5 cb:grid-cols-2">
          <Panel pad="lg" className={cn(isLocal && 'border-[#F1DEB0] bg-warning-50')}>
            <div className="flex items-start gap-3.5">
              <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-md',
                isLocal ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700')}>
                {isLocal ? <Database size={19} aria-hidden="true" /> : <Server size={19} aria-hidden="true" />}
              </span>
              <div>
                <h2 className="text-h4">
                  {isLocal ? 'Local mode — edits live in this browser' : `Connected to ${backend}`}
                </h2>
                <p className="mt-2 text-sm text-ink-700">
                  {isLocal ? (
                    <>The catalog that ships with the build is read-only. Everything you
                      create or change in the admin screens is stored as an override in
                      this browser&rsquo;s local storage. Clearing site data, using a different
                      computer, or a different browser profile all mean it is not there.</>
                  ) : (
                    <>Lessons, activities and questions are written to the database and are
                      live for everyone as soon as you publish. This page is still useful
                      for taking a snapshot into version control.</>
                  )}
                </p>
                <Badge tone={isLocal ? 'warning' : 'success'} className="mt-3">
                  {isLocal ? 'Not yet permanent' : 'Shared'}
                </Badge>
              </div>
            </div>
          </Panel>

          <Panel pad="lg">
            <h2 className="text-h4">What is here right now</h2>
            {!summary ? (
              <Skeleton className="mt-4 h-20 w-full rounded-sm" />
            ) : summary.count === 0 ? (
              <p className="mt-3 text-sm text-ink-600">
                No local edits. The catalog is exactly what the build shipped —
                204 lessons, 234 questions.
              </p>
            ) : (
              <>
                <dl className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    ['Lessons touched', summary.count],
                    ['New', summary.created],
                    ['Edited', summary.edited],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dd className="cq-data cq-data--md text-blue-700">{value}</dd>
                      <dt className="text-micro text-ink-500">{label}</dt>
                    </div>
                  ))}
                </dl>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {summary.titles.map((t) => <li key={t}><Badge>{t}</Badge></li>)}
                  {summary.count > 12 ? <li><Badge>+{summary.count - 12} more</Badge></li> : null}
                </ul>
                <p className="mt-3 text-micro text-ink-500">{(summary.bytes / 1024).toFixed(1)} KB of JSON</p>
              </>
            )}
          </Panel>
        </div>

        {/* The round trip. */}
        <Panel pad="lg" className="mt-6">
          <h2 className="flex items-center gap-2 text-h4">
            <GitBranch size={17} aria-hidden="true" className="text-blue-600" />
            Making edits permanent
          </h2>
          <ol className="mt-4 space-y-3.5">
            {[
              <>Download the JSON below, or copy it.</>,
              <>Save it into the repository as <code>src/content/overrides.json</code>.</>,
              <>Have <code>scripts/build-content.mjs</code> read that file at the end of its
                run and merge it over the generated catalog — one <code>fs.existsSync</code>{' '}
                check and an object spread. Its integrity assertions then cover your edits
                too, so a lesson referencing a missing skill fails the build rather than
                shipping broken.</>,
              <>Run <code>npm run content</code>, commit, and push. On the next deploy the
                edits are part of the catalog everyone loads, and the local overrides
                become redundant.</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-3.5 text-sm text-ink-700">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-blue-600 text-[0.6875rem] font-bold text-white">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <Callout tone="note" className="mt-5">
            Until step four, treat authored lessons as drafts on one machine. If you have
            written something you would be upset to lose, export it now.
          </Callout>
        </Panel>

        {/* Export */}
        <Panel pad="lg" className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-h4">Export</h2>
              <p className="mt-1 text-sm text-ink-600">
                Every local override, as JSON.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button
                variant="primary"
                disabled={!summary?.count}
                onClick={() => {
                  downloadText('cq-content-overrides.json', json, 'application/json');
                  toast.success('Downloaded', 'cq-content-overrides.json');
                }}
              >
                <Download size={16} aria-hidden="true" /> Download JSON
              </Button>
              <Button
                variant="outline"
                disabled={!summary?.count}
                onClick={() => {
                  navigator.clipboard?.writeText(json).then(() => {
                    setCopied(true);
                    toast.success('Copied to clipboard');
                    setTimeout(() => setCopied(false), 2200);
                  });
                }}
              >
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          {json ? (
            <pre className="mt-5 max-h-72 overflow-auto rounded-md border border-line bg-ink-950 p-4 text-xs leading-relaxed text-white">
              {summary?.count ? json : '{}'}
            </pre>
          ) : (
            <Skeleton className="mt-5 h-40 w-full rounded-md" />
          )}
        </Panel>

        {/* Import */}
        <Panel pad="lg" className="mt-6">
          <h2 className="text-h4">Import</h2>
          <p className="mt-1 max-w-[70ch] text-sm text-ink-600">
            Paste an exported file to restore it on this device, or to move work between
            machines. Existing overrides with the same lesson id are replaced; others are
            left alone.
          </p>
          <Textarea
            label="Overrides JSON"
            rows={6}
            className="mt-4 font-mono text-xs"
            placeholder='{"authored.abc123": { … }}'
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <Button
            variant="outline"
            className="mt-4"
            disabled={!importText.trim()}
            onClick={async () => {
              try {
                await api.importOverrides(importText);
                setImportText('');
                toast.success('Imported');
                await load();
              } catch (e) { toast.error('Could not import', e?.message); }
            }}
          >
            <Upload size={16} aria-hidden="true" /> Import
          </Button>
        </Panel>

        {/* Danger zone */}
        <Panel pad="lg" className="mt-6 border-[#F5CDCA]">
          <h2 className="flex items-center gap-2 text-h4 text-danger-700">
            <AlertTriangle size={17} aria-hidden="true" />
            Discard all local edits
          </h2>
          <p className="mt-2 max-w-[70ch] text-sm text-ink-700">
            Removes every override and returns the catalog to exactly what the build
            shipped. Anything you have authored and not exported is gone. Student progress
            is untouched — that is stored separately.
          </p>
          <Button
            variant="danger"
            className="mt-4"
            disabled={!summary?.count}
            onClick={() => { setConfirmText(''); setClearing(true); }}
          >
            <Trash2 size={16} aria-hidden="true" /> Discard local edits
          </Button>
        </Panel>
      </div>

      <Modal
        open={clearing}
        onClose={() => setClearing(false)}
        size="sm"
        title="Discard all local content edits?"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setClearing(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={confirmText.trim().toLowerCase() !== 'discard'}
              onClick={async () => {
                try {
                  await api.clearOverrides();
                  toast.success('Local edits discarded');
                  setClearing(false);
                  await load();
                } catch (e) { toast.error('Could not clear', e?.message); }
              }}
            >
              Discard
            </Button>
          </>
        )}
      >
        <p className="text-sm text-ink-600">
          {summary?.count
            ? `${plural(summary.count, 'lesson')} will lose their local changes. This cannot be undone.`
            : 'Nothing to discard.'}
        </p>
        <Input
          label="Type “discard” to confirm"
          className="mt-4"
          data-autofocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </Modal>
    </>
  );
}
