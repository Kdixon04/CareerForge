'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function Input({ label, hint, error, id, className = '', 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionIds = [describedBy, hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null].filter(Boolean).join(' ') || undefined;
  return <div className="cf-field">
    <label className="cf-label" htmlFor={inputId}>{label}</label>
    <input {...props} id={inputId} className={`cf-input ${className}`.trim()} aria-invalid={error ? true : invalid} aria-describedby={descriptionIds} />
    {hint && <p className="cf-hint" id={`${inputId}-hint`}>{hint}</p>}
    {error && <p className="cf-error" id={`${inputId}-error`} role="alert">{error}</p>}
  </div>;
}
