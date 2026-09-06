import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import handler, { isAuthorized, validateSubmission } from '../api/tracker.js';

function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('validates decisions and rejects forged letter names', () => {
  assert.deepEqual(validateSubmission({ name: 'Daniel', letterId: 'botanist', durationMs: 1234 }), {
    name: 'Daniel', letterId: 'botanist', letterName: 'The Botanist', durationMs: 1234,
  });
  assert.equal(validateSubmission({ name: '', letterId: 'botanist', durationMs: 1234 }), null);
  assert.equal(validateSubmission({ name: 'Daniel', letterId: 'forged', durationMs: 1234 }), null);
  assert.equal(validateSubmission({ name: 'Daniel', letterId: 'botanist', durationMs: null }), null);
});

test('requires an exact admin password', () => {
  process.env.ADMIN_PASSWORD = 'test-secret';
  assert.equal(isAuthorized({ headers: { authorization: 'Bearer test-secret' } }), true);
  assert.equal(isAuthorized({ headers: { authorization: 'Bearer wrong' } }), false);
  const expires = String(Date.now() - 1000);
  const signed = createHmac('sha256', process.env.ADMIN_PASSWORD).update(`admin:${expires}`).digest('hex');
  assert.equal(isAuthorized({ headers: { cookie: `decision_admin=${expires}.${signed}` } }), false);
});

test('rejects unauthenticated reads and malformed writes before database access', async () => {
  process.env.ADMIN_PASSWORD = 'test-secret';
  const read = response();
  await handler({ method: 'GET', headers: {} }, read);
  assert.equal(read.statusCode, 401);

  const write = response();
  await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }, write);
  assert.equal(write.statusCode, 400);
  const crossSite = response();
  await handler({ method: 'POST', url: '/api/tracker?action=login', headers: { 'content-type': 'application/json', origin: 'https://other.example', host: 'letters.example' }, body: { password: 'test-secret' } }, crossSite);
  assert.equal(crossSite.statusCode, 403);
});

test('persistent visitor lock, concurrent submissions, and server-authorized admin testing', async t => {
  process.env.ADMIN_PASSWORD = 'test-secret';
  process.env.SUPABASE_URL = 'https://tracker-test.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'test-server-key';
  const records = new Map();
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(input);
    assert.equal(url.hostname, 'tracker-test.supabase.co');
    if (options.method === 'POST') {
      const record = JSON.parse(options.body);
      assert.ok(record.participant_name.length <= 32);
      if (records.has(record.visitor_id)) return Response.json({ code: '23505' }, { status: 409 });
      records.set(record.visitor_id, { ...record, submitted_at: new Date().toISOString() });
      return new Response(null, { status: 201 });
    }
    const id = url.searchParams.get('visitor_id')?.slice(3);
    return Response.json(id ? (records.has(id) ? [records.get(id)] : []) : [...records.values()]);
  });
  const request = async (method, action, body, cookies = '') => {
    const res = response();
    await handler({ method, url: `/api/tracker?action=${action}`, headers: { cookie: cookies, 'content-type': 'application/json' }, body }, res);
    return res;
  };
  const body = { name: 'QA', letterId: 'botanist', durationMs: 1500 };
  assert.equal((await request('POST', '', body)).statusCode, 428);
  const initial = await request('GET', 'status');
  assert.deepEqual(initial.body, { admin: false, submitted: false });
  const visitor = initial.headers['Set-Cookie'].split(';')[0];
  assert.match(initial.headers['Set-Cookie'], /Max-Age=31536000; HttpOnly/);
  const concurrent = await Promise.all([request('POST', '', body, visitor), request('POST', '', body, visitor)]);
  assert.deepEqual(concurrent.map(res => res.statusCode).sort(), [200, 409]);
  assert.equal(records.size, 1);
  assert.equal((await request('GET', 'status', undefined, visitor)).body.submitted, true);
  assert.equal((await request('POST', '', { ...body, name: 'Different name' }, visitor)).statusCode, 409);
  assert.equal((await request('POST', '', { ...body, adminTest: true }, visitor)).statusCode, 401);
  assert.equal((await request('GET', '', undefined, visitor)).statusCode, 401);
  assert.equal((await request('POST', 'login', { password: 'wrong' })).statusCode, 401);
  const login = await request('POST', 'login', { password: 'test-secret' });
  assert.equal(login.statusCode, 200);
  const adminCookie = login.headers['Set-Cookie'].split(';')[0];
  assert.ok(!adminCookie.includes('test-secret'));
  const cookies = `${visitor}; ${adminCookie}`;
  assert.equal((await request('GET', 'status', undefined, cookies)).body.admin, true);
  assert.equal((await request('GET', '', undefined, `${cookies}tampered`)).statusCode, 401);
  for (let i = 0; i < 2; i++) assert.equal((await request('POST', '', { ...body, adminTest: true }, cookies)).statusCode, 200);
  assert.equal(records.size, 3);
  assert.equal([...records.values()].filter(row => row.participant_name === '[Test] QA').length, 2);
  assert.equal((await request('GET', '', undefined, cookies)).body.submissions.length, 3);
  assert.equal((await request('POST', '', { ...body, name: 'A'.repeat(32), adminTest: true }, cookies)).statusCode, 200);
  const logout = await request('POST', 'logout', {}, cookies);
  assert.match(logout.headers['Set-Cookie'], /decision_admin=;.*Max-Age=0/);
  assert.equal((await request('POST', '', body, visitor)).statusCode, 409);
  process.env.ADMIN_PASSWORD = 'rotated-password';
  assert.equal((await request('GET', '', undefined, cookies)).statusCode, 401);
});
