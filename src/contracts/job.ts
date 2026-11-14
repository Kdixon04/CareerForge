import { z } from 'zod';

/** Provisional until Keyan confirms the job-ingestion and verification fields. */
export const JobSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), company: z.string().min(1),
  location: z.string().min(1), sourceUrl: z.string().url(),
  verificationStatus: z.enum(['verified', 'unverified', 'expired']),
});

export type Job = z.infer<typeof JobSchema>;
