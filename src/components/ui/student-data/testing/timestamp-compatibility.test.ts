import { expect, it, vi } from 'vitest';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';
import { createApplicationHandlers } from '../../../../app/api/applications/adapter-handlers';
import { AdapterError, type StudentDataAdapter, type ProfileWrite, type ApplicationPatch } from '../adapter-contract';
import { checkedAdapter } from '../checked-adapter';
import { createMemoryHarness, PUBLIC_JOB } from './memory-double';

// TEST DOUBLES ONLY. These check consumer/HTTP precision, not database CAS,
// Supabase timestamps, durability, Auth, or RLS.
const OLD = '2026-11-14T12:00:00.123456Z';
const NEXT = '2026-11-14T12:00:00.123457Z';
const LATEST = '2026-11-14T12:00:00.123458Z';
const request = (path: string, method = 'GET', body?: unknown) => new Request(`https://lab.test${path}`, {
  method,
  headers: { Origin: 'https://lab.test', 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

it('MOCK checked adapter preserves microsecond versions on reads and consecutive writes', async () => {
  const h = createMemoryHarness();
  const profile = await h.a.getProfile();
  const putProfile = vi.fn(async (input: ProfileWrite) => ({
    ...profile, displayName: input.displayName, updatedAt: NEXT,
  })).mockImplementationOnce(async input => ({ ...profile, displayName: input.displayName, updatedAt: NEXT }))
    .mockImplementationOnce(async input => ({ ...profile, displayName: input.displayName, updatedAt: LATEST }));
  const adapter = checkedAdapter({ ...h.a, getProfile: async () => ({ ...profile, updatedAt: OLD }), putProfile });
  const initial = await adapter.getProfile();
  expect(initial.updatedAt).toBe(OLD);
  const input = { displayName: 'Fictional precision check', field: null, facts: profile.facts };
  const first = await adapter.putProfile({ ...input, expectedUpdatedAt: initial.updatedAt });
  const second = await adapter.putProfile({ ...input, expectedUpdatedAt: first.updatedAt });
  expect(first.updatedAt).toBe(NEXT);
  expect(second.updatedAt).toBe(LATEST);
  expect(putProfile.mock.calls.map(([value]) => value.expectedUpdatedAt)).toEqual([OLD, NEXT]);
});

it('MOCK profile HTTP preserves microseconds and forwards a stale same-millisecond version unchanged', async () => {
  const h = createMemoryHarness();
  const profile = await h.a.getProfile();
  let version = OLD;
  const putProfile = vi.fn(async (input: ProfileWrite) => {
    if (input.expectedUpdatedAt !== version) throw new AdapterError('CONFLICT');
    version = NEXT;
    return { ...profile, updatedAt: version };
  });
  const source: StudentDataAdapter = {
    ...h.a, getProfile: async () => ({ ...profile, updatedAt: version }), putProfile,
  };
  const handlers = createProfileHandlers(async () => source);
  const read = await handlers.GET(request('/profile'));
  expect(read.status).toBe(200);
  expect((await read.json()).data.updatedAt).toBe(OLD);
  const input = { displayName: profile.displayName, field: profile.field, facts: profile.facts, expectedUpdatedAt: OLD };
  const saved = await handlers.PUT(request('/profile', 'PUT', input));
  expect(saved.status).toBe(200);
  expect((await saved.json()).data.updatedAt).toBe(NEXT);
  const stale = await handlers.PUT(request('/profile', 'PUT', input));
  expect(stale.status).toBe(409);
  expect((await stale.json()).error.code).toBe('CONFLICT');
  expect(putProfile.mock.calls.map(([value]) => value.expectedUpdatedAt)).toEqual([OLD, OLD]);
  const after = await handlers.GET(request('/profile'));
  expect((await after.json()).data).toEqual({ ...profile, updatedAt: NEXT });
  for (const response of [read, saved, stale, after]) {
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  }
});

it('MOCK application HTTP preserves microseconds through list, save, and versioned patch', async () => {
  const h = createMemoryHarness();
  const app = await h.a.saveApplication({ jobId: PUBLIC_JOB });
  const patchApplication = vi.fn(async (_id: string, _input: ApplicationPatch) => ({
    ...app, notes: 'Fictional precision check', updatedAt: NEXT,
  }));
  const source: StudentDataAdapter = {
    ...h.a,
    listApplications: async () => [{ ...app, updatedAt: OLD }],
    saveApplication: async () => ({ ...app, updatedAt: OLD }),
    patchApplication,
  };
  const handlers = createApplicationHandlers(async () => source);
  const read = await handlers.GET(request('/applications'));
  expect(read.status).toBe(200);
  expect((await read.json()).data[0].updatedAt).toBe(OLD);
  const saved = await handlers.POST(request('/applications', 'POST', { jobId: PUBLIC_JOB }));
  expect(saved.status).toBe(200);
  expect((await saved.json()).data.updatedAt).toBe(OLD);
  const patch = { notes: 'Fictional precision check', expectedUpdatedAt: OLD };
  const updated = await handlers.PATCH(request(`/applications/${app.id}`, 'PATCH', patch), app.id);
  expect(updated.status).toBe(200);
  expect((await updated.json()).data).toEqual({ ...app, notes: patch.notes, updatedAt: NEXT });
  expect(patchApplication.mock.calls).toEqual([[app.id, patch]]);
  for (const response of [read, saved, updated]) {
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  }
});
