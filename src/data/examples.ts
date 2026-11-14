import type { JobPosting, ResumeVersion, StudentProfile } from '../contracts';

const studentId = '11111111-1111-4111-8111-111111111111';
const jobId = '22222222-2222-4222-8222-222222222222';
const factId = '33333333-3333-4333-8333-333333333333';
const bulletId = '44444444-4444-4444-8444-444444444444';
const now = '2026-11-13T12:00:00.000Z';

export const exampleStudent: StudentProfile = {
  userId: studentId, displayName: 'Maya Chen', field: 'Computer Science', updatedAt: now,
  facts: [{ id: factId, kind: 'project', text: 'Built a typed application tracker', dates: null, org: null }],
};
export const exampleJob: JobPosting = {
  id: jobId, title: 'Junior Web Developer', company: 'North Star Labs',
  description: 'Build accessible web interfaces.', location: 'Rexburg, ID',
  jobType: 'full_time', workMode: 'on_site', sourceUrl: 'https://example.com/jobs/job-001',
  deadline: null, source: 'pasted', providerName: null, externalId: null,
  createdByUserId: studentId, employerId: null, status: 'private', retrievedAt: null,
  deadlineVerified: false, createdAt: now, updatedAt: now,
};
export const exampleResume: ResumeVersion = {
  id: '55555555-5555-4555-8555-555555555555', userId: studentId, jobId,
  generatedBullets: [{ id: bulletId, text: 'Built a typed application tracker.', evidence: [factId], targetsRequirement: 'Web development' }],
  editedBullets: [{ id: bulletId, text: 'Built a typed application tracker.' }],
  match: { jobId, matches: [{ requirement: 'Web development', factIds: [factId] }], gaps: [] },
  factSnapshot: exampleStudent.facts, createdAt: now, updatedAt: now,
};
