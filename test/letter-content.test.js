import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { letters } from '../src/components/magical/letterData.js';
import { validateSubmission } from '../supabase/functions/_shared/tracker.js';

test('the public collection keeps Wendy first in the winter envelope style', () => {
  assert.deepEqual(letters.map(letter => letter.id), ['wendy', 'rachel', 'yvonne', 'amy', 'benjamin', 'dr-smith', 'jerry']);
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

test('Yvonne is third, using the Home envelope and exact multiline message', () => {
  const letter = letters[2];
  assert.equal(letter.name, 'Happy Birthday!');
  assert.equal(letter.sender, 'Yvonne');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.equal(letter.sign, '');
  assert.equal(letter.closing, undefined);
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#d6bd91', '#453326', '#805039', '⌂']);
  assert.equal(letter.body.length, 1);
  assert.equal(createHash('sha256').update(letter.body[0], 'utf8').digest('hex'), '406b56cd922111e53ae57fd0645227d8468bae65bae8736d715da314a2af6efd');
  assert.deepEqual(letter.body[0].split('\n').filter(line => line.startsWith('-')), ['-Kishmo ', '-Genova', '-Fabian', '-Feathers', '-Yvonne']);
});

test('Amy is fourth, using the Botanist envelope and exact bilingual message', () => {
  const letter = letters[3];
  assert.equal(letter.name, 'Totally no Chaotic Chaotic Evilness in here');
  assert.equal(letter.sender, 'Amy');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.equal(letter.sign, '');
  assert.equal(letter.closing, undefined);
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#778066', '#263e2e', '#334c38', '❧']);
  assert.equal(letter.body.length, 1);
  assert.equal(createHash('sha256').update(letter.body[0], 'utf8').digest('hex'), '44c9278a0fcf2f7cb825dc7b4aa622f0eb31952d743cbf1fb30e4f2d95503915');
  assert.deepEqual(letter.body[0].split('\n').filter(line => line.startsWith('——')), ['—— Adrian', '—— Incubus', '—— Cerval', '——Sephiran', '—— Ossia', '—— Amy in person']);
});

test('Benjamin is fifth, using the Midnight envelope and exact signed message', () => {
  const letter = letters[4];
  assert.equal(letter.name, 'Read this if you are a 5e nerd');
  assert.equal(letter.sender, 'Benjamin');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.equal(letter.sign, '');
  assert.equal(letter.closing, undefined);
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#303642', '#d8d1bc', '#8296a3', '☾']);
  assert.equal(letter.sealInk, '#e0e8ed');
  assert.equal(letter.readingInk, '#29313c');
  assert.equal(letter.compactTitle, true);
  assert.equal(letter.body.length, 1);
  assert.equal(createHash('sha256').update(letter.body[0], 'utf8').digest('hex'), '698175cc080fc62c5df40e025f52ff46b937329931013e49e6c9300da4e5a56e');
  assert.ok(letter.body[0].endsWith('\n\n—Benjamin'));
});

test('Dr Smith is sixth, using the Alchemist envelope and exact message', () => {
  const letter = letters[5];
  assert.equal(letter.id, 'dr-smith');
  assert.equal(letter.name, 'Happy Birthday!');
  assert.equal(letter.sender, 'Dr Smith');
  assert.equal(letter.sign, 'Dr Smith');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#b18a4e', '#44301d', '#8a572e', '△']);
  assert.deepEqual(letter.body, ['Happy birthday to the most brilliant and dangerous roleplayer between the Sword Coast and the Moonsea! Thank you so much for your hard work as club leader. It is an honor to work with you.']);
});

test('Jerry is seventh, using the Home envelope and exact message', () => {
  const letter = letters[6];
  assert.equal(letter.id, 'jerry');
  assert.equal(letter.name, '打开我！！！');
  assert.equal(letter.sender, 'Jerry');
  assert.equal(letter.sign, 'Jerry');
  assert.equal(letter.note, '');
  assert.equal(letter.salutation, '');
  assert.deepEqual([letter.tone, letter.ink, letter.seal, letter.mark], ['#d6bd91', '#453326', '#805039', '⌂']);
  assert.deepEqual(letter.body, ['egg bird 生日快乐。我猜你知道我祝你生日快乐，所以就不写很多了🎂']);
});

test('the multilingual message is preserved byte-for-byte, without generated prose', () => {
  assert.equal(letters[0].body.length, 1);
  assert.equal(createHash('sha256').update(letters[0].body[0], 'utf8').digest('hex'), 'dbb5f8cc9eaff1f4f1f1b5c5ddcda67e292c1c04f43d9477993e7a5ea6f53a4c');
});

test('tracking uses the real title while allowing previously loaded pages during rollout', () => {
  const payload = { name: 'Daniel', letterId: 'wendy', durationMs: 1234, requestId: randomUUID(), letterName: 'forged' };
  assert.equal(validateSubmission(payload).letterName, '别看这个');
  assert.equal(validateSubmission({ ...payload, letterId: 'rachel' }).letterName, 'Happy Eggberthday!');
  assert.equal(validateSubmission({ ...payload, letterId: 'yvonne' }).letterName, 'Happy Birthday!');
  assert.equal(validateSubmission({ ...payload, letterId: 'amy' }).letterName, 'Totally no Chaotic Chaotic Evilness in here');
  assert.equal(validateSubmission({ ...payload, letterId: 'benjamin' }).letterName, 'Read this if you are a 5e nerd');
  const jerryChoice = validateSubmission({ ...payload, letterId: 'jerry' });
  assert.equal(jerryChoice.letterId, 'jerry');
  assert.equal(jerryChoice.letterName, '打开我！！！');
  const smithChoice = validateSubmission({ ...payload, letterId: 'dr-smith' });
  assert.equal(smithChoice.letterName, 'Happy Birthday!');
  assert.equal(smithChoice.letterId, 'dr-smith');
  assert.notEqual(smithChoice.letterId, validateSubmission({ ...payload, letterId: 'yvonne' }).letterId);
  assert.equal(validateSubmission({ ...payload, letterId: 'winter' }).letterName, 'The Winter Letter');
  assert.equal(validateSubmission({ ...payload, letterId: 'not-a-letter' }), null);
});
