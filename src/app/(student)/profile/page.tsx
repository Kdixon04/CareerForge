import { redirect } from 'next/navigation';
import { StudentProfileSchema } from '../../../contracts';
import { exampleStudent } from '../../../data/examples';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { ProfilePreview } from './ProfilePreview';
import '../../../styles/tokens.css';
import '../../../styles/components.css';
import './profile.css';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  if (process.env.CAREERFORGE_E2E_PROFILE_FIXTURE === '1') {
    return <ProfilePreview initialProfile={exampleStudent} fixtureMode />;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in?next=/profile');
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
    throw new Error('Unable to load your profile');
  }

  const initialProfile = StudentProfileSchema.parse({
    userId: profile.id,
    displayName: profile.display_name || 'Student',
    field: profile.field,
    facts: facts ?? [],
    updatedAt: new Date(profile.updated_at).toISOString(),
  });

  return <ProfilePreview initialProfile={initialProfile} />;
}
