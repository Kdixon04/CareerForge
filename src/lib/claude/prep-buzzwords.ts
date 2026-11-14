import { z } from 'zod';
import type { JobPosting } from '../../contracts';
import { MAX_JOB_DESCRIPTION_CHARS, MAX_MODEL_OUTPUT_CHARS, type ModelCaller } from './resume-suggest';

export interface PrepBuzzword {
  term: string;
  definition: string;
  contextInJob: string;
  verified: false;
}

export const BuzzwordItemSchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(1).max(500),
  contextInJob: z.string().min(1).max(500),
});

export const PrepBuzzwordsModelOutputSchema = z.object({
  buzzwords: z.array(BuzzwordItemSchema).min(1).max(20),
});

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildBuzzwordsPrompt(
  job: Pick<JobPosting, 'title' | 'company' | 'description'>,
): { system: string; userMessage: string } {
  const system = `You are a technical glossary assistant for CareerForge. You extract key industry buzzwords, acronyms, and technical domain terminology exclusively from the provided job posting text and explain them clearly for student interview preparation.

RULES:
1. ONLY extract terms, technologies, acronyms, or methodologies explicitly mentioned in the <job_posting>.
2. Provide a clear, educational definition suitable for an undergraduate student.
3. Quote or summarize the context in which the term appears in the job description.
4. Respond exclusively with valid JSON matching the schema.`;

  const userMessage = `<job_posting>
  <title>${escapeXml(job.title)}</title>
  <company>${escapeXml(job.company)}</company>
  <description>${escapeXml(job.description)}</description>
</job_posting>

Extract up to 10 key technical terms, acronyms, or domain concepts found in this job posting.

Respond with JSON:
{
  "buzzwords": [
    {
      "term": "Term Name",
      "definition": "Clear concise definition",
      "contextInJob": "Brief excerpt or explanation of how the job uses this term"
    }
  ]
}`;

  return { system, userMessage };
}

export interface GeneratePrepBuzzwordsInput {
  job: Pick<JobPosting, 'title' | 'company' | 'description'>;
  modelCaller: ModelCaller;
}

export type GeneratePrepBuzzwordsResult =
  | { ok: true; buzzwords: PrepBuzzword[] }
  | { ok: false; error: string; code: 'INVALID_INPUT' | 'MODEL_ERROR' };

export async function generatePrepBuzzwords(
  input: GeneratePrepBuzzwordsInput,
): Promise<GeneratePrepBuzzwordsResult> {
  const { job, modelCaller } = input;

  if (job.description.length > MAX_JOB_DESCRIPTION_CHARS) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: `Job description exceeds maximum length of ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters`,
    };
  }

  const prompt = buildBuzzwordsPrompt(job);
  const response = await modelCaller(prompt);
  if (!response.ok) {
    return { ok: false, code: 'MODEL_ERROR', error: response.error };
  }

  if (response.content.length > MAX_MODEL_OUTPUT_CHARS) {
    return { ok: false, code: 'MODEL_ERROR', error: 'Model output exceeded maximum permitted length' };
  }

  let parsedJson: unknown;
  try {
    const cleaned = response.content
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    parsedJson = JSON.parse(cleaned);
  } catch {
    return { ok: false, code: 'MODEL_ERROR', error: 'Failed to parse JSON response from model' };
  }

  const validation = PrepBuzzwordsModelOutputSchema.safeParse(parsedJson);
  if (!validation.success) {
    return {
      ok: false,
      code: 'MODEL_ERROR',
      error: `Model output violated schema: ${validation.error.issues[0]?.message}`,
    };
  }

  const buzzwords: PrepBuzzword[] = validation.data.buzzwords.map(item => ({
    term: item.term,
    definition: item.definition,
    contextInJob: item.contextInJob,
    verified: false,
  }));

  return { ok: true, buzzwords };
}
