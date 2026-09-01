import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Compass, Search } from 'lucide-react';
import { Button } from '@/components/cq';
import Meta from '@/shell/Meta.jsx';

/**
 * 404.
 *
 * The old site used bare page names as URLs (/ScienceArena, /QuestPassport).
 * Those are redirected in the router, but a mistyped or long-dead link still
 * lands here — so this page offers the four places people were most likely
 * heading rather than just apologising.
 */
export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="cq-wash">
      <Meta title="Page not found" />
      <div className="cq-container cq-container--narrow py-20 text-center cb:py-28">
        <p className="text-micro font-semibold uppercase tracking-label text-orange-800">404</p>
        <h1 className="mt-4 text-h1">That page isn&rsquo;t here.</h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-lead text-ink-600">
          The site was rebuilt recently and a few addresses moved. Everything below still
          works.
        </p>
        <code className="mt-5 inline-block rounded-sm border border-line bg-white px-3 py-1.5 text-xs text-ink-600">
          {pathname}
        </code>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button to="/" size="lg" variant="primary">
            <Home size={17} aria-hidden="true" /> Homepage
          </Button>
          <Button to="/explore" size="lg" variant="outline">
            <Compass size={17} aria-hidden="true" /> Activities
          </Button>
          <Button to="/arena" size="lg" variant="outline">Science Arena</Button>
          <Button to="/about" size="lg" variant="ghost">About us</Button>
        </div>
      </div>
    </div>
  );
}
