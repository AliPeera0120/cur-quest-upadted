import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader.jsx';
import PublicFooter from './PublicFooter.jsx';

export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a href="#main" className="cq-skip">Skip to content</a>
      <PublicHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
