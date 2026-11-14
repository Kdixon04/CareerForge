'use client';

import { useState } from 'react';
import { exampleStudent } from '../../../data/examples';
import { ProfileForm, type ProfileFormProps } from '../../../app/(student)/profile/ProfileForm';
import { ProfileSaveError } from '../../../app/(student)/profile/profile-model';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ThemeToggle } from '../../theme/ThemeToggle';

// Served only by the loopback component harness; no simulated save API in Next.js.
export function ProfileTestFixture({ scenario = 'success' }: { scenario?: string }) {
  const [calls, setCalls] = useState(0);
  const [expectedVersion, setExpectedVersion] = useState('');
  const onSave: NonNullable<ProfileFormProps['onSave']> = async (draft, version) => {
    setCalls(value => value + 1); setExpectedVersion(version);
    await new Promise(resolve => setTimeout(resolve, 350));
    if (scenario === 'conflict') throw new ProfileSaveError('conflict');
    if (scenario === 'error') throw new ProfileSaveError('unavailable');
    return { ...exampleStudent, ...draft, updatedAt: '2026-11-14T07:00:00.000Z' };
  };
  return <ThemeProvider><div className="cf-profile"><div className="cf-profile-shell">
    <header className="cf-profile-header"><strong>Simulated save callback — no database</strong><ThemeToggle /></header>
    <main><h1>Profile component test fixture</h1><p>Fictional inputs; all saves are simulated and reset on reload.</p>
      <ProfileForm initialProfile={exampleStudent} onSave={onSave} />
      <p data-testid="save-call-count">{calls}</p><p data-testid="expected-version">{expectedVersion}</p>
    </main>
  </div></div></ThemeProvider>;
}
