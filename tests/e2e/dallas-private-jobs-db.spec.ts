import { expect, test } from '@playwright/test';

/**
 * Real Student A/B Database Persistence & Isolation Specification
 *
 * This test exercises real database persistence and cross-student RLS isolation
 * against a live Supabase instance with two distinct student accounts (Student A and Student B).
 *
 * GUARD:
 * This spec is skipped unless live Supabase environment variables and both student credentials
 * are explicitly provided. It will not run in mock/fixture mode and never weakens permissions.
 *
 * Requirements verified when enabled:
 * 1. Student A imports a private pasted job -> persisted with `source = 'pasted'`, `status = 'private'`.
 * 2. Student A reads back their own private job via GET /api/jobs/[id] -> 200 with matching data.
 * 3. Student B authenticates with ordinary user session, attempts GET /api/jobs/[studentAJobId] ->
 *    returns 404 NOT_FOUND (indistinguishable result under `jobs_select_authorized` policy).
 * 4. Zero existence leakage: Student B cannot determine whether the private job exists.
 */

const LIVE_DB_ENABLED = Boolean(
  process.env.SUPABASE_URL &&
  process.env.E2E_STUDENT_A_EMAIL &&
  process.env.E2E_STUDENT_A_PASSWORD &&
  process.env.E2E_STUDENT_B_EMAIL &&
  process.env.E2E_STUDENT_B_PASSWORD,
);

test.describe('Student A/B Private Job Persistence & Isolation (Live Supabase DB)', () => {
  test.skip(
    !LIVE_DB_ENABLED,
    'Skipped: Live Supabase environment variables and Student A/B credentials not provided in this environment.',
  );

  test('Student A persists private job, reads it back, and Student B receives indistinguishable 404', async ({
    request,
  }) => {
    // 1. Authenticate Student A via Supabase Auth endpoint
    const authARes = await request.post(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      },
      data: {
        email: process.env.E2E_STUDENT_A_EMAIL,
        password: process.env.E2E_STUDENT_A_PASSWORD,
      },
    });
    expect(authARes.ok()).toBe(true);
    const authAData = await authARes.json();
    const tokenA = authAData.access_token;
    const studentAId = authAData.user.id;

    // 2. Student A imports a private job
    const testDraft = {
      title: 'E2E Real Private Job',
      company: 'Live Isolation Testing Corp',
      description: 'Testing live RLS isolation between Student A and Student B.',
      location: 'Rexburg, ID',
      jobType: 'internship',
      workMode: 'remote',
      sourceUrl: 'https://example.com/e2e/live-test-001',
      deadline: '2026-12-31',
    };

    const importRes = await request.post('/api/jobs/import', {
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      data: testDraft,
    });
    expect(importRes.status()).toBe(200);
    const importBody = await importRes.json();
    expect(importBody.data).toBeDefined();
    const createdJobId = importBody.data.id;
    expect(importBody.data.createdByUserId).toBe(studentAId);
    expect(importBody.data.status).toBe('private');
    expect(importBody.data.source).toBe('pasted');
    expect(importBody.data.deadlineVerified).toBe(false);

    // 3. Student A reads back their own private job
    const readARes = await request.get(`/api/jobs/${createdJobId}`, {
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(readARes.status()).toBe(200);
    const readABody = await readARes.json();
    expect(readABody.data.id).toBe(createdJobId);
    expect(readABody.data.title).toBe(testDraft.title);

    // 4. Authenticate Student B via Supabase Auth endpoint
    const authBRes = await request.post(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      },
      data: {
        email: process.env.E2E_STUDENT_B_EMAIL,
        password: process.env.E2E_STUDENT_B_PASSWORD,
      },
    });
    expect(authBRes.ok()).toBe(true);
    const authBData = await authBRes.json();
    const tokenB = authBData.access_token;

    // 5. Student B attempts to read Student A's private job
    // Under RLS `jobs_select_authorized`, Student B cannot select Student A's private job.
    // The route MUST return 404 NOT_FOUND, identical to a non-existent job.
    const readBRes = await request.get(`/api/jobs/${createdJobId}`, {
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });
    expect(readBRes.status()).toBe(404);
    const readBBody = await readBRes.json();
    expect(readBBody.error.code).toBe('NOT_FOUND');
    expect(readBBody.error.message).toBe('Job not found');

    // 6. Non-existent job check: returns identical 404
    const nonExistentId = '00000000-0000-4000-8000-000000000000';
    const nonExistentRes = await request.get(`/api/jobs/${nonExistentId}`, {
      headers: {
        Authorization: `Bearer ${tokenB}`,
      },
    });
    expect(nonExistentRes.status()).toBe(404);
    const nonExistentBody = await nonExistentRes.json();
    expect(nonExistentBody).toEqual(readBBody);
  });
});
