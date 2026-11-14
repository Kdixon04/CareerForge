import { expect, it, vi } from 'vitest';
function productionEnvironment(){vi.stubEnv('NODE_ENV','production');for(const flag of ['STEVE_ADAPTER_LAB','STEVE_LIVE_CONTRACTS','CAREERFORGE_E2E_PROFILE_FIXTURE','CAREERFORGE_E2E_JOBS_FIXTURE'])vi.stubEnv(flag,undefined);}
import { ownProfile, AdapterError } from '../adapter-contract';
import { createMemoryHarness } from './memory-double';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';

it('rejects corrupt profile reads with duplicate fact IDs or oversized combined content', async () => {
  const h=createMemoryHarness(),profile=await h.a.getProfile();
  for(const facts of [[...profile.facts,...profile.facts],Array.from({length:16},()=>({...profile.facts[0],id:crypto.randomUUID(),text:'x'.repeat(1900)}))]) {
    expect(()=>ownProfile(h.a,{...profile,facts})).toThrow();
  }
});

it('reconstructs public errors instead of trusting mutable adapter messages or status',async()=>{
  const failure=new AdapterError('UNAVAILABLE');failure.message='private SQL session token';
  Object.assign(failure,{status:200});
  const handlers=createProfileHandlers(async()=>{throw failure;});
  const response=await handlers.GET(new Request('https://example.test/profile'));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error:{code:'UNAVAILABLE',message:new AdapterError('UNAVAILABLE').message}});
});

it('prepared production HTTP refuses declared memory drivers and accidental test-mode flags',async()=>{
  const h=createMemoryHarness();
  productionEnvironment();
  try{
    const double=await createProfileHandlers(async()=>h.a).GET(new Request('https://example.test/profile'));
    expect(double.status).toBe(503);
    for(const name of ['STEVE_ADAPTER_LAB','STEVE_LIVE_CONTRACTS','CAREERFORGE_E2E_PROFILE_FIXTURE','CAREERFORGE_E2E_JOBS_FIXTURE']){
      const old=process.env[name];process.env[name]='1';
      try{expect((await createProfileHandlers(async()=>({...h.a,kind:'real'})).GET(new Request('https://example.test/profile'))).status).toBe(503);}
      finally{if(old===undefined)delete process.env[name];else process.env[name]=old;}
    }
  }finally{vi.unstubAllEnvs();}
});

it('prepared production HTTP rejects fictional aliases and never trusts an unknown error code',async()=>{
  const h=createMemoryHarness();productionEnvironment();
  try{
    for(const header of ['x-lab-user','x-lab-fault']){
      const response=await createProfileHandlers(async()=>({...h.a,kind:'real'})).GET(new Request('https://example.test/profile',{headers:{[header]:'fictional'}}));
      expect(response.status).toBe(403);expect(response.headers.get('cache-control')).toBe('private, no-store');
    }
  }finally{vi.unstubAllEnvs();}
  const error=new AdapterError('UNAVAILABLE');Object.assign(error,{code:'constructor',message:'secret diagnostic',status:200});
  const response=await createProfileHandlers(async()=>{throw error;}).GET(new Request('https://example.test/profile'));
  expect(response.status).toBe(503);expect(await response.text()).not.toMatch(/secret|diagnostic|constructor/);
});
