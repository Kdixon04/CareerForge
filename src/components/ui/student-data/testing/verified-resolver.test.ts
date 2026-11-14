import { expect,it,vi } from 'vitest';
import { createVerifiedResolver } from '../../../../app/api/profile/verified-resolver';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';
import { createApplicationHandlers } from '../../../../app/api/applications/adapter-handlers';
import { createMemoryHarness,A,B,PUBLIC_JOB } from './memory-double';

// All sessions/drivers/config below are STUBS. kind=real exercises guards only.
const environment=()=>({NODE_ENV:'production',APP_URL:'https://careerforge.example.test',NEXT_PUBLIC_SUPABASE_URL:'https://isolated.example.test',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_nonsecret_fixture'});
const request=(method='GET',extra:Record<string,string>={})=>new Request('https://careerforge.example.test/api/profile',{method,headers:{Origin:'https://careerforge.example.test',...extra}});
function setup(){
  const h=createMemoryHarness();
  const verifyCaller=vi.fn(async()=>({subjectId:A,role:'student'}));
  const connect=vi.fn(async()=>({...h.a,kind:'real' as const}));
  return {h,verifyCaller,connect,environment:environment()};
}
it('STUB verified resolver binds the ordinary driver to verified caller and preserves no-store',async()=>{
  const s=setup(),resolver=createVerifiedResolver(s);
  const response=await createProfileHandlers(resolver).GET(request());
  expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect((await response.json()).data.userId).toBe(A);
  expect(s.verifyCaller).toHaveBeenCalledOnce();
  expect(s.connect).toHaveBeenCalledWith({subjectId:A,role:'student'},expect.any(Request));
});
it('STUB resolver rejects absent/expired identity and wrong roles before connecting',async()=>{
  for(const [caller,code] of [[null,'UNAUTHENTICATED'],[{subjectId:'',role:'student'},'UNAUTHENTICATED'],[{subjectId:A,role:'employer'},'FORBIDDEN']] as const){
    const s=setup(),resolver=createVerifiedResolver({...s,verifyCaller:async()=>caller});
    await expect(resolver(request())).rejects.toMatchObject({code});expect(s.connect).not.toHaveBeenCalled();
  }
});
it('STUB resolver refuses missing callbacks, missing/unsafe configuration, and every test-mode flag',async()=>{
  const s=setup();await expect(createVerifiedResolver({environment:s.environment})(request())).rejects.toMatchObject({code:'UNAVAILABLE'});
  for(const patch of [{NODE_ENV:'development'},{APP_URL:''},{APP_URL:'http://localhost:3000'},{NEXT_PUBLIC_SUPABASE_URL:'https://user:password@example.test'},{NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_not_real'},...['STEVE_ADAPTER_LAB','STEVE_LIVE_CONTRACTS','CAREERFORGE_E2E_PROFILE_FIXTURE','CAREERFORGE_E2E_JOBS_FIXTURE'].map(key=>({[key]:'1'}))]){
    const current=setup();await expect(createVerifiedResolver({...current,environment:{...current.environment,...patch}})(request())).rejects.toMatchObject({code:'UNAVAILABLE'});
    expect(current.verifyCaller).not.toHaveBeenCalled();expect(current.connect).not.toHaveBeenCalled();
  }
});
it('STUB resolver denies fictional session/fault headers and incorrect destination origin',async()=>{
  for(const header of ['x-lab-user','x-lab-fault']){
    const s=setup();await expect(createVerifiedResolver(s)(request('GET',{[header]:'fictional'}))).rejects.toMatchObject({code:'FORBIDDEN'});expect(s.connect).not.toHaveBeenCalled();
  }
  const s=setup();await expect(createVerifiedResolver(s)(new Request('https://other.example.test/api/profile'))).rejects.toMatchObject({code:'FORBIDDEN'});expect(s.connect).not.toHaveBeenCalled();
});
it('STUB resolver refuses declared doubles and mismatched driver identities',async()=>{
  for(const which of ['double','foreign'] as const){const s=setup();
    const resolver=createVerifiedResolver({...s,connect:async()=>which==='double'?s.h.a:{...s.h.b,kind:'real'}});
    await expect(resolver(request())).rejects.toMatchObject({code:which==='double'?'UNAVAILABLE':'INVALID_DATA'});
  }
});
it('STUB resolver provides no shared identity cache when ordinary A/B requests overlap',async()=>{
  const h=createMemoryHarness();
  const resolver=createVerifiedResolver({environment:environment(),verifyCaller:async req=>({subjectId:req.headers.get('x-test-request')==='B'?B:A,role:'student'}),connect:async caller=>({...(caller.subjectId===A?h.a:h.b),kind:'real'})});
  const [a,b]=await Promise.all([resolver(request()),resolver(request('GET',{'x-test-request':'B'}))]);
  expect((await a.getProfile()).userId).toBe(A);expect((await b.getProfile()).userId).toBe(B);
  const app=await a.saveApplication({jobId:PUBLIC_JOB});
  await expect(b.patchApplication(app.id,{notes:'foreign',expectedUpdatedAt:app.updatedAt})).rejects.toMatchObject({code:'NOT_FOUND'});
  expect(await b.listApplications()).toEqual([]);expect(await a.listApplications()).toEqual([app]);
});
it('STUB resolver sanitizes verifier failures through both prepared handler families',async()=>{
  const s=setup();const resolver=createVerifiedResolver({...s,verifyCaller:async()=>{throw new Error('private database bearer detail');}});
  for(const response of [await createProfileHandlers(resolver).GET(request()),await createApplicationHandlers(resolver).GET(request())]){
    expect(response.status).toBe(503);expect(await response.text()).not.toMatch(/private|database|bearer/);expect(response.headers.get('cache-control')).toBe('private, no-store');
  }
});

it('STUB resolver cannot be invoked from a browser environment',async()=>{
  const s=setup();vi.stubGlobal('window',{});
  try{await expect(createVerifiedResolver(s)(request())).rejects.toMatchObject({code:'UNAVAILABLE'});expect(s.connect).not.toHaveBeenCalled();}
  finally{vi.unstubAllGlobals();}
});
