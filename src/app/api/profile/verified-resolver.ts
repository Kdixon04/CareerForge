import { z } from 'zod';
import { AdapterError, type StudentDataAdapter } from '../../../components/ui/student-data/adapter-contract';
import { checkedAdapter } from '../../../components/ui/student-data/checked-adapter';
import { productionConfigurationIssues } from '../../../components/ui/student-data/readiness';
import type { ResolveAdapter } from '../../../components/ui/student-data/http-boundary';
export type VerifiedCaller={subjectId:string;role:string};
export type ResolverDependencies={
  environment?:Record<string,string|undefined>;
  // Must use supported Auth verification + trusted server role, never lab headers/metadata.
  verifyCaller?:(request:Request)=>Promise<VerifiedCaller|null>;
  // Must create a per-request ordinary-session/RLS adapter, never service-role assertions.
  connect?:(caller:Readonly<VerifiedCaller>,request:Request)=>Promise<StudentDataAdapter>;
};
// PREPARED SERVER BOUNDARY ONLY. No Auth/database implementation or live route export.
// kind=real and an injected verifier are not evidence of Auth/RLS correctness.
export function createVerifiedResolver(dependencies:ResolverDependencies={}):ResolveAdapter {
  return async(request)=>{
    const environment=dependencies.environment??process.env;
    if(typeof window!=='undefined'||productionConfigurationIssues(environment).length||
       !dependencies.verifyCaller||!dependencies.connect)throw new AdapterError('UNAVAILABLE');
    if(request.headers.has('x-lab-user')||request.headers.has('x-lab-fault')||
       new URL(request.url).origin!==new URL(environment.APP_URL!).origin)throw new AdapterError('FORBIDDEN');
    const caller=await dependencies.verifyCaller(request);
    if(!caller||!z.string().uuid().safeParse(caller.subjectId).success)throw new AdapterError('UNAUTHENTICATED');
    if(caller.role!=='student')throw new AdapterError('FORBIDDEN');
    const verified=Object.freeze({subjectId:caller.subjectId,role:caller.role});
    const source=await dependencies.connect(verified,request);
    if(!source||source.kind!=='real')throw new AdapterError('UNAVAILABLE');
    if(source.subjectId!==verified.subjectId)throw new AdapterError('INVALID_DATA');
    return checkedAdapter(source);
  };
}
