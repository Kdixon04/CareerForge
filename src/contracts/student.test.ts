import { describe, expect, it } from 'vitest';
import { StudentProfileSchema } from './student';

describe('StudentProfile contract', () => {
  it('accepts the smallest fictional profile shape', () => {
    const result = StudentProfileSchema.safeParse({
      id: 'student-001',
      displayName: 'Maya Chen',
      school: 'BYU-Idaho',
      major: 'Computer Science',
      skills: ['TypeScript', 'Testing'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty skill', () => {
    expect(StudentProfileSchema.safeParse({
      id: 'student-001', displayName: 'Maya Chen', school: 'BYU-Idaho', major: 'Computer Science', skills: [''],
    }).success).toBe(false);
  });
});
