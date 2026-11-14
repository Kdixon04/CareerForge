import { z } from 'zod';
import { StudentFactSchema } from './student';

export const MatchResultSchema = z.object({
  jobId: z.string().uuid(),
  matches: z.array(z.object({ requirement: z.string(), factIds: z.array(z.string().uuid()) })),
  gaps: z.array(z.object({ requirement: z.string(), note: z.string() })),
});
export const ResumeVersionSchema = z.object({
  id: z.string().uuid(), userId: z.string().uuid(), jobId: z.string().uuid(),
  generatedBullets: z.array(z.object({
    id: z.string().uuid(), text: z.string().min(1), evidence: z.array(z.string().uuid()).min(1),
    targetsRequirement: z.string(),
  })),
  editedBullets: z.array(z.object({ id: z.string().uuid(), text: z.string() })),
  match: MatchResultSchema, factSnapshot: z.array(StudentFactSchema),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
}).superRefine((version, context) => {
  const factIds = new Set(version.factSnapshot.map(fact => fact.id));
  version.generatedBullets.forEach((bullet, index) => {
    if (bullet.evidence.some(id => !factIds.has(id))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Evidence must reference a saved source fact',
        path: ['generatedBullets', index, 'evidence'],
      });
    }
  });
});
export type MatchResult = z.infer<typeof MatchResultSchema>;
export type ResumeVersion = z.infer<typeof ResumeVersionSchema>;
