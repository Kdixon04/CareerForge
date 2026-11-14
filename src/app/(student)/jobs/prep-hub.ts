import type { StudentFact } from '../../../contracts';

/**
 * STRETCH — Internship Prep Hub shared types + pure view logic.
 *
 * Everything here is fixture-first and inert. `IS_PREP_LIVE` stays false until
 * Antigravity's `src/app/api/prep/**` routes (and any needed read adapters) are
 * merged and verified. Never flip it on mocks or an open PR. See
 * assignments/stretch-prep-hub.md.
 */
export const IS_PREP_LIVE = false;

export type PrepQuestion = {
  id: string;
  text: string;
  answerableByFactIds: string[];
  bestFactId: string | null;
  suggestedAnswer: { text: string; evidence: string[] } | null;
  gapNote: string | null;
};

export type PrepContact = {
  id: string;
  name: string;
  role: string;
  org: string;
  blurb: string;
  fictional: true;
};

export type PrepNewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string | null;
  summary: string;
  unverified: true;
};

export type PrepBundle = {
  jobId: string;
  buzzwords: { term: string; definition: string }[];
  questions: PrepQuestion[];
  contacts: PrepContact[];
  news: PrepNewsItem[];
};

/** View A row: a question with its grounded answer evidence resolved to fact text. */
export type AnsweredQuestion = {
  question: PrepQuestion;
  evidence: { factId: string; text: string | null }[];
  hasAnswer: boolean;
};

/** View B row: a question a chosen/typed experience can answer. */
export type QuestionMatch = {
  question: PrepQuestion;
  isBest: boolean;
  score: number;
};

/** View A — questions → grounded answers (evidence resolved from the student's facts). */
export function buildQuestionAnswerView(bundle: PrepBundle, facts: StudentFact[]): AnsweredQuestion[] {
  const textById = new Map(facts.map(f => [f.id, f.text]));
  return bundle.questions.map(question => ({
    question,
    evidence: (question.suggestedAnswer?.evidence ?? []).map(factId => ({
      factId,
      text: textById.get(factId) ?? null,
    })),
    hasAnswer: question.suggestedAnswer !== null,
  }));
}

/** View B (existing fact) — questions the fact can answer, best match flagged. */
export function questionsForFact(bundle: PrepBundle, factId: string): QuestionMatch[] {
  return bundle.questions
    .filter(question => question.answerableByFactIds.includes(factId))
    .map(question => ({
      question,
      isBest: question.bestFactId === factId,
      score: 1,
    }));
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'you', 'are', 'was', 'were', 'this', 'that',
  'have', 'has', 'from', 'about', 'into', 'our', 'their', 'they', 'how', 'what',
  'when', 'where', 'who', 'why', 'did', 'does', 'can', 'could', 'would', 'should',
]);

/** Tokenize to lowercase words longer than two chars, excluding common stopwords. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    token => token.length > 2 && !STOPWORDS.has(token),
  );
}

/**
 * View B (typed experience) — a deterministic local token-overlap heuristic.
 * This is NOT an AI call; it is a transparent preview ranking so the two views
 * work without a backend. The top match is flagged "answers this best".
 */
export function questionsForTypedExperience(bundle: PrepBundle, text: string): QuestionMatch[] {
  const typedTokens = new Set(tokenize(text));
  if (typedTokens.size === 0) return [];

  const scored = bundle.questions
    .map(question => {
      let score = 0;
      for (const token of Array.from(new Set(tokenize(question.text)))) {
        if (typedTokens.has(token)) score += 1;
      }
      return { question, isBest: false, score };
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) scored[0].isBest = true;
  return scored;
}
