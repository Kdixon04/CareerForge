import { z } from 'zod';
import { StudentProfileSchema, StudentFactSchema } from '../../../contracts';

// Consumer-owned proposal. Keyan/Dallas must approve the production bridge.
const fact = StudentFactSchema.extend({text:z.string().trim().min(1).max(2000),org:z.string().max(200).nullable(),dates:z.string().max(100).nullable()}).strict();
const facts = z.array(fact).max(100).refine(value=>new Set(value.map(item=>item.id)).size===value.length,'Duplicate fact IDs').refine(value=>value.reduce((n,item)=>n+item.text.length+(item.org?.length??0)+(item.dates?.length??0),0)<=30000,'Profile too long');
export const ProfileSchema = StudentProfileSchema.extend({displayName:z.string().max(120),field:z.string().max(160).nullable(),facts}).strict();
export type Profile = z.infer<typeof ProfileSchema>;
export const ProfileWriteSchema = z.object({displayName:z.string().trim().min(1).max(120),field:z.string().trim().max(160).nullable(),facts,expectedUpdatedAt:z.string().datetime()}).strict();
export type ProfileWrite = z.infer<typeof ProfileWriteSchema>;
export const CalendarDate = z.string().length(10).regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const date=new Date(`${value}T00:00:00Z`);return !value.startsWith('0000')&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;});
export const StatusSchema = z.enum(['saved','applied','interviewing','offer','rejected']);
export const ApplicationPatchSchema = z.object({status:StatusSchema.optional(),deadline:CalendarDate.nullable().optional(),notes:z.string().max(4000).optional(),expectedUpdatedAt:z.string().datetime()}).strict().refine(value=>Object.keys(value).some(key=>key!=='expectedUpdatedAt'),'Supply a change');
export type ApplicationPatch = z.infer<typeof ApplicationPatchSchema>;
export const SaveApplicationSchema = z.object({jobId:z.string().uuid()}).strict();
export const ApplicationSchema = z.object({id:z.string().uuid(),userId:z.string().uuid(),jobId:z.string().uuid(),status:StatusSchema,deadline:CalendarDate.nullable(),notes:z.string().max(4000),updatedAt:z.string().datetime(),job:z.object({id:z.string().uuid(),title:z.string().max(300),company:z.string().max(300),status:z.enum(['private','published','paused']),source:z.enum(['pasted','employer','provider','claude_web']),sourceUrl:z.string().url().regex(/^https:\/\//).refine(value=>{try{const url=new URL(value);return !url.username&&!url.password;}catch{return false;}},'URL credentials are forbidden').nullable(),deadline:CalendarDate.nullable(),deadlineVerified:z.boolean()}).strict().nullable()}).strict().refine(value=>!value.job||value.job.id===value.jobId,'Mismatched job');
export type Application = z.infer<typeof ApplicationSchema>;
export const ERROR_STATUS = {INVALID_INPUT:400,UNAUTHENTICATED:401,FORBIDDEN:403,NOT_FOUND:404,CONFLICT:409,NETWORK_ERROR:503,INVALID_DATA:503,UNAVAILABLE:503} as const;
export type ErrorCode = keyof typeof ERROR_STATUS;
const messages:Record<ErrorCode,string>={INVALID_INPUT:'Check your entries. Nothing was changed.',UNAUTHENTICATED:'Sign in again. Your edits are still here.',FORBIDDEN:'Your account cannot perform this action.',NOT_FOUND:'This record is unavailable.',CONFLICT:'A newer version exists. Copy your edits before reloading.',NETWORK_ERROR:'Connection failed. Your edits are still here; retry when connected.',INVALID_DATA:'The response could not be validated safely.',UNAVAILABLE:'This service is unavailable. Your edits are still here.'};
export class AdapterError extends Error { readonly status:number; constructor(readonly code:ErrorCode){super(messages[code]);this.status=ERROR_STATUS[code];} }
export interface StudentDataAdapter {
  readonly kind:'test-double'|'real'; readonly subjectId:string;
  getProfile():Promise<Profile>;
  putProfile(input:ProfileWrite):Promise<Profile>;
  listApplications():Promise<Application[]>;
  saveApplication(input:{jobId:string}):Promise<Application>;
  patchApplication(id:string,input:ApplicationPatch):Promise<Application>;
  removeApplication(id:string):Promise<{id:string}>;
}
export function assertAdapterShape(value:unknown):asserts value is StudentDataAdapter {
  const adapter=value as StudentDataAdapter|undefined;
  for(const method of ['getProfile','putProfile','listApplications','saveApplication','patchApplication','removeApplication'] as const) if(typeof adapter?.[method]!=='function') throw new Error(`Adapter contract missing method: ${method}`);
  if(!z.string().uuid().safeParse(adapter?.subjectId).success||!adapter||!['test-double','real'].includes(adapter.kind)) throw new Error('Adapter contract requires verified subjectId and explicit kind');
}
export function ownProfile(adapter:StudentDataAdapter,value:unknown):Profile {
  const parsed=ProfileSchema.safeParse(value);if(!parsed.success||parsed.data.userId!==adapter.subjectId)throw new AdapterError('INVALID_DATA');return parsed.data;
}
export function ownApplication(adapter:StudentDataAdapter,value:unknown):Application {
  const parsed=ApplicationSchema.safeParse(value);if(!parsed.success||parsed.data.userId!==adapter.subjectId)throw new AdapterError('INVALID_DATA');return parsed.data;
}
export function preparedAdapter():StudentDataAdapter {throw new AdapterError('UNAVAILABLE');} // No production implementation/fallback.

// Never expose mutable Error.message/status values received from a driver.
export function publicAdapterError(error: unknown): AdapterError {
  const code=error instanceof AdapterError && Object.hasOwn(ERROR_STATUS,error.code) ? error.code : 'UNAVAILABLE';
  return new AdapterError(code);
}
