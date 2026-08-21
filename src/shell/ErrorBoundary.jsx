import React from 'react';

/**
 * Last line of defence. A thrown render error in one screen should show a
 * recoverable message, not a white page — especially on a school Chromebook
 * where nobody is going to open a console.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('[CuriosityQuest] Unhandled render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6">
        <div className="max-w-md text-center">
          <p className="font-mono text-micro uppercase tracking-label text-ember-700">Something broke</p>
          <h1 className="mt-3 text-h2">This page hit an error</h1>
          <p className="mt-3 text-ink-700">
            Your progress is saved. Reloading usually clears it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="cq-btn cq-btn--primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a className="cq-btn cq-btn--outline" href="/">Back to the homepage</a>
          </div>
          {import.meta.env.DEV ? (
            <pre className="mt-6 overflow-auto rounded-md border border-line bg-ink-950 p-3 text-left text-xs text-white">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          ) : null}
        </div>
      </main>
    );
  }
}
