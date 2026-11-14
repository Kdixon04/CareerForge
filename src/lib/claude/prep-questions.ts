import { z } from 'zod';
import type { JobPosting, StudentFact } from '../../contracts';
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_FACTS_COUNT,
  MAX_FACTS_TOTAL_CHARS,
  MAX_MODEL_OUTPUT_CHARS,
  extractNumericTokens,
  verifyBulletGrounding,
  type ModelCaller,
} from './resume-suggest';

export interface PrepQuestion {
  id: string;
  text: string;
  answerableByFactIds: string[];
  bestFactId: string | null;
  suggestedAnswer: {
    text: string;
    evidence: string[];
  } | null;
  gapNote: string | null;
}

export const PrepQuestionItemSchema = z.object({
  text: z.string().min(1).max(500),
  answerableByFactIds: z.array(z.string().uuid()).max(MAX_FACTS_COUNT),
  bestFactId: z.string().uuid().nullable(),
  suggestedAnswer: z
    .object({
      text: z.string().min(1).max(2000),
      evidence: z.array(z.string().uuid()).min(1).max(MAX_FACTS_COUNT),
    })
    .nullable(),
  gapNote: z.string().min(1).max(1000).nullable(),
});

export const PrepQuestionsModelOutputSchema = z.object({
  questions: z.array(PrepQuestionItemSchema).min(1).max(15),
});

export type PrepQuestionsModelOutput = z.infer<typeof PrepQuestionsModelOutputSchema>;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildPrepQuestionsPrompt(
  job: Pick<JobPosting, 'title' | 'company' | 'description'>,
  facts: StudentFact[],
): { system: string; userMessage: string } {
  const system = `You are an interview preparation advisor for CareerForge. You generate targeted interview questions based on job postings and cross-reference them with the student's verified experience facts.

CRITICAL FACTUALITY AND INTEGRITY RULES:
1. Grounding: Every suggested answer MUST be grounded strictly in the provided <student_facts>. NEVER invent projects, metrics, dates, skills, or companies.
2. Evidence: When providing a suggestedAnswer, the "evidence" array MUST contain only fact IDs from <student_facts>.
3. Metric Fidelity: Every number, percentage, or date mentioned in a suggestedAnswer MUST appear verbatim in the cited fact.
4. Gaps: If an interview question covers an area where the student has NO supporting facts, set suggestedAnswer to null and provide a helpful coaching tip in gapNote.
5. Format: Respond with valid JSON matching the specified schema.`;

  const factsBlock = facts
    .map(
      f =>
        `<fact id="${f.id}" kind="${f.kind}">
  <text>${escapeXml(f.text)}</text>
  ${f.dates ? `<dates>${escapeXml(f.dates)}</dates>` : ''}
  ${f.org ? `<org>${escapeXml(f.org)}</org>` : ''}
</fact>`,
    )
    .join('\n');

  const userMessage = `<job_posting>
  <title>${escapeXml(job.title)}</title>
  <company>${escapeXml(job.company)}</company>
  <description>${escapeXml(job.description)}</description>
</job_posting>

<student_facts>
${factsBlock}
</student_facts>

Generate 3-6 targeted interview questions for this role. For each question:
- Indicate which student fact IDs can answer it (answerableByFactIds).
- Pick the single strongest fact ID (bestFactId), or null if none apply.
- If supporting facts exist, provide a concise suggested answer citing those fact IDs.
- If no supporting facts exist, suggestedAnswer must be null and gapNote must give a practical strategy for addressing the gap honestly.

Respond with JSON:
{
  "questions": [
    {
      "text": "Question text",
      "answerableByFactIds": ["fact-uuid"],
      "bestFactId": "fact-uuid",
      "suggestedAnswer": {
        "text": "Draft answer grounded in cited fact",
        "evidence": ["fact-uuid"]
      },
      "gapNote": null
    }
  ]
}`;

  return { system, userMessage };
}

export interface GeneratePrepQuestionsInput {
  job: Pick<JobPosting, 'title' | 'company' | 'description'>;
  facts: StudentFact[];
  modelCaller: ModelCaller;
}

export type GeneratePrepQuestionsResult =
  | { ok: true; questions: PrepQuestion[] }
  | { ok: false; error: string; code: 'INVALID_INPUT' | 'MODEL_ERROR' | 'GROUNDING_VIOLATION' };

export async function generatePrepQuestions(
  input: GeneratePrepQuestionsInput,
): Promise<GeneratePrepQuestionsResult> {
  const { job, facts, modelCaller } = input;

  // 1. Input bounding checks
  if (job.description.length > MAX_JOB_DESCRIPTION_CHARS) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: `Job description exceeds maximum length of ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters`,
    };
  }

  if (facts.length > MAX_FACTS_COUNT) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: `Student facts count exceeds maximum of ${MAX_FACTS_COUNT}`,
    };
  }

  const totalFactChars = facts.reduce(
    (acc, f) => acc + f.text.length + (f.dates?.length || 0) + (f.org?.length || 0),
    0,
  );
  if (totalFactChars > MAX_FACTS_TOTAL_CHARS) {
    return {
      ok: false,
      code: 'INVALID_INPUT',
      error: `Total student facts length exceeds maximum of ${MAX_FACTS_TOTAL_CHARS.toLocaleString()} characters`,
    };
  }

  const factMap = new Map<string, StudentFact>(facts.map(f => [f.id, f]));

  // 2. Call Claude model caller
  const prompt = buildPrepQuestionsPrompt(job, facts);
  const response = await modelCaller(prompt);
  if (!response.ok) {
    return { ok: false, code: 'MODEL_ERROR', error: response.error };
  }

  if (response.content.length > MAX_MODEL_OUTPUT_CHARS) {
    return { ok: false, code: 'MODEL_ERROR', error: 'Model output exceeded maximum permitted length' };
  }

  // 3. Parse JSON from output
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

  const validation = PrepQuestionsModelOutputSchema.safeParse(parsedJson);
  if (!validation.success) {
    return {
      ok: false,
      code: 'MODEL_ERROR',
      error: `Model output violated schema: ${validation.error.issues[0]?.message}`,
    };
  }

  // 4. Grounding & fact integrity verification
  const questions: PrepQuestion[] = [];

  for (const q of validation.data.questions) {
    // Verify answerableByFactIds exist in caller's facts
    for (const fId of q.answerableByFactIds) {
      if (!factMap.has(fId)) {
        return {
          ok: false,
          code: 'GROUNDING_VIOLATION',
          error: `Question cited non-existent or foreign fact ID: ${fId}`,
        };
      }
    }

    if (q.bestFactId && !factMap.has(q.bestFactId)) {
      return {
        ok: false,
        code: 'GROUNDING_VIOLATION',
        error: `Question cited non-existent or foreign bestFactId: ${q.bestFactId}`,
      };
    }

    if (q.suggestedAnswer) {
      for (const eId of q.suggestedAnswer.evidence) {
        if (!factMap.has(eId)) {
          return {
            ok: false,
            code: 'GROUNDING_VIOLATION',
            error: `Suggested answer cited non-existent or foreign evidence fact ID: ${eId}`,
          };
        }
      }

      const citedFacts = q.suggestedAnswer.evidence
        .map(id => factMap.get(id))
        .filter((f): f is StudentFact => f !== undefined);

      const groundingCheck = verifyBulletGrounding(q.suggestedAnswer.text, citedFacts);
      if (!groundingCheck.valid) {
        return {
          ok: false,
          code: 'GROUNDING_VIOLATION',
          error: `Suggested answer contains ungrounded numeric/date token "${groundingCheck.ungroundedToken}" not in cited facts`,
        };
      }
    }

    questions.push({
      id: crypto.randomUUID(),
      text: q.text,
      answerableByFactIds: q.answerableByFactIds,
      bestFactId: q.bestFactId,
      suggestedAnswer: q.suggestedAnswer,
      gapNote: q.gapNote,
    });
  }

  return { ok: true, questions };
}
