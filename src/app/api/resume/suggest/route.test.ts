import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('../../../../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '../../../../lib/supabase/server';

const mockJobId = '22222222-2222-4222-8222-222222222222';

function createPostRequest(body: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/resume/suggest', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    duplex: 'half',
    body,
  } as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

describe('POST /api/resume/suggest - inert route handler', () => {
  it('returns 401 UNAUTHENTICATED when caller is signed out', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({ data: { user: null }, error: null }),
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);

    const response = await POST(createPostRequest(JSON.stringify({ jobId: mockJobId })));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
    });
  });

  it('fails closed with 503 SERVICE_UNAVAILABLE while adapters/key are absent', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValueOnce({
          data: { user: { id: '11111111-1111-4111-8111-111111111111' } },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);

    const response = await POST(createPostRequest(JSON.stringify({ jobId: mockJobId })));
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
