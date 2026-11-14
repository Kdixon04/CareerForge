'use client';
import { useState, type FormEvent } from 'react';
import { MainNav } from '../../../components/nav/MainNav';
import { ThemeToggle } from '../../../components/theme/ThemeToggle';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { fictionalApplications } from './fixtures';
import { changePreview, removePreview, validatePreviewChanges, visiblePreviewJob, PREVIEW_STATUSES, type PreviewApplication } from './preview-model';
import '../profile/profile.css';
import './saved.css';

function PreviewCard({item,onChange,onRemove}:{item:PreviewApplication;onChange:(value:PreviewApplication)=>void;onRemove:()=>void}) {
  const [status,setStatus]=useState(item.status); const [deadline,setDeadline]=useState(item.deadline ?? '');
  const [notes,setNotes]=useState(item.notes); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  const job=visiblePreviewJob(item);
  function check(event:FormEvent) {
    event.preventDefault(); setMessage('');
    const result=validatePreviewChanges({status,deadline:deadline || null,notes});
    if(!result.success) { setError('Choose a valid status and calendar date; keep notes to 4,000 characters or fewer.'); return; }
    setError(''); onChange({...item,...result.data});
    setMessage('Preview updated on this page only. Nothing was saved.');
  }
  const clearFeedback=()=>{setError('');setMessage('');};
  return <Card aria-label={job?.title ?? 'Unavailable fictional listing'}>
    <h2>{job?.title ?? 'Listing unavailable'}</h2>
    {job ? <><p>{job.company}</p><div className="cf-saved-badges"><Badge>Fictional example</Badge><Badge>{job.status==='paused' ? 'Inactive listing' : 'Example listing'}</Badge></div>
      <p className="cf-hint">Source: {job.source}</p>
      {job.sourceUrl?.startsWith('https://') && <p><a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">Fictional source link</a></p>}
      <p>{job.deadline ? `Listing deadline (${job.deadlineVerified ? 'verified' : 'unverified'}): ${job.deadline}` : 'Deadline not provided'}</p></>
      : <p>The listing is unavailable. This fictional example keeps the tracking fields without exposing listing content.</p>}
    <form onSubmit={check} noValidate aria-label={`Tracking preview: ${job?.title ?? 'unavailable listing'}`}>
      <div className="cf-saved-fields"><div className="cf-field"><label className="cf-label" htmlFor={`status-${item.id}`}>Application status</label>
        <select id={`status-${item.id}`} className="cf-input" value={status} onChange={event=>{setStatus(event.target.value as PreviewApplication['status']);clearFeedback();}}>
          {PREVIEW_STATUSES.map(value=><option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}
        </select></div>
        <Input label="Personal reminder date" type="date" min="0001-01-01" max="9999-12-31" value={deadline} onChange={event=>{setDeadline(event.target.value);clearFeedback();}} hint="Your reminder does not verify or change the listing deadline." />
        <Textarea label="Application notes" rows={3} maxLength={4000} value={notes} onChange={event=>{setNotes(event.target.value);clearFeedback();}} />
        <div className="cf-profile-add"><Button type="submit">Check preview changes</Button><Button variant="secondary" onClick={onRemove}>Remove from preview</Button></div>
      </div>
      {error && <p className="cf-error" role="alert">{error}</p>}<p role="status" aria-live="polite">{message}</p>
    </form>
  </Card>;
}
export function SavedApplicationsPreview() {
  const [items,setItems]=useState(fictionalApplications); const [reset,setReset]=useState(0); const [notice,setNotice]=useState('');
  return <div className="cf-profile cf-saved"><a className="cf-skip" href="#saved-main">Skip to saved preview</a><div className="cf-profile-shell">
    <header className="cf-profile-header cf-saved-header"><a href="/" className="cf-profile-brand">Career Forge</a><MainNav currentPath="/saved" links={[{href:'/',label:'Home'},{href:'/profile',label:'Profile'},{href:'/jobs',label:'Find jobs'},{href:'/saved',label:'Saved'}]} /><ThemeToggle /></header>
    <main id="saved-main" tabIndex={-1}><p className="cf-profile-eyebrow">SAVED APPLICATIONS / DESIGN PREVIEW</p><h1>Your next steps.</h1>
      <aside className="cf-profile-notice" aria-label="Saved preview limitations"><strong>Fictional preview — nothing is saved</strong><p>These examples are not your account data. Changes stay in this page's memory and reset on reload. This preview is not connected to your account or saved application records. Checking, removing or resetting these examples never writes to a real account.</p></aside>
      <p>Try application statuses, personal reminders and notes. Nothing is submitted automatically.</p>
      {items.length===0 ? <Card><h2>No applications in this preview.</h2><p>Your real saved applications will appear here after secure account integration.</p><a href="/jobs">Find or paste a job</a></Card>
        : items.map(item=><PreviewCard key={`${reset}:${item.id}`} item={item} onChange={next=>setItems(current=>changePreview(current,next.id,next))} onRemove={()=>{setItems(current=>removePreview(current,item.id));setNotice('Removed from this preview only. No account data changed.');requestAnimationFrame(()=>document.getElementById('saved-preview-reset')?.focus());}} />)}
      <Button id="saved-preview-reset" variant="secondary" onClick={()=>{setItems(fictionalApplications());setReset(value=>value+1);setNotice('Fictional examples reset. Nothing was saved.');}}>Reset fictional examples</Button>
      <p role="status" aria-live="polite">{notice}</p>
    </main>
  </div></div>;
}
