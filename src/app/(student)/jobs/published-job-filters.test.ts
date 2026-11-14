import { describe, expect, it } from 'vitest';
import type { JobPosting } from '../../../contracts';
import { exampleJob } from '../../../data/examples';
import {
  countPublishedFilterLabel,
  filterPublishedJobs,
  hasActivePublishedFilters,
  type PublishedJobFilters,
} from './published-job-filters';

const secondJob: JobPosting = {
  ...exampleJob,
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  title: 'Remote Design Intern',
  company: 'Summit Studio',
  jobType: 'internship',
  workMode: 'remote',
  description: 'Support design systems.',
};

const jobs = [exampleJob, secondJob];
const allFilters: PublishedJobFilters = { keyword: '', jobType: 'all', workMode: 'all' };

describe('filterPublishedJobs', () => {
  it('returns all jobs when filters are empty', () => {
    expect(filterPublishedJobs(jobs, allFilters)).toHaveLength(2);
  });

  it('filters by keyword in title or company', () => {
    expect(filterPublishedJobs(jobs, { ...allFilters, keyword: 'north star' })).toEqual([exampleJob]);
    expect(filterPublishedJobs(jobs, { ...allFilters, keyword: 'summit' })).toEqual([secondJob]);
    expect(filterPublishedJobs(jobs, { ...allFilters, keyword: '  intern  ' })).toHaveLength(1);
  });

  it('filters by job type and work mode', () => {
    expect(filterPublishedJobs(jobs, { ...allFilters, jobType: 'full_time' })).toEqual([exampleJob]);
    expect(filterPublishedJobs(jobs, { ...allFilters, workMode: 'remote' })).toEqual([secondJob]);
  });

  it('combines filters', () => {
    expect(filterPublishedJobs(jobs, { keyword: 'design', jobType: 'internship', workMode: 'all' })).toEqual([
      secondJob,
    ]);
    expect(filterPublishedJobs(jobs, { keyword: 'design', jobType: 'full_time', workMode: 'all' })).toEqual([]);
  });
});

describe('hasActivePublishedFilters', () => {
  it('detects any non-default filter', () => {
    expect(hasActivePublishedFilters(allFilters)).toBe(false);
    expect(hasActivePublishedFilters({ ...allFilters, keyword: 'a' })).toBe(true);
    expect(hasActivePublishedFilters({ ...allFilters, jobType: 'internship' })).toBe(true);
  });
});

describe('countPublishedFilterLabel', () => {
  it('describes visible count without implying external search', () => {
    expect(countPublishedFilterLabel(2, 5)).toBe('Showing 2 of 5 published opportunities on this page.');
    expect(countPublishedFilterLabel(0, 3)).toBe('Showing 0 of 3 published opportunities on this page.');
  });
});