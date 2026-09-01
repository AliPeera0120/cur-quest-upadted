import React, { forwardRef, useId } from 'react';
import { cn } from './cn';

/**
 * One field wrapper handles label, hint, error and the aria wiring, so no
 * screen can accidentally ship an unlabelled input.
 */
export function Field({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label className="cq-label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-1 text-danger-600" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="cq-error" role="alert">{error}</p>
      ) : hint ? (
        <p className="cq-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, code, className, id, required, ...rest }, ref,
) {
  const auto = useId();
  const inputId = id || auto;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={cn('cq-field', code && 'cq-field--code', className)}
        {...rest}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, className, id, rows = 4, required, ...rest }, ref,
) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={cn('cq-field resize-y', className)}
        {...rest}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, options = [], className, id, placeholder, required, children, ...rest }, ref,
) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          className={cn('cq-field appearance-none pr-9', className)}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
          {children}
        </select>
        <svg
          aria-hidden="true" viewBox="0 0 12 12" width="11" height="11"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-600"
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    </Field>
  );
});

export function Checkbox({ label, hint, className, id, ...rest }) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        type="checkbox"
        id={inputId}
        className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 cursor-pointer rounded-xs border border-ink-300 accent-[var(--cq-blue-600)]"
        {...rest}
      />
      <label htmlFor={inputId} className="cursor-pointer text-sm text-ink-800">
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-ink-600">{hint}</span> : null}
      </label>
    </div>
  );
}

export function Switch({ label, hint, checked, onChange, id, className }) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={inputId} className="cursor-pointer text-sm text-ink-800">
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-ink-600">{hint}</span> : null}
      </label>
      <button
        type="button"
        role="switch"
        id={inputId}
        aria-checked={!!checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-2 ease-out',
          checked ? 'border-blue-700 bg-blue-600' : 'border-ink-300 bg-ink-100',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-4 w-4 rounded-pill bg-white shadow-hair transition-[left] duration-2 ease-out',
            checked ? 'left-[1.4rem]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  );
}
