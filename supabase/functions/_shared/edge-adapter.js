import handler from './tracker.js';

const MAX_BODY_BYTES = 8 * 1024;
const actions = { GET: new Set(['', 'status']), POST: new Set(['', 'login', 'logout', 'enter']) };

function error(status, message) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async function handleRequest(request) {
  const url = new URL(request.url);
  if (!Object.hasOwn(actions, request.method)) {
    const response = error(405, 'Method not allowed.');
    response.headers.set('Allow', 'GET, POST');
    return response;
  }
  if (url.searchParams.getAll('action').length > 1 || !actions[request.method].has(url.searchParams.get('action') || '')) return error(400, 'Invalid action.');

  // Browser requests go through the same-origin website proxy. Do not enable
  // CORS here or accept cross-origin cookie-authenticated writes directly.
  const origin = request.headers.get('origin');
  if (request.method === 'POST' && origin && origin !== url.origin) return error(403, 'Invalid origin.');
  let body;
  if (request.method === 'POST') {
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error(415, 'JSON required.');
    if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return error(413, 'Submission is too large.');
    const reader = request.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return error(413, 'Submission is too large.');
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = new TextDecoder().decode(bytes);
  }

  const headers = new Headers();
  let status = 200;
  let response;
  const res = {
    setHeader(name, values) {
      headers.delete(name);
      for (const value of Array.isArray(values) ? values : [values]) headers.append(name, String(value));
    },
    status(code) { status = code; return this; },
    json(data) { response = Response.json(data, { status, headers }); return response; },
  };
  const requestHeaders = Object.fromEntries(request.headers);
  requestHeaders.host = url.host;
  if (request.method === 'POST') requestHeaders['content-type'] = 'application/json';
  await handler({ method: request.method, url: request.url, headers: requestHeaders, body }, res);
  return response || error(500, 'Tracker request failed.');
}
