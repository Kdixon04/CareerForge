'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { MainNav } from '../../nav/MainNav';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { ProfileTestFixture } from './ProfileTestFixture';

export function DesignPreview({ currentPath = '/profile', scenario }: { currentPath?: string; scenario?: string }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid = value.trim().length > 0;
    setError(valid ? '' : 'Enter a career field to try this example.');
    setAccepted(valid);
    if (!valid) formRef.current?.querySelector('input')?.focus();
  }
  if (currentPath === '/profile-form') return <ProfileTestFixture scenario={scenario} />;
  return <ThemeProvider>
    <a className="cf-skip" href="#main">Skip to content</a>
    <div className="preview-shell">
      <header className="preview-header">
        <div className="preview-wordmark"><span aria-hidden="true" className="preview-mark">CF</span><span>Career Forge</span></div>
        <ThemeToggle />
      </header>
      <div className="preview-nav-row"><MainNav currentPath={currentPath} /><span className="preview-tag">Design preview</span></div>
      <main id="main" tabIndex={-1} className="preview-main">
        <section className="preview-intro" aria-labelledby="preview-heading">
          <div>
            <p className="preview-eyebrow">YOUR EXPERIENCE. YOUR NEXT OPPORTUNITY.</p>
            <h1 id="preview-heading">Forge your<br />next chapter.</h1>
            <p className="preview-lead">Start with what you know. Shape it into a story that opens doors.</p>
          </div>
          <figure className="preview-art"><img src="/brand/careerforge.webp" alt="Career Forge: a hammer striking an anvil above a leather satchel" width="1024" height="1024" /><figcaption>The supplied Career Forge artwork</figcaption></figure>
        </section>
        <section className="preview-panel" aria-labelledby="example-heading">
          <div className="preview-panel-heading"><span className="preview-step" aria-hidden="true">01</span><div><p className="preview-eyebrow">BUILT TO START SMALL</p><h2 id="example-heading">{currentPath === '/saved' ? 'A place for your next steps' : 'What will you forge?'}</h2></div></div>
          {currentPath === '/saved' ? <div className="preview-empty"><p>No applications in this preview.</p><p className="cf-hint">The saved-application screen will connect after the shared contracts and adapters arrive.</p></div> : <>
            <p className="preview-description">Try the shared input and buttons below. This example does not create a profile, save information, or contact an AI service.</p>
            <form ref={formRef} onSubmit={submit} noValidate>
              <Input label="Career field" name="careerField" placeholder="e.g. Environmental science" autoComplete="off" maxLength={120} value={value} error={error} hint="Use fictional information while we build and test." onChange={event => { setValue(event.target.value); setError(''); setAccepted(false); }} />
              <div className="preview-actions"><Button type="submit">Try form validation <span aria-hidden="true">→</span></Button><Button variant="secondary" disabled>Unavailable example</Button></div>
              <div className="preview-feedback" role="status" aria-live="polite">{accepted ? 'Example accepted. Nothing was saved or sent.' : ''}</div>
            </form>
          </>}
        </section>
        <footer className="preview-footer"><span>Made for the experience you already have.</span><span>Component fixture · no database connection</span></footer>
      </main>
    </div>
  </ThemeProvider>;
}
