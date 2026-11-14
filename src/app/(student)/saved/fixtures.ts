import type { PreviewApplication } from './preview-model';
// Fictional examples only. Never a fallback for a signed-in student's data.
export function fictionalApplications(): PreviewApplication[] {
  return [
    {id:'fixture-open',status:'saved',deadline:null,notes:'Fictional example: review the posting before applying.',job:{title:'Fictional Solar Internship',company:'Fictional Solar Co',source:'employer',sourceUrl:'https://example.com/fictional-opportunity',status:'published',deadline:null,deadlineVerified:false}},
    {id:'fixture-paused',status:'applied',deadline:null,notes:'Fictional example: prepare a project walkthrough.',job:{title:'Fictional Design Assistant',company:'Fictional Studio',source:'employer',sourceUrl:null,status:'paused',deadline:'2026-12-01',deadlineVerified:false}},
    {id:'fixture-hidden',status:'interviewing',deadline:null,notes:'Fictional example: tracking stays when a listing is unavailable.',job:null},
  ];
}
