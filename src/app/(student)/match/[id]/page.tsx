import { findFixtureMatch } from '../match-lookup';
import { MatchReview } from '../MatchReview';
import '../../../../styles/tokens.css';
import '../../../../styles/components.css';
import '../match.css';

type MatchPageProps = {
  params: Promise<{ id: string }>;
};

function formatJobSource(job: NonNullable<ReturnType<typeof findFixtureMatch>>['job']) {
  if (job.sourceUrl && job.retrievedAt) {
    return (
      <>
        Source:{' '}
        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
          {job.sourceUrl}
        </a>
        {' · '}Retrieved (unverified): {job.retrievedAt}
      </>
    );
  }
  if (job.sourceUrl) {
    return (
      <>
        Source:{' '}
        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
          {job.sourceUrl}
        </a>
      </>
    );
  }
  return <>Source: pasted / unverified</>;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = await params;
  const bundle = findFixtureMatch(id);

  return (
    <div className="cf-match">
      <div className="cf-match-shell">
        <main id="main" tabIndex={-1}>
          <p style={{ margin: '0 0 1.5rem' }}>
            <a
              href={bundle ? `/jobs/${bundle.job.id}` : '/jobs'}
              className="cf-match-back"
              aria-label="Back to job detail"
            >
              ← Back to job detail
            </a>
          </p>
          {bundle ? <KnownMatch bundle={bundle} /> : <MissingMatch id={id} />}
        </main>
      </div>
    </div>
  );
}

function KnownMatch({ bundle }: { bundle: NonNullable<ReturnType<typeof findFixtureMatch>> }) {
  const { job, resume } = bundle;
  return (
    <>
      <p className="cf-match-eyebrow">RÉSUMÉ SUGGESTIONS</p>
      <h1>{job.title}</h1>
      <p className="cf-match-meta">{job.company}</p>

      <aside className="cf-match-notice" aria-label="Fixture and AI limitations">
        <strong>Fixture preview — not saved.</strong>
        <p>AI suggestions not connected yet. These bullets are fictional sample output for layout review only.</p>
      </aside>

      <p className="cf-match-source">{formatJobSource(job)}</p>

      <MatchReview resume={resume} />
    </>
  );
}

function MissingMatch({ id }: { id: string }) {
  return (
    <>
      <p className="cf-match-eyebrow">RÉSUMÉ SUGGESTIONS</p>
      <h1>Suggestions not available</h1>
      <aside className="cf-match-notice" aria-label="Missing match">
        <strong>No fixture suggestions for this job id.</strong>
        <p>Only the fictional example job has a sample match until suggest/read routes are connected.</p>
      </aside>
      <p className="cf-match-meta">Requested job id: {id}</p>
      <a className="cf-button" href="/jobs">Back to paste a job</a>
    </>
  );
}