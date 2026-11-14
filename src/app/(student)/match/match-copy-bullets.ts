import type { ResumeVersion } from '../../../contracts';

type BulletRow = ResumeVersion['generatedBullets'][number];

/** Plain-text export of the student's current edits (not immutable generated text). */
export function formatEditedBulletsForCopy(
  generatedBullets: BulletRow[],
  edits: Record<string, string>,
): string {
  return generatedBullets
    .map(bullet => edits[bullet.id]?.trim())
    .filter((line): line is string => Boolean(line))
    .map(line => `• ${line}`)
    .join('\n');
}