'use client';

import { useMemo, useState } from 'react';
import type { ResumeVersion } from '../../../contracts';
import { Button } from '../../../components/ui/Button';

export function MatchReview({ resume }: { resume: ResumeVersion }) {
  const initialById = useMemo(
    () => new Map(resume.editedBullets.map(b => [b.id, b.text])),
    [resume.editedBullets],
  );
  const [edits, setEdits] = useState<Record<string, string>>(Object.fromEntries(initialById));

  const factTextById = useMemo(
    () => new Map(resume.factSnapshot.map(f => [f.id, f.text])),
    [resume.factSnapshot],
  );

  return (
    <>
      <section className="cf-match-section" aria-label="Suggested bullets and evidence">
        <h2>Suggested bullets</h2>
        <p className="cf-match-save-note">
          <strong>Not saved — review before using.</strong> Edits stay in your browser until secure save routes exist.
        </p>
        <ul className="cf-match-bullets">
          {resume.generatedBullets.map((bullet, index) => (
            <li key={bullet.id} className="cf-match-bullet">
              <label className="cf-label" htmlFor={`bullet-${bullet.id}`}>{`Suggested bullet ${index + 1}`}</label>
              <textarea
                id={`bullet-${bullet.id}`}
                className="cf-input"
                rows={3}
                value={edits[bullet.id] ?? ''}
                onChange={event => setEdits(current => ({ ...current, [bullet.id]: event.target.value }))}
              />
              <p className="cf-hint">Targets: {bullet.targetsRequirement}</p>
              <div className="cf-match-evidence">
                <p className="cf-label">Evidence (fact ids)</p>
                <ul>
                  {bullet.evidence.map(evidenceId => (
                    <li key={evidenceId}>
                      <code>{evidenceId}</code>
                      {factTextById.has(evidenceId) && (
                        <span className="cf-match-evidence-quote"> — “{factTextById.get(evidenceId)}”</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" disabled aria-describedby="match-save-hint">
          Save edits (not connected)
        </Button>
        <p className="cf-hint" id="match-save-hint">Server-side PATCH /api/resume/[id] is not wired in this fixture slice.</p>
      </section>

      <section className="cf-match-section" aria-label="Requirement gaps">
        <h2>Gaps</h2>
        <p className="cf-hint">Requirements with no supporting fact in your snapshot — shown explicitly, never hidden.</p>
        {resume.match.gaps.length === 0 ? (
          <p className="cf-match-empty">No gaps in this fictional sample.</p>
        ) : (
          <ul className="cf-match-gaps">
            {resume.match.gaps.map(gap => (
              <li key={gap.requirement}>
                <span className="cf-match-gap-label">Gap</span>
                <strong>{gap.requirement}</strong>
                <p>{gap.note}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}