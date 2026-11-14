import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { StudentProfileSchema } from '../../../contracts';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

const ProfileUpdateSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  displayName: z.string().trim().min(1).max(120),
  field: z.string().trim().max(160).nullable(),
  facts: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.enum(['skill', 'education', 'project', 'experience', 'interest']),
      text: z.string().trim().min(1).max(2000),
      dates: z.string().trim().max(100).nullable(),
      org: z.string().trim().max(200).nullable(),
    }),
  ).max(100),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
  }

 const { data: currentProfile, error: currentProfileError } = await supabase
  .from('profiles')
  .select('updated_at')
  .eq('id', user.id)
  .single();

if (currentProfileError || !currentProfile) {
  return NextResponse.json({ error: 'Unable to load current profile' }, { status: 500 });
}

const currentTime = new Date(currentProfile.updated_at).getTime();
const expectedTime = new Date(parsed.data.expectedUpdatedAt).getTime();

if (currentTime !== expectedTime) {
  return NextResponse.json(
    { error: 'Profile changed; reload before saving' },
    { status: 409 },
  );
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .update({
    display_name: parsed.data.displayName,
    field: parsed.data.field || null,
  })
  .eq('id', user.id)
  .select('id, display_name, field, updated_at')
  .single();

if (profileError || !profile) {
  return NextResponse.json({ error: 'Unable to save profile' }, { status: 500 });
}

  const { error: deleteError } = await supabase
    .from('student_facts')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json({ error: 'Unable to save profile facts' }, { status: 500 });
  }

  if (parsed.data.facts.length > 0) {
    const { error: insertError } = await supabase
      .from('student_facts')
      .insert(parsed.data.facts.map(fact => ({
        id: fact.id,
        user_id: user.id,
        kind: fact.kind,
        text: fact.text,
        dates: fact.dates || null,
        org: fact.org || null,
      })));

    if (insertError) {
      return NextResponse.json({ error: 'Unable to save profile facts' }, { status: 500 });
    }
  }

  const { data: facts, error: factsError } = await supabase
    .from('student_facts')
    .select('id, kind, text, dates, org')
    .eq('user_id', user.id)
    .order('created_at');

  if (factsError) {
    return NextResponse.json({ error: 'Unable to reload profile facts' }, { status: 500 });
  }

  const result = StudentProfileSchema.parse({
    userId: profile.id,
    displayName: profile.display_name || 'Student',
    field: profile.field,
    facts: facts ?? [],
    updatedAt: new Date(profile.updated_at).toISOString(),
  });

  return NextResponse.json({ data: result });
}