import { z } from 'zod';

/** Provisional until Keyan confirms the Supabase profile/facts shape. */
export const StudentFactSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), value: z.string().min(1),
  category: z.enum(['skill', 'experience', 'education']),
});

export const StudentProfileSchema = z.object({
  id: z.string().min(1), displayName: z.string().min(1), school: z.string().min(1),
  major: z.string().min(1), skills: z.array(z.string().min(1)).min(1), facts: z.array(StudentFactSchema).optional(),
});

export type StudentFact = z.infer<typeof StudentFactSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
