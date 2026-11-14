import { fixturePrepBundle, prepFixtureFacts } from '../../fixture-prep-hub';
import { PrepHub } from './PrepHub';
import '../../../../../styles/tokens.css';
import '../../../../../styles/components.css';
import '../../jobs.css';
import './prep.css';

export const dynamic = 'force-dynamic';

type PrepPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PrepPage({ params }: PrepPageProps) {
  const { id } = await params;
  const bundle = fixturePrepBundle();
  const facts = prepFixtureFacts();

  return (
    <div className="cf-jobs">
      <a className="cf-skip" href="#prep-main">Skip to content</a>

      <div className="cf-jobs-shell">
        <header className="cf-jobs-header">
          <a href="/" className="cf-jobs-brand">Career Forge</a>
          <a href={`/jobs/${id}`} className="cf-jobs-back">← Back to job detail</a>
        </header>

        <main id="prep-main" tabIndex={-1}>
          <p className="cf-jobs-eyebrow">PREP FOR THIS ROLE</p>
          <h1>Interview prep (preview)</h1>

          <aside className="cf-jobs-notice" aria-label="Prep hub limitations">
            <strong>Preview with fictional sample data.</strong>
            <p>
              This prep hub shows fictional sample content for layout review only. It is not generated from the real
              job yet, nothing here is verified, and no data is sent anywhere. Live, role-specific prep is not connected.
            </p>
          </aside>

          <PrepHub bundle={bundle} facts={facts} />

          <section className="cf-jobs-next" aria-label="Back to job">
            <a className="cf-button cf-button--secondary" href={`/jobs/${id}`}>Back to job detail</a>
          </section>
        </main>
      </div>
    </div>
  );
}
