import { describe, expect, it } from 'vitest';
import { exampleJob } from '../../../data/examples';
import { findFixtureJob } from './job-lookup';

describe('findFixtureJob', () => {
  it('returns the fictional example job when the id matches', () => {
    const result = findFixtureJob(exampleJob.id);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(exampleJob.id);
    expect(result?.title).toBe('Junior Web Developer');
    expect(result?.source).toBe('pasted');
    expect(result?.deadlineVerified).toBe(false);
  });

  it('returns null for an unknown id', () => {
    expect(findFixtureJob('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBeNull();
  });

  it('returns null for a non-uuid string', () => {
    expect(findFixtureJob('not-a-job')).toBeNull();
    expect(findFixtureJob('')).toBeNull();
  });
});
