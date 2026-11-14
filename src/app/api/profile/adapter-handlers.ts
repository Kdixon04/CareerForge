import { preparedAdapter,ProfileWriteSchema,ownProfile,AdapterError } from '../../../components/ui/student-data/adapter-contract';
import { adapterResponse,inputJson,type ResolveAdapter } from '../../../components/ui/student-data/http-boundary';
// Prepared handlers, deliberately NOT exported as a live Next route.
// ResolveAdapter must verify session/role before returning a user-scoped adapter.
export function createProfileHandlers(resolve:ResolveAdapter=async()=>preparedAdapter()){
  return {GET:(request:Request)=>adapterResponse(request,resolve,async adapter=>{if(new URL(request.url).search)throw new AdapterError('INVALID_INPUT');return ownProfile(adapter,await adapter.getProfile());}),
    PUT:(request:Request)=>adapterResponse(request,resolve,async adapter=>ownProfile(adapter,await adapter.putProfile(await inputJson(request,ProfileWriteSchema))))};
}
