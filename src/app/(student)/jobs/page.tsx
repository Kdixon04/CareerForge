import { exampleJob } from '../../../data/examples';
import { listPublishedJobs } from '../../../lib/jobs/job-adapter';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from './paste-job';
import { PasteJobForm } from './PasteJobForm';
import '../../../styles/tokens.css';
import '../../../styles/components.css';
import './jobs.css';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const fixtureMode = process.env.CAREERFORGE_E2E_JOBS_FIXTURE === '1';
  const jobs = fixtureMode ? [exampleJob] : await listPublishedJobs();

  return (
    <div className="cf-jobs">
      <a className="cf-skip" href="#jobs-main">Skip to content</a>

      <div className="cf-jobs-shell">
        <header className="cf-jobs-header">
          <a href="/" className="cf-jobs-brand">Career Forge</a>
        </header>

        <main id="jobs-main" tabIndex={-1}>
          <p className="cf-jobs-eyebrow">FIND A JOB</p>
          <h1>Find opportunities worth pursuing.</h1>
          <p className="cf-jobs-intro">
            Browse published opportunities or paste a job description to create a private preview.
          </p>

          <aside className="cf-jobs-notice" aria-label="What this page can and cannot do">
            <strong>
              {fixtureMode ? 'Nothing here is saved yet.' : 'Published opportunities'}
            </strong>
            <p>
              {fixtureMode
                ? 'Pasting a job builds an unsaved preview in your browser.'
                : 'Published employer opportunities are loaded securely from Career Forge.'}
              {' '}Every job is treated as <em>unverified</em> until a real source confirms it.
            </p>
          </aside>

          <section
            className="cf-jobs-example"
            aria-label={fixtureMode ? 'Example opportunity' : 'Published opportunities'}
          >
            <div className="cf-jobs-card-top">
              <span className="cf-jobs-badge cf-jobs-badge--example">
                {fixtureMode ? 'Example opportunity' : 'Published opportunity'}
              </span>
              <span className="cf-jobs-badge cf-jobs-badge--muted">● Unverified</span>
            </div>

            {jobs.length === 0 ? (
              <>
                <h2>No published opportunities yet</h2>
                <p className="cf-jobs-card-note">
                  Check back soon or paste a job description below.
                </p>
              </>
            ) : (
              jobs.map(job => (
                <article key={job.id}>
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
                      <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {job.sourceUrl}
                      </a>
                    </p>
                  )}

                  <p className="cf-jobs-card-note">
                    {fixtureMode
                      ? 'Fictional sample data, shown to illustrate the layout.'
                      : 'Published through Career Forge.'}
                  </p>

                  <p className="cf-jobs-example-actions">
                    <a
                      className="cf-button cf-button--secondary"
                      href={`/jobs/${job.id}`}
                    >
                      Open job detail
                    </a>
                  </p>
                </article>
              ))
            )}
          </section>

          <h2 className="cf-jobs-form-heading">Paste your own</h2>
          <PasteJobForm />
        </main>
      </div>
    </div>
  );
}