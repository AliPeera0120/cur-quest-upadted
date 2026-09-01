import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Info, TriangleAlert, X, Award } from 'lucide-react';
import { cn } from './cn';

const ToastCtx = createContext(null);
let seq = 0;

const ICONS = { success: Check, error: TriangleAlert, info: Info, award: Award };

/**
 * Notifications are deliberately restrained: bottom-left, max three at a
 * time, auto-dismissed, and announced via a polite live region. There is no
 * mechanism here for streak nags or engagement pop-ups.
 */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const push = useCallback((toast) => {
    const id = ++seq;
    const ttl = toast.duration ?? (toast.tone === 'error' ? 6500 : 4200);
    setItems((l) => [...l.slice(-2), { id, ...toast }]);
    if (ttl > 0) setTimeout(() => dismiss(id), ttl);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    push,
    dismiss,
    success: (title, detail) => push({ tone: 'success', title, detail }),
    error: (title, detail) => push({ tone: 'error', title, detail }),
    info: (title, detail) => push({ tone: 'info', title, detail }),
    award: (title, detail) => push({ tone: 'award', title, detail, duration: 5200 }),
  }), [push, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div
          className="pointer-events-none fixed bottom-4 left-4 z-toast flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
          role="region"
          aria-label="Notifications"
        >
          <div aria-live="polite" aria-atomic="false" className="cq-sr">
            {items.map((t) => <p key={t.id}>{t.title}{t.detail ? `. ${t.detail}` : ''}</p>)}
          </div>
          {items.map((t) => {
            const Icon = ICONS[t.tone] || Info;
            return (
              <div
                key={t.id}
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-md border bg-surface px-3.5 py-3 shadow-pop animate-rise',
                  t.tone === 'success' && 'border-success-500',
                  t.tone === 'error' && 'border-danger-600',
                  t.tone === 'award' && 'border-ember-500',
                  (!t.tone || t.tone === 'info') && 'border-ink-900',
                )}
              >
                <Icon
                  size={16} aria-hidden="true"
                  className={cn('mt-0.5 shrink-0',
                    t.tone === 'success' ? 'text-success-600' : t.tone === 'error' ? 'text-danger-600'
                    : t.tone === 'award' ? 'text-ember-700' : 'text-blue-600')}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-ink-900">{t.title}</p>
                  {t.detail ? <p className="mt-0.5 text-xs text-ink-700">{t.detail}</p> : null}
                </div>
                <button
                  type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"
                  className="-mr-1 -mt-1 shrink-0 rounded-xs p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx) || {
  push: () => {}, dismiss: () => {}, success: () => {}, error: () => {}, info: () => {}, award: () => {},
};
