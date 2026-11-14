import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../paste-job';
import { findFixtureJob } from '../job-lookup';
import '../../../../styles/tokens.css';
import '../../../../styles/components.css';
import '../jobs.css';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = findFixtureJob(id);

  return (
    <div className="cf-jobs">
      <a className="cf-skip" href="#jobs-main">Skip to content</a>
      <div className="cf-jobs-shell">
        <header className="cf-jobs-header">
          <a href="/" className="cf-jobs-brand">Career Forge</a>
          <a href="/jobs" className="cf-jobs-back">← Back to paste a job</a>
        </header>
        <main id="jobs-main" tabIndex={-1}>
          {job ? <KnownJobDetail job={job} /> : <MissingJobDetail id={id} />}
        </main>
      </div>
    </div>
  );
}

function KnownJobDetail({ job }: { job: NonNullable<ReturnType<typeof findFixtureJob>> }) {
  return (
    <>
      <p className="cf-jobs-eyebrow">JOB DETAIL</p>
      <div className="cf-jobs-card-top" style={{ marginBottom: '0.75rem' }}>
        <span className="cf-jobs-badge cf-jobs-badge--example">Example opportunity</span>
        <span className="cf-jobs-badge cf-jobs-badge--muted">● Unverified</span>
      </div>
      <h1>{job.title}</h1>
      <p className="cf-jobs-intro">
        {job.company}
        {job.location ? ` · ${job.location}` : ''}
        {` · ${JOB_TYPE_LABELS[job.jobType]} · ${WORK_MODE_LABELS[job.workMode]}`}
      </p>

      <aside className="cf-jobs-notice" aria-label="What this page can and cannot do">
        <strong>Fixture preview — not loaded from the database.</strong>
        <p>
          This page shows a fictional sample posting so the student job-detail layout can be reviewed.
          Secure job import and authorized reads are not connected yet. The deadline is{' '}
          {job.deadlineVerified ? 'verified' : 'unverified'}.
        </p>
      </aside>

      <article className="cf-jobs-card" aria-label="Job posting">
        <h2>Description</h2>
        <p className="cf-jobs-card-description">{job.description}</p>
        {job.deadline && (
          <p className="cf-jobs-card-meta">Deadline (unverified): {job.deadline}</p>
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
          Review fictional suggestion bullets against your profile snapshot. Nothing here is saved or sent to an AI service.
        </p>
        <a className="cf-button" href={`/match/${job.id}`}>Review résumé suggestions</a>
        <a className="cf-button cf-button--secondary" href="/jobs">Paste another job</a>
      </section>
    </>
  );
}

function MissingJobDetail({ id }: { id: string }) {
  return (
    <>
      <p className="cf-jobs-eyebrow">JOB DETAIL</p>
      <h1>Job not available</h1>
      <aside className="cf-jobs-notice" aria-label="Missing job">
        <strong>No fixture posting matches this id.</strong>
        <p>
          Only the fictional example job is browsable until secure import and authorized job reads are
          connected. Pasted previews on /jobs stay in the browser and do not create a detail page.
        </p>
      </aside>
      <p className="cf-jobs-card-meta">Requested id: {id}</p>
      <a className="cf-button" href="/jobs">Back to paste a job</a>
    </>
  );
}
