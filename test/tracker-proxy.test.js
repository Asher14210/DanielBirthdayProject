import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import handler from '../api/tracker.js';

const endpoint = 'https://lmvdhvtqdtjohgzdagcn.supabase.co/functions/v1/letter-tracker';

async function request(overrides = {}) {
  const req = {
    method: 'POST', url: '/api/tracker?action=enter', body: { name: 'Daniel' },
    headers: { host: 'letters.example', origin: 'https://letters.example', 'content-type': 'application/json' },
    ...overrides,
  };
  const res = {
    headers: {}, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler(req, res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  return res;
}

test('proxy forwards only tracker credentials and action, without Vercel secrets', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(String(url), `${endpoint}?action=enter`);
    assert.deepEqual(options.headers, {
      accept: 'application/json', 'content-type': 'application/json',
      cookie: 'decision_visitor=visitor; decision_admin=admin; decision_entry=entry',
      authorization: 'Bearer supplied-admin-password',
    });
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { name: 'Daniel' });
    assert.equal(options.redirect, 'manual');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ ok: true });
  });
  const result = await request({
    url: '/api/tracker?action=enter&url=https://other.example&redirect=elsewhere',
    headers: {
      host: 'letters.example', origin: 'https://letters.example', 'content-type': 'application/json; charset=utf-8',
      cookie: 'unrelated=private; decision_visitor=visitor; decision_admin=admin; decision_entry=entry; decision_other=no',
      authorization: 'Bearer supplied-admin-password', 'x-forwarded-host': 'other.example', 'x-forwarded-for': '192.0.2.1',
    },
  });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { ok: true });
});

test('proxy preserves upstream JSON errors and separate Set-Cookie headers', async t => {
  const cookies = [
    'decision_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure',
    'decision_entry=entry; Expires=Tue, 01 Dec 2026 00:00:00 GMT; Path=/; HttpOnly; SameSite=Strict; Secure',
  ];
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Incorrect password.' }, {
    status: 401, headers: [...cookies, '__cf_bm=unrelated; Domain=.supabase.co; HttpOnly; Secure'].map(value => ['Set-Cookie', value]),
  }));
  const result = await request({ url: '/api/tracker?action=login' });
  assert.equal(result.statusCode, 401);
  assert.deepEqual(result.body, { error: 'Incorrect password.' });
  assert.deepEqual(result.headers['Set-Cookie'], cookies);
});

test('proxy rejects malformed and cross-site origins before forwarding', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Must reject before upstream request'));
  for (const origin of ['null', 'malformed', 'https://other.example', 'https://letters.example/path', 'https://user@letters.example', 'ftp://letters.example']) {
    const result = await request({ headers: { host: 'letters.example', origin, 'content-type': 'application/json' } });
    assert.equal(result.statusCode, 403, origin);
  }
  assert.equal((await request({ headers: { origin: 'https://letters.example', 'content-type': 'application/json' } })).statusCode, 403);
});

test('proxy rejects unsupported methods, unknown actions, and mismatched method/actions', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Must reject before upstream request'));
  for (const method of ['OPTIONS', 'DELETE', 'HEAD', 'PUT', 'toString']) {
    const result = await request({ method });
    assert.equal(result.statusCode, 405);
    assert.equal(result.headers.Allow, 'GET, POST');
  }
  for (const [method, query] of [['GET', 'login'], ['GET', 'enter'], ['GET', 'logout'], ['POST', 'status'], ['POST', 'delete'], ['GET', 'status&action=status']]) {
    assert.equal((await request({ method, url: `/api/tracker?action=${query}` })).statusCode, 400);
  }
});

test('proxy accepts all supported routes and non-browser requests without Origin', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([String(url), options.method]);
    if (options.method === 'GET') assert.equal(options.body, undefined);
    return Response.json({ ok: true });
  });
  for (const [method, action] of [['GET', ''], ['GET', 'status'], ['POST', ''], ['POST', 'login'], ['POST', 'logout'], ['POST', 'enter']]) {
    assert.equal((await request({ method, url: `/api/tracker?action=${action}`, headers: { 'content-type': 'application/json' } })).statusCode, 200);
    assert.deepEqual(calls.at(-1), [`${endpoint}${action ? `?action=${action}` : ''}`, method]);
  }
});

test('proxy validates JSON content type and bounds parsed, raw, and streamed request bodies', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Must reject before upstream request'));
  for (const type of [undefined, 'text/plain', 'application/jsonp', 'application/x-www-form-urlencoded']) {
    assert.equal((await request({ headers: { 'content-type': type } })).statusCode, 415);
  }
  for (const body of ['{', undefined, Buffer.from('invalid')]) {
    assert.equal((await request({ body })).statusCode, 400);
  }
  for (const body of [{ value: 'x'.repeat(8192) }, `"${'é'.repeat(4096)}"`, Buffer.from(`"${'x'.repeat(8192)}"`)]) {
    assert.equal((await request({ body })).statusCode, 413);
  }
  assert.equal((await request({ headers: { 'content-type': 'application/json', 'content-length': '9000' } })).statusCode, 413);
  const stream = Readable.from(['"', 'x'.repeat(8192), '"']);
  assert.equal((await request({ body: undefined, [Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream) })).statusCode, 413);
});

test('proxy accepts bounded raw and streamed JSON', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { name: 'Daniel' });
    return Response.json({ ok: true });
  });
  for (const body of ['{"name":"Daniel"}', Buffer.from('{"name":"Daniel"}')]) {
    assert.equal((await request({ body })).statusCode, 200);
  }
  const stream = Readable.from(['{"name":', '"Daniel"}']);
  assert.equal((await request({ body: undefined, [Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream) })).statusCode, 200);
});

test('proxy fails closed for redirects, malformed upstream responses, and network errors', async t => {
  const badResponses = [
    () => new Response('', { status: 302, headers: { Location: 'https://other.example' } }),
    () => new Response('<html>internal details</html>', { status: 500, headers: { 'content-type': 'text/html' } }),
    () => new Response('{', { headers: { 'content-type': 'application/json', 'set-cookie': 'decision_admin=bad' } }),
    () => Response.json(null), () => Response.json('unexpected'), () => Response.json([]),
    () => { throw new Error('sensitive network diagnostic'); },
  ];
  for (const makeResponse of badResponses) {
    t.mock.method(globalThis, 'fetch', async () => makeResponse());
    const result = await request();
    assert.equal(result.statusCode, 502);
    assert.deepEqual(result.body, { error: 'Tracker is temporarily unavailable. Please try again.' });
    assert.equal(result.headers['Set-Cookie'], undefined);
    t.mock.restoreAll();
  }
});

test('proxy uses a 15-second deadline and returns a safe timeout response', async t => {
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    assert.equal(milliseconds, 15_000);
    return AbortSignal.abort(new DOMException('private timeout detail', 'TimeoutError'));
  });
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => { throw signal.reason; });
  const result = await request();
  assert.equal(result.statusCode, 504);
  assert.deepEqual(result.body, { error: 'Tracker request timed out. Please try again.' });
});
