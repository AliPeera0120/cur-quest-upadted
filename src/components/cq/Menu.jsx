import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './cn';

/**
 * Small dropdown. Closes on outside click, Escape, and route-level blur;
 * items are real buttons/links so keyboard and screen readers work by default.
 */
export function Menu({ trigger, children, align = 'end', className, label }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={wrap} className={cn('relative', className)}>
      {React.cloneElement(trigger, {
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'aria-controls': id,
      })}
      {open ? (
        <div
          id={id}
          role="menu"
          aria-label={label}
          onClick={() => setOpen(false)}
          className={cn(
            'absolute top-[calc(100%+6px)] z-dropdown min-w-[12rem] animate-rise overflow-hidden rounded-md border border-ink-900 bg-surface shadow-pop',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, danger, ...rest }) {
  const Tag = rest.to ? Link : rest.href ? 'a' : 'button';
  return (
    <Tag
      role="menuitem"
      type={Tag === 'button' ? 'button' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm no-underline transition-colors duration-1',
        danger ? 'text-danger-700 hover:bg-danger-50' : 'text-ink-800 hover:bg-blue-50 hover:text-ink-900',
      )}
      {...rest}
    >
      {Icon ? <Icon size={15} className="shrink-0 opacity-70" aria-hidden="true" /> : null}
      {children}
    </Tag>
  );
}

export function MenuLabel({ children }) {
  return (
    <p className="border-b border-line bg-paper-2 px-3.5 py-2 text-micro font-semibold uppercase tracking-label text-ink-600">
      {children}
    </p>
  );
}
