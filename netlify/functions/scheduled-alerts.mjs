// Runs every 5 minutes (Netlify Scheduled Function). Works while the app is closed.
// Reads prefs saved by the app, compares live data with the last run, and sends SMS / Grok-bot email.
import { getStore } from '@netlify/blobs';
import {
  env, emailConfigured, smsConfigured, sendEmail, sendSms, formatEventEmail, defaultRecipient,
  allowedRecipients, smsNumberAllowed, normalizePhone, validPhone,
} from '../lib/notify.mjs';
import { resolveParks, fetchLive, fetchSchedule, fetchDeals } from '../lib/themeparks.mjs';

const COOLDOWN_MS = 30 * 60 * 1000;
const TRIP = { start: '2026-10-29', end: '2026-11-05' };

const etHour = () => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(new Date())) % 24;
const fmtET = (iso) => new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });

export default async () => {
  const store = getStore({ name: 'wdw', consistency: 'strong' });
  const prefs = await store.get('prefs', { type: 'json' });
  if (!prefs?.cloudEnabled) return new Response('cloud alerts off');
  const h = etHour();
  if (h >= 1 && h < 6) return new Response('quiet hours'); // parks are closed overnight

  const state = (await store.get('state', { type: 'json' })) || { rides: {}, hours: {}, sent: {}, deals: null, lastEmail: 0 };
  const now = Date.now();
  const events = [];

  /* ---- live waits ---- */
  const parks = await resolveParks();
  const byId = {};
  const liveResults = await Promise.allSettled(parks.map((p) => fetchLive(p.id)));
  liveResults.forEach((r, i) => { if (r.status === 'fulfilled') r.value.forEach((e) => { byId[e.id] = { ...e, _park: parks[i].name }; }); });

  const cool = (key) => !(state.sent[key] && now - state.sent[key] < COOLDOWN_MS);
  const mark = (key) => { state.sent[key] = now; };

  for (const w of prefs.watch || []) {
    const cur = byId[w.id]; if (!cur) continue;
    const wait = cur.queue?.STANDBY?.waitTime ?? null;
    const status = cur.status || 'UNKNOWN';
    const prev = state.rides[w.id];
    if (prev) {
      if (prefs.rules?.waitDrop && w.max != null && status === 'OPERATING' && wait != null && wait <= w.max
          && (prev.wait == null || prev.wait > w.max || prev.status !== 'OPERATING') && cool(`w:${w.id}`)) {
        events.push({ kind: 'waitDrop', title: `${cur.name} wait is ${wait} min`, detail: `${cur._park}; your threshold is ${w.max} min`, data: { id: w.id, wait, threshold: w.max } });
        mark(`w:${w.id}`);
      }
      if (prefs.rules?.reopen && w.reopen && prev.status === 'DOWN' && status === 'OPERATING' && cool(`r:${w.id}`)) {
        events.push({ kind: 'reopen', title: `${cur.name} reopened`, detail: `${cur._park}${wait != null ? `; wait ${wait} min` : ''}`, data: { id: w.id, wait } });
        mark(`r:${w.id}`);
      }
    }
    state.rides[w.id] = { wait, status };
  }
  for (const w of prefs.watchRestaurants || []) {
    const cur = byId[w.id]; if (!cur) continue;
    const avail = Array.isArray(cur.diningAvailability) && cur.diningAvailability.some((a) => a.waitTime != null);
    const prev = state.rides[`d:${w.id}`];
    if (prefs.rules?.restaurant && prev && prev.avail === false && avail && cool(`d:${w.id}`)) {
      events.push({ kind: 'restaurant', title: `Table availability at ${cur.name}`, detail: `${cur._park}; walk-up / short-notice seating just appeared`, data: { id: w.id } });
      mark(`d:${w.id}`);
    }
    state.rides[`d:${w.id}`] = { avail };
  }

  /* ---- park hours (trip dates only) ---- */
  if (prefs.rules?.hours) {
    const months = [[2026, 10], [2026, 11]];
    for (const p of parks) {
      try {
        const all = (await Promise.all(months.map(([y, m]) => fetchSchedule(p.id, y, m)))).flat();
        const trip = all.filter((s) => s.date >= TRIP.start && s.date <= TRIP.end && ['OPERATING', 'EXTRA_HOURS'].includes(s.type));
        const sig = {};
        for (const s of trip) { const k = `${s.date}|${s.type}`; sig[k] = [sig[k], `${s.openingTime}>${s.closingTime}`].filter(Boolean).join(';'); }
        const prev = state.hours[p.id];
        if (prev) {
          const changed = Object.keys({ ...prev, ...sig }).filter((k) => prev[k] !== sig[k]);
          if (changed.length && cool(`h:${p.id}`)) {
            const k = changed[0]; const date = k.split('|')[0];
            const now1 = sig[k] ? sig[k].split(';')[0].split('>').map(fmtET).join(' - ') : 'removed';
            events.push({ kind: 'hours', title: `${p.name} hours changed`, detail: `${date}: now ${now1}${changed.length > 1 ? ` (+${changed.length - 1} more day changes)` : ''}`, data: { park: p.key, days: changed.length } });
            mark(`h:${p.id}`);
          }
        }
        state.hours[p.id] = sig;
      } catch { /* keep previous */ }
    }
  }

  /* ---- deals ---- */
  if (prefs.rules?.deal) {
    try {
      const deals = await fetchDeals();
      const ids = deals.map((d) => d.id);
      if (state.deals) {
        const fresh = deals.filter((d) => !state.deals.includes(d.id)).slice(0, 3);
        for (const d of fresh) events.push({ kind: 'deal', title: `New deal: ${d.title}`.slice(0, 150), detail: `${d.source} - ${d.link}` });
      }
      state.deals = ids.slice(0, 60);
    } catch { /* ignore */ }
  }

  /* ---- deliver ---- */
  const result = { events: events.length, sms: null, email: null };
  if (events.length) {
    if (prefs.smsEnabled && prefs.phone && validPhone(normalizePhone(prefs.phone)) && smsConfigured() && smsNumberAllowed(normalizePhone(prefs.phone))) {
      const msg = 'WDW: ' + events.slice(0, 3).map((e) => e.title).join(' | ') + (events.length > 3 ? ` (+${events.length - 3} more)` : '');
      try { await sendSms({ to: normalizePhone(prefs.phone), body: msg.slice(0, 300) }); result.sms = 'sent'; } catch (e) { result.sms = String(e.message); }
    }
    const minMs = (prefs.minMinutes || 30) * 60 * 1000;
    if (prefs.emailEnabled && emailConfigured() && now - (state.lastEmail || 0) >= minMs) {
      const to = (prefs.emailTo || defaultRecipient()).trim();
      if (allowedRecipients().has(to.toLowerCase())) {
        const { subject, text } = formatEventEmail(events, { replyTo: prefs.replyTo });
        try { await sendEmail({ to, subject, text, replyTo: prefs.replyTo || undefined }); state.lastEmail = now; result.email = 'sent'; } catch (e) { result.email = String(e.message); }
      }
    }
  }
  // trim cooldown map
  for (const k of Object.keys(state.sent)) if (now - state.sent[k] > 6 * 3600_000) delete state.sent[k];
  await store.setJSON('state', state);
  return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
};

export const config = { schedule: '*/5 * * * *' };
