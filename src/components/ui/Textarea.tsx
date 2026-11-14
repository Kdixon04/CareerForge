'use client';

import { useId, type TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({ id, label, hint, error, className = '', 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props }: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionIds = [describedBy, hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null].filter(Boolean).join(' ') || undefined;
  return <div className="cf-field">
    <label className="cf-label" htmlFor={inputId}>{label}</label>
    <textarea {...props} id={inputId} className={`cf-input ${className}`.trim()} aria-invalid={error ? true : invalid} aria-describedby={descriptionIds} />
    {hint && <p className="cf-hint" id={`${inputId}-hint`}>{hint}</p>}
    {error && <p className="cf-error" id={`${inputId}-error`} role="alert">{error}</p>}
  </div>;
}
