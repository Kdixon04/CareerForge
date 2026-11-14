import type { StudentFact } from '../../../contracts';
import { exampleJob } from '../../../data/examples';
import type { PrepBundle } from './prep-hub';

/**
 * STRETCH — fictional Prep Hub sample data. Used by the `/jobs/[id]/prep`
 * preview while live generation is not connected (`IS_PREP_LIVE = false`).
 * All content is fictional sample data for layout review only.
 */

const FACT_TRACKER = '33333333-3333-4333-8333-333333333333';
const FACT_A11Y = '66666666-6666-4666-8666-666666666666';

/** Sample facts mirrored from the fictional example student (ids match evidence below). */
export function prepFixtureFacts(): StudentFact[] {
  return [
    { id: FACT_TRACKER, kind: 'project', text: 'Built a typed application tracker', dates: null, org: null },
    { id: FACT_A11Y, kind: 'skill', text: 'Accessible HTML and TypeScript for student-facing tools', dates: null, org: null },
  ];
}

export function fixturePrepBundle(): PrepBundle {
  return {
    jobId: exampleJob.id,
    buzzwords: [
      { term: 'Accessibility (a11y)', definition: 'Designing interfaces usable by people with disabilities — keyboard navigation, screen readers, and sufficient contrast.' },
      { term: 'Component library', definition: 'A reusable set of shared UI building blocks used across an application.' },
      { term: 'CI/CD', definition: 'Automated building, testing, and deploying of code changes.' },
    ],
    questions: [
      {
        id: 'q-web-ui',
        text: 'Tell us about a web interface you built and the tools you used.',
        answerableByFactIds: [FACT_TRACKER, FACT_A11Y],
        bestFactId: FACT_TRACKER,
        suggestedAnswer: {
          text: 'Describe the typed application tracker you built — the problem it solved for classmates and the TypeScript and accessible-HTML choices you made.',
          evidence: [FACT_TRACKER, FACT_A11Y],
        },
        gapNote: null,
      },
      {
        id: 'q-accessibility',
        text: 'How do you make a user interface accessible?',
        answerableByFactIds: [FACT_A11Y],
        bestFactId: FACT_A11Y,
        suggestedAnswer: {
          text: 'Draw on your accessible HTML and TypeScript work: semantic markup, keyboard navigation, and checking colour contrast.',
          evidence: [FACT_A11Y],
        },
        gapNote: null,
      },
      {
        id: 'q-deploy',
        text: 'Describe a time you deployed an application to production.',
        answerableByFactIds: [],
        bestFactId: null,
        suggestedAnswer: null,
        gapNote: 'No fact in your sample profile covers production deployment. Consider adding one, or prepare an honest answer about what you would learn.',
      },
    ],
    contacts: [
      {
        id: 'contact-1',
        name: 'Jordan Rivera (sample)',
        role: 'Frontend Engineer',
        org: exampleJob.company,
        blurb: 'Open to a short chat about early-career frontend work.',
        fictional: true,
      },
      {
        id: 'contact-2',
        name: 'Alex Kim (sample)',
        role: 'Engineering Manager',
        org: exampleJob.company,
        blurb: 'Happy to answer questions about how the internship team works.',
        fictional: true,
      },
    ],
    news: [
      {
        id: 'news-1',
        title: `${exampleJob.company} highlighted for accessibility work (sample)`,
        source: 'Sample Wire',
        url: 'https://example.com/news/accessibility',
        publishedAt: '2026-11-10',
        summary: 'Fictional sample headline used for layout review only — not a real article.',
        unverified: true,
      },
    ],
  };
}
