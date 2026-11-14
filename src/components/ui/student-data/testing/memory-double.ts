import { AdapterError, ProfileWriteSchema, ApplicationPatchSchema, SaveApplicationSchema, type Profile, type Application, type StudentDataAdapter, type ProfileWrite, type ApplicationPatch } from '../adapter-contract';
import { z } from 'zod';
export const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',E='33333333-3333-4333-8333-333333333333';
export const PUBLIC_JOB='44444444-4444-4444-8444-444444444444',PRIVATE_A='55555555-5555-4555-8555-555555555555',PRIVATE_B='66666666-6666-4666-8666-666666666666',FACT_A='88888888-8888-4888-8888-888888888888';
type Job=Omit<NonNullable<Application['job']>,'status'>&{owner:string|null;status:'published'|'private'|'paused'|'hidden'};
const copy=<T>(value:T):T=>structuredClone(value);
// TEST DOUBLE ONLY: identity comes from a fictional fixture, not real authentication.
// Retains data only while this harness/server instance lives. No disk/browser storage.
export function createMemoryHarness(){
  if(process.env.NODE_ENV==='production')throw new Error('Test double disabled in production');
  let version=Date.UTC(2026,10,14);const stamp=()=>new Date(++version).toISOString();
  const profiles=new Map<string,Profile>([[A,{userId:A,displayName:'Fictional Student A',field:null,facts:[{id:FACT_A,kind:'skill',text:'Python',dates:null,org:null}],updatedAt:stamp()}],[B,{userId:B,displayName:'',field:null,facts:[],updatedAt:stamp()}]]);
  const jobs=new Map<string,Job>();
  for(const [id,owner] of [[PUBLIC_JOB,null],[PRIVATE_A,A],[PRIVATE_B,B]] as const)jobs.set(id,{id,owner,title:'Fictional role',company:'Fictional Co',status:owner?'private':'published',source:owner?'pasted':'employer',sourceUrl:null,deadline:null,deadlineVerified:false});
  const apps=new Map<string,Omit<Application,'job'>>();
  function connect(subjectId:string,role:'student'|'employer'|'anonymous'='student'):StudentDataAdapter{
    const authorize=()=>{if(role==='anonymous')throw new AdapterError('UNAUTHENTICATED');if(role!=='student')throw new AdapterError('FORBIDDEN');if(!profiles.has(subjectId))throw new AdapterError('UNAUTHENTICATED');};
    const summary=(item:Omit<Application,'job'>):Application=>{const job=jobs.get(item.jobId);let visible:Application['job']=null;if(job&&job.status!=='hidden'&&(job.status!=='private'||job.owner===subjectId)){const {owner:_,...fields}=job;visible=fields as Application['job'];}return copy({...item,job:visible});};
    return {kind:'test-double',subjectId,
      async getProfile(){authorize();return copy(profiles.get(subjectId)!);},
      async putProfile(raw:ProfileWrite){authorize();const result=ProfileWriteSchema.safeParse(raw);if(!result.success)throw new AdapterError('INVALID_INPUT');const input=result.data,previous=profiles.get(subjectId)!;
        if(previous.updatedAt!==input.expectedUpdatedAt)throw new AdapterError('CONFLICT');
        for(const fact of input.facts)for(const [owner,profile] of Array.from(profiles.entries()))if(owner!==subjectId&&profile.facts.some(old=>old.id===fact.id))throw new AdapterError('INVALID_INPUT');
        // Synchronous validation + commit: models atomic behavior, not PostgreSQL transactions.
        const next={userId:subjectId,displayName:input.displayName,field:input.field?.trim()||null,facts:copy(input.facts),updatedAt:stamp()};profiles.set(subjectId,next);return copy(next);
      },
      async listApplications(){authorize();return Array.from(apps.values()).filter(item=>item.userId===subjectId).map(summary);},
      async saveApplication(raw){authorize();const parsed=SaveApplicationSchema.safeParse(raw);if(!parsed.success)throw new AdapterError('INVALID_INPUT');const jobId=parsed.data.jobId;
        const existing=Array.from(apps.values()).find(item=>item.userId===subjectId&&item.jobId===jobId);if(existing)return summary(existing);
        const job=jobs.get(jobId);if(!job||job.status==='hidden'||job.status==='paused'||(job.status==='private'&&job.owner!==subjectId))throw new AdapterError('NOT_FOUND');
        const item={id:crypto.randomUUID(),userId:subjectId,jobId,status:'saved' as const,deadline:null,notes:'',updatedAt:stamp()};apps.set(item.id,item);return summary(item);
      },
      async patchApplication(id:string,raw:ApplicationPatch){authorize();if(!z.string().uuid().safeParse(id).success)throw new AdapterError('INVALID_INPUT');const parsed=ApplicationPatchSchema.safeParse(raw);if(!parsed.success)throw new AdapterError('INVALID_INPUT');const item=apps.get(id);if(!item||item.userId!==subjectId)throw new AdapterError('NOT_FOUND');if(parsed.data.expectedUpdatedAt!==item.updatedAt)throw new AdapterError('CONFLICT');const {expectedUpdatedAt:_,...patch}=parsed.data;const next={...item,...patch,updatedAt:stamp()};apps.set(id,next);return summary(next);},
      async removeApplication(id:string){authorize();if(!z.string().uuid().safeParse(id).success)throw new AdapterError('INVALID_INPUT');if(apps.get(id)?.userId===subjectId)apps.delete(id);return {id};},
    };
  }
  return {a:connect(A),b:connect(B),anonymous:connect(A,'anonymous'),employer:connect(E,'employer'),reconnectA:()=>connect(A),reconnectB:()=>connect(B),setJobStatus:(id:string,status:Job['status'])=>{const job=jobs.get(id)!;jobs.set(id,{...job,status});}};
}
