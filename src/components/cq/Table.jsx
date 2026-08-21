import React from 'react';
import { cn } from './cn';

/** Horizontally scrollable data table with a caption for screen readers. */
export function DataTable({ caption, head, children, sticky, className, wrapClassName }) {
  return (
    <div className={cn('cq-scroll-x', wrapClassName)}>
      <table className={cn('cq-table', sticky && 'cq-table--sticky', className)}>
        {caption ? <caption className="cq-sr">{caption}</caption> : null}
        {head ? <thead>{head}</thead> : null}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function SortableTh({ label, active, dir, onSort, align = 'left', className, ...rest }) {
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(align === 'right' && 'text-right', className)}
      {...rest}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn('inline-flex items-center gap-1 uppercase tracking-label hover:text-ink-900',
          active && 'text-ink-900')}
      >
        {label}
        <span aria-hidden="true" className={cn('text-[9px]', !active && 'opacity-30')}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
