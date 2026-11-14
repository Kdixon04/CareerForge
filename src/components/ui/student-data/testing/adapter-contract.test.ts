import { it,expect } from 'vitest';
import { studentAdapterContract } from './contract-suite';
import { createMemoryHarness,A,B,PUBLIC_JOB,PRIVATE_A,PRIVATE_B,FACT_A } from './memory-double';
import { assertAdapterShape,preparedAdapter,ownProfile } from '../adapter-contract';
studentAdapterContract('TEST DOUBLE conformance — process memory, not production persistence',createMemoryHarness,{a:A,b:B,publicJob:PUBLIC_JOB,privateA:PRIVATE_A,privateB:PRIVATE_B,factA:FACT_A});
it('a missing real implementation fails loudly, never falls back to a double',()=>{expect(()=>preparedAdapter()).toThrow('unavailable');expect(()=>assertAdapterShape({})).toThrow('missing method: getProfile');});
it('consumer refuses corrupted/foreign data even if a driver returns it',async()=>{const h=createMemoryHarness();expect(()=>ownProfile(h.a,{userId:'bad'})).toThrow();const foreign=await h.b.getProfile();expect(()=>ownProfile(h.a,foreign)).toThrow();});

it('test-double bounds reject oversized fact collections/text/metadata without any partial update',async()=>{
  const h=createMemoryHarness(),before=await h.a.getProfile(),base={displayName:'Should not commit',field:null,facts:before.facts,expectedUpdatedAt:before.updatedAt};
  const facts=(count:number,length:number)=>Array.from({length:count},()=>({id:crypto.randomUUID(),kind:'skill',text:'x'.repeat(length),org:null,dates:null}));
  for(const patch of [{displayName:' '},{displayName:'x'.repeat(121)},{field:'x'.repeat(161)},{facts:facts(101,1)},{facts:facts(16,1900)},{facts:[{...before.facts[0],org:'x'.repeat(201)}]},{facts:[{...before.facts[0],dates:'x'.repeat(101)}]}]){await expect(h.a.putProfile({...base,...patch} as never)).rejects.toMatchObject({code:'INVALID_INPUT'});expect(await h.a.getProfile()).toEqual(before);}
});
