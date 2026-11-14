'use client';

import { useMemo, useState } from 'react';
import type { StudentFact } from '../../../../../contracts';
import { Button } from '../../../../../components/ui/Button';
import {
  buildQuestionAnswerView,
  questionsForFact,
  questionsForTypedExperience,
  type PrepBundle,
  type QuestionMatch,
} from '../../prep-hub';

type PrepHubProps = {
  bundle: PrepBundle;
  facts: StudentFact[];
};

type QuestionView = 'answers' | 'experience';

export function PrepHub({ bundle, facts }: PrepHubProps) {
  const [view, setView] = useState<QuestionView>('answers');
  const [selectedFactId, setSelectedFactId] = useState<string>(facts[0]?.id ?? '');
  const [typed, setTyped] = useState('');
  const [submittedExperience, setSubmittedExperience] = useState<string | null>(null);
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  const answerView = useMemo(() => buildQuestionAnswerView(bundle, facts), [bundle, facts]);

  const factMatches = useMemo<QuestionMatch[]>(
    () => (selectedFactId ? questionsForFact(bundle, selectedFactId) : []),
    [bundle, selectedFactId],
  );
  const typedMatches = useMemo<QuestionMatch[]>(
    () => (submittedExperience ? questionsForTypedExperience(bundle, submittedExperience) : []),
    [bundle, submittedExperience],
  );

  return (
    <div className="cf-prep">
      <section className="cf-prep-section" aria-labelledby="prep-buzzwords-title">
        <h2 id="prep-buzzwords-title">Buzzwords &amp; terms</h2>
        <p className="cf-hint">AI-generated — may be inaccurate, verify before relying on these.</p>
        <dl className="cf-prep-glossary">
          {bundle.buzzwords.map(item => (
            <div key={item.term} className="cf-prep-term">
              <dt>{item.term}</dt>
              <dd>{item.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="cf-prep-section" aria-labelledby="prep-questions-title">
        <h2 id="prep-questions-title">Likely interview questions</h2>
        <p className="cf-hint">
          AI practice — not the employer&apos;s actual questions. Review and make every answer your own before using it.
        </p>

        <div className="cf-prep-toggle" role="tablist" aria-label="Question views">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'answers'}
            className={`cf-prep-tab${view === 'answers' ? ' cf-prep-tab--active' : ''}`}
            onClick={() => setView('answers')}
          >
            Questions &amp; suggested answers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'experience'}
            className={`cf-prep-tab${view === 'experience' ? ' cf-prep-tab--active' : ''}`}
            onClick={() => setView('experience')}
          >
            Start from an experience
          </button>
        </div>

        {view === 'answers' ? (
          <ul className="cf-prep-questions" aria-label="Questions and suggested answers">
            {answerView.map(({ question, evidence, hasAnswer }) => (
              <li key={question.id} className="cf-prep-question">
                <h3>{question.text}</h3>
                {hasAnswer ? (
                  <>
                    <p className="cf-prep-answer">{question.suggestedAnswer?.text}</p>
                    {evidence.length > 0 && (
                      <div className="cf-prep-evidence">
                        <p className="cf-label">Grounded in your experience:</p>
                        <ul>
                          {evidence.map(item => (
                            <li key={item.factId}>
                              {item.text ? `“${item.text}”` : <code>{item.factId}</code>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="cf-prep-gap">
                    <span className="cf-prep-gap-label">Gap</span> {question.gapNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="cf-prep-experience">
            <div className="cf-field">
              <label className="cf-label" htmlFor="prep-fact-select">Use an experience from your profile</label>
              <select
                id="prep-fact-select"
                className="cf-input"
                value={selectedFactId}
                onChange={event => setSelectedFactId(event.target.value)}
              >
                {facts.length === 0 && <option value="">No facts in this sample profile</option>}
                {facts.map(fact => (
                  <option key={fact.id} value={fact.id}>{fact.text}</option>
                ))}
              </select>
            </div>

            {selectedFactId && (
              <MatchList
                heading="Questions this experience can answer"
                matches={factMatches}
                emptyText="This experience does not clearly answer any of the sample questions."
              />
            )}

            <form
              className="cf-prep-typed"
              onSubmit={event => {
                event.preventDefault();
                setSubmittedExperience(typed);
              }}
            >
              <div className="cf-field">
                <label className="cf-label" htmlFor="prep-typed">Or describe a new experience</label>
                <textarea
                  id="prep-typed"
                  className="cf-input"
                  rows={3}
                  value={typed}
                  onChange={event => setTyped(event.target.value)}
                  aria-describedby="prep-typed-hint"
                />
                <p className="cf-hint" id="prep-typed-hint">
                  Matched locally by keyword overlap (not AI) to show which sample questions it could answer.
                </p>
              </div>
              <Button type="submit" variant="secondary">Find matching questions</Button>
            </form>

            {submittedExperience !== null && (
              <MatchList
                heading="Questions your description could answer"
                matches={typedMatches}
                emptyText="No sample questions overlap with that description yet."
              />
            )}
          </div>
        )}
      </section>

      <section className="cf-prep-section" aria-labelledby="prep-connect-title">
        <h2 id="prep-connect-title">Connect for an informational interview</h2>
        <aside className="cf-prep-notice" aria-label="Connect limitations">
          <strong>Sample contacts — fictional demo data.</strong>
          <p>These are not real people and no message is ever sent. &ldquo;Draft a message&rdquo; only opens an editable template in your browser.</p>
        </aside>
        <ul className="cf-prep-contacts">
          {bundle.contacts.map(contact => (
            <li key={contact.id} className="cf-prep-contact">
              <div>
                <strong>{contact.name}</strong>
                <span className="cf-prep-contact-meta">{contact.role} · {contact.org}</span>
                <p>{contact.blurb}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                aria-expanded={openContactId === contact.id}
                onClick={() => setOpenContactId(current => (current === contact.id ? null : contact.id))}
              >
                {openContactId === contact.id ? 'Hide template' : 'Draft a message'}
              </Button>
              {openContactId === contact.id && (
                <div className="cf-prep-draft">
                  <label className="cf-label" htmlFor={`draft-${contact.id}`}>Message template (nothing is sent)</label>
                  <textarea
                    id={`draft-${contact.id}`}
                    className="cf-input"
                    rows={4}
                    defaultValue={`Hi ${contact.name.replace(' (sample)', '')},\n\nI'm a student exploring ${contact.org} and the ${/* role */ contact.role.toLowerCase()} path. Would you be open to a short informational chat about your experience? Thank you for considering.\n\nBest,\n[Your name]`}
                  />
                  <p className="cf-hint">Fictional demo — copy and adapt this yourself; Career Forge does not contact anyone for you.</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="cf-prep-section" aria-labelledby="prep-news-title">
        <h2 id="prep-news-title">Role &amp; company news</h2>
        <p className="cf-hint">AI-gathered from the web — unverified. Verify before relying on any item.</p>
        <ul className="cf-prep-news">
          {bundle.news.map(item => (
            <li key={item.id} className="cf-prep-news-item">
              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
              <span className="cf-prep-news-meta">
                {item.source}{item.publishedAt ? ` · ${item.publishedAt}` : ''} · <em>Unverified</em>
              </span>
              <p>{item.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchList({
  heading,
  matches,
  emptyText,
}: {
  heading: string;
  matches: QuestionMatch[];
  emptyText: string;
}) {
  return (
    <div className="cf-prep-matches" aria-live="polite">
      <p className="cf-label">{heading}</p>
      {matches.length === 0 ? (
        <p className="cf-prep-empty">{emptyText}</p>
      ) : (
        <ul>
          {matches.map(match => (
            <li key={match.question.id} className="cf-prep-match">
              <span>{match.question.text}</span>
              {match.isBest && <span className="cf-prep-best">Answers this best</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
