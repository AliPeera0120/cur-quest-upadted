import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Globe2, Mail, Sparkles,
} from 'lucide-react';
import {
  Badge, Button, Callout, EmptyState, ErrorState, Kicker, Reveal, Skeleton, cn,
} from '@/components/cq';
import { Band, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import { api } from '@/platform/api.js';
import { plain } from '@/lib/format.js';

const SUBSTACK = 'https://curiosityquest25.substack.com/';

/* ------------------------------------------------------------- helpers ---- */

/**
 * Week dates arrive as bare 'YYYY-MM-DD' strings. `new Date(iso)` reads those
 * as UTC midnight, which renders as the *previous* day for every reader west
 * of London — so the parts go through the local-time constructor instead.
 */
function asDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

const dayLabel = (iso) => asDate(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
const shortDay = (iso) => asDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const monthLabel = (iso) => asDate(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

/**
 * Every brief carries #brief and #reading, so neither tells a reader anything.
 * Whatever is left is the actual topic.
 */
const STRUCTURAL_TAGS = new Set(['#brief', '#reading']);
function topicOf(lesson) {
  const tag = (lesson.tags || []).find((t) => !STRUCTURAL_TAGS.has(t));
  return tag ? tag.slice(1).replace(/^./, (c) => c.toUpperCase()) : null;
}

/**
 * One archived headline ends in an emoji it picked up from the newsletter.
 * Stripping it at render time honours the no-emoji-in-UI rule without
 * rewriting published content.
 */
const title = (t = '') => t
  .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
  .replace(/\s+/g, ' ')
  .trim();

/** ISO week dates sort correctly as plain strings — newest first. */
const byNewest = (a, b) => String(b.brief?.weekDate || '').localeCompare(String(a.brief?.weekDate || ''));

/* ------------------------------------------------------------ the data ---- */

/** The archive is 14 rows of catalog metadata, so one load serves both views. */
function useBriefs() {
  const [state, setState] = useState({ loading: true, briefs: [], error: null });

  useEffect(() => {
    let alive = true;
    api.getCatalog()
      .then((catalog) => {
        if (!alive) return;
        const briefs = catalog.lessons.filter((l) => l.format === 'brief').sort(byNewest);
        setState({ loading: false, briefs, error: null });
      })
      .catch((err) => {
        if (alive) setState({ loading: false, briefs: [], error: err.message || 'The archive could not be loaded.' });
      });
    return () => { alive = false; };
  }, []);

  return state;
}

export default function Briefs() {
  const { lessonId } = useParams();
  const archive = useBriefs();
  return lessonId
    ? <BriefDetail lessonId={lessonId} {...archive} />
    : <BriefIndex {...archive} />;
}

/* ================================================================ index === */

function BriefIndex({ briefs, loading, error }) {
  const [featured, ...rest] = briefs;
  const months = useMemo(() => groupByMonth(rest), [rest]);

  return (
    <>
      <Meta
        title="5 Minutes of STEM — the archive"
        description="A short weekly read that answers one real question properly: how self-driving cars see, why ice floats, what happens when you sleep. Every issue, free to read."
      />

      <section className="cq-wash border-b border-line">
        <div className="cq-container py-14 cb:py-20">
          <Kicker pill>5 Minutes of STEM</Kicker>
          <h1 className="mt-6 max-w-[24ch] text-h1">One good question, answered properly.</h1>
          <p className="mt-6 max-w-[54ch] text-lead text-ink-600">
            Each issue takes a question a curious ten-year-old would actually ask and
            answers it in about five minutes of reading — no talking down, no padding.
            Sparsh writes it; every issue is here, free.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {featured ? (
              <Button to={`/explore/briefs/${featured.id}`} size="lg" variant="accent">
                Read the newest issue <ArrowRight size={17} aria-hidden="true" />
              </Button>
            ) : null}
            <Button href={SUBSTACK} size="lg" variant="outline">
              <Mail size={16} aria-hidden="true" /> Get it by email
            </Button>
          </div>
          {featured ? (
            <p className="mt-8 text-sm text-ink-500">
              {briefs.length} issues published · newest {dayLabel(featured.brief?.weekDate)}
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="cq-container cq-section">
          <ErrorState title="The archive did not load" detail={error} onRetry={() => window.location.reload()} />
        </div>
      ) : loading ? (
        <IndexSkeleton />
      ) : !briefs.length ? (
        <div className="cq-container cq-section">
          <EmptyState
            icon={BookOpen}
            title="No issues in the archive yet"
            action={<Button href={SUBSTACK} variant="primary">Subscribe and get the first one</Button>}
          >
            The newsletter goes out most weeks. Subscribing is the fastest way to see it.
          </EmptyState>
        </div>
      ) : (
        <>
          <Band dense>
            <Featured lesson={featured} />
          </Band>

          <Band
            tone="tint"
            kicker="The archive"
            title="Every issue so far"
            lede="Grouped by the week it went out. Nothing here expires — why the sky is blue reads the same in March as it does in August."
          >
            <div className="space-y-12">
              {months.map(([key, items]) => (
                <section key={key}>
                  <h3 className="border-b border-line pb-3 text-micro font-semibold uppercase tracking-label text-ink-500">
                    {monthLabel(items[0].brief?.weekDate)}
                  </h3>
                  <ul className="divide-y divide-line">
                    {items.map((l, i) => <ArchiveRow key={l.id} lesson={l} delay={i * 40} />)}
                  </ul>
                </section>
              ))}
            </div>
          </Band>
        </>
      )}

      <NewsletterBand />
    </>
  );
}

/** Keys are 'YYYY-MM', so insertion order already is date order. */
function groupByMonth(list) {
  const map = new Map();
  for (const l of list) {
    const key = String(l.brief?.weekDate || '').slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(l);
  }
  return [...map.entries()];
}

function Featured({ lesson }) {
  const topic = topicOf(lesson);
  return (
    <Reveal className="overflow-hidden rounded-lg border border-line bg-white shadow-lg">
      <div className="grid cb:grid-cols-[1.35fr_1fr]">
        <div className="p-7 cb:p-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="ember" icon={Sparkles}>Newest issue</Badge>
            {topic ? <Badge tone="info">{topic}</Badge> : null}
            <span className="text-xs text-ink-500">{dayLabel(lesson.brief?.weekDate)}</span>
          </div>
          <h2 className="mt-5 max-w-[26ch] text-h2">
            <Link to={`/explore/briefs/${lesson.id}`} className="text-ink-900 no-underline hover:text-blue-600">
              {title(lesson.title)}
            </Link>
          </h2>
          <p className="mt-4 max-w-[56ch] text-lead text-ink-600">{lesson.summary}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to={`/explore/briefs/${lesson.id}`} variant="primary">Read it now</Button>
            <span className="text-xs text-ink-500">About 5 minutes</span>
          </div>
        </div>

        {/* The fun fact is what makes someone open an issue, so it is the one
            piece of the body the index gives away. */}
        {lesson.brief?.funFact ? (
          <aside className="border-t border-line bg-paper-2 p-7 cb:border-l cb:border-t-0 cb:p-10">
            <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-orange-800">
              <Sparkles size={13} aria-hidden="true" /> From this issue
            </p>
            <p className="mt-4 font-display text-lg font-bold leading-snug text-ink-900">
              {lesson.brief.funFact}
            </p>
          </aside>
        ) : null}
      </div>
    </Reveal>
  );
}

function ArchiveRow({ lesson, delay }) {
  const topic = topicOf(lesson);
  return (
    <Reveal as="li" delay={delay}>
      <Link
        to={`/explore/briefs/${lesson.id}`}
        className="group grid min-h-[2.75rem] items-baseline gap-x-8 gap-y-2 py-6 no-underline cb:grid-cols-[6.5rem_1fr_8rem_5rem]"
      >
        <span className="cq-data text-sm text-ink-500">{shortDay(lesson.brief?.weekDate)}</span>
        <span className="min-w-0">
          <span className="block font-display text-h4 font-semibold text-ink-900 group-hover:text-blue-600">
            {title(lesson.title)}
          </span>
          <span className="mt-1.5 block max-w-[68ch] text-sm text-ink-600">{lesson.summary}</span>
        </span>
        <span>{topic ? <Badge tone="info">{topic}</Badge> : null}</span>
        <span className="inline-flex items-center gap-1.5 self-center text-sm font-semibold text-blue-600 cb:justify-self-end">
          Read
          <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-2 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </Reveal>
  );
}

function IndexSkeleton() {
  return (
    <div className="cq-container cq-section" aria-busy="true">
      <Skeleton className="h-56 w-full" />
      <div className="mt-12 space-y-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-8">
            <Skeleton className="h-5 w-20 shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================================================== detail === */

function BriefDetail({ lessonId, briefs, loading: indexLoading, error: indexError }) {
  const [state, setState] = useState({ loading: true, content: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, content: null, error: null });
    api.getLessonForPlay(lessonId)
      .then((content) => { if (alive) setState({ loading: false, content, error: null }); })
      .catch((err) => {
        if (alive) setState({ loading: false, content: null, error: err.message || 'This issue could not be loaded.' });
      });
    return () => { alive = false; };
  }, [lessonId]);

  const { content, loading, error } = state;
  const lesson = content?.lesson;
  const explain = content?.activities?.find((a) => a.kind === 'explain');
  const body = explain?.config?.markdown;
  /* The catalog carries a copy of both extras; the activity config is the
     authoritative version an admin edit would touch, so it wins. */
  const realWorld = explain?.config?.realWorld || lesson?.brief?.realWorld;
  const funFact = explain?.config?.funFact || lesson?.brief?.funFact;

  const position = briefs.findIndex((l) => l.id === lessonId);
  const newer = position > 0 ? briefs[position - 1] : null;
  const older = position >= 0 && position < briefs.length - 1 ? briefs[position + 1] : null;
  const related = useMemo(() => relatedTo(briefs, lessonId), [briefs, lessonId]);

  if (loading || indexLoading) {
    return (
      <div className="cq-container cq-container--narrow cq-section" aria-busy="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-10 w-4/5" />
        <div className="mt-10 space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-3/4' : 'w-full')} />
          ))}
        </div>
      </div>
    );
  }

  if (error || indexError) {
    return (
      <div className="cq-container cq-container--narrow cq-section">
        <ErrorState title="This issue did not load" detail={error || indexError} onRetry={() => window.location.reload()} />
        <div className="mt-6"><TextLink to="/explore/briefs">Back to the archive</TextLink></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="cq-container cq-container--narrow cq-section">
        <Meta title="Issue not found" description="That issue of 5 Minutes of STEM is not in the archive." />
        <EmptyState
          icon={BookOpen}
          title="That issue is not in the archive"
          action={<Button to="/explore/briefs" variant="primary">See every issue</Button>}
        >
          The link may be out of date. Every published issue is listed in the archive.
        </EmptyState>
      </div>
    );
  }

  const topic = topicOf(lesson);

  return (
    <>
      <Meta title={title(lesson.title)} description={plain(lesson.summary, 180)} />

      <article>
        <header className="cq-wash border-b border-line">
          <div className="cq-container cq-container--narrow py-12 cb:py-16">
            <Link
              to="/explore/briefs"
              className="inline-flex min-h-[2.75rem] items-center gap-1.5 text-sm font-semibold text-blue-600 no-underline hover:text-blue-500"
            >
              <ArrowLeft size={15} aria-hidden="true" /> 5 Minutes of STEM
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Badge tone="ember">Week of {dayLabel(lesson.brief?.weekDate)}</Badge>
              {topic ? <Badge tone="info">{topic}</Badge> : null}
              <span className="text-xs text-ink-500">About 5 minutes</span>
            </div>
            <h1 className="mt-5 text-h1">{title(lesson.title)}</h1>
            <p className="mt-5 text-lead text-ink-600">{lesson.summary}</p>
          </div>
        </header>

        <div className="cq-container cq-container--narrow cq-section">
          {body ? (
            <div className="cq-prose">
              <ReactMarkdown>{body}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-ink-600">The text of this issue is not available yet.</p>
          )}

          {/* Two deliberately different treatments: the real-world connection is
              the point of the issue, the fun fact is the bit you repeat at
              dinner. Same component, different tone and icon, so they never
              read as one undifferentiated box of extras. */}
          {realWorld ? (
            <Callout tone="info" icon={Globe2} title="Where this shows up in real life" className="mt-12">
              {realWorld}
            </Callout>
          ) : null}
          {funFact ? (
            <Callout tone="note" icon={Sparkles} title="Fun fact" className="mt-4">
              {funFact}
            </Callout>
          ) : null}

          <nav aria-label="Other issues" className="mt-14 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
            <AdjacentLink lesson={older} direction="older" />
            <AdjacentLink lesson={newer} direction="newer" />
          </nav>
        </div>
      </article>

      {related.length ? (
        <Band tone="tint" dense kicker="Keep reading" title="More worth five minutes">
          <ul className="grid gap-5 cb:grid-cols-3">
            {related.map((l) => (
              <li key={l.id}>
                <Link to={`/explore/briefs/${l.id}`} className="cq-panel cq-panel--action flex h-full flex-col p-5 no-underline">
                  <span className="text-micro font-semibold uppercase tracking-label text-ink-500">
                    {shortDay(l.brief?.weekDate)}
                  </span>
                  <span className="mt-2 font-display text-h4 font-semibold text-ink-900">{title(l.title)}</span>
                  <span className="mt-2 flex-1 text-sm text-ink-600">{plain(l.summary, 110)}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    Read <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Band>
      ) : null}

      <NewsletterBand />
    </>
  );
}

/**
 * Same topic first — "another one about technology" is a more useful suggestion
 * than "the one published a week earlier". Neighbours in the archive fill the
 * strip when a topic only has one issue.
 */
function relatedTo(briefs, lessonId) {
  const current = briefs.find((l) => l.id === lessonId);
  if (!current) return [];
  const pool = briefs.filter((l) => l.id !== lessonId);
  const topic = topicOf(current);
  return [
    ...pool.filter((l) => topicOf(l) === topic),
    ...pool.filter((l) => topicOf(l) !== topic),
  ].slice(0, 3);
}

function AdjacentLink({ lesson, direction }) {
  const older = direction === 'older';
  if (!lesson) {
    return (
      <p className={cn('rounded-md border border-dashed border-line px-5 py-4 text-sm text-ink-500', !older && 'sm:text-right')}>
        {older ? 'This is the first issue.' : 'This is the newest issue.'}
      </p>
    );
  }
  return (
    <Link
      to={`/explore/briefs/${lesson.id}`}
      className={cn('cq-panel cq-panel--action block p-5 no-underline', !older && 'sm:text-right')}
    >
      <span className="inline-flex items-center gap-1.5 text-micro font-semibold uppercase tracking-label text-ink-500">
        {older ? <ChevronLeft size={13} aria-hidden="true" /> : null}
        {older ? 'Older issue' : 'Newer issue'}
        {older ? null : <ChevronRight size={13} aria-hidden="true" />}
      </span>
      <span className="mt-1.5 block font-display font-semibold text-ink-900">{title(lesson.title)}</span>
    </Link>
  );
}

/* ----------------------------------------------------------- newsletter --- */

function NewsletterBand() {
  return (
    <Band tone="tint" dense>
      <div className="grid items-center gap-8 rounded-lg border border-line bg-white p-7 shadow-xs cb:grid-cols-[1fr_auto] cb:p-10">
        <div>
          <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-label text-blue-600">
            <Mail size={13} aria-hidden="true" /> Get it by email
          </p>
          <h2 className="mt-3 text-h3">Or let it come to you.</h2>
          <p className="mt-3 max-w-[60ch] text-ink-600">
            The same issues go out as an email on Substack, usually one a week. Free,
            and still a five-minute read. The archive here keeps every issue either
            way — subscribing just saves you the trip.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href={SUBSTACK} variant="primary">Subscribe on Substack</Button>
          <Button to="/explore" variant="outline">More to explore</Button>
        </div>
      </div>
    </Band>
  );
}
