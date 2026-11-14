import { AdapterError,ERROR_STATUS,ownProfile,ownApplication,type ErrorCode,type StudentDataAdapter } from '../adapter-contract';
export type LabFault='normal'|'load-error'|'load-auth'|'load-forbidden'|'corrupt-load'|'save-network'|'save-validation'|'save-auth'|'save-forbidden'|'save-conflict'|'slow-save';
// TEST TRANSPORT ONLY. Header identities are fictional and provide no real authentication.
export function labTransport(subjectId:string,user:'a'|'b',fault:()=>LabFault):StudentDataAdapter{
  async function call(path:string,method='GET',data?:unknown):Promise<unknown>{
    let response:Response;try{response=await fetch(`/lab/${path}`,{method,cache:'no-store',headers:{'x-lab-user':user,'x-lab-fault':fault(),...(data!==undefined?{'Content-Type':'application/json'}:{})},...(data!==undefined?{body:JSON.stringify(data)}:{})});}catch{throw new AdapterError('NETWORK_ERROR');}
    let body:unknown;try{body=await response.json();}catch{throw new AdapterError('INVALID_DATA');}
    const envelope=body as {data?:unknown;error?:{code?:unknown}}|null;const code=envelope?.error?.code;
    if(!response.ok)throw new AdapterError(typeof code==='string'&&Object.prototype.hasOwnProperty.call(ERROR_STATUS,code)?code as ErrorCode:'UNAVAILABLE');return envelope?.data;
  }
  const adapter:StudentDataAdapter={kind:'test-double',subjectId,
    getProfile:async()=>ownProfile(adapter,await call('profile')),
    putProfile:async input=>ownProfile(adapter,await call('profile','PUT',input)),
    listApplications:async()=>{const values=await call('applications');if(!Array.isArray(values))throw new AdapterError('INVALID_DATA');return values.map(value=>ownApplication(adapter,value));},
    saveApplication:async input=>ownApplication(adapter,await call('applications','POST',input)),
    patchApplication:async(id,input)=>ownApplication(adapter,await call(`applications/${id}`,'PATCH',input)),
    removeApplication:async id=>{const data=await call(`applications/${id}`,'DELETE') as {id?:unknown}|null;if(data?.id!==id)throw new AdapterError('INVALID_DATA');return{id};},
  };return adapter;
}
