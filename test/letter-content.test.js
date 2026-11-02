import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { letters } from '../src/components/magical/letterData.js';
import { validateSubmission } from '../supabase/functions/_shared/tracker.js';

test('the public collection keeps Wendy first in the winter envelope style', () => {
  assert.deepEqual(letters.map(letter => letter.id), ['wendy', 'rachel']);
  const [letter] = letters;
  assert.equal(letter.id, 'wendy');
  assert.equal(letter.name, '别看这个');
  assert.equal(letter.sender, 'Wendy');
  assert.equal(letter.sign, 'Wendy');
  assert.equal(letter.salutation, '');
  assert.equal(letter.note, '');
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#8e9ca3', '#29383e', '#667986', '❄']);
});

test('Rachel is second, using the Botanist envelope and exact signed message', () => {
  const letter = letters[1];
  assert.equal(letter.name, 'Happy Eggberthday!');
  assert.equal(letter.sender, 'Rachel');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#778066', '#263e2e', '#334c38', '❧']);
  assert.equal(letter.closing, 'Best,');
  assert.equal(letter.sign, 'Rachel Zhang');
  const message = `${letter.body.join('\n\n')}\n\n${letter.closing}\n${letter.sign}`;
  assert.equal(createHash('sha256').update(message, 'utf8').digest('hex'), '28539c050bffffa942816caadf46e97f9bac76cf9e7a021447a3a703b69dcf22');
});

test('the multilingual message is preserved byte-for-byte, without generated prose', () => {
  assert.equal(letters[0].body.length, 1);
  assert.equal(createHash('sha256').update(letters[0].body[0], 'utf8').digest('hex'), 'dbb5f8cc9eaff1f4f1f1b5c5ddcda67e292c1c04f43d9477993e7a5ea6f53a4c');
});

test('tracking uses the real title while allowing previously loaded pages during rollout', () => {
  const payload = { name: 'Daniel', letterId: 'wendy', durationMs: 1234, requestId: randomUUID(), letterName: 'forged' };
  assert.equal(validateSubmission(payload).letterName, '别看这个');
  assert.equal(validateSubmission({ ...payload, letterId: 'rachel' }).letterName, 'Happy Eggberthday!');
  assert.equal(validateSubmission({ ...payload, letterId: 'winter' }).letterName, 'The Winter Letter');
  assert.equal(validateSubmission({ ...payload, letterId: 'not-a-letter' }), null);
});
