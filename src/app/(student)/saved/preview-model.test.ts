import { expect, test } from 'vitest';
import { changePreview, removePreview, validatePreviewChanges, visiblePreviewJob, type PreviewApplication } from './preview-model';
const item:PreviewApplication = {id:'fictional-entry',status:'saved',deadline:null,notes:'Original',job:{title:'Fictional role',company:'Fictional Co',source:'pasted',sourceUrl:null,status:'private',deadline:null,deadlineVerified:false}};
test('fixture-only tracking validation accepts empty notes and real date-only values',() => {
  expect(validatePreviewChanges({status:'applied',deadline:'2028-02-29',notes:''})).toEqual({success:true,data:{status:'applied',deadline:'2028-02-29',notes:''}});
  expect(validatePreviewChanges({status:'saved',deadline:null,notes:'<script>plain text</script>'}).success).toBe(true);
});
test('fixture validation rejects invalid input, dates, statuses, oversized notes and ownership fields',() => {
  for (const input of [null,{}, {status:'admin',deadline:null,notes:''},{status:'saved',deadline:'2026-02-30',notes:''},{status:'saved',deadline:'12/01/2026',notes:''},{status:'saved',deadline:null,notes:'x'.repeat(4001)},{status:'saved',deadline:null,notes:'',userId:'foreign'}]) expect(validatePreviewChanges(input).success).toBe(false);
});
test('preview edits are immutable, missing ids are harmless and repeated removals stay empty',() => {
  const items=[structuredClone(item)]; const patch={status:'applied' as const,deadline:'2026-12-01',notes:'Fictional follow-up'};
  const changed=changePreview(items,item.id,patch); expect(changed[0]).toMatchObject(patch); expect(items[0]).toEqual(item);
  expect(changePreview(items,'missing',patch)).toEqual(items);
  expect(removePreview(removePreview(items,item.id),item.id)).toEqual([]); expect(items).toHaveLength(1);
});
test('hidden/draft summaries are unavailable while paused summaries remain inactive preview data',() => {
  expect(visiblePreviewJob({...item,job:null})).toBeNull();
  expect(visiblePreviewJob({...item,job:{...item.job!,status:'hidden'}})).toBeNull();
  expect(visiblePreviewJob({...item,job:{...item.job!,status:'draft'}})).toBeNull();
  expect(visiblePreviewJob({...item,job:{...item.job!,status:'paused'}})?.title).toBe('Fictional role');
});
