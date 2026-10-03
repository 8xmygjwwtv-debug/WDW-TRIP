import {
  json, authorized, rateLimit, clientIp, emailConfigured, emailProvider, allowedRecipients,
  defaultRecipient, sendEmail, formatEventEmail,
} from '../lib/notify.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req, ctx) => {
  if (req.method === 'GET') return json({ configured: emailConfigured(), provider: emailProvider(), defaultTo: defaultRecipient() });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!authorized(req)) return json({ ok: false, error: 'unauthorized', message: 'Missing or wrong app passcode (x-app-key).' }, 401);
  if (!rateLimit(`email:${clientIp(req, ctx)}`, 20, 3600_000)) return json({ ok: false, error: 'rate_limited' }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }

  const to = String(body.to || defaultRecipient()).trim();
  const replyTo = body.replyTo && EMAIL_RE.test(String(body.replyTo).trim()) ? String(body.replyTo).trim() : undefined;
  if (!EMAIL_RE.test(to) || !allowedRecipients().has(to.toLowerCase())) {
    return json({ ok: false, error: 'recipient_not_allowed', message: `Recipient must be one of: ${[...allowedRecipients()].join(', ')}. Change EMAIL_ALLOWED_RECIPIENTS to allow others.` }, 403);
  }

  let subject = String(body.subject || '').slice(0, 200);
  let text = String(body.text || '').slice(0, 20000);
  if (Array.isArray(body.events) && body.events.length) {
    const f = formatEventEmail(body.events.slice(0, 20).map((e) => ({
      kind: String(e.kind || 'event').slice(0, 30), title: String(e.title || '').slice(0, 160),
      detail: String(e.detail || '').slice(0, 400), data: e.data,
    })), { replyTo });
    subject = subject || f.subject; text = text || f.text;
  }
  if (!subject || !text) return json({ ok: false, error: 'missing_subject_or_text' }, 400);

  if (!emailConfigured()) {
    // Graceful fallback: return the draft so the UI can show it + setup instructions instead of failing.
    return json({
      ok: false, configured: false, error: 'not_configured',
      message: 'Email credentials are not set on the server yet. Use Copy / Open in Gmail for now, then follow the Help tab to enable one-click sending.',
      draft: { to, subject, text },
    });
  }
  try {
    const res = await sendEmail({ to, subject, text, replyTo });
    return json({ ok: true, ...res, to, subject });
  } catch (e) {
    return json({ ok: false, error: 'send_failed', message: String(e.message || e), draft: { to, subject, text } }, 502);
  }
};
export const config = { path: '/api/send-email' };
