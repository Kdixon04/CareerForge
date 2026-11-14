'use client';

import { useRef, useState } from 'react';
import { JobPostingSchema, type JobPosting } from '../../../contracts';
import { submitPasteJob } from '../../../lib/jobs/submit-paste';
import {
  JOB_TYPE_LABELS,
  JOB_TYPE_OPTIONS,
  WORK_MODE_LABELS,
  WORK_MODE_OPTIONS,
  type PasteJobFieldErrors,
  type PasteJobInput,
} from './paste-job';

const EMPTY: PasteJobInput = {
  title: '', company: '', description: '', location: '',
  jobType: 'unknown', workMode: 'unknown', sourceUrl: '', deadline: '',
};

export function PasteJobForm() {
  const [values, setValues] = useState<PasteJobInput>(EMPTY);
  const [errors, setErrors] = useState<PasteJobFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<JobPosting | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const sourceUrlRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);

  

  const update = (field: keyof PasteJobInput) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setValues(current => ({ ...current, [field]: event.target.value }));

  const focusFirstError = (fieldErrors: PasteJobFieldErrors) => {
    if (fieldErrors.title) titleRef.current?.focus();
    else if (fieldErrors.company) companyRef.current?.focus();
    else if (fieldErrors.description) descriptionRef.current?.focus();
    else if (fieldErrors.sourceUrl) sourceUrlRef.current?.focus();
    else if (fieldErrors.deadline) deadlineRef.current?.focus();
  };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setSaveMessage('');

    const result = await submitPasteJob(values);
    setIsSubmitting(false);

    if (result.ok) {
      setErrors({});
      setPreview(result.posting);
    } else {
      setPreview(null);
      setErrors(result.errors);

      if (result.message && !Object.keys(result.errors).length) {
        setServerError(result.message);
      }

      focusFirstError(result.errors);
    }
  };

  async function savePreview() {
    if (!preview || isSaving) return;

    setIsSaving(true);
    setSaveMessage('');
    setServerError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preview.title,
          company: preview.company,
          description: preview.description,
          location: preview.location,
          jobType: preview.jobType,
          workMode: preview.workMode,
          sourceUrl: preview.sourceUrl,
          deadline: preview.deadline,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setServerError(body?.error ?? 'Could not save this job.');
        return;
      }

      const parsed = JobPostingSchema.safeParse(body?.data);

      if (!parsed.success) {
        setServerError('The saved job response was invalid.');
        return;
      }

      setPreview(parsed.data);
      setSaveMessage('Job saved privately.');
    } catch {
      setServerError('Could not reach the job save service.');
    } finally {
      setIsSaving(false);
    }
  }

  const describedBy = (field: keyof PasteJobInput, hintId?: string) =>
    [hintId, errors[field] ? `${field}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="cf-jobs-grid">
      <form className="cf-jobs-form" aria-label="Paste a job description" noValidate onSubmit={onSubmit}>
        {serverError && (
          <p className="cf-error" role="alert" id="server-error">{serverError}</p>
        )}

        <div className="cf-field">
          <label className="cf-label" htmlFor="title">Job title</label>
          <input
            ref={titleRef} id="title" name="title" className="cf-input" value={values.title}
            onChange={update('title')} aria-invalid={errors.title ? true : undefined}
            aria-describedby={describedBy('title')}
          />
          {errors.title && <p className="cf-error" id="title-error">{errors.title}</p>}
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="company">Company</label>
          <input
            ref={companyRef} id="company" name="company" className="cf-input" value={values.company}
            onChange={update('company')} aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy('company')}
          />
          {errors.company && <p className="cf-error" id="company-error">{errors.company}</p>}
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="description">Job description</label>
          <p className="cf-hint" id="description-hint">Paste the full text from the posting. It is rendered as plain text, never as HTML.</p>
          <textarea
            ref={descriptionRef} id="description" name="description" className="cf-input" rows={8}
            value={values.description} onChange={update('description')}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={describedBy('description', 'description-hint')}
          />
          {errors.description && <p className="cf-error" id="description-error">{errors.description}</p>}
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="location">Location <span className="cf-jobs-optional">(optional)</span></label>
          <input id="location" name="location" className="cf-input" value={values.location} onChange={update('location')} />
        </div>

        <div className="cf-jobs-row">
          <div className="cf-field">
            <label className="cf-label" htmlFor="jobType">Job type</label>
            <select id="jobType" name="jobType" className="cf-input" value={values.jobType} onChange={update('jobType')}>
              {JOB_TYPE_OPTIONS.map(option => <option key={option} value={option}>{JOB_TYPE_LABELS[option]}</option>)}
            </select>
          </div>
          <div className="cf-field">
            <label className="cf-label" htmlFor="workMode">Work arrangement</label>
            <select id="workMode" name="workMode" className="cf-input" value={values.workMode} onChange={update('workMode')}>
              {WORK_MODE_OPTIONS.map(option => <option key={option} value={option}>{WORK_MODE_LABELS[option]}</option>)}
            </select>
          </div>
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="sourceUrl">Source URL <span className="cf-jobs-optional">(optional)</span></label>
          <input
            ref={sourceUrlRef} id="sourceUrl" name="sourceUrl" className="cf-input" inputMode="url" placeholder="https://"
            value={values.sourceUrl} onChange={update('sourceUrl')}
            aria-invalid={errors.sourceUrl ? true : undefined} aria-describedby={describedBy('sourceUrl')}
          />
          {errors.sourceUrl && <p className="cf-error" id="sourceUrl-error">{errors.sourceUrl}</p>}
        </div>

        <div className="cf-field">
          <label className="cf-label" htmlFor="deadline">Application deadline <span className="cf-jobs-optional">(optional, YYYY-MM-DD)</span></label>
          <input
            ref={deadlineRef} id="deadline" name="deadline" className="cf-input" placeholder="2026-12-01"
            value={values.deadline} onChange={update('deadline')}
            aria-invalid={errors.deadline ? true : undefined} aria-describedby={describedBy('deadline')}
          />
          {errors.deadline && <p className="cf-error" id="deadline-error">{errors.deadline}</p>}
        </div>

        <button className="cf-button" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Parsing...' : 'Preview pasted job'}
        </button>
      </form>

      <section
        className="cf-jobs-preview"
        aria-label="Pasted job preview"
        aria-live="polite"
      >
        {preview ? (
          <article className="cf-jobs-card">
            <div className="cf-jobs-card-top">
              <span className="cf-jobs-badge">
  	      	{saveMessage ? 'Saved privately' : 'Preview — not saved'}
	      </span>
              <span className="cf-jobs-badge cf-jobs-badge--muted">
                ● Unverified
              </span>
            </div>

            <h3>{preview.title}</h3>

            <p className="cf-jobs-card-meta">
              {preview.company}
              {preview.location ? ` · ${preview.location}` : ''}
              {` · ${JOB_TYPE_LABELS[preview.jobType]} · ${WORK_MODE_LABELS[preview.workMode]}`}
            </p>

            {preview.deadline && (
              <p className="cf-jobs-card-meta">
                Deadline (unverified): {preview.deadline}
              </p>
            )}

            <p className="cf-jobs-card-description">
              {preview.description}
            </p>

            {preview.sourceUrl && (
              <p className="cf-jobs-card-source">
                Source:{' '}
                <a
                  href={preview.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {preview.sourceUrl}
                </a>
              </p>
            )}

            <p className="cf-jobs-card-note">
              {saveMessage
                ? 'This job is saved privately to your Career Forge account.'
                : 'This preview is private and has not been saved yet.'}
            </p>

            <button
              className="cf-button"
              type="button"
              onClick={savePreview}
              disabled={isSaving || Boolean(saveMessage)}
            >
              {isSaving
                ? 'Saving…'
                : saveMessage
                  ? 'Saved privately'
                  : 'Save privately'}
            </button>

            {saveMessage && (
              <p className="cf-profile-status" role="status">
                {saveMessage}
              </p>
            )}
          </article>
        ) : (
          <p className="cf-jobs-empty">
            Your pasted job will appear here as an unsaved preview after you
            select “Preview pasted job”.
          </p>
        )}
      </section>
    </div>
  );
}
