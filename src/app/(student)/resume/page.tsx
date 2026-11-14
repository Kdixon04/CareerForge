import { redirect } from 'next/navigation';
import { StudentProfileSchema, type StudentProfile } from '../../../contracts';
import { exampleStudent } from '../../../data/examples';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import '../../../styles/tokens.css';
import '../../../styles/components.css';
import '../profile/profile.css';

export const dynamic = 'force-dynamic';

const sections = [
  { kind: 'experience', title: 'Experience' },
  { kind: 'project', title: 'Projects' },
  { kind: 'education', title: 'Education' },
  { kind: 'skill', title: 'Skills' },
  { kind: 'interest', title: 'Interests' },
] as const;

async function loadProfile(): Promise<StudentProfile> {
  if (process.env.CAREERFORGE_E2E_PROFILE_FIXTURE === '1') {
    return exampleStudent;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/resume');
  }

  const [{ data: profile, error: profileError }, { data: facts, error: factsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, field, updated_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('student_facts')
        .select('id, kind, text, dates, org')
        .eq('user_id', user.id)
        .order('created_at'),
    ]);

  if (profileError || factsError || !profile) {
    throw new Error('Unable to load your resume data');
  }

  return StudentProfileSchema.parse({
    userId: profile.id,
    displayName: profile.display_name || 'Student',
    field: profile.field,
    facts: facts ?? [],
    updatedAt: new Date(profile.updated_at).toISOString(),
  });
}

export default async function ResumePage() {
  const profile = await loadProfile();

  return (
    <main className="cf-profile">
      <p className="cf-profile-eyebrow">YOUR RESUME</p>
      <h1>Build a resume from your story.</h1>
      <p className="cf-profile-intro">
        Your saved profile facts become the foundation for a resume you can
        improve and tailor to opportunities.
      </p>

      <section className="cf-profile-card" aria-label="Resume preview">
        <header>
          <h2>{profile.displayName}</h2>
          {profile.field && <p>{profile.field}</p>}
        </header>

        {sections.map(section => {
          const facts = profile.facts.filter(fact => fact.kind === section.kind);

          if (facts.length === 0) return null;

          return (
            <section key={section.kind}>
              <h2>{section.title}</h2>

              {facts.map(fact => (
                <article key={fact.id}>
                  <h3>{fact.text}</h3>
                  {(fact.org || fact.dates) && (
                    <p>
                      {[fact.org, fact.dates].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </article>
              ))}
            </section>
          );
        })}

        {profile.facts.length === 0 && (
          <p>
            Add skills, projects, education, and experience on your profile to
            begin building your resume.
          </p>
        )}
      </section>

      <p>
        <a className="cf-button cf-button--secondary" href="/profile">
          Edit profile details
        </a>
      </p>
    </main>
  );
}