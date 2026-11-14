import { describe, expect, it } from 'vitest';
import { generatePrepQuestions } from './prep-questions';
import type { StudentFact, JobPosting } from '../../contracts';

const mockFact1: StudentFact = {
  id: '11111111-1111-4111-8111-111111111111',
  kind: 'project',
  text: 'Built an e-commerce dashboard with React and TypeScript serving 500 users.',
  dates: '2025',
  org: 'University Project',
};

const mockFact2: StudentFact = {
  id: '22222222-2222-4222-8222-222222222222',
  kind: 'skill',
  text: 'Proficient in PostgreSQL and REST APIs with Node.js.',
  dates: null,
  org: null,
};

const mockJob: Pick<JobPosting, 'title' | 'company' | 'description'> = {
  title: 'Full Stack Intern',
  company: 'Rexburg Tech Solutions',
  description: 'Looking for an intern skilled in React, TypeScript, and database optimization.',
};

describe('generatePrepQuestions', () => {
  it('successfully generates prep questions matching fact IDs and strictly grounded answers', async () => {
    const mockModelOutput = JSON.stringify({
      questions: [
        {
          text: 'Tell me about a time you built a web interface with React.',
          answerableByFactIds: [mockFact1.id],
          bestFactId: mockFact1.id,
          suggestedAnswer: {
            text: 'In 2025, I built an e-commerce dashboard using React and TypeScript for 500 users.',
            evidence: [mockFact1.id],
          },
          gapNote: null,
        },
        {
          text: 'How do you handle backend API design and databases?',
          answerableByFactIds: [mockFact2.id],
          bestFactId: mockFact2.id,
          suggestedAnswer: {
            text: 'I have experience designing REST APIs and working with PostgreSQL in Node.js.',
            evidence: [mockFact2.id],
          },
          gapNote: null,
        },
        {
          text: 'Describe your experience with AWS Cloud deployment.',
          answerableByFactIds: [],
          bestFactId: null,
          suggestedAnswer: null,
          gapNote: 'Acknowledge lack of direct AWS experience while highlighting eagerness to learn.',
        },
      ],
    });

    const result = await generatePrepQuestions({
      job: mockJob,
      facts: [mockFact1, mockFact2],
      modelCaller: async () => ({ ok: true, content: mockModelOutput }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].bestFactId).toBe(mockFact1.id);
    expect(result.questions[0].suggestedAnswer?.evidence).toEqual([mockFact1.id]);
    expect(result.questions[2].suggestedAnswer).toBeNull();
    expect(result.questions[2].gapNote).toBeDefined();
  });

  it('rejects output citing foreign fact IDs not in student profile', async () => {
    const foreignFactId = '99999999-9999-4999-8999-999999999999';
    const mockModelOutput = JSON.stringify({
      questions: [
        {
          text: 'Tell me about React experience.',
          answerableByFactIds: [foreignFactId],
          bestFactId: foreignFactId,
          suggestedAnswer: null,
          gapNote: null,
        },
      ],
    });

    const result = await generatePrepQuestions({
      job: mockJob,
      facts: [mockFact1],
      modelCaller: async () => ({ ok: true, content: mockModelOutput }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('GROUNDING_VIOLATION');
    expect(result.error).toContain(foreignFactId);
  });

  it('rejects output with ungrounded numeric metrics absent from cited facts', async () => {
    const mockModelOutput = JSON.stringify({
      questions: [
        {
          text: 'Tell me about scale.',
          answerableByFactIds: [mockFact1.id],
          bestFactId: mockFact1.id,
          suggestedAnswer: {
            // "99.9%" does not appear in mockFact1 (which only has "500" and "2025")
            text: 'I achieved 99.9% uptime on the project.',
            evidence: [mockFact1.id],
          },
          gapNote: null,
        },
      ],
    });

    const result = await generatePrepQuestions({
      job: mockJob,
      facts: [mockFact1],
      modelCaller: async () => ({ ok: true, content: mockModelOutput }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('GROUNDING_VIOLATION');
    expect(result.error).toContain('99.9%');
  });

  it('rejects oversized job descriptions', async () => {
    const result = await generatePrepQuestions({
      job: { ...mockJob, description: 'X'.repeat(20_001) },
      facts: [mockFact1],
      modelCaller: async () => ({ ok: true, content: '{}' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.error).toContain('20,000');
  });

  it('handles model error gracefully', async () => {
    const result = await generatePrepQuestions({
      job: mockJob,
      facts: [mockFact1],
      modelCaller: async () => ({ ok: false, error: 'Rate limit exceeded' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('MODEL_ERROR');
    expect(result.error).toBe('Rate limit exceeded');
  });

  it('handles malformed JSON from model gracefully', async () => {
    const result = await generatePrepQuestions({
      job: mockJob,
      facts: [mockFact1],
      modelCaller: async () => ({ ok: true, content: 'not valid json' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('MODEL_ERROR');
    expect(result.error).toContain('Failed to parse JSON');
  });
});
