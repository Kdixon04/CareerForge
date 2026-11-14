import type { Job, ResumeSuggestion, StudentProfile } from '../contracts';

export const exampleStudent: StudentProfile = {
  id: 'student-001', displayName: 'Maya Chen', school: 'BYU-Idaho', major: 'Computer Science',
  skills: ['TypeScript', 'Testing', 'Accessible UI'],
  facts: [
    { id: 'skill-typescript', label: 'Skill', value: 'TypeScript', category: 'skill' },
    { id: 'project-tracker', label: 'Project', value: 'Built a typed application tracker', category: 'experience' },
  ],
};

export const exampleJob: Job = {
  id: 'job-001', title: 'Junior Web Developer', company: 'North Star Labs', location: 'Rexburg, ID',
  sourceUrl: 'https://example.com/jobs/job-001', verificationStatus: 'unverified',
};

export const exampleSuggestion: ResumeSuggestion = {
  id: 'suggestion-001', type: 'experience', text: 'Built a typed application tracker with TypeScript.',
  sourceFactIds: ['skill-typescript', 'project-tracker'], evidence: 'TypeScript; typed application tracker',
};
