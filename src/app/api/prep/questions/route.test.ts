import { describe, expect, it, vi } from 'vitest';
import { handlePrepQuestions } from '../../../../lib/claude/prep-handlers';
import type { JobPosting, StudentFact } from '../../../../contracts';

const mockUserId = '11111111-1111-4111-8111-111111111111';
const mockJobId = '22222222-2222-4222-8222-222222222222';

const mockJob: JobPosting = {
  id: mockJobId,
  title: 'Backend Engineer',
  company: 'Cloud Corp',
  description: 'Design robust APIs with TypeScript.',
  location: 'Remote',
  jobType: 'full_time',
  workMode: 'remote',
  sourceUrl: 'https://example.com/job/1',
  deadline: null,
  source: 'employer',
  providerName: null,
  externalId: null,
  createdByUserId: '33333333-3333-4333-8333-333333333333',
  employerId: '44444444-4444-4444-8444-444444444444',
  status: 'published',
  retrievedAt: null,
  deadlineVerified: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockFact: StudentFact = {
  id: '55555555-5555-4555-8555-555555555555',
  kind: 'skill',
  text: 'TypeScript and Node.js REST API development.',
  dates: null,
  org: null,
};

function createPostRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/prep/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/prep/questions', () => {
  it('returns 401 when caller is unauthenticated', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepQuestions(req, {
      getUser: async () => null,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 400 when consent is missing', async () => {
    const req = createPostRequest({ jobId: mockJobId });
    const res = await handlePrepQuestions(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message).toContain('consent');
  });

  it('returns 400 when consent is false', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: false });
    const res = await handlePrepQuestions(req, {
      getUser: async () => ({ id: mockUserId }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('fails closed with 503 when adapters are absent', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepQuestions(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      // No getAuthorizedJob or getStudentFacts provided
    });

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(json.error.message).toContain('adapters');
  });

  it('returns 404 when job does not exist', async () => {
    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepQuestions(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      getAuthorizedJob: async () => null,
      getStudentFacts: async () => [mockFact],
      modelCaller: async () => ({ ok: true, content: '{}' }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 200 with questions when authorized, consented, and model succeeds', async () => {
    const mockModelOutput = JSON.stringify({
      questions: [
        {
          text: 'How do you structure TypeScript APIs?',
          answerableByFactIds: [mockFact.id],
          bestFactId: mockFact.id,
          suggestedAnswer: {
            text: 'I have experience with TypeScript and Node.js REST API development.',
            evidence: [mockFact.id],
          },
          gapNote: null,
        },
      ],
    });

    const req = createPostRequest({ jobId: mockJobId, consent: true });
    const res = await handlePrepQuestions(req, {
      getUser: async () => ({ id: mockUserId }),
      apiKey: 'sk-ant-test',
      getAuthorizedJob: async () => mockJob,
      getStudentFacts: async () => [mockFact],
      modelCaller: async () => ({ ok: true, content: mockModelOutput }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.questions).toHaveLength(1);
    expect(json.data.questions[0].bestFactId).toBe(mockFact.id);
  });
});
