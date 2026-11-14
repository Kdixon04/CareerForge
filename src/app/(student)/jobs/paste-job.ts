import { z } from 'zod';
import { JobDraftSchema, type JobDraft } from '../../../contracts';

// Raw string values as they come off the paste form. Optional fields arrive as
// empty strings and are normalized to null before validation.
export type PasteJobInput = {
  title: string;
  company: string;
  description: string;
  location: string;
  jobType: string;
  workMode: string;
  sourceUrl: string;
  deadline: string;
};

export type PasteJobFieldErrors = Partial<Record<keyof PasteJobInput, string>>;

export type PasteJobResult =
  | { ok: true; draft: JobDraft }
  | { ok: false; errors: PasteJobFieldErrors };

export const JOB_TYPE_OPTIONS = ['internship', 'full_time', 'part_time', 'co_op', 'contract', 'unknown'] as const;
export const WORK_MODE_OPTIONS = ['remote', 'hybrid', 'on_site', 'unknown'] as const;

export const JOB_TYPE_LABELS: Record<string, string> = {
  internship: 'Internship', full_time: 'Full time', part_time: 'Part time',
  co_op: 'Co-op', contract: 'Contract', unknown: 'Not specified',
};
export const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remote', hybrid: 'Hybrid', on_site: 'On site', unknown: 'Not specified',
};

function friendlyMessage(issue: z.ZodIssue): string {
  const field = issue.path[0];
  if (field === 'sourceUrl') return 'Enter a full https:// URL, or leave it blank.';
  if (field === 'deadline') return 'Use the date format YYYY-MM-DD, or leave it blank.';
  if (field === 'description' && issue.code === 'too_big') {
    return 'Description is too long (20,000 characters maximum).';
  }
  return 'This field is required.';
}

export function parseJobDraft(input: PasteJobInput): PasteJobResult {
  const candidate = {
    title: input.title.trim(),
    company: input.company.trim(),
    description: input.description.trim(),
    location: input.location.trim() || null,
    jobType: input.jobType,
    workMode: input.workMode,
    sourceUrl: input.sourceUrl.trim() || null,
    deadline: input.deadline.trim() || null,
  };
  const parsed = JobDraftSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, draft: parsed.data };

  const errors: PasteJobFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof PasteJobInput | undefined;
    if (key && !errors[key]) errors[key] = friendlyMessage(issue);
  }
  return { ok: false, errors };
}
