import { exampleJob } from '../../../data/examples';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from './paste-job';
import { PasteJobForm } from './PasteJobForm';
import '../../../styles/tokens.css';
import '../../../styles/components.css';
import './jobs.css';

export default function JobsPage() {
  return (
    <div className="cf-jobs">
      <a className="cf-skip" href="#jobs-main">Skip to content</a>
      <div className="cf-jobs-shell">
        <header className="cf-jobs-header">
          <a href="/" className="cf-jobs-brand">Career Forge</a>
        </header>
        <main id="jobs-main" tabIndex={-1}>
          <p className="cf-jobs-eyebrow">FIND A JOB</p>
          <h1>Paste a job to get started.</h1>
          <p className="cf-jobs-intro">
            Paste a real job description to build a private preview. Live discovery through Claude is coming; for now the
            pasted-job path is the supported way in.
          </p>
          <aside className="cf-jobs-notice" aria-label="What this page can and cannot do">
            <strong>Nothing here is saved yet.</strong>
            <p>
              Pasting a job builds an unsaved preview in your browser. Secure import, saved applications and AI résumé
              suggestions are not connected yet. Every job is treated as <em>unverified</em> until a real source confirms it.
            </p>
          </aside>

          <section className="cf-jobs-example" aria-label="Example opportunity">
            <div className="cf-jobs-card-top">
              <span className="cf-jobs-badge cf-jobs-badge--example">Example opportunity</span>
              <span className="cf-jobs-badge cf-jobs-badge--muted">● Unverified</span>
            </div>
            <h2>{exampleJob.title}</h2>
            <p className="cf-jobs-card-meta">
              {exampleJob.company}
              {exampleJob.location ? ` · ${exampleJob.location}` : ''}
              {` · ${JOB_TYPE_LABELS[exampleJob.jobType]} · ${WORK_MODE_LABELS[exampleJob.workMode]}`}
            </p>
            <p className="cf-jobs-card-description">{exampleJob.description}</p>
            {exampleJob.sourceUrl && (
              <p className="cf-jobs-card-source">
                Source: <a href={exampleJob.sourceUrl} target="_blank" rel="noopener noreferrer">{exampleJob.sourceUrl}</a>
              </p>
            )}
            <p className="cf-jobs-card-note">Fictional sample data, shown to illustrate the layout.</p>
          </section>

          <h2 className="cf-jobs-form-heading">Paste your own</h2>
          <PasteJobForm />
        </main>
      </div>
    </div>
  );
}
