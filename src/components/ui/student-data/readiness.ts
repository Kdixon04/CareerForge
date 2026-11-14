import { AdapterError, assertAdapterShape, type StudentDataAdapter } from './adapter-contract';
export function labMode(environment:Record<string,string|undefined>):'test-double'|'disabled'{
  if(environment.STEVE_ADAPTER_LAB!=='test-double')return 'disabled';
  if(environment.NODE_ENV==='production')throw new Error('Adapter lab is disabled in production');
  return 'test-double';
}
export function liveContractReadiness(environment:Record<string,string|undefined>){
  if(environment.STEVE_LIVE_CONTRACTS!=='1')return {state:'disabled' as const,missing:[] as string[]};
  const required=['STEVE_ISOLATED_PROJECT','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','E2E_STUDENT_A_EMAIL','E2E_STUDENT_A_PASSWORD','E2E_STUDENT_B_EMAIL','E2E_STUDENT_B_PASSWORD'];
  const missing=required.filter(name=>!environment[name]);
  if(environment.STEVE_ISOLATED_PROJECT!=='yes'&&!missing.includes('STEVE_ISOLATED_PROJECT'))missing.push('STEVE_ISOLATED_PROJECT');
  try{const url=new URL(environment.NEXT_PUBLIC_SUPABASE_URL??'');if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error();}catch{if(!missing.includes('NEXT_PUBLIC_SUPABASE_URL'))missing.push('NEXT_PUBLIC_SUPABASE_URL');}
  const key=environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??'';if(key.startsWith('sb_secret_')&&!missing.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'))missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  if(environment.E2E_STUDENT_A_EMAIL===environment.E2E_STUDENT_B_EMAIL&&!missing.includes('E2E_STUDENT_B_EMAIL'))missing.push('E2E_STUDENT_B_EMAIL');
  return {state:missing.length?'configuration-required' as const:'real-driver-required' as const,missing};
}
// Configuration alone never enables real writes or substitutes fictional data.
export function requireRealDriver(value:StudentDataAdapter|undefined):StudentDataAdapter{if(!value||value.kind!=='real')throw new AdapterError('UNAVAILABLE');assertAdapterShape(value);return value;}
