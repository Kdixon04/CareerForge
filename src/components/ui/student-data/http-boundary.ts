import { rejectProductionTestMode } from './readiness';
import { z } from 'zod';
import { checkedAdapter } from './checked-adapter';
import { AdapterError, publicAdapterError, type StudentDataAdapter } from './adapter-contract';
export type ResolveAdapter=(request:Request)=>Promise<StudentDataAdapter>;
export async function inputJson<T>(request:Request,schema:z.ZodType<T>):Promise<T>{
  if(request.headers.get('content-type')?.toLowerCase().split(';')[0].trim()!=='application/json')throw new AdapterError('INVALID_INPUT');
  const reader=request.body?.getReader();if(!reader)throw new AdapterError('INVALID_INPUT');const chunks:Uint8Array[]=[];let length=0;
  for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>196608){await reader.cancel();throw new AdapterError('INVALID_INPUT');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let value:unknown;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new AdapterError('INVALID_INPUT');}
  const parsed=schema.safeParse(value);if(!parsed.success)throw new AdapterError('INVALID_INPUT');return parsed.data;
}
export async function adapterResponse(request:Request,resolve:ResolveAdapter,operation:(adapter:StudentDataAdapter)=>Promise<unknown>,expectedMethod:string){
  const headers={'Cache-Control':'private, no-store','Vary':'Cookie, Authorization','X-Content-Type-Options':'nosniff','X-Request-Id':crypto.randomUUID()};
  try{const adapter=checkedAdapter(await resolve(request));rejectProductionTestMode(request,adapter,process.env);if(request.method!==expectedMethod||new URL(request.url).search)throw new AdapterError('INVALID_INPUT');if(!['GET','HEAD'].includes(request.method)&&request.headers.get('origin')!==new URL(request.url).origin)throw new AdapterError('FORBIDDEN');return Response.json({data:await operation(adapter)},{headers});}
  catch(error){const failure=publicAdapterError(error);return Response.json({error:{code:failure.code,message:failure.message}},{status:failure.status,headers});}
}
