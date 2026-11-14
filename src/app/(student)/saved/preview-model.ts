import { z } from 'zod';
import type { JobPosting } from '../../../contracts';

// UI-only fixture shapes, not a shared API/data contract or an authorization layer.
export const PREVIEW_STATUSES = ['saved','applied','interviewing','offer','rejected'] as const;
export type PreviewStatus = typeof PREVIEW_STATUSES[number];
export type PreviewApplication = {
  id: string; status: PreviewStatus; deadline: string | null; notes: string;
  job: Pick<JobPosting,'title'|'company'|'source'|'sourceUrl'|'status'|'deadline'|'deadlineVerified'> | null;
};
export type PreviewChanges = Pick<PreviewApplication,'status'|'deadline'|'notes'>;
const dateOnly = z.string().length(10).regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return value.slice(0,4)!=='0000' && Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
});
const changesSchema = z.object({status:z.enum(PREVIEW_STATUSES),deadline:dateOnly.nullable(),notes:z.string().max(4000)}).strict();
export function validatePreviewChanges(input: unknown): {success:true;data:PreviewChanges} | {success:false} {
  const result = changesSchema.safeParse(input);
  return result.success ? {success:true,data:result.data} : {success:false};
}
export function changePreview(items:PreviewApplication[],id:string,changes:PreviewChanges):PreviewApplication[] {
  return items.map(item => item.id===id ? {...item,...changes} : item);
}
export function removePreview(items:PreviewApplication[],id:string):PreviewApplication[] { return items.filter(item => item.id!==id); }
export function visiblePreviewJob(item:PreviewApplication):PreviewApplication['job'] {
  return !item.job || ['hidden','draft'].includes(item.job.status) ? null : item.job;
}
