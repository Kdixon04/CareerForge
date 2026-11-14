import type { JobPosting } from '../../../contracts';
import { exampleJob } from '../../../data/examples';

/** Extra fixture row for browse/filter Playwright only (E2E fixture mode). */
export function fixtureBrowseJobs(): JobPosting[] {
  return [
    exampleJob,
    {
      ...exampleJob,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      title: 'Remote Design Intern',
      company: 'Summit Studio',
      jobType: 'internship',
      workMode: 'remote',
      description: 'Support design systems and prototype work.',
      sourceUrl: 'https://example.com/jobs/design-intern',
    },
  ];
}