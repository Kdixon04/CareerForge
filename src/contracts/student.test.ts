import { describe, expect, it } from 'vitest';
import { StudentProfileSchema } from './student';
import { exampleStudent } from '../data/examples';

describe('student contract', () => {
  it('accepts factual, identified profile data', () => {
    expect(StudentProfileSchema.safeParse(exampleStudent).success).toBe(true);
  });
  it('rejects unsupported fact kinds', () => {
    const bad = { ...exampleStudent, facts: [{ ...exampleStudent.facts[0], kind: 'award' }] };
    expect(StudentProfileSchema.safeParse(bad).success).toBe(false);
  });
});
