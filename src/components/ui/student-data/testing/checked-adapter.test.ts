import { expect, it, vi } from 'vitest';
import { checkedAdapter } from '../checked-adapter';
import { createMemoryHarness, PUBLIC_JOB, B } from './memory-double';

it('validates editable inputs before invoking an ordinary driver', async () => {
  const h = createMemoryHarness();
  const putProfile = vi.fn(h.a.putProfile);
  const patchApplication = vi.fn(h.a.patchApplication);
  const removeApplication = vi.fn(h.a.removeApplication);
  const adapter = checkedAdapter({...h.a, putProfile, patchApplication, removeApplication});
  const profile = await adapter.getProfile();
  await expect(adapter.putProfile({displayName:'Test',field:null,facts:[],expectedUpdatedAt:profile.updatedAt,userId:B} as never)).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(adapter.patchApplication('invalid', {notes:'Test',expectedUpdatedAt:profile.updatedAt})).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(adapter.removeApplication('invalid')).rejects.toMatchObject({code:'INVALID_INPUT'});
  expect(putProfile).not.toHaveBeenCalled();
  expect(patchApplication).not.toHaveBeenCalled();
  expect(removeApplication).not.toHaveBeenCalled();
});

it('rejects duplicate application identities/jobs rather than rendering ambiguous tracking', async () => {
  const h = createMemoryHarness();
  const app = await h.a.saveApplication({jobId:PUBLIC_JOB});
  for(const second of [app,{...app,id:crypto.randomUUID()}]) {
    const adapter = checkedAdapter({...h.a,listApplications:async()=>[app,second]});
    await expect(adapter.listApplications()).rejects.toMatchObject({code:'INVALID_DATA'});
  }
});

it('rejects mutable adapter identity before invoking a write', async () => {
  const h = createMemoryHarness();
  const removeApplication = vi.fn(h.a.removeApplication);
  const source = {...h.a,removeApplication};
  const adapter = checkedAdapter(source);
  source.subjectId = B;
  await expect(adapter.removeApplication(crypto.randomUUID())).rejects.toMatchObject({code:'INVALID_DATA'});
  expect(removeApplication).not.toHaveBeenCalled();
});

it('rejects malformed delete acknowledgements without passing extra data through', async () => {
  const h = createMemoryHarness();
  const id = crypto.randomUUID();
  const adapter = checkedAdapter({...h.a,removeApplication:async()=>({id,privateData:'not for output'})});
  await expect(adapter.removeApplication(id)).rejects.toMatchObject({code:'INVALID_DATA'});
});
