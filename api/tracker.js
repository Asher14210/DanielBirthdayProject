// Public function URL only. Database/admin secrets stay in Supabase, never in this deployment.
const TRACKER_URL = 'https://lmvdhvtqdtjohgzdagcn.supabase.co/functions/v1/letter-tracker';
const MAX_BODY_BYTES = 8 * 1024;
const ACTIONS = { GET: new Set(['', 'status']), POST: new Set(['', 'login', 'logout', 'enter']) };

function sameOrigin(req) {
  if (req.headers.origin === undefined) return true; // Non-browser clients have no Origin.
  try {
    const origin = new URL(req.headers.origin);
    return ['http:', 'https:'].includes(origin.protocol)
      && origin.origin === req.headers.origin
      && origin.host === req.headers.host;
  } catch {
    return false;
  }
}

async function jsonBody(req) {
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) throw { status: 413 };
  let raw = req.body;
  if (raw === undefined && req[Symbol.asyncIterator]) {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > MAX_BODY_BYTES) throw { status: 413 };
      chunks.push(buffer);
    }
    raw = Buffer.concat(chunks);
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw !== 'string') raw = JSON.stringify(raw);
  if (typeof raw !== 'string') throw { status: 400 };
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw { status: 413 };
  JSON.parse(raw);
  return raw;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!Object.hasOwn(ACTIONS, req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let action;
  try {
    const query = new URL(req.url || '/', 'http://localhost').searchParams;
    action = query.get('action') || '';
    if (query.getAll('action').length > 1 || !ACTIONS[req.method].has(action)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Invalid action.' });
  }

  let body;
  if (req.method === 'POST') {
    if (!sameOrigin(req)) return res.status(403).json({ error: 'Invalid origin.' });
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return res.status(415).json({ error: 'JSON required.' });
    }
    try {
      body = await jsonBody(req);
    } catch (error) {
      const tooLarge = error?.status === 413;
      return res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'Submission is too large.' : 'Invalid submission.' });
    }
  }

  const url = new URL(TRACKER_URL);
  if (action) url.searchParams.set('action', action);
  const headers = { accept: 'application/json' };
  const cookies = (req.headers.cookie || '').split(';').map(part => part.trim())
    .filter(part => /^decision_(visitor|admin|entry)=/.test(part)).join('; ');
  if (cookies) headers.cookie = cookies;
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  if (body !== undefined) headers['content-type'] = 'application/json';

  // Never pass Origin, Host, forwarding headers, or unrelated site cookies upstream.
  const signal = AbortSignal.timeout(15_000);
  try {
    const upstream = await fetch(url, { method: req.method, headers, body, redirect: 'manual', signal });
    if (upstream.status >= 300 && upstream.status < 400) throw new Error();
    if (upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error();
    const data = await upstream.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    const setCookies = upstream.headers.getSetCookie().filter(value => /^decision_(visitor|admin|entry)=/.test(value));
    if (setCookies.length) res.setHeader('Set-Cookie', setCookies);
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(signal.aborted ? 504 : 502).json({ error: signal.aborted ? 'Tracker request timed out. Please try again.' : 'Tracker is temporarily unavailable. Please try again.' });
  }
}
