import { it,expect } from 'vitest';
import { createProfileHandlers } from '../../../../app/api/profile/adapter-handlers';
import { createApplicationHandlers } from '../../../../app/api/applications/adapter-handlers';
import { AdapterError } from '../adapter-contract';
import { labMode,liveContractReadiness,requireRealDriver } from '../readiness';
import { createMemoryHarness,A,B,PUBLIC_JOB } from './memory-double';
const request=(path:string,method='GET',data?:unknown,origin='http://lab.test')=>new Request(`http://lab.test${path}`,{method,headers:{'Content-Type':'application/json',Origin:origin},...(data!==undefined?{body:JSON.stringify(data)}:{})});
it('prepared real GET/PUT fail closed, lab/live configuration cannot enable a double in production',async()=>{
  expect((await createProfileHandlers().GET(request('/profile'))).status).toBe(503);
  expect(labMode({})).toBe('disabled');expect(()=>labMode({NODE_ENV:'production',STEVE_ADAPTER_LAB:'test-double'})).toThrow();
  expect(liveContractReadiness({}).state).toBe('disabled');expect(liveContractReadiness({STEVE_LIVE_CONTRACTS:'1'}).state).toBe('configuration-required');expect(()=>requireRealDriver(createMemoryHarness().a)).toThrow();
});
it('HTTP boundary verifies caller before parsing, returns private envelopes and rejects ownership/origin/invalid JSON',async()=>{
  const h=createMemoryHarness(),handlers=createProfileHandlers(async()=>h.a);const read=await handlers.GET(request('/profile'));expect(read.headers.get('cache-control')).toBe('private, no-store');expect((await read.json()).data.userId).toBe(A);
  expect((await handlers.GET(request(`/profile?userId=${B}`))).status).toBe(400);
  const original=await h.a.getProfile(),valid={displayName:'Fictional HTTP',field:null,facts:original.facts,expectedUpdatedAt:original.updatedAt};
  expect((await handlers.PUT(request('/profile','PUT',{...valid,userId:B}))).status).toBe(400);
  expect((await handlers.PUT(request('/profile','PUT',valid,'https://evil.test'))).status).toBe(403);
  expect((await handlers.PUT(new Request('http://lab.test/profile',{method:'PUT',headers:{Origin:'http://lab.test','Content-Type':'application/json'},body:'{'}))).status).toBe(400);
  expect((await handlers.PUT(request('/profile','PUT',{...valid,displayName:'x'.repeat(196609)}))).status).toBe(400);
  for(const type of ['application/jsonp','text/plain'])expect((await handlers.PUT(new Request('http://lab.test/profile',{method:'PUT',headers:{Origin:'http://lab.test','Content-Type':type},body:JSON.stringify(valid)}))).status).toBe(400);
  expect(await h.a.getProfile()).toEqual(original);
  expect((await handlers.PUT(request('/profile','PUT',valid))).status).toBe(200);
  expect((await handlers.PUT(request('/profile','PUT',valid))).status).toBe(409);
  const denied=createProfileHandlers(async()=>{throw new AdapterError('UNAUTHENTICATED');});expect((await denied.PUT(request('/profile','PUT',{}))).status).toBe(401);
  const broken=createProfileHandlers(async()=>{throw new Error('private SQL token profile');});expect(await (await broken.GET(request('/profile'))).text()).not.toMatch(/SQL|token|stack/);
});
it('HTTP application handlers retain owner checks and unchanged state on foreign writes',async()=>{
  const h=createMemoryHarness(),a=createApplicationHandlers(async()=>h.a),b=createApplicationHandlers(async()=>h.b);
  const saved=await (await a.POST(request('/applications','POST',{jobId:PUBLIC_JOB}))).json();
  expect((await b.PATCH(request('/applications','PATCH',{notes:'Foreign',expectedUpdatedAt:saved.data.updatedAt}),saved.data.id)).status).toBe(404);
  expect((await b.DELETE(request('/applications','DELETE'),saved.data.id)).status).toBe(200);
  expect((await (await a.GET(request('/applications'))).json()).data).toEqual([saved.data]);expect((await (await b.GET(request('/applications'))).json()).data).toEqual([]);
});

it('authentication/role failures cover every mutation and never expose or cache private errors',async()=>{
  const h=createMemoryHarness(),before=await h.a.getProfile(),id=crypto.randomUUID();
  for(const code of ['UNAUTHENTICATED','FORBIDDEN'] as const){
    const resolver=async()=>{throw new AdapterError(code);};
    const p=createProfileHandlers(resolver),a=createApplicationHandlers(resolver);
    const responses=await Promise.all([
      p.GET(request('/profile')),p.PUT(request('/profile','PUT',{})),
      a.GET(request('/applications')),a.POST(request('/applications','POST',{})),
      a.PATCH(request('/applications','PATCH',{}),id),a.DELETE(request('/applications','DELETE'),id),
    ]);
    for(const response of responses){
      expect(response.status).toBe(code==='UNAUTHENTICATED'?401:403);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(response.headers.get('vary')).toBe('Cookie, Authorization');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
      expect(await response.json()).toEqual({error:{code,message:new AdapterError(code).message}});
    }
  }
  expect(await h.a.getProfile()).toEqual(before);expect(await h.a.listApplications()).toEqual([]);
});
