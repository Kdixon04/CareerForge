'use client';

import type { StudentProfile } from '../../../contracts';
import { StudentProfileSchema } from '../../../contracts';
import { ThemeProvider } from '../../../components/theme/ThemeProvider';
import { ThemeToggle } from '../../../components/theme/ThemeToggle';
import { ProfileForm } from './ProfileForm';
import { ProfileSaveError, type ProfileDraft } from './profile-model';

async function saveProfile(draft: ProfileDraft, expectedUpdatedAt: string): Promise<StudentProfile> {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, expectedUpdatedAt }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ProfileSaveError(response.status === 409 ? 'conflict' : 'unavailable');
  }

  const parsed = StudentProfileSchema.safeParse(body?.data);

  if (!parsed.success) {
    throw new ProfileSaveError('unavailable');
  }

  return parsed.data;
}

export function ProfilePreview({ initialProfile }: { initialProfile: StudentProfile }) {
  return (
    <ThemeProvider>
      <div className="cf-profile">
        <a className="cf-skip" href="#profile-main">Skip to profile</a>

        <div className="cf-profile-shell">
          <header className="cf-profile-header">
            <a href="/" className="cf-profile-brand">Career Forge</a>
            <ThemeToggle />
          </header>

          <main id="profile-main" tabIndex={-1}>
            <p className="cf-profile-eyebrow">YOUR PROFILE</p>
            <h1>Start with your story.</h1>
            <p className="cf-profile-intro">
              Build a picture of what you know, what you have done and where you want to go.
            </p>

            <aside className="cf-profile-notice" aria-label="Profile status">
              <strong>Connected profile</strong>
              <p>
                This profile is loaded from your Career Forge account. Changes save securely
                to your account. No profile text is sent to an AI service.
              </p>
            </aside>

            <ProfileForm initialProfile={initialProfile} onSave={saveProfile} />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}