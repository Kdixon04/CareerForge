'use client';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import { ProfileForm } from '../../../app/(student)/profile/ProfileForm';
import { ProfileSaveError } from '../../../app/(student)/profile/profile-model';
import { Button } from '../Button';import { Input } from '../Input';import { Textarea } from '../Textarea';import { Card } from '../Card';
import { AdapterError,ownProfile,ownApplication,StatusSchema,ApplicationPatchSchema,type StudentDataAdapter,type Profile,type Application } from './adapter-contract';
function message(error:unknown){return error instanceof AdapterError?error.message:'This service is unavailable. Your edits are still here.';}
function useUnsaved(dirty:boolean){useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};addEventListener('beforeunload',warn);return()=>removeEventListener('beforeunload',warn);},[dirty]);}
export function ProfileAdapterEditor({adapter,onDirtyChange}:{adapter?:StudentDataAdapter;onDirtyChange?:(dirty:boolean)=>void}){
  const [profile,setProfile]=useState<Profile|null>(null),[error,setError]=useState(''),[load,setLoad]=useState(0),[dirty,setDirty]=useState(false),[saving,setSaving]=useState(false);const alert=useRef<HTMLDivElement>(null);useUnsaved(dirty);
  useEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
  useEffect(()=>{let active=true;setProfile(null);setError('');setDirty(false);if(!adapter){setError('Adapter not connected. Saving is unavailable.');return;}
    adapter.getProfile().then(value=>{if(active)setProfile(ownProfile(adapter,value));}).catch(failure=>{if(active)setError(message(failure));});return()=>{active=false;};
  },[adapter,load]);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  const test=adapter?.kind==='test-double';
  return <section aria-label="Profile adapter integration"><h2>Profile adapter integration</h2>
    {test&&<p className="cf-profile-notice">TEST DOUBLE: writes below affect lab server memory only. They are not real account saves.</p>}
    {error?<div ref={alert} tabIndex={-1} role="alert"><p>{error}</p><Button onClick={()=>setLoad(n=>n+1)}>Retry profile load</Button></div>:!profile?<p role="status">Loading profile through adapter…</p>:<>
      {dirty&&<p role="status">Unsaved profile changes in this page.</p>}
      <Button variant="secondary" disabled={saving} onClick={()=>{setDirty(false);setLoad(n=>n+1);}}>{dirty?'Discard unsaved profile changes':'Reload profile'}</Button>
      <ProfileForm key={`${adapter!.subjectId}:${load}`} initialProfile={profile} onDirtyChange={setDirty} saveLabel={test?'Save to test double':'Save profile'} savedMessage={test?'Test double updated. Retained in lab server memory only.':'Adapter update confirmed.'} onSave={async(draft,expectedUpdatedAt)=>{
        setSaving(true);try{return ownProfile(adapter!,await adapter!.putProfile({...draft,expectedUpdatedAt}));}
        catch(failure){const codes={CONFLICT:'conflict',UNAUTHENTICATED:'unauthenticated',FORBIDDEN:'forbidden',INVALID_INPUT:'validation',NETWORK_ERROR:'network'} as const;throw new ProfileSaveError(failure instanceof AdapterError&&failure.code in codes?codes[failure.code as keyof typeof codes]:'unavailable');}
        finally{setSaving(false);}
      }}/>
    </>}
  </section>;
}
function ApplicationEditor({adapter,item,onChange,onRemove,onDirty}:{adapter:StudentDataAdapter;item:Application;onChange:(value:Application)=>void;onRemove:()=>void;onDirty:(id:string,dirty:boolean)=>void}){
  const [status,setStatus]=useState(item.status),[deadline,setDeadline]=useState(item.deadline??''),[notes,setNotes]=useState(item.notes),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  const errorRef=useRef<HTMLParagraphElement>(null);useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
  const dirty=status!==item.status||deadline!==(item.deadline??'')||notes!==item.notes;useEffect(()=>{onDirty(item.id,dirty);},[item.id,dirty,onDirty]);
  async function update(event:FormEvent){event.preventDefault();if(busy)return;setSuccess('');const input=ApplicationPatchSchema.safeParse({status,deadline:deadline||null,notes,expectedUpdatedAt:item.updatedAt});if(!input.success){setError('Check the status/date and keep notes to 4,000 characters.');return;}setBusy(true);setError('');try{onChange(ownApplication(adapter,await adapter.patchApplication(item.id,input.data)));setSuccess(adapter.kind==='test-double'?'Test double updated; lab memory only.':'Adapter update confirmed.');}catch(failure){setError(message(failure));}finally{setBusy(false);}}
  return <Card aria-label={item.job?.title??'Unavailable listing'}><h3>{item.job?.title??'Listing unavailable'}</h3>
    {item.job?<><p>{item.job.company} · Source: {item.job.source}</p>{item.job.status==='paused'&&<p>Inactive listing</p>}<p>{item.job.deadline?`Listing deadline (${item.job.deadlineVerified?'verified':'unverified'}): ${item.job.deadline}`:'Deadline not provided'}</p></>:<p>Listing content is unavailable; tracking is retained.</p>}
    {dirty&&<p role="status">Unsaved application changes.</p>}
    <form onSubmit={update} noValidate><fieldset disabled={busy} className="cf-profile-fieldset"><div className="cf-field"><label htmlFor={`adapter-status-${item.id}`}>Application status</label><select id={`adapter-status-${item.id}`} className="cf-input" value={status} onChange={event=>{setStatus(event.target.value as Application['status']);setSuccess('');}}>{StatusSchema.options.map(value=><option key={value} value={value}>{value}</option>)}</select></div>
      <Input label="Personal reminder date" type="date" value={deadline} onChange={event=>{setDeadline(event.target.value);setSuccess('');}} hint="A personal reminder does not verify the listing deadline."/>
      <Textarea label="Application notes" maxLength={4000} value={notes} onChange={event=>{setNotes(event.target.value);setSuccess('');}}/>
      <Button type="submit">{busy?'Updating…':adapter.kind==='test-double'?'Update test double':'Update application'}</Button>
      <Button variant="secondary" onClick={()=>{setStatus(item.status);setDeadline(item.deadline??'');setNotes(item.notes);setError('');setSuccess('');}}>Reset application edits</Button>
      <Button variant="secondary" onClick={async()=>{if(busy)return;setBusy(true);setError('');try{await adapter.removeApplication(item.id);onRemove();requestAnimationFrame(()=>document.getElementById('adapter-app-refresh')?.focus());}catch(failure){setError(message(failure));setBusy(false);}}}>{adapter.kind==='test-double'?'Remove from test double':'Unsave application'}</Button>
    </fieldset></form>{error&&<p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}<p role="status">{success}</p>
  </Card>;
}
export function ApplicationsAdapterEditor({adapter,onDirtyChange}:{adapter?:StudentDataAdapter;onDirtyChange?:(dirty:boolean)=>void}){
  const [items,setItems]=useState<Application[]|null>(null),[error,setError]=useState(''),[load,setLoad]=useState(0),[dirtyIds,setDirtyIds]=useState<Record<string,boolean>>({});
  const loadError=useRef<HTMLDivElement>(null);useEffect(()=>{if(error)loadError.current?.focus();},[error]);
  const dirty=Object.values(dirtyIds).some(Boolean);useUnsaved(dirty);useEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
  const dirtyCallback=useRef((id:string,value:boolean)=>setDirtyIds(current=>current[id]===value?current:{...current,[id]:value})).current;
  useEffect(()=>{let active=true;setItems(null);setError('');setDirtyIds({});if(!adapter){setError('Adapter not connected. Applications are unavailable.');return;}
    adapter.listApplications().then(values=>{if(active){if(!Array.isArray(values))throw new AdapterError('INVALID_DATA');setItems(values.map(value=>ownApplication(adapter,value)));}}).catch(failure=>{if(active)setError(message(failure));});return()=>{active=false;};
  },[adapter,load]);
  return <section aria-label="Application adapter integration"><h2>Application adapter integration</h2>{adapter?.kind==='test-double'&&<p>TEST DOUBLE: application updates exist only in lab server memory.</p>}
    <Button id="adapter-app-refresh" variant="secondary" disabled={dirty} onClick={()=>setLoad(n=>n+1)}>Reload applications</Button>
    {error?<div ref={loadError} tabIndex={-1} role="alert"><p>{error}</p><Button onClick={()=>setLoad(n=>n+1)}>Retry application load</Button></div>:!items?<p role="status">Loading applications through adapter…</p>:items.length===0?<p role="status">No applications returned by this adapter.</p>:items.map(item=><ApplicationEditor key={item.id} item={item} adapter={adapter!} onDirty={dirtyCallback} onChange={next=>setItems(current=>current!.map(old=>old.id===next.id?next:old))} onRemove={()=>{setItems(current=>current!.filter(old=>old.id!==item.id));dirtyCallback(item.id,false);}}/>)}
  </section>;
}
