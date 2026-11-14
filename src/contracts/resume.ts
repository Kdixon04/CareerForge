import { z } from 'zod';

/** Provisional until Keyan confirms how profile facts are referenced in stored suggestions. */
export const ResumeSuggestionSchema = z.object({
  id: z.string().min(1), type: z.enum(['skill', 'experience', 'summary']), text: z.string().min(1),
  sourceFactIds: z.array(z.string().min(1)).min(1), evidence: z.string().min(1),
  sourceUrl: z.string().url().optional(),
});

export type ResumeSuggestion = z.infer<typeof ResumeSuggestionSchema>;
