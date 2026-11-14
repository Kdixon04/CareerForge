import { expect, it, vi } from 'vitest';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';
import { createApplicationHandlers } from '../../../../app/api/applications/adapter-handlers';
import { createMemoryHarness, A, PUBLIC_JOB } from './memory-double';
import type { StudentDataAdapter } from '../adapter-contract';

const request = (path: string, method = 'GET', body?: unknown) => new Request(`http://lab.test${path}`, {
  method, headers: { Origin: 'http://lab.test', 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

it('rejects missing adapter identities before any write and does not cache failures', async () => {
  const h = createMemoryHarness();
  const original = await h.a.getProfile();
  for (const subjectId of ['', 'not-a-uuid']) {
    const putProfile = vi.fn(h.a.putProfile);
    const handlers = createProfileHandlers(async () => ({ ...h.a, subjectId, putProfile }));
    const response = await handlers.PUT(request('/profile', 'PUT', {
      displayName: 'Should never save', field: null, facts: [], expectedUpdatedAt: original.updatedAt,
    }));
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(putProfile).not.toHaveBeenCalled();
  }
  expect(await h.a.getProfile()).toEqual(original);
});

it('rejects same-owner application responses with the wrong requested record or job', async () => {
  const h = createMemoryHarness();
  const app = await h.a.saveApplication({ jobId: PUBLIC_JOB });
  const otherId = '99999999-9999-4999-8999-999999999999';
  const adapter: StudentDataAdapter = { ...h.a,
    patchApplication: async () => ({ ...app, id: otherId }),
    saveApplication: async () => ({ ...app, jobId: otherId, job: null }),
  };
  const handlers = createApplicationHandlers(async () => adapter);
  expect((await handlers.PATCH(request('/applications', 'PATCH', { notes: 'Test', expectedUpdatedAt: app.updatedAt }), app.id)).status).toBe(503);
  expect((await handlers.POST(request('/applications', 'POST', { jobId: PUBLIC_JOB }))).status).toBe(503);
  expect(await h.a.listApplications()).toEqual([app]);
});

it('rejects ambiguous query ownership and method mismatches without calling adapters', async () => {
  const h = createMemoryHarness();
  const listApplications = vi.fn(h.a.listApplications);
  const getProfile = vi.fn(h.a.getProfile);
  const adapter = { ...h.a, listApplications, getProfile };
  const applications = createApplicationHandlers(async () => adapter);
  const profile = createProfileHandlers(async () => adapter);
  expect((await applications.GET(request(`/applications?userId=${A}`))).status).toBe(400);
  expect((await profile.GET(request('/profile', 'POST'))).status).toBe(400);
  expect(listApplications).not.toHaveBeenCalled();
  expect(getProfile).not.toHaveBeenCalled();
});
