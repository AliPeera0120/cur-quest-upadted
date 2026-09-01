import React, { useId, useRef } from 'react';
import { cn } from './cn';

/**
 * Roving-tabindex tab strip. Arrow keys move between tabs, matching the
 * WAI-ARIA authoring practice, so keyboard users don't tab through every tab.
 */
export function Tabs({ tabs, value, onChange, className, size = 'md', ariaLabel }) {
  const base = useId();
  const refs = useRef({});

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.value === value);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next == null) return;
    e.preventDefault();
    onChange(tabs[next].value);
    refs.current[tabs[next].value]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('flex gap-1 overflow-x-auto border-b border-line', className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[t.value] = el; }}
            role="tab"
            id={`${base}-${t.value}`}
            aria-selected={active}
            aria-controls={t.panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 font-display font-semibold transition-colors duration-1 ease-out',
              size === 'sm' ? 'min-h-[2.5rem] text-xs' : 'min-h-[3rem] text-sm',
              active ? 'border-ember-500 text-ink-900' : 'border-transparent text-ink-600 hover:text-ink-900',
            )}
          >
            {t.icon ? <t.icon size={15} aria-hidden="true" /> : null}
            {t.label}
            {t.count != null ? (
              <span className={cn('cq-data text-micro', active ? 'text-ember-700' : 'text-ink-500')}>{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
