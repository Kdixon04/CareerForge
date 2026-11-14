import { z } from 'zod';
import { preparedAdapter,SaveApplicationSchema,ApplicationPatchSchema,ownApplication,AdapterError } from '../../../components/ui/student-data/adapter-contract';
import { adapterResponse,inputJson,type ResolveAdapter } from '../../../components/ui/student-data/http-boundary';
export function createApplicationHandlers(resolve:ResolveAdapter=async()=>preparedAdapter()){
  const id=(value:string)=>{if(!z.string().uuid().safeParse(value).success)throw new AdapterError('INVALID_INPUT');return value;};
  return {GET:(request:Request)=>adapterResponse(request,resolve,async adapter=>(await adapter.listApplications()).map(value=>ownApplication(adapter,value))),
    POST:(request:Request)=>adapterResponse(request,resolve,async adapter=>ownApplication(adapter,await adapter.saveApplication(await inputJson(request,SaveApplicationSchema)))),
    PATCH:(request:Request,value:string)=>adapterResponse(request,resolve,async adapter=>ownApplication(adapter,await adapter.patchApplication(id(value),await inputJson(request,ApplicationPatchSchema)))),
    DELETE:(request:Request,value:string)=>adapterResponse(request,resolve,async adapter=>{const expected=id(value),result=await adapter.removeApplication(expected);if(result.id!==expected)throw new AdapterError('INVALID_DATA');return {id:expected};})};
}
