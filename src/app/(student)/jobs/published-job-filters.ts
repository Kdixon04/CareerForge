import type { JobPosting } from '../../../contracts';

export type PublishedJobFilters = {
  keyword: string;
  jobType: 'all' | JobPosting['jobType'];
  workMode: 'all' | JobPosting['workMode'];
};

export const DEFAULT_PUBLISHED_JOB_FILTERS: PublishedJobFilters = {
  keyword: '',
  jobType: 'all',
  workMode: 'all',
};

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase();
}

/** Client-side filter over the jobs already loaded for this page — not a new search. */
export function filterPublishedJobs(jobs: JobPosting[], filters: PublishedJobFilters): JobPosting[] {
  const keyword = normalizeKeyword(filters.keyword);

  return jobs.filter(job => {
    if (filters.jobType !== 'all' && job.jobType !== filters.jobType) return false;
    if (filters.workMode !== 'all' && job.workMode !== filters.workMode) return false;
    if (!keyword) return true;
    const haystack = `${job.title} ${job.company}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function hasActivePublishedFilters(filters: PublishedJobFilters): boolean {
  return (
    normalizeKeyword(filters.keyword).length > 0
    || filters.jobType !== 'all'
    || filters.workMode !== 'all'
  );
}

export function countPublishedFilterLabel(visible: number, total: number): string {
  return `Showing ${visible} of ${total} published opportunities on this page.`;
}