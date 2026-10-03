import {
  json, authorized, rateLimit, clientIp, smsConfigured, normalizePhone, validPhone, smsNumberAllowed, sendSms,
} from '../lib/notify.mjs';

export default async (req, ctx) => {
  if (req.method === 'GET') return json({ configured: smsConfigured() });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!authorized(req)) return json({ ok: false, error: 'unauthorized', message: 'Missing or wrong app passcode (x-app-key).' }, 401);
  if (!rateLimit(`sms:${clientIp(req, ctx)}`, 15, 3600_000)) return json({ ok: false, error: 'rate_limited' }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const to = normalizePhone(body.to);
  const message = String(body.message || '').slice(0, 320);
  if (!validPhone(to)) return json({ ok: false, error: 'bad_number', message: 'Enter the number with country code, e.g. +14075550123.' }, 400);
  if (!message) return json({ ok: false, error: 'empty_message' }, 400);
  if (!smsNumberAllowed(to)) {
    return json({ ok: false, error: 'number_not_allowed', message: 'Add this number to ALLOWED_SMS_NUMBERS in Netlify (or set ALLOW_ANY_SMS_NUMBER=true).' }, 403);
  }
  if (!smsConfigured()) {
    return json({ ok: false, configured: false, error: 'not_configured', message: 'Twilio credentials are not set on the server yet. In-app browser alerts still work. See Help for the 5-minute setup.' });
  }
  try {
    const r = await sendSms({ to, body: message });
    return json({ ok: true, ...r });
  } catch (e) {
    return json({ ok: false, error: 'send_failed', message: String(e.message || e) }, 502);
  }
};
export const config = { path: '/api/send-sms' };
