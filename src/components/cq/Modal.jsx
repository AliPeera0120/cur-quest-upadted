import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';

/**
 * Focus-trapped dialog. Restores focus to the trigger on close, closes on
 * Escape and on backdrop click, and locks background scroll.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', className }) {
  const ref = useRef(null);
  const lastFocused = useRef(null);
  const titleId = useId();
  const descId = useId();

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const focusable = ref.current.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = ref.current?.querySelector('[data-autofocus],button,a[href],input,select,textarea');
      el?.focus();
    }, 20);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg';

  return createPortal(
    <div
      className="cq-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn('cq-sheet', width, className)}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <h2 id={titleId} className="text-h4 font-display font-semibold">{title}</h2>
              {description ? <p id={descId} className="mt-1 text-sm text-ink-700">{description}</p> : null}
            </div>
            <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close dialog">
              <X size={17} aria-hidden="true" />
            </Button>
          </div>
        ) : null}
        <div className="px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper-2 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
