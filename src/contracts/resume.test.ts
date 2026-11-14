import { describe, expect, it } from 'vitest';
import { ResumeVersionSchema } from './resume';
import { exampleResume } from '../data/examples';

describe('resume contract', () => {
  it('accepts a fictional version with evidence identifiers', () => {
    expect(ResumeVersionSchema.safeParse(exampleResume).success).toBe(true);
  });
  it('rejects bullets without any evidence identifiers', () => {
    const bad = { ...exampleResume, generatedBullets: [{ ...exampleResume.generatedBullets[0], evidence: [] }] };
    expect(ResumeVersionSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects evidence identifiers absent from the saved fact snapshot', () => {
    const bad = { ...exampleResume, generatedBullets: [{ ...exampleResume.generatedBullets[0], evidence: [exampleResume.id] }] };
    expect(ResumeVersionSchema.safeParse(bad).success).toBe(false);
  });
});
