import { describe, expect, it } from 'vitest';
import { exampleJob, exampleResumeSuggestion } from '../../../data/examples';
import { findFixtureMatch } from './match-lookup';

describe('findFixtureMatch', () => {
  it('returns the fictional résumé suggestion when the job id matches', () => {
    const result = findFixtureMatch(exampleJob.id);
    expect(result).not.toBeNull();
    expect(result?.resume.jobId).toBe(exampleJob.id);
    expect(result?.resume.generatedBullets.length).toBeGreaterThanOrEqual(2);
    expect(result?.resume.match.gaps.length).toBeGreaterThanOrEqual(1);
    expect(result?.job.title).toBe(exampleJob.title);
  });

  it('includes evidence ids that exist in the fact snapshot', () => {
    const result = findFixtureMatch(exampleResumeSuggestion.jobId);
    const snapshotIds = new Set(result!.resume.factSnapshot.map(f => f.id));
    for (const bullet of result!.resume.generatedBullets) {
      for (const evidenceId of bullet.evidence) {
        expect(snapshotIds.has(evidenceId)).toBe(true);
      }
    }
  });

  it('returns null for an unknown job id', () => {
    expect(findFixtureMatch('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBeNull();
  });
});