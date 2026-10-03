// Shared helpers: env, auth, rate limiting, email (Gmail SMTP / Resend), SMS (Twilio), message formatting.
import nodemailer from 'nodemailer';

export const DEFAULT_TO = 'grokbotaccess@gmail.com';
export const env = (k, d = '') => String(process.env[k] ?? d).trim();
const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

/* ---------- optional passcode ---------- */
export function authorized(req) {
  const need = env('APP_PASSCODE');
  if (!need) return true;
  return req.headers.get('x-app-key') === need;
}

/* ---------- tiny in-memory rate limiter (best effort, per warm instance) ---------- */
const hits = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now); hits.set(key, arr);
  return true;
}
export const clientIp = (req, ctx) => ctx?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';

/* ---------- EMAIL ---------- */
export function emailProvider() {
  const p = env('EMAIL_PROVIDER', 'auto').toLowerCase();
  const hasResend = !!env('RESEND_API_KEY');
  const hasGmail = !!(env('GMAIL_USER') && env('GMAIL_APP_PASSWORD'));
  if (p === 'resend') return hasResend ? 'resend' : null;
  if (p === 'gmail') return hasGmail ? 'gmail' : null;
  if (hasResend) return 'resend';
  if (hasGmail) return 'gmail';
  return null;
}
export const emailConfigured = () => !!emailProvider();

export function allowedRecipients() {
  const l = list(env('EMAIL_ALLOWED_RECIPIENTS')).concat(list(env('EMAIL_TO')));
  return new Set((l.length ? l : [DEFAULT_TO]).map((x) => x.toLowerCase()));
}
export const defaultRecipient = () => env('EMAIL_TO') || DEFAULT_TO;

export async function sendEmail({ to, subject, text, replyTo }) {
  const provider = emailProvider();
  if (!provider) { const e = new Error('Email credentials are not configured'); e.code = 'not_configured'; throw e; }
  if (provider === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env('EMAIL_FROM', 'WDW Dashboard <onboarding@resend.dev>'),
        to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Resend error ${r.status}: ${j.message || JSON.stringify(j)}`);
    return { provider, id: j.id };
  }
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env('GMAIL_USER'), pass: env('GMAIL_APP_PASSWORD').replace(/\s+/g, '') },
  });
  const info = await transport.sendMail({
    from: `"WDW Dashboard" <${env('GMAIL_USER')}>`,
    to, subject, text, ...(replyTo ? { replyTo } : {}),
  });
  return { provider, id: info.messageId };
}

/* ---------- SMS ---------- */
export function normalizePhone(raw) {
  const s = String(raw || '').trim();
  const digits = s.replace(/[^\d]/g, '');
  if (s.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}
export const validPhone = (p) => /^\+[1-9]\d{7,14}$/.test(p);
export const smsConfigured = () =>
  !!(env('TWILIO_ACCOUNT_SID') && env('TWILIO_AUTH_TOKEN') && (env('TWILIO_FROM') || env('TWILIO_MESSAGING_SERVICE_SID')));

export function smsNumberAllowed(phone) {
  if (env('ALLOW_ANY_SMS_NUMBER').toLowerCase() === 'true') return true;
  const allow = list(env('ALLOWED_SMS_NUMBERS')).map(normalizePhone);
  return allow.includes(phone);
}

export async function sendSms({ to, body }) {
  if (!smsConfigured()) { const e = new Error('Twilio credentials are not configured'); e.code = 'not_configured'; throw e; }
  const sid = env('TWILIO_ACCOUNT_SID');
  const form = new URLSearchParams({ To: to, Body: String(body).slice(0, 600) });
  if (env('TWILIO_MESSAGING_SERVICE_SID')) form.set('MessagingServiceSid', env('TWILIO_MESSAGING_SERVICE_SID'));
  else form.set('From', env('TWILIO_FROM'));
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      authorization: 'Basic ' + Buffer.from(`${sid}:${env('TWILIO_AUTH_TOKEN')}`).toString('base64'),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Twilio error ${r.status}: ${j.message || JSON.stringify(j)}`);
  return { sid: j.sid, status: j.status };
}

/* ---------- Structured email for the Grok bots ---------- */
export const TRIP = {
  dates: '2026-10-29 to 2026-11-05', adults: 2, hotel: 'Westgate Lakes Resort & Spa (off-site)',
  scope: 'Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom, Disney Springs',
};

/** events: [{kind,title,detail,data?}] -> {subject,text} (plain text + JSON block) */
export function formatEventEmail(events, { replyTo } = {}) {
  const now = new Date();
  const et = now.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
  const head = events.length === 1 ? events[0].title : `${events.length} updates`;
  const subject = `[WDW Dashboard] Travel Update – ${head}`;
  const lines = [
    'WDW DASHBOARD -> GROK TRAVEL MANAGER',
    `Generated: ${et} ET`,
    `Trip: ${TRIP.dates} | ${TRIP.adults} adults | Hotel: ${TRIP.hotel}`,
    `Scope: ${TRIP.scope}`,
    replyTo ? `Reply-To: ${replyTo}` : '',
    '',
    'EVENTS',
    ...events.map((e, i) => `${i + 1}. [${e.kind}] ${e.title}${e.detail ? ' - ' + e.detail : ''}`),
    '',
    'Please acknowledge and, if any logistics are affected (hotel, flights, car, shuttle, reservations), reply with recommended changes.',
    '',
    '--- JSON ---',
    JSON.stringify({
      source: 'wdw-dashboard', type: 'alert', generatedAt: now.toISOString(),
      trip: { start: '2026-10-29', end: '2026-11-05', adults: TRIP.adults, hotel: 'Westgate Lakes Resort & Spa' },
      events: events.map((e) => ({ kind: e.kind, title: e.title, detail: e.detail || '', ...(e.data ? { data: e.data } : {}) })),
    }, null, 2),
  ].filter((l) => l !== '');
  return { subject, text: lines.join('\n') };
}
