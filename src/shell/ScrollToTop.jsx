import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A single-page app has to restore scroll itself. Navigating to a new route
 * jumps to the top and moves focus to the main landmark, so keyboard and
 * screen-reader users land at the start of the new page instead of wherever
 * the old one left them.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ block: 'start' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    const main = document.getElementById('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      main.removeAttribute('tabindex');
    }
  }, [pathname, hash]);

  return null;
}
