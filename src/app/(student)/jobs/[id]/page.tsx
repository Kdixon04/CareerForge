import type { JobPosting } from '../../../../contracts';
import { getPublishedJob } from '../../../../lib/jobs/job-adapter';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../paste-job';
import { findFixtureJob } from '../job-lookup';
import '../../../../styles/tokens.css';
import '../../../../styles/components.css';
import '../jobs.css';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const fixtureMode = process.env.CAREERFORGE_E2E_JOBS_FIXTURE === '1';

  const job = fixtureMode
    ? findFixtureJob(id)
    : await getPublishedJob(id);

  return (
    <div className="cf-jobs">
      <a className="cf-skip" href="#jobs-main">Skip to content</a>

      <div className="cf-jobs-shell">
        <header className="cf-jobs-header">
          <a href="/" className="cf-jobs-brand">Career Forge</a>
          <a href="/jobs" className="cf-jobs-back">← Back to jobs</a>
        </header>

        <main id="jobs-main" tabIndex={-1}>
          {job ? (
            <KnownJobDetail job={job} fixtureMode={fixtureMode} />
          ) : (
            <MissingJobDetail fixtureMode={fixtureMode} id={id} />
          )}
        </main>
      </div>
    </div>
  );
}

function KnownJobDetail({
  job,
  fixtureMode,
}: {
  job: JobPosting;
  fixtureMode: boolean;
}) {
  return (
    <>
      <p className="cf-jobs-eyebrow">JOB DETAIL</p>

      <div className="cf-jobs-card-top" style={{ marginBottom: '0.75rem' }}>
        <span className="cf-jobs-badge cf-jobs-badge--example">
          {fixtureMode ? 'Example opportunity' : 'Published opportunity'}
        </span>
        <span className="cf-jobs-badge cf-jobs-badge--muted">● Unverified</span>
      </div>

      <h1>{job.title}</h1>

      <p className="cf-jobs-intro">
        {job.company}
        {job.location ? ` · ${job.location}` : ''}
        {` · ${JOB_TYPE_LABELS[job.jobType]} · ${WORK_MODE_LABELS[job.workMode]}`}
      </p>

      <aside className="cf-jobs-notice" aria-label="Job status">
        <strong>
          {fixtureMode ? 'Fixture preview — not loaded from the database.' : 'Published job'}
        </strong>
        <p>
          {fixtureMode
            ? 'This is fictional sample data used for UI testing.'
            : 'This job was loaded from Career Forge with authenticated access.'}
          {' '}The deadline is {job.deadlineVerified ? 'verified' : 'unverified'}.
        </p>
      </aside>

      <article className="cf-jobs-card" aria-label="Job posting">
        <h2>Description</h2>
        <p className="cf-jobs-card-description">{job.description}</p>

        {job.deadline && (
          <p className="cf-jobs-card-meta">
            Deadline (unverified): {job.deadline}
          </p>
        )}

        {job.sourceUrl && (
          <p className="cf-jobs-card-source">
            Source:{' '}
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
              {job.sourceUrl}
            </a>
          </p>
        )}

        <p className="cf-jobs-card-meta">
          Source type: {job.source} · Status: {job.status}
        </p>
      </article>

      <section className="cf-jobs-next" aria-label="Next steps">
        <h2>Next steps</h2>
        <p className="cf-jobs-card-note">
          Saving applications and résumé matching will be connected in the next integration steps.
        </p>
        {fixtureMode && (
          <a className="cf-button" href={`/match/${job.id}`}>
            Review résumé suggestions
          </a>
        )}
        <a className="cf-button cf-button--secondary" href="/jobs">
          Back to jobs
        </a>
      </section>
    </>
  );
}

function MissingJobDetail({
  fixtureMode,
  id,
}: {
  fixtureMode: boolean;
  id: string;
}) {
  return (
    <>
      <p className="cf-jobs-eyebrow">JOB DETAIL</p>
      <h1>Job not available</h1>

      <aside className="cf-jobs-notice" aria-label="Missing job">
        <strong>
          {fixtureMode
            ? 'No fixture posting matches this id.'
            : 'No published job matches this id.'}
        </strong>
        <p>
          Published jobs appear in the list on /jobs. Parse previews are not stored until you save a private
          import. Return to jobs to pick a published opportunity or paste again.
        </p>
      </aside>

      <p className="cf-jobs-card-meta">Requested id: {id}</p>

      <a className="cf-button" href="/jobs">
        {fixtureMode ? 'Back to paste a job' : 'Back to jobs'}
      </a>
    </>
  );
}