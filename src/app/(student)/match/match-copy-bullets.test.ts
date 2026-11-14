import { describe, expect, it } from 'vitest';
import { formatEditedBulletsForCopy } from './match-copy-bullets';

const bullets = [
  { id: 'a', text: 'Generated one', evidence: [], targetsRequirement: 'A' },
  { id: 'b', text: 'Generated two', evidence: [], targetsRequirement: 'B' },
];

describe('formatEditedBulletsForCopy', () => {
  it('uses edited text in bullet order, not original generated strings', () => {
    const edits = {
      a: 'My edited first bullet.',
      b: 'My edited second bullet.',
    };
    expect(formatEditedBulletsForCopy(bullets, edits)).toBe(
      '• My edited first bullet.\n• My edited second bullet.',
    );
  });

  it('skips blank edited lines', () => {
    const edits = { a: '  Keeps this.  ', b: '   ' };
    expect(formatEditedBulletsForCopy(bullets, edits)).toBe('• Keeps this.');
  });

  it('returns empty string when nothing editable is present', () => {
    expect(formatEditedBulletsForCopy(bullets, {})).toBe('');
    expect(formatEditedBulletsForCopy(bullets, { a: '', b: '' })).toBe('');
  });
});