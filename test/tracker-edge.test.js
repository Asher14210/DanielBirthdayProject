import test from 'node:test';
import assert from 'node:assert/strict';
import handleRequest from '../supabase/functions/_shared/edge-adapter.js';

const endpoint = 'https://example.supabase.co/functions/v1/letter-tracker';

test('Edge adapter issues private, secure visitor and admin cookies', async () => {
  const previous = { password: process.env.ADMIN_PASSWORD };
  process.env.ADMIN_PASSWORD = 'edge-test-password';
  try {
    const status = await handleRequest(new Request(`${endpoint}?action=status`));
    assert.equal(status.status, 200);
    assert.deepEqual(await status.json(), { admin: false });
    assert.equal(status.headers.get('cache-control'), 'no-store');
    assert.match(status.headers.get('set-cookie'), /decision_visitor=.+; HttpOnly; SameSite=Strict; Secure/);
    const login = await handleRequest(new Request(`${endpoint}?action=login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
    }));
    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie'), /decision_admin=.+; HttpOnly; SameSite=Strict; Secure/);
    assert.deepEqual(await login.json(), { ok: true });
  } finally {
    if (previous.password === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previous.password;
  }
});

test('Edge adapter rejects unsupported methods, actions, cross-origin and malformed bodies', async () => {
  const request = (suffix, options) => handleRequest(new Request(endpoint + suffix, options));
  assert.equal((await request('', { method: 'OPTIONS' })).status, 405);
  assert.equal((await request('?action=login', {})).status, 400);
  assert.equal((await request('?action=status&action=status', {})).status, 400);
  assert.equal((await request('?action=login', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' })).status, 403);
  assert.equal((await request('', { method: 'POST', body: '{}' })).status, 415);
  assert.equal((await request('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: 'x'.repeat(8192) }) })).status, 413);
});
