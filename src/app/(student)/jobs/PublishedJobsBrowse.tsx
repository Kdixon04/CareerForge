'use client';

import { useMemo, useState } from 'react';
import type { JobPosting } from '../../../contracts';
import { Button } from '../../../components/ui/Button';
import {
  DEFAULT_PUBLISHED_JOB_FILTERS,
  countPublishedFilterLabel,
  filterPublishedJobs,
  hasActivePublishedFilters,
  type PublishedJobFilters,
} from './published-job-filters';
import { JOB_TYPE_LABELS, JOB_TYPE_OPTIONS, WORK_MODE_LABELS, WORK_MODE_OPTIONS } from './paste-job';

type PublishedJobsBrowseProps = {
  jobs: JobPosting[];
  fixtureMode: boolean;
  sectionLabel: string;
};

export function PublishedJobsBrowse({ jobs, fixtureMode, sectionLabel }: PublishedJobsBrowseProps) {
  const [filters, setFilters] = useState<PublishedJobFilters>(DEFAULT_PUBLISHED_JOB_FILTERS);
  const visible = useMemo(() => filterPublishedJobs(jobs, filters), [jobs, filters]);
  const filtersActive = hasActivePublishedFilters(filters);

  const clearFilters = () => setFilters(DEFAULT_PUBLISHED_JOB_FILTERS);

  return (
    <>
      <fieldset className="cf-jobs-filters" aria-label="Filter loaded opportunities">
        <legend className="cf-jobs-filter-legend">Filter this list</legend>
        <p className="cf-hint" id="jobs-filter-scope">
          Filters only the opportunities already loaded below. This does not search the web or load new jobs.
        </p>
        <div className="cf-jobs-filter-grid">
          <div className="cf-field">
            <label className="cf-label" htmlFor="jobs-filter-keyword">Keyword (title or company)</label>
            <input
              id="jobs-filter-keyword"
              className="cf-input"
              type="search"
              autoComplete="off"
              value={filters.keyword}
              onChange={event => setFilters(current => ({ ...current, keyword: event.target.value }))}
              aria-describedby="jobs-filter-scope"
            />
          </div>
          <div className="cf-field">
            <label className="cf-label" htmlFor="jobs-filter-job-type">Job type</label>
            <select
              id="jobs-filter-job-type"
              className="cf-input"
              value={filters.jobType}
              onChange={event => setFilters(current => ({
                ...current,
                jobType: event.target.value as PublishedJobFilters['jobType'],
              }))}
            >
              <option value="all">All job types</option>
              {JOB_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{JOB_TYPE_LABELS[option]}</option>
              ))}
            </select>
          </div>
          <div className="cf-field">
            <label className="cf-label" htmlFor="jobs-filter-work-mode">Work arrangement</label>
            <select
              id="jobs-filter-work-mode"
              className="cf-input"
              value={filters.workMode}
              onChange={event => setFilters(current => ({
                ...current,
                workMode: event.target.value as PublishedJobFilters['workMode'],
              }))}
            >
              <option value="all">All arrangements</option>
              {WORK_MODE_OPTIONS.map(option => (
                <option key={option} value={option}>{WORK_MODE_LABELS[option]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cf-jobs-filter-actions">
          <Button type="button" variant="secondary" disabled={!filtersActive} onClick={clearFilters}>
            Clear filters
          </Button>
          <p className="cf-hint" role="status" aria-live="polite">
            {countPublishedFilterLabel(visible.length, jobs.length)}
          </p>
        </div>
      </fieldset>

      {visible.length === 0 ? (
        <p className="cf-jobs-filter-empty" role="status">
          <strong>No jobs match these filters.</strong>
          {' '}Try different keywords or{' '}
          <button type="button" className="cf-jobs-text-button" onClick={clearFilters}>clear filters</button>.
        </p>
      ) : (
        <div className="cf-jobs-browse-list" aria-label={sectionLabel}>
          {visible.map(job => (
            <article key={job.id} className="cf-jobs-browse-card">
              <h2>{job.title}</h2>
              <p className="cf-jobs-card-meta">
                {job.company}
                {job.location ? ` · ${job.location}` : ''}
                {` · ${JOB_TYPE_LABELS[job.jobType]} · ${WORK_MODE_LABELS[job.workMode]}`}
              </p>
              <p className="cf-jobs-card-description">{job.description}</p>
              {job.sourceUrl && (
                <p className="cf-jobs-card-source">
                  Source:{' '}
                  <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">{job.sourceUrl}</a>
                </p>
              )}
              <p className="cf-jobs-card-note">
                {fixtureMode
                  ? 'Fictional sample data, shown to illustrate the layout.'
                  : 'Published through Career Forge.'}
              </p>
              <p className="cf-jobs-example-actions">
                <a className="cf-button cf-button--secondary" href={`/jobs/${job.id}`}>
                  {fixtureMode ? 'Open example job detail' : 'Open job detail'}
                </a>
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}