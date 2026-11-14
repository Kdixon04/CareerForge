'use client';

import type { StudentProfile } from '../../../contracts';
import { ThemeToggle } from '../../../components/theme/ThemeToggle';
import { ProfileForm } from './ProfileForm';

export function ProfilePreview({ initialProfile }: { initialProfile: StudentProfile }) {
  // RootLayout owns the single provider. Keep this page's header until RootShell
  // is applied to the profile route as well as Home.
  return <div className="cf-profile">
      <a className="cf-skip" href="#profile-main">Skip to profile</a>
      <div className="cf-profile-shell">
        <header className="cf-profile-header"><a href="/" className="cf-profile-brand">Career Forge</a><ThemeToggle /></header>
        <main id="profile-main" tabIndex={-1}>
          <p className="cf-profile-eyebrow">YOUR PROFILE</p><h1>Start with your story.</h1>
          <p className="cf-profile-intro">Build a picture of what you know, what you have done and where you want to go.</p>
          <aside className="cf-profile-notice" aria-label="Preview limitations"><strong>Fictional profile preview</strong><p>You are editing Maya Chen's sample profile. Changes stay on this page and reset on reload. Sign-in and secure saving are not connected yet. No profile text is sent to an AI service.</p></aside>
          <ProfileForm initialProfile={initialProfile} />
        </main>
      </div>
    </div>;
}
