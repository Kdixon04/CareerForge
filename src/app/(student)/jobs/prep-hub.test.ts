import { describe, expect, it } from 'vitest';
import type { StudentFact } from '../../../contracts';
import {
  buildQuestionAnswerView,
  questionsForFact,
  questionsForTypedExperience,
  tokenize,
  type PrepBundle,
} from './prep-hub';

const FACT_A = '33333333-3333-4333-8333-333333333333';
const FACT_B = '66666666-6666-4666-8666-666666666666';

const facts: StudentFact[] = [
  { id: FACT_A, kind: 'project', text: 'Built a typed application tracker', dates: null, org: null },
  { id: FACT_B, kind: 'skill', text: 'Accessible HTML and TypeScript', dates: null, org: null },
];

const bundle: PrepBundle = {
  jobId: 'job-1',
  buzzwords: [{ term: 'a11y', definition: 'accessibility' }],
  questions: [
    {
      id: 'q1',
      text: 'Tell us about a web interface you built and the tools you used.',
      answerableByFactIds: [FACT_A, FACT_B],
      bestFactId: FACT_A,
      suggestedAnswer: { text: 'Describe your tracker.', evidence: [FACT_A, FACT_B] },
      gapNote: null,
    },
    {
      id: 'q2',
      text: 'How do you make a UI accessible?',
      answerableByFactIds: [FACT_B],
      bestFactId: FACT_B,
      suggestedAnswer: { text: 'Draw on accessible HTML work.', evidence: [FACT_B] },
      gapNote: null,
    },
    {
      id: 'q3',
      text: 'Describe a production deployment.',
      answerableByFactIds: [],
      bestFactId: null,
      suggestedAnswer: null,
      gapNote: 'No fact covers deployment.',
    },
  ],
  contacts: [],
  news: [],
};

describe('buildQuestionAnswerView (View A)', () => {
  it('resolves evidence fact text for answered questions', () => {
    const view = buildQuestionAnswerView(bundle, facts);
    expect(view).toHaveLength(3);
    expect(view[0].hasAnswer).toBe(true);
    expect(view[0].evidence.map(e => e.text)).toEqual([
      'Built a typed application tracker',
      'Accessible HTML and TypeScript',
    ]);
  });

  it('marks gap questions as having no answer and null evidence text for unknown ids', () => {
    const view = buildQuestionAnswerView(bundle, []);
    expect(view[2].hasAnswer).toBe(false);
    expect(view[2].question.gapNote).toBe('No fact covers deployment.');
    expect(view[0].evidence.every(e => e.text === null)).toBe(true);
  });
});

describe('questionsForFact (View B — existing fact)', () => {
  it('returns only questions answerable by the fact and marks the best', () => {
    const matches = questionsForFact(bundle, FACT_A);
    expect(matches.map(m => m.question.id)).toEqual(['q1']);
    expect(matches[0].isBest).toBe(true);
  });

  it('includes a question where the fact helps but is not the best', () => {
    const matches = questionsForFact(bundle, FACT_B);
    expect(matches.map(m => m.question.id)).toEqual(['q1', 'q2']);
    expect(matches.find(m => m.question.id === 'q1')?.isBest).toBe(false);
    expect(matches.find(m => m.question.id === 'q2')?.isBest).toBe(true);
  });

  it('returns nothing for a fact that answers no question', () => {
    expect(questionsForFact(bundle, 'unknown-fact')).toEqual([]);
  });
});

describe('questionsForTypedExperience (View B — typed heuristic)', () => {
  it('ranks questions by token overlap and marks the top as best', () => {
    const matches = questionsForTypedExperience(bundle, 'I built an accessible web interface with TypeScript tools');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].isBest).toBe(true);
    // the first question shares the most tokens (built, web, interface, tools)
    expect(matches[0].question.id).toBe('q1');
    // scores are non-increasing
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
    }
  });

  it('returns empty for blank or stopword-only input', () => {
    expect(questionsForTypedExperience(bundle, '   ')).toEqual([]);
    expect(questionsForTypedExperience(bundle, 'the and or to')).toEqual([]);
  });

  it('excludes questions with zero overlap', () => {
    const matches = questionsForTypedExperience(bundle, 'accessible');
    expect(matches.every(m => m.score > 0)).toBe(true);
    expect(matches.map(m => m.question.id)).toContain('q2');
    expect(matches.map(m => m.question.id)).not.toContain('q3');
  });

  it('tokenize drops short tokens and stopwords', () => {
    expect(tokenize('The UI is an Accessible interface')).toEqual(['accessible', 'interface']);
  });
});
