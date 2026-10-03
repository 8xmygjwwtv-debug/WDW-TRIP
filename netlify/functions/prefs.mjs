// Stores the alert preferences the scheduled function needs (phone, thresholds, watch list). Netlify Blobs.
import { getStore } from '@netlify/blobs';
import { json, authorized, rateLimit, clientIp, normalizePhone, validPhone } from '../lib/notify.mjs';

export default async (req, ctx) => {
  if (!authorized(req)) return json({ ok: false, error: 'unauthorized' }, 401);
  const store = getStore({ name: 'wdw', consistency: 'strong' });
  if (req.method === 'GET') {
    const prefs = (await store.get('prefs', { type: 'json' })) || null;
    return json({ ok: true, prefs });
  }
  if (req.method !== 'POST') return json({ error: 'GET or POST only' }, 405);
  if (!rateLimit(`prefs:${clientIp(req, ctx)}`, 60, 3600_000)) return json({ ok: false, error: 'rate_limited' }, 429);
  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  const p = body.prefs || {};
  const phone = p.phone ? normalizePhone(p.phone) : '';
  const clean = {
    cloudEnabled: !!p.cloudEnabled,
    phone: validPhone(phone) ? phone : '',
    smsEnabled: !!p.smsEnabled,
    emailEnabled: !!p.emailEnabled,
    emailTo: String(p.emailTo || '').slice(0, 200),
    replyTo: String(p.replyTo || '').slice(0, 200),
    minMinutes: Math.max(5, Math.min(720, Number(p.minMinutes) || 30)),
    rules: Object.fromEntries(['waitDrop', 'reopen', 'restaurant', 'hours', 'deal'].map((k) => [k, p.rules?.[k] !== false])),
    watch: (Array.isArray(p.watch) ? p.watch : []).slice(0, 80).map((w) => ({
      id: String(w.id), name: String(w.name || '').slice(0, 80), park: String(w.park || '').slice(0, 20),
      max: w.max == null ? null : Math.max(0, Math.min(300, Number(w.max))), reopen: w.reopen !== false,
    })),
    watchRestaurants: (Array.isArray(p.watchRestaurants) ? p.watchRestaurants : []).slice(0, 30).map((w) => ({
      id: String(w.id), name: String(w.name || '').slice(0, 80), park: String(w.park || '').slice(0, 20),
    })),
    updatedAt: new Date().toISOString(),
  };
  await store.setJSON('prefs', clean);
  return json({ ok: true, saved: clean.updatedAt, watching: clean.watch.length + clean.watchRestaurants.length });
};
export const config = { path: '/api/prefs' };
