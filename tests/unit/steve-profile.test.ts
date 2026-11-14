import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exampleStudent } from '../../src/data/examples';
import { addFact, removeFact, updateFact, validateProfileDraft, type ProfileDraft } from '../../src/app/(student)/profile/profile-model';

const factId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function draft(): ProfileDraft {
  return { displayName: exampleStudent.displayName, field: exampleStudent.field, facts: structuredClone(exampleStudent.facts) };
}

test('normalizes editable profile fields and strips ownership/timestamps', () => {
  const input = { ...exampleStudent, displayName: '  Maya Chen  ', field: '   ', facts: [{ ...exampleStudent.facts[0], text: '  Built a tracker  ', dates: ' ', org: '  Class project  ' }] };
  const result = validateProfileDraft(input);
  assert.ok(result.success);
  assert.deepEqual(Object.keys(result.data).sort(), ['displayName', 'facts', 'field']);
  assert.equal(result.data.displayName, 'Maya Chen');
  assert.equal(result.data.field, null);
  assert.equal(result.data.facts[0].text, 'Built a tracker');
  assert.equal(result.data.facts[0].dates, null);
  assert.equal(result.data.facts[0].org, 'Class project');
});

test('accepts empty fact list but rejects blank names and blank fact text', () => {
  assert.equal(validateProfileDraft({ ...draft(), facts: [] }).success, true);
  const invalidName = validateProfileDraft({ ...draft(), displayName: '   ' });
  assert.equal(invalidName.success, false);
  if (!invalidName.success) assert.ok(invalidName.errors.displayName);
  const invalidText = validateProfileDraft({ ...draft(), facts: [{ ...exampleStudent.facts[0], text: '  ' }] });
  assert.equal(invalidText.success, false);
  if (!invalidText.success) assert.ok(invalidText.errors['facts.0.text']);
});

test('rejects duplicate ids, wrong ids/kinds and oversized profile content', () => {
  const original = draft();
  assert.equal(validateProfileDraft({ ...original, facts: [original.facts[0], original.facts[0]] }).success, false);
  assert.equal(validateProfileDraft({ ...original, facts: [{ ...original.facts[0], id: 'wrong' }] }).success, false);
  assert.equal(validateProfileDraft({ ...original, facts: [{ ...original.facts[0], kind: 'admin' }] as unknown as ProfileDraft['facts'] }).success, false);
  assert.equal(validateProfileDraft({ ...original, displayName: 'x'.repeat(121) }).success, false);
  assert.equal(validateProfileDraft({ ...original, facts: [{ ...original.facts[0], text: 'x'.repeat(30001) }] }).success, false);
  assert.equal(validateProfileDraft({ ...original, facts: Array.from({ length: 101 }, () => original.facts[0]) }).success, false);
});

test('adds and edits facts immutably without replacing stable evidence ids', () => {
  const original = draft();
  const added = addFact(original, 'skill', factId);
  assert.equal(original.facts.length, 1);
  assert.equal(added.facts.length, 2);
  assert.deepEqual(added.facts[1], { id: factId, kind: 'skill', text: '', dates: null, org: null });
  const edited = updateFact(added, factId, { text: 'Python', org: 'Coursework' });
  assert.equal(added.facts[1].text, '');
  assert.equal(edited.facts[1].id, factId);
  assert.equal(edited.facts[1].text, 'Python');
  assert.equal(edited.facts[0].id, original.facts[0].id);
});

test('repeated remove is harmless, unknown edits do not create facts, duplicate add is rejected', () => {
  const original = draft();
  const added = addFact(original, 'project', factId);
  const removed = removeFact(added, factId);
  assert.deepEqual(removeFact(removed, factId), removed);
  assert.deepEqual(updateFact(original, factId, { text: 'No record' }), original);
  assert.throws(() => addFact(added, 'skill', factId), /already exists/i);
});
