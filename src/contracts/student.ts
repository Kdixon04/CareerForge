import { z } from 'zod';

export const StudentFactSchema = z.object({
  id: z.string().uuid(), kind: z.enum(['skill', 'education', 'project', 'experience', 'interest']),
  text: z.string().min(1), dates: z.string().nullable(), org: z.string().nullable(),
});
export const StudentProfileSchema = z.object({
  userId: z.string().uuid(), displayName: z.string().min(1), field: z.string().nullable(),
  facts: z.array(StudentFactSchema), updatedAt: z.string().datetime(),
});
export type StudentFact = z.infer<typeof StudentFactSchema>;
export type StudentProfile = z.infer<typeof StudentProfileSchema>;
