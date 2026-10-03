/* WDW Trip Dashboard — vanilla JS. Data: ThemeParks.wiki (via /api/tp proxy, with direct fallback). */
(() => {
'use strict';
const D = window.WDW_DATA;
const TZ = D.trip.tz;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const enc = encodeURIComponent;
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } }
};
const KEY = {
  prefs: 'wdw.prefs', cache: 'wdw.cache', prev: 'wdw.prev', log: 'wdw.log', sent: 'wdw.sent', plan: 'wdw.plan',
  logi: 'wdw.logistics', collect: 'wdw.collect', ids: 'wdw.parkIds', fab: 'wdw.fab', dealsSeen: 'wdw.dealsSeen',
  emailAt: 'wdw.emailAt', hours: 'wdw.hours', theme: 'wdw.theme',
  news: 'wdw.news', lastPos: 'wdw.lastPos', poiTp: 'wdw.poi.tp', poiOsm: 'wdw.poi.osm2'
};

/* ---------- time helpers ---------- */
const fmtTime = (iso) => { try { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }); } catch { return ''; } };
const etDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const fmtDay = (ymd) => new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtDayLong = (ymd) => new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const ago = (ts) => {
  if (!ts) return 'never';
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};
function tripDays() {
  const out = []; let d = new Date(D.trip.start + 'T12:00:00Z'); const end = new Date(D.trip.end + 'T12:00:00Z');
  while (d <= end) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 864e5); }
  return out;
}
const daysUntil = (ymd) => Math.round((new Date(ymd + 'T12:00:00Z') - new Date(etDate() + 'T12:00:00Z')) / 864e5);

/* ---------- preferences ---------- */
const DEFAULT_PREFS = {
  phone: '', defaultMax: 30, priorityAlerts: false,
  inApp: { enabled: true }, sms: { enabled: false },
  email: { enabled: false, to: 'grokbotaccess@gmail.com', from: '', minMinutes: 30 },
  cloud: { enabled: false, passcode: '' },
  rules: { waitDrop: true, reopen: true, restaurant: true, hours: true, deal: true },
  rides: {}, restaurants: {}, favorites: []
};
const merge = (a, b) => { for (const k of Object.keys(b || {})) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], b[k]); else a[k] = b[k]; } return a; };
const loadPrefs = () => merge(JSON.parse(JSON.stringify(DEFAULT_PREFS)), LS.get(KEY.prefs, {}));
function setPath(obj, path, val) { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { o = o[k] = o[k] || {}; }); o[ks.at(-1)] = val; }

/* ---------- state ---------- */
const days = tripDays();
const today = etDate();
const S = {
  tab: 'overview',
  viewDate: days.includes(today) ? today : days[0],
  parkIds: {}, parks: {}, sched: {}, index: {},
  loading: false, lastRefresh: null, schedAt: 0,
  filters: { q: '', status: 'all', kind: 'ATTRACTION', sort: 'short', fav: false },
  gq: '', gcat: 'all', deals: { items: [], at: null, error: null, loading: false },
  prefs: loadPrefs(), server: { email: null, sms: null }, draft: null, cloudMsg: '', prevSnap: LS.get(KEY.prev, null), fromCache: false
};

/* ---------- API ---------- */
async function api(path) {
  const urls = [`/api/tp?path=${enc(path)}`, `https://api.themeparks.wiki/v1${path}`];
  let last;
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      if (!(r.headers.get('content-type') || '').includes('json')) throw new Error('Unexpected response');
      return await r.json();
    } catch (e) { last = e; }
  }
  throw last || new Error('Network error');
}
async function post(url, body) {
  const h = { 'content-type': 'application/json' };
  if (S.prefs.cloud.passcode) h['x-app-key'] = S.prefs.cloud.passcode;
  const r = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body) });
  let j = null; try { j = await r.json(); } catch { /* non-JSON */ }
  if (!j) throw new Error(`Server returned ${r.status}. Are the Netlify Functions deployed on this site?`);
  return j;
}

/* ---------- data shaping ---------- */
const KEEP = ['ATTRACTION', 'SHOW', 'RESTAURANT'];
function slim(e, park) {
  const q = e.queue || {};
  return {
    id: e.id, name: e.name, type: e.entityType, park, status: e.status || 'UNKNOWN',
    wait: q.STANDBY?.waitTime ?? null, single: q.SINGLE_RIDER?.waitTime ?? null,
    ret: q.RETURN_TIME ? { state: q.RETURN_TIME.state, start: q.RETURN_TIME.returnStart } : null,
    paid: q.PAID_RETURN_TIME ? { state: q.PAID_RETURN_TIME.state, start: q.PAID_RETURN_TIME.returnStart, price: q.PAID_RETURN_TIME.price?.formatted || '' } : null,
    shows: (e.showtimes || []).map((s) => ({ s: s.startTime, e: s.endTime, t: s.type })),
    dining: Array.isArray(e.diningAvailability) ? e.diningAvailability.map((d) => ({ size: d.partySize, wait: d.waitTime })) : null,
    updated: e.lastUpdated || null
  };
}
const rebuildIndex = () => { S.index = {}; Object.values(S.parks).forEach((p) => (p.live || []).forEach((e) => { S.index[e.id] = e; })); };
const diningAvail = (e) => !!(e.dining && e.dining.some((d) => d.wait != null));
const parkDef = (k) => D.parks.find((p) => p.key === k);

async function discoverParks() {
  const cached = LS.get(KEY.ids, null);
  if (cached && Date.now() - cached.t < 7 * 864e5) { S.parkIds = cached.ids; return; }
  const ids = Object.fromEntries(D.parks.map((p) => [p.key, p.fallbackId]));
  try {
    const j = await api('/destinations');
    const dest = (j.destinations || []).find((d) => /walt disney world/i.test(d.name));
    (dest?.parks || []).forEach((x) => { const p = D.parks.find((pp) => pp.match.test(x.name)); if (p) ids[p.key] = x.id; });
    LS.set(KEY.ids, { t: Date.now(), ids });
  } catch { /* use fallbacks */ }
  S.parkIds = ids;
}

async function loadSchedules(force) {
  if (!force && Date.now() - S.schedAt < 20 * 60e3 && Object.keys(S.sched).length) return;
  await Promise.allSettled(D.parks.map(async (p) => {
    const id = S.parkIds[p.key];
    const parts = await Promise.all(['10', '11'].map((m) => api(`/entity/${id}/schedule/2026/${m}`).then((j) => j.schedule || []).catch(() => [])));
    const all = parts.flat();
    if (all.length) S.sched[p.key] = all.filter((s) => days.includes(s.date) || s.date === today);
  }));
  S.schedAt = Date.now();
}
function hoursFor(parkKey, ymd) {
  const list = (S.sched[parkKey] || []).filter((s) => s.date === ymd);
  const op = list.filter((s) => s.type === 'OPERATING');
  const extra = list.filter((s) => s.type === 'EXTRA_HOURS');
  const events = list.filter((s) => ['TICKETED_EVENT', 'PRIVATE_EVENT'].includes(s.type));
  return { open: op[0]?.openingTime || null, close: op.at(-1)?.closingTime || null, extra, events, known: list.length > 0 };
}
function parksActive() {
  const now = Date.now(); let known = false;
  for (const p of D.parks) {
    const h = hoursFor(p.key, etDate());
    if (h.open && h.close) { known = true; if (now > new Date(h.open) - 3600e3 && now < new Date(h.close).getTime() + 3600e3) return true; }
  }
  return !known;
}

async function refresh(manual) {
  if (S.loading) return;
  S.loading = true; setStatus();
  if (!Object.keys(S.parkIds).length) await discoverParks();
  const results = await Promise.allSettled(D.parks.map(async (p) => {
    const j = await api(`/entity/${S.parkIds[p.key]}/live`);
    S.parks[p.key] = { live: (j.liveData || []).filter((e) => KEEP.includes(e.entityType)).map((e) => slim(e, p.key)), updated: Date.now(), error: null };
  }));
  results.forEach((r, i) => {
    if (r.status === 'rejected') { const k = D.parks[i].key; S.parks[k] = { ...(S.parks[k] || { live: [] }), error: String(r.reason?.message || r.reason) }; }
  });
  rebuildIndex();
  await loadSchedules(!!manual);
  const ok = results.some((r) => r.status === 'fulfilled');
  if (ok) { S.lastRefresh = Date.now(); S.fromCache = false; LS.set(KEY.cache, { t: S.lastRefresh, parks: S.parks, sched: S.sched }); runAlerts(); }
  S.loading = false;
  setStatus();
  if (shouldRerender()) render(); else renderFab();
  if (manual && !ok) toast('Could not reach live data', 'Showing the last saved numbers. Check your connection and try again.');
}

/* ---------- priority resolution ---------- */
function resolvePriority() {
  return D.priority.map((def) => {
    const list = (S.parks[def.park]?.live || []).filter((e) => e.type === def.type && def.re.test(e.name));
    return { def, ent: list.find((e) => e.status === 'OPERATING') || list[0] || null };
  });
}
const isFav = (id) => S.prefs.favorites.includes(id);
function savePrefs() { LS.set(KEY.prefs, S.prefs); scheduleCloudSync(); }

/* ---------- alerts ---------- */
function watchList() {
  const p = S.prefs; const map = {};
  Object.entries(p.rides).forEach(([id, r]) => { if (r.on) map[id] = { id, name: r.name, park: r.park, max: r.max ?? p.defaultMax, reopen: r.reopen !== false }; });
  if (p.priorityAlerts) resolvePriority().forEach(({ def, ent }) => { if (ent && def.type === 'ATTRACTION' && !map[ent.id]) map[ent.id] = { id: ent.id, name: ent.name, park: ent.park, max: p.defaultMax, reopen: true }; });
  return Object.values(map);
}
function watchRestaurants() {
  const p = S.prefs; const map = {};
  Object.entries(p.restaurants).forEach(([id, r]) => { if (r.on) map[id] = { id, name: r.name, park: r.park }; });
  if (p.priorityAlerts) resolvePriority().forEach(({ def, ent }) => { if (ent && def.type === 'RESTAURANT' && !map[ent.id]) map[ent.id] = { id: ent.id, name: ent.name, park: ent.park }; });
  return Object.values(map);
}
const cooled = (key) => { const s = LS.get(KEY.sent, {}); return !(s[key] && Date.now() - s[key] < 30 * 60e3); };
const markSent = (key) => { const s = LS.get(KEY.sent, {}); s[key] = Date.now(); Object.keys(s).forEach((k) => { if (Date.now() - s[k] > 6 * 3600e3) delete s[k]; }); LS.set(KEY.sent, s); };

function runAlerts() {
  const snap = {};
  Object.values(S.index).forEach((e) => { snap[e.id] = { wait: e.wait, status: e.status, avail: diningAvail(e) }; });
  const prevSnap = S.prevSnap; const events = []; const R = S.prefs.rules;
  if (prevSnap && Date.now() - prevSnap.t < 30 * 60e3) {
    // Banner news for every attraction, not only watched ones
    const downs = [], ups = [];
    Object.values(S.index).forEach((cur) => {
      if (cur.type !== 'ATTRACTION') return; const pr = prevSnap.map[cur.id]; if (!pr) return;
      if (pr.status === 'OPERATING' && cur.status === 'DOWN') downs.push(cur); else if (pr.status === 'DOWN' && cur.status === 'OPERATING') ups.push(cur);
    });
    const newsFor = (list, icon, verb, kind) => { if (list.length > 6) pushNews(kind, `${icon} ${list.length} attractions ${verb}`); else list.forEach((c) => pushNews(kind, `${icon} ${c.name} ${verb} (${parkDef(c.park).short})`)); };
    newsFor(downs, '🔴', 'temporarily down', 'down'); newsFor(ups, '🟢', 'reopened', 'up');
    for (const w of watchList()) {
      const cur = S.index[w.id]; const pr = prevSnap.map[w.id]; if (!cur || !pr) continue;
      if (R.waitDrop && w.max != null && cur.status === 'OPERATING' && cur.wait != null && cur.wait <= w.max &&
          (pr.wait == null || pr.wait > w.max || pr.status !== 'OPERATING') && cooled('w:' + w.id)) {
        events.push({ kind: 'waitDrop', title: `${cur.name} is down to ${cur.wait} min`, detail: `${parkDef(cur.park).name}; your limit is ${w.max} min`, data: { id: w.id, wait: cur.wait, threshold: w.max } });
        markSent('w:' + w.id);
      }
      if (R.reopen && w.reopen && pr.status === 'DOWN' && cur.status === 'OPERATING' && cooled('r:' + w.id)) {
        events.push({ kind: 'reopen', title: `${cur.name} reopened`, detail: `${parkDef(cur.park).name}${cur.wait != null ? `; wait ${cur.wait} min` : ''}`, data: { id: w.id } });
        markSent('r:' + w.id);
      }
    }
    for (const w of watchRestaurants()) {
      const cur = S.index[w.id]; const pr = prevSnap.map[w.id]; if (!cur || !pr) continue;
      if (R.restaurant && pr.avail === false && diningAvail(cur) && cooled('d:' + w.id)) {
        events.push({ kind: 'restaurant', title: `Walk-up availability at ${cur.name}`, detail: parkDef(cur.park).name, data: { id: w.id } });
        markSent('d:' + w.id);
      }
    }
  }
  S.prevSnap = { t: Date.now(), map: snap }; LS.set(KEY.prev, S.prevSnap);

  // park hours changes across trip dates
  const sig = {};
  D.parks.forEach((p) => (S.sched[p.key] || []).filter((s) => days.includes(s.date) && ['OPERATING', 'EXTRA_HOURS'].includes(s.type))
    .forEach((s) => { const k = `${p.key}|${s.date}|${s.type}`; sig[k] = [sig[k], `${s.openingTime}>${s.closingTime}`].filter(Boolean).join(';'); }));
  const prevSig = LS.get(KEY.hours, null);
  if (prevSig && R.hours && Object.keys(sig).length) {
    const had = new Set(Object.keys(prevSig).map((k) => k.split('|')[0]));
    const changed = Object.keys({ ...prevSig, ...sig }).filter((k) => had.has(k.split('|')[0]) && prevSig[k] !== sig[k]);
    if (changed.length) {
      const [pk, date] = changed[0].split('|'); const h = hoursFor(pk, date);
      events.push({ kind: 'hours', title: `${parkDef(pk).name} hours changed`, detail: `${fmtDay(date)}: ${h.open ? fmtTime(h.open) + ' – ' + fmtTime(h.close) : 'no hours listed'}${changed.length > 1 ? ` (+${changed.length - 1} more)` : ''}`, data: { park: pk, changes: changed.length } });
    }
  }
  if (Object.keys(sig).length) LS.set(KEY.hours, sig);
  if (events.length) fireEvents(events);
}

function logEvent(e) { const l = LS.get(KEY.log, []); l.unshift({ t: Date.now(), kind: e.kind, title: e.title, detail: e.detail || '' }); LS.set(KEY.log, l.slice(0, 50)); }

async function fireEvents(events) {
  events.forEach(logEvent);
  events.forEach((e) => { if (e.kind === 'hours') pushNews('hours', `🕒 ${e.title}: ${e.detail}`); else if (!['deal', 'reopen'].includes(e.kind)) pushNews('alert', `🔔 ${e.title}`); });
  renderTicker();
  if (S.prefs.inApp.enabled) events.forEach((e) => { toast(e.title, e.detail); browserNotify(e.title, e.detail, e.kind + (e.data?.id || '')); });
  // When cloud alerts are on, the scheduled function sends SMS/email; avoid double messages.
  if (S.prefs.cloud.enabled) return;
  const p = S.prefs;
  if (p.sms.enabled && p.phone) {
    const msg = 'WDW: ' + events.slice(0, 3).map((e) => e.title).join(' | ') + (events.length > 3 ? ` (+${events.length - 3} more)` : '');
    post('/api/send-sms', { to: p.phone, message: msg }).catch(() => {});
  }
  if (p.email.enabled) {
    const last = LS.get(KEY.emailAt, 0);
    if (Date.now() - last >= (p.email.minMinutes || 30) * 60e3) {
      LS.set(KEY.emailAt, Date.now());
      post('/api/send-email', { to: p.email.to, replyTo: p.email.from || undefined, events: events.map((e) => ({ kind: e.kind, title: e.title, detail: e.detail, data: e.data })) }).catch(() => {});
    }
  }
}

function browserNotify(title, body, tag) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: tag || undefined };
    if (navigator.serviceWorker?.controller) navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, opts));
    else new Notification(title, opts);
  } catch { /* unsupported */ }
}
function toast(title, body) {
  const wrap = $('#toasts'); if (!wrap) return;
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `<div class="font-semibold">${esc(title)}</div>${body ? `<div class="text-sm opacity-80">${esc(body)}</div>` : ''}`;
  wrap.appendChild(el); setTimeout(() => el.remove(), 7000);
  el.addEventListener('click', () => el.remove());
}

/* ---------- cloud preference sync ---------- */
let cloudTimer = null;
function scheduleCloudSync() { if (!S.prefs.cloud.enabled && !S.cloudDirty) return; clearTimeout(cloudTimer); cloudTimer = setTimeout(syncCloud, 1200); }
async function syncCloud() {
  const p = S.prefs;
  try {
    const j = await post('/api/prefs', { prefs: {
      cloudEnabled: p.cloud.enabled, phone: p.phone, smsEnabled: p.sms.enabled, emailEnabled: p.email.enabled,
      emailTo: p.email.to, replyTo: p.email.from, minMinutes: p.email.minMinutes, rules: p.rules,
      watch: watchList(), watchRestaurants: watchRestaurants()
    } });
    S.cloudMsg = j.ok ? `Saved to cloud at ${new Date().toLocaleTimeString()}. Watching ${j.watching} item(s).` : `Cloud save failed: ${j.error || 'unknown error'}`;
    S.cloudDirty = !!p.cloud.enabled;
  } catch (e) { S.cloudMsg = `Cloud save failed: ${e.message}`; }
  const el = $('#cloud-msg'); if (el) el.textContent = S.cloudMsg;
}

/* ---------- deals ---------- */
async function loadDeals(force) {
  if (S.deals.loading || (!force && S.deals.at && Date.now() - S.deals.at < 10 * 60e3)) return;
  S.deals.loading = true;
  try {
    const r = await fetch('/api/deals'); const j = await r.json();
    S.deals.items = j.deals || []; S.deals.at = Date.now(); S.deals.error = null;
    const seen = LS.get(KEY.dealsSeen, null);
    const fresh = seen ? S.deals.items.filter((d) => !seen.includes(d.id)).slice(0, 3) : [];
    LS.set(KEY.dealsSeen, S.deals.items.map((d) => d.id).slice(0, 80));
    if (fresh.length && S.prefs.rules.deal) fireEvents(fresh.map((d) => ({ kind: 'deal', title: `New deal: ${d.title}`.slice(0, 150), detail: `${d.source} · ${d.link}` })));
  } catch { S.deals.error = 'Deals feed is not available (needs the Netlify Functions).'; }
  S.deals.loading = false;
  renderTicker();
  if (S.tab === 'deals') render();
}

/* ---------- rendering helpers ---------- */
const TABS = [
  ['overview', 'Overview'], ['mk', 'Magic Kingdom'], ['epcot', 'EPCOT'], ['hs', 'Hollywood Studios'], ['ak', 'Animal Kingdom'],
  ['springs', 'Disney Springs'], ['favs', 'Favorites / Must-Rides'], ['skyliner', 'Skyliner'], ['photos', 'Photos'], ['sync', 'Travel Sync'], ['deals', 'Deals & Alerts'], ['help', 'Help']
];
const TAB_COLOR = { mk: '#2563eb', epcot: '#7c3aed', hs: '#dc2626', ak: '#15803d', springs: '#d97706', skyliner: '#0891b2', photos: '#db2777' };

function waitCls(e) {
  if (!e) return 'w-off';
  if (e.status === 'DOWN') return 'w-bad';
  if (e.status === 'REFURBISHMENT') return 'w-ref';
  if (e.status !== 'OPERATING') return 'w-off';
  if (e.wait == null) return 'w-ok';
  return e.wait <= 20 ? 'w-ok' : e.wait <= 45 ? 'w-mid' : e.wait <= 75 ? 'w-high' : 'w-bad';
}
function pill(e) {
  if (!e) return '<span class="pill t w-off">—</span>';
  if (e.status === 'OPERATING' && e.wait != null) return `<span class="pill ${waitCls(e)}" title="Standby wait"><span class="n">${e.wait}</span><span class="u">min</span></span>`;
  const label = { OPERATING: 'Open', DOWN: 'Down', REFURBISHMENT: 'Refurb', CLOSED: 'Closed' }[e.status] || 'N/A';
  return `<span class="pill t ${waitCls(e)}">${label}</span>`;
}
const boardNum = (e) => {
  if (!e) return '<span class="nc-off">—</span>';
  if (e.status === 'OPERATING' && e.wait != null) { const c = e.wait <= 20 ? 'ok' : e.wait <= 45 ? 'mid' : e.wait <= 75 ? 'high' : 'bad'; return `<span class="nc-${c}">${e.wait}<small>min</small></span>`; }
  if (e.status === 'OPERATING') return '<span class="nc-ok" style="font-size:1.2rem">Open</span>';
  if (e.status === 'DOWN') return '<span class="nc-bad" style="font-size:1.2rem">Down</span>';
  if (e.status === 'REFURBISHMENT') return '<span class="nc-off" style="font-size:1.1rem">Refurb</span>';
  return '<span class="nc-off" style="font-size:1.2rem">Closed</span>';
};
const menuLink = (name) => `https://www.google.com/search?q=${enc(name + ' menu Walt Disney World')}`;
const nextShows = (e, n = 3) => (e.shows || []).filter((s) => new Date(s.s) > Date.now() - 10 * 60e3).sort((a, b) => new Date(a.s) - new Date(b.s)).slice(0, n);
let _pid = null; const PRIORITY_IDS = () => (_pid ||= new Set(resolvePriority().map((x) => x.ent?.id).filter(Boolean)));

function btnStar(e) { const f = isFav(e.id); return `<button class="star" data-act="star" data-id="${e.id}" aria-pressed="${f}" aria-label="${f ? 'Remove from' : 'Add to'} favorites: ${esc(e.name)}" title="Favorite">${f ? '★' : '☆'}</button>`; }
function btnBell(e) {
  const on = e.type === 'RESTAURANT' ? !!S.prefs.restaurants[e.id]?.on : !!S.prefs.rides[e.id]?.on;
  const tip = e.type === 'RESTAURANT' ? 'Alert when a table opens' : `Alert when wait is ${S.prefs.rides[e.id]?.max ?? S.prefs.defaultMax} min or less, or it reopens`;
  return `<button class="star bell" data-act="bell" data-id="${e.id}" aria-pressed="${on}" aria-label="${on ? 'Turn off' : 'Turn on'} alerts: ${esc(e.name)}" title="${tip}">${on ? '🔔' : '🔕'}</button>`;
}

function btnGo(e) { return `<button class="star" data-act="goto" data-id="${e.id}" aria-label="Directions to ${esc(e.name)}" title="Directions on the map">🧭</button>`; }

function entityRow(e, { showPark = false, star = true } = {}) {
  const p = parkDef(e.park); const bits = [];
  if (showPark) bits.push(esc(p.name));
  if (e.type === 'ATTRACTION' && e.status === 'OPERATING') {
    if (e.single != null) bits.push(`Single rider ${e.single} min`);
    if (e.ret?.start) bits.push(`Lightning Lane return ${fmtTime(e.ret.start)}`);
    else if (e.ret?.state === 'FINISHED' || e.ret?.state === 'TEMPORARILY_FULL') bits.push('Lightning Lane full');
    if (e.paid?.price) bits.push(`Individual LL ${esc(e.paid.price)}${e.paid.start ? ' from ' + fmtTime(e.paid.start) : ''}`);
  }
  let right = pill(e);
  if (e.type === 'SHOW') {
    const n = nextShows(e); right = '';
    bits.push(n.length ? 'Next: ' + n.map((s) => fmtTime(s.s)).join(', ') : (e.status === 'OPERATING' ? 'No more times today' : 'No times posted'));
  }
  if (e.type === 'RESTAURANT') {
    const walk = e.dining?.find((d) => d.size === 2 && d.wait != null) || e.dining?.find((d) => d.wait != null);
    right = walk ? `<span class="pill w-ok"><span class="n">${walk.wait}</span><span class="u">min walk-up</span></span>` : pill(e);
    bits.push(`<a class="link" target="_blank" rel="noopener" href="${menuLink(e.name)}">Menu</a>`);
    bits.push(`<a class="link" target="_blank" rel="noopener" href="https://disneyworld.disney.go.com/dining/">Check tables</a>`);
    if (!walk) bits.push('Walk-up data not published right now');
  }
  const prio = PRIORITY_IDS().has(e.id) ? '<span class="chip" style="cursor:default;padding:.05rem .5rem;min-height:22px;font-size:.7rem">Must-do</span>' : '';
  return `<li class="flex items-center gap-2 py-2.5 border-t first:border-t-0" style="border-color:var(--line)">
    <span class="dot" style="--pc:${p.color}" aria-hidden="true"></span>
    <div class="min-w-0 flex-1"><div class="font-semibold leading-snug">${esc(e.name)} ${prio}</div>
      <div class="text-xs muted">${bits.join(' · ') || '&nbsp;'}</div></div>
    ${right}${e.type !== 'SHOW' ? btnGo(e) + btnBell(e) : ''}${star ? btnStar(e) : ''}</li>`;
}

/* ---------- park hours ---------- */
function hoursCard(p, ymd) {
  const h = hoursFor(p.key, ymd); let body;
  if (!h.known) body = `<div class="muted text-sm">No schedule published yet for this date.</div>`;
  else if (!h.open) body = `<div class="muted text-sm">Closed or no regular hours listed.</div>`;
  else body = `<div class="display text-xl font-extrabold">${fmtTime(h.open)} – ${fmtTime(h.close)}</div>`;
  const extras = h.extra.map((x) => `<div class="text-xs"><span class="chip" style="cursor:default;padding:.05rem .5rem;min-height:22px">${esc(x.description || 'Extra hours')}</span> ${fmtTime(x.openingTime)} – ${fmtTime(x.closingTime)}</div>`).join('');
  const ev = h.events.map((x) => `<div class="text-xs mt-1">🎟️ ${esc(x.description || 'Special event')}: ${fmtTime(x.openingTime)} – ${fmtTime(x.closingTime)}</div>`).join('');
  return `<div class="card park-bar p-3" style="--pc:${p.color}"><div class="font-semibold">${p.name}</div>${body}<div class="mt-1 space-y-1">${extras}${ev}</div></div>`;
}
function dateSelect() {
  return `<label class="sr-only" for="sel-date">Date</label><select id="sel-date" class="input" style="width:auto" data-act="date">${days.map((d) => `<option value="${d}" ${d === S.viewDate ? 'selected' : ''}>${fmtDay(d)}${d === today ? ' (today)' : ''}</option>`).join('')}</select>`;
}

/* ---------- OVERVIEW ---------- */
function viewOverview() {
  const du = daysUntil(D.trip.start);
  const inTrip = days.includes(today);
  const headline = inTrip ? `Day ${days.indexOf(today) + 1} of ${days.length}` : du > 0 ? `${du} day${du === 1 ? '' : 's'} to go` : 'Trip complete';
  const prio = resolvePriority();
  const board = prio.map(({ def, ent }) => {
    const p = parkDef(def.park);
    return `<div class="row"><div class="min-w-0 flex items-center gap-2"><span class="dot" style="--pc:${p.color}"></span>
      <div class="min-w-0"><div class="font-semibold truncate">${esc(def.label)}</div><div class="text-xs opacity-70">${p.short}${ent?.single != null && ent.status === 'OPERATING' ? ` · single rider ${ent.single} min` : ''}</div></div></div>
      <div class="num">${boardNum(ent)}</div></div>`;
  }).join('');
  const loaded = Object.values(S.parks).some((p) => p.live?.length);
  return `
  <div class="flex flex-wrap gap-2 mb-3"><button class="btn btn-primary" data-act="map">📍 Park map &amp; directions</button><button class="btn" data-act="camera">📷 Take a photo</button></div>
  <section class="grid gap-4 md:grid-cols-5">
    <div class="md:col-span-3 board overflow-hidden">
      <div class="px-4 pt-4 pb-2 flex items-end justify-between gap-2">
        <div><div class="display text-2xl font-extrabold">Must-do board</div>
          <div class="text-xs opacity-70">${headline} · Westgate Lakes Resort & Spa · 2 adults</div></div>
        <div class="text-xs opacity-70 text-right">${S.lastRefresh ? 'Updated ' + fmtTime(S.lastRefresh) : 'Loading…'}</div>
      </div>
      ${loaded ? board : `<div class="p-4 space-y-2">${'<div class="skel h-12"></div>'.repeat(5)}</div>`}
    </div>
    <div class="md:col-span-2 space-y-4">
      <div class="card p-4">
        <div class="flex items-center justify-between gap-2 mb-2"><h2 class="display text-lg font-bold">Park hours</h2>${dateSelect()}</div>
        <div class="grid grid-cols-2 gap-2">${D.parks.map((p) => hoursCard(p, S.viewDate)).join('')}</div>
        <p class="text-xs muted mt-2">${esc(fmtDayLong(S.viewDate))}. Times shown in Orlando time.</p>
      </div>
      <div class="card p-4"><h2 class="display text-lg font-bold mb-1">Good to know</h2>
        <ul class="text-sm space-y-1.5 list-disc pl-5">${D.trip.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
    </div>
  </section>

  <section class="card p-4 mt-4">
    <h2 class="display text-lg font-bold mb-2">Search everything</h2>
    <label class="sr-only" for="gq">Search the full Walt Disney World directory</label>
    <input id="gq" class="input" type="search" placeholder="Search rides, restaurants, kiosks, shops, restrooms…" value="${esc(S.gq)}" autocomplete="off" />
    <div id="gchips" class="flex flex-wrap gap-1.5 mt-2" role="group" aria-label="Filter results">${globalChips()}</div>
    <div id="gstatus" class="text-xs muted mt-2" aria-live="polite">${globalStatus()}</div>
    <ul id="gres" class="mt-1">${globalResults()}</ul>
  </section>

  <section class="card p-4 mt-4">
    <h2 class="display text-lg font-bold">Day planner</h2>
    <p class="text-sm muted mb-3">Pick a park for each day. Saved on this device and included in your Travel Manager sync.</p>
    <div class="grid gap-2 sm:grid-cols-2">${days.map((d) => planRow(d)).join('')}</div>
  </section>`;
}
const GCATS = [['all', 'All'], ['ride', 'Rides & attractions'], ['show', 'Shows'], ['dining', 'Dining & snacks'], ['shop', 'Shops & kiosks'], ['restroom', 'Restrooms'], ['firstaid', 'First aid'], ['guest', 'Guest services'], ['baby', 'Baby care'], ['entrance', 'Entrances / exits'], ['skyliner', 'Skyliner'], ['bus', 'Bus stops'], ['parking', 'Parking']];
const LIVE_CAT = { ATTRACTION: 'ride', SHOW: 'show', RESTAURANT: 'dining' };
function globalChips() { return GCATS.map(([k, l]) => `<button class="chip" data-act="gcat" data-v="${k}" aria-pressed="${S.gcat === k}">${l}</button>`).join(''); }
function globalStatus() {
  if (MAP.loading) return 'Loading the full Walt Disney World directory (shops, kiosks, Disney Springs, resorts). The first load can take up to a minute…';
  if (!MAP.pois.length) return 'Start typing and the full directory will load.';
  return `${MAP.pois.length.toLocaleString()} places in the directory plus live rides, shows and restaurants. Shops, kiosks, Disney Springs and resort places come from OpenStreetMap and can be incomplete.${MAP.note ? ' ' + esc(MAP.note) : ''}`;
}
function globalResults() {
  const q = S.gq.trim().toLowerCase(); const cat = S.gcat || 'all';
  if (!q && cat === 'all') return '<li class="muted text-sm py-2">Search rides, shows, restaurants, snack kiosks, shops, restrooms, Disney Springs and resorts. Or pick a category above.</li>';
  const o = (typeof mapOrigin === 'function') ? mapOrigin() : null; const seen = new Set(); const rows = [];
  Object.values(S.index).forEach((e) => {
    const c = LIVE_CAT[e.type]; seen.add(e.id);
    if ((cat === 'all' || cat === c) && (!q || e.name.toLowerCase().includes(q))) rows.push({ live: e, name: e.name, d: o && S.parks[e.park] ? null : null });
  });
  MAP.pois.forEach((p) => {
    if (p.eid && seen.has(p.eid)) return;
    if ((cat === 'all' || cat === p.cat) && (!q || p.name.toLowerCase().includes(q) || catDef(p.cat).label.toLowerCase().includes(q) || areaName(p.park).toLowerCase().includes(q)))
      rows.push({ poi: p, name: p.name, d: o ? dist(o.lat, o.lon, p.lat, p.lon) : null });
  });
  if (!rows.length) return `<li class="muted text-sm py-2">${MAP.loading ? 'Still loading the directory…' : 'No matches. Try a shorter word or another category.'}</li>`;
  rows.sort((x, y) => (x.d != null && y.d != null ? x.d - y.d : 0) || x.name.localeCompare(y.name));
  const shown = rows.slice(0, 80);
  return shown.map((r) => {
    if (r.live) return entityRow(r.live, { showPark: true });
    const p = r.poi; const c = catDef(p.cat);
    return `<li class="flex items-center gap-2 py-2.5 border-t first:border-t-0" style="border-color:var(--line)"><span class="dot" style="--pc:${areaColor(p.park)}" aria-hidden="true"></span>
      <div class="min-w-0 flex-1"><div class="font-semibold leading-snug">${c.icon} ${esc(p.name)}</div><div class="text-xs muted">${esc(areaName(p.park))} · ${esc(c.label)}${r.d != null ? ` · ${fmtDist(r.d)}` : ''}</div></div>
      <button class="btn btn-sm" data-act="goto-poi" data-pid="${esc(p.id)}">Directions</button></li>`;
  }).join('') + (rows.length > shown.length ? `<li class="muted text-xs py-2">Showing the first ${shown.length} of ${rows.length}. Type more letters to narrow it down.</li>` : '');
}
function refreshGlobal() {
  const r = $('#gres'); if (!r) return;
  const c = $('#gchips'); if (c) c.innerHTML = globalChips();
  const s = $('#gstatus'); if (s) s.innerHTML = globalStatus();
  r.innerHTML = globalResults();
}
const PLAN_OPTS = [['', 'Not set'], ['mk', 'Magic Kingdom'], ['epcot', 'EPCOT'], ['hs', 'Hollywood Studios'], ['ak', 'Animal Kingdom'], ['springs', 'Disney Springs'], ['rest', 'Rest / pool day']];
function planRow(d) {
  const plan = LS.get(KEY.plan, {}); const v = plan[d] || '';
  return `<div class="card-flat p-2 flex items-center gap-2"><div class="w-24 shrink-0 text-sm font-semibold">${fmtDay(d)}</div>
    <select class="input" data-act="plan" data-day="${d}" aria-label="Plan for ${fmtDay(d)}">${PLAN_OPTS.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
}

/* ---------- PARK VIEW ---------- */
function viewPark(key) {
  const p = parkDef(key); const st = S.parks[key];
  const err = st?.error ? `<div class="card-flat p-3 text-sm mb-3" role="alert">Live data for this park failed to load: ${esc(st.error)}. ${st.live?.length ? 'Showing the last saved numbers.' : ''}</div>` : '';
  const f = S.filters;
  const festival = key === 'epcot' ? festivalCard() : '';
  const tips = (D.parkTips[key] || []).map((t) => `<li>${esc(t)}</li>`).join('');
  const prio = resolvePriority().filter((x) => x.def.park === key);
  const mini = prio.length ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">${prio.map(({ def, ent }) => `<div class="card-flat p-2 flex items-center gap-2"><div class="min-w-0 flex-1 text-sm font-semibold leading-tight">${esc(def.label)}</div>${pill(ent)}</div>`).join('')}</div>` : '';
  return `
  <section class="card park-bar p-4" style="--pc:${p.color}">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="display text-2xl font-extrabold">${p.name}</h2>${dateSelect()}</div>
    <div class="grid gap-2 mt-2 sm:grid-cols-2">${hoursCard(p, S.viewDate)}
      <div class="card-flat p-3 text-sm"><div class="font-semibold mb-1">Tips</div><ul class="list-disc pl-5 space-y-1">${tips}</ul></div></div>
    <div class="text-xs muted mt-2">${st?.updated ? 'Data updated ' + ago(st.updated) : 'Waiting for data…'}</div>
    ${mini ? `<div class="mt-2 font-semibold text-sm">Your must-dos here</div>${mini}` : ''}
  </section>
  ${festival}
  <section class="card p-4 mt-4">
    ${err}
    <div class="flex flex-wrap gap-2 mb-2" role="group" aria-label="Type">
      ${[['ATTRACTION', 'Rides'], ['SHOW', 'Shows & parades'], ['RESTAURANT', 'Dining']].map(([k, l]) => `<button class="chip" data-act="kind" data-v="${k}" aria-pressed="${f.kind === k}">${l}</button>`).join('')}
    </div>
    <div class="grid gap-2 sm:grid-cols-3">
      <div class="sm:col-span-1"><label class="sr-only" for="pq">Search this park</label><input id="pq" class="input" type="search" placeholder="Search this park…" value="${esc(f.q)}" autocomplete="off" /></div>
      <div><label class="sr-only" for="pstatus">Status</label><select id="pstatus" class="input" data-act="status">
        ${[['all', 'All statuses'], ['open', 'Operating'], ['down', 'Down'], ['closed', 'Closed / refurbishment']].map(([k, l]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div><label class="sr-only" for="psort">Sort</label><select id="psort" class="input" data-act="sort">
        ${[['short', 'Shortest wait first'], ['long', 'Longest wait first'], ['name', 'A to Z']].map(([k, l]) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    </div>
    <div class="mt-2"><button class="chip" data-act="favonly" aria-pressed="${f.fav}">★ Favorites only</button></div>
    <ul id="plist" class="mt-2" data-park="${key}">${parkList(key)}</ul>
  </section>`;
}
function parkList(key) {
  const f = S.filters; const list = S.parks[key]?.live || [];
  if (!list.length) return `<li class="py-3">${S.loading ? '<div class="skel h-14 mb-2"></div>'.repeat(4) : '<span class="muted text-sm">No live data yet. Pull to refresh or tap Refresh.</span>'}</li>`;
  const q = f.q.trim().toLowerCase();
  let out = list.filter((e) => e.type === f.kind);
  if (q) out = out.filter((e) => e.name.toLowerCase().includes(q));
  if (f.fav) out = out.filter((e) => isFav(e.id));
  if (f.status !== 'all') out = out.filter((e) => (f.status === 'open' ? e.status === 'OPERATING' : f.status === 'down' ? e.status === 'DOWN' : ['CLOSED', 'REFURBISHMENT'].includes(e.status)));
  const rank = (e) => (e.status === 'OPERATING' && e.wait != null ? 0 : e.status === 'OPERATING' ? 1 : e.status === 'DOWN' ? 2 : 3);
  out.sort((a, b) => {
    if (f.sort === 'name') return a.name.localeCompare(b.name);
    if (f.kind === 'SHOW') { const na = nextShows(a, 1)[0], nb = nextShows(b, 1)[0]; return (na ? new Date(na.s) : 9e15) - (nb ? new Date(nb.s) : 9e15) || a.name.localeCompare(b.name); }
    const d = rank(a) - rank(b); if (d) return d;
    const w = (a.wait ?? 0) - (b.wait ?? 0); return (f.sort === 'long' ? -w : w) || a.name.localeCompare(b.name);
  });
  if (f.kind === 'SHOW') {
    const isHl = (e) => /parade|fireworks|cavalcade|nighttime|luminous|fantasmic|happily ever after|spectacular/i.test(e.name);
    const hl = out.filter(isHl); const rest = out.filter((e) => !isHl(e));
    if (!out.length) return '<li class="muted text-sm py-3">Nothing matches these filters.</li>';
    return (hl.length ? `<li class="font-semibold text-sm pt-1">Parades & fireworks</li>${hl.map((e) => entityRow(e)).join('')}` : '')
      + (rest.length ? `${hl.length ? '<li class="font-semibold text-sm pt-3">Other shows</li>' : ''}${rest.map((e) => entityRow(e)).join('')}` : '');
  }
  return out.length ? out.map((e) => entityRow(e)).join('') : '<li class="muted text-sm py-3">Nothing matches these filters.</li>';
}
function festivalCard() {
  const F = D.festival;
  const booths = (S.parks.epcot?.live || []).filter((e) => F.re.test(e.name) && e.type !== 'ATTRACTION').slice(0, 12);
  return `<section class="card p-4 mt-4 park-bar" style="--pc:#d97706">
    <h2 class="display text-xl font-bold">${F.heading}</h2>
    <p class="text-sm muted mt-1">${esc(F.caution)}</p>
    <div class="grid gap-3 mt-3 md:grid-cols-2">
      <div><div class="font-semibold mb-1">Practical tips</div><ul class="list-disc pl-5 text-sm space-y-1.5">${F.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><div class="font-semibold mb-1">Ideas from past years</div><ul class="list-disc pl-5 text-sm space-y-1.5">${F.ideas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="font-semibold mt-3 mb-1">Learn more</div><div class="flex flex-wrap gap-2">${F.links.map((l) => `<a class="btn btn-sm" target="_blank" rel="noopener" href="${l.url}">${esc(l.label)}</a>`).join('')}</div></div></div>
    ${booths.length ? `<details class="mt-3"><summary>Festival-related listings in live data (${booths.length})</summary><ul class="mt-1">${booths.map((e) => entityRow(e, { star: false })).join('')}</ul></details>` : ''}
  </section>`;
}

/* ---------- DISNEY SPRINGS ---------- */
function viewSprings() {
  const X = D.springs;
  return `<section class="card park-bar p-4" style="--pc:#d97706">
    <h2 class="display text-2xl font-extrabold">Disney Springs</h2>
    <p class="text-sm muted mt-1">${esc(X.blurb)}</p>
    <ul class="list-disc pl-5 text-sm space-y-1.5 mt-3">${X.facts.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="flex flex-wrap gap-2 mt-3">${X.links.map((l) => `<a class="btn btn-primary" target="_blank" rel="noopener" href="${l.url}">${esc(l.label)}</a>`).join('')}</div>
  </section>
  <section class="grid gap-4 md:grid-cols-2 mt-4">
    <div class="card p-4"><h3 class="display font-bold text-lg mb-2">Dining ideas</h3><ul class="space-y-2">${X.dining.map((r) => `<li><div class="font-semibold">${esc(r.name)}</div><div class="text-sm muted">${esc(r.note)} <a class="link" target="_blank" rel="noopener" href="${menuLink(r.name + ' Disney Springs')}">Menu</a></div></li>`).join('')}</ul></div>
    <div class="card p-4"><h3 class="display font-bold text-lg mb-2">Shopping</h3><ul class="list-disc pl-5 space-y-1 text-sm">${X.shopping.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
  </section>`;
}

/* ---------- FAVORITES / MUST-RIDES ---------- */
function alertControls(ent) {
  if (!ent) return '';
  const r = S.prefs.rides[ent.id]; const on = !!r?.on;
  if (ent.type === 'RESTAURANT') return `<div class="text-xs mt-1 flex items-center gap-2"><label class="flex items-center gap-1.5"><input type="checkbox" data-act="bell" data-id="${ent.id}" ${S.prefs.restaurants[ent.id]?.on ? 'checked' : ''}/> Alert me when a table opens</label></div>`;
  return `<div class="text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"><label class="flex items-center gap-1.5"><input type="checkbox" data-act="bell" data-id="${ent.id}" ${on ? 'checked' : ''}/> Alert at or under</label>
    <input class="input" style="width:4.5rem;min-height:30px;padding:.15rem .4rem" type="number" min="0" max="240" step="5" inputmode="numeric" data-act="max" data-id="${ent.id}" value="${r?.max ?? S.prefs.defaultMax}" aria-label="Wait limit in minutes for ${esc(ent.name)}"/><span>min, or on reopen</span></div>`;
}
function viewFavs() {
  const prio = resolvePriority(); const groups = D.parks.map((p) => [p, prio.filter((x) => x.def.park === p.key)]);
  const col = LS.get(KEY.collect, {});
  const shownIds = new Set(prio.map((x) => x.ent?.id));
  const hl = D.headliners.map((h) => ({ h, ent: (S.parks[h.park]?.live || []).find((e) => e.type === 'ATTRACTION' && h.re.test(e.name)) })).filter((x) => x.ent && !shownIds.has(x.ent.id));
  const stars = S.prefs.favorites.map((id) => S.index[id]).filter(Boolean).filter((e) => !shownIds.has(e.id));
  return `<section class="space-y-4">
    <div class="card p-4"><div class="flex flex-wrap items-center justify-between gap-2"><h2 class="display text-2xl font-extrabold">Must-rides</h2>
      <label class="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" data-pref="priorityAlerts" ${S.prefs.priorityAlerts ? 'checked' : ''}/> Alert me for the whole list (limit: ${S.prefs.defaultMax} min)</label></div>
      <p class="text-sm muted">Live waits for your priority list. Use the checkboxes to set a custom limit per ride. Alert delivery options are in Deals & Alerts.</p></div>
    ${groups.map(([p, items]) => `<div class="card park-bar p-4" style="--pc:${p.color}"><h3 class="display font-bold text-lg mb-1">${p.name}</h3>
      ${items.map(({ def, ent }) => `<div class="py-2.5 border-t first:border-t-0" style="border-color:var(--line)"><div class="flex items-center gap-2"><div class="min-w-0 flex-1"><div class="font-semibold">${esc(def.label)}</div>
        <div class="text-xs muted">${esc(def.tip)}${ent?.single != null && ent.status === 'OPERATING' ? ` Single rider: ${ent.single} min.` : ''}</div></div>${pill(ent)}${ent ? btnStar(ent) : ''}</div>
        ${ent ? alertControls(ent) : '<div class="text-xs muted mt-1">Not in the live feed right now.</div>'}
        ${def.type === 'RESTAURANT' && ent ? `<div class="text-xs mt-1"><a class="link" target="_blank" rel="noopener" href="${menuLink(def.label)}">Menu</a> · <a class="link" target="_blank" rel="noopener" href="https://disneyworld.disney.go.com/dining/">Check tables</a></div>` : ''}</div>`).join('')}</div>`).join('')}
    <div class="card p-4"><h3 class="display font-bold text-lg mb-1">Popcorn holders</h3>
      <ul>${D.collectibles.map((c) => `<li class="py-2 border-t first:border-t-0" style="border-color:var(--line)"><label class="flex items-start gap-2"><input type="checkbox" class="mt-1.5" data-act="collect" data-id="${c.id}" ${col[c.id] ? 'checked' : ''}/><span><span class="font-semibold">${esc(c.label)}</span><br/><span class="text-sm muted">${esc(c.note)}</span></span></label></li>`).join('')}</ul></div>
    <div class="card p-4"><h3 class="display font-bold text-lg mb-1">More headliners</h3><ul>${hl.length ? hl.map(({ ent }) => entityRow(ent, { showPark: true })).join('') : '<li class="muted text-sm py-2">Waiting for live data.</li>'}</ul></div>
    <div class="card p-4"><h3 class="display font-bold text-lg mb-1">Your starred</h3><ul>${stars.length ? stars.map((e) => entityRow(e, { showPark: true })).join('') : '<li class="muted text-sm py-2">Tap ☆ on anything to pin it here.</li>'}</ul></div>
  </section>`;
}

/* ---------- SKYLINER ---------- */
function skylinerSvg() {
  const K = D.skyliner; const st = Object.fromEntries(K.stations.map((s) => [s.id, s]));
  const line = (a, b, c) => `<line x1="${st[a].x}" y1="${st[a].y}" x2="${st[b].x}" y2="${st[b].y}" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="${st[a].x}" y1="${st[a].y}" x2="${st[b].x}" y2="${st[b].y}" stroke="var(--surface)" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  const mid = (a, b, t) => `<text x="${(st[a].x + st[b].x) / 2}" y="${(st[a].y + st[b].y) / 2 - 12}" text-anchor="middle" font-size="13" font-weight="700">${t}</text>`;
  const node = (s) => {
    const color = s.id === 'hs' ? '#dc2626' : s.id === 'epcot' ? '#7c3aed' : s.kind === 'hub' ? '#0891b2' : '#64748b';
    const r = s.kind === 'hub' ? 17 : 12;
    return `<circle cx="${s.x}" cy="${s.y}" r="${r}" fill="var(--surface)" stroke="${color}" stroke-width="5"/>${s.kind === 'hub' ? `<circle cx="${s.x}" cy="${s.y}" r="5" fill="${color}"/>` : ''}`;
  };
  const lab = (id, dx, dy, anchor, t1, t2) => `<text x="${st[id].x + dx}" y="${st[id].y + dy}" text-anchor="${anchor}" font-size="15" font-weight="700">${t1}</text>${t2 ? `<text x="${st[id].x + dx}" y="${st[id].y + dy + 17}" text-anchor="${anchor}" font-size="12" opacity=".75">${t2}</text>` : ''}`;
  return `<svg class="svgmap" viewBox="0 0 780 420" role="img" aria-label="Skyliner map: Hollywood Studios and Pop Century / Art of Animation connect to the Caribbean Beach hub; Caribbean Beach connects through Riviera to EPCOT International Gateway" style="width:100%;height:auto">
    ${line('hs', 'cb', '#dc2626')}${line('pop', 'cb', '#d97706')}${line('cb', 'riv', '#2563eb')}${line('riv', 'epcot', '#2563eb')}
    ${mid('hs', 'cb', '~6–8 min')}${mid('pop', 'cb', '~6–8 min')}${mid('cb', 'riv', '~5–7 min')}${mid('riv', 'epcot', '~6–8 min')}
    ${K.stations.map(node).join('')}
    ${lab('hs', 0, -26, 'middle', 'Hollywood Studios', 'Park station')}
    ${lab('cb', -26, -22, 'end', 'Caribbean Beach', 'Transfer hub')}
    ${lab('pop', 26, 5, 'start', 'Pop Century /', 'Art of Animation')}
    ${lab('riv', 0, 38, 'middle', 'Riviera Resort', '')}
    ${lab('epcot', 0, -26, 'middle', 'EPCOT International Gateway', 'Park station')}
    <g font-size="12"><rect x="20" y="360" width="14" height="6" rx="3" fill="#dc2626"/><text x="40" y="367">HS line</text>
      <rect x="110" y="360" width="14" height="6" rx="3" fill="#d97706"/><text x="130" y="367">Pop / AoA line</text>
      <rect x="240" y="360" width="14" height="6" rx="3" fill="#2563eb"/><text x="260" y="367">EPCOT line</text></g>
  </svg>`;
}
function viewSkyliner() {
  const K = D.skyliner;
  const live = Object.values(S.index).filter((e) => /skyliner/i.test(e.name));
  return `<section class="card park-bar p-4" style="--pc:#0891b2"><h2 class="display text-2xl font-extrabold">Disney Skyliner</h2>
    <p class="text-sm muted mb-2">Gondola network linking Hollywood Studios, EPCOT, and three resort areas, with one transfer hub at Caribbean Beach.</p>
    ${skylinerSvg()}
    ${live.length ? `<ul class="mt-2">${live.map((e) => entityRow(e, { showPark: true, star: false })).join('')}</ul>` : ''}
  </section>
  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-2">Station to station</h3>
    <div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left muted"><th class="py-1 pr-3">From</th><th class="py-1 pr-3">To</th><th class="py-1 pr-3">Approx. ride</th></tr></thead><tbody>
    ${K.legs.map((l) => { const s = Object.fromEntries(K.stations.map((x) => [x.id, x.name])); return `<tr class="border-t" style="border-color:var(--line)"><td class="py-1.5 pr-3">${esc(s[l.from])}</td><td class="py-1.5 pr-3">${esc(s[l.to])}</td><td class="py-1.5 pr-3">${l.mins} min</td></tr>`; }).join('')}</tbody></table></div></section>
  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-2">How to get there</h3>
    <ul class="space-y-3">${K.routes.map((r) => `<li><div class="font-semibold">${esc(r.name)}</div><div class="text-sm">${esc(r.steps)}</div><div class="text-xs muted">${esc(r.time)}</div></li>`).join('')}</ul></section>
  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-2">Practical tips</h3><ul class="list-disc pl-5 space-y-1.5 text-sm">${K.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div class="mt-3">${K.links.map((l) => `<a class="btn btn-sm" target="_blank" rel="noopener" href="${l.url}">${esc(l.label)}</a>`).join('')}</div></section>`;
}

/* ---------- TRAVEL SYNC ---------- */
const LOGI_FIELDS = [
  ['hotel', 'Hotel: Westgate Lakes confirmation, check-in/out, notes'], ['flights', 'Flights (airline, numbers, times)'], ['car', 'Car rental (company, pickup, return)'],
  ['shuttle', 'Shuttles / rideshare plans'], ['reservations', 'Dining & park reservations'], ['notes', 'Other notes for the bots']
];
function viewSync() {
  const L = LS.get(KEY.logi, {}); const d = S.draft;
  const srv = S.server.email;
  const srvLine = srv == null ? 'Checking server…' : srv.configured ? `Email sending is ready (${esc(srv.provider)}). Messages go to ${esc(srv.defaultTo)}.` : 'Email credentials are not set on the server yet. You can still copy the draft or open it in Gmail. See Help for setup.';
  return `<section class="card p-4"><h2 class="display text-2xl font-extrabold">Travel Sync</h2>
    <p class="text-sm muted">Send your Grok bots a structured update, or ask them a question. They watch <strong>${esc(S.prefs.email.to)}</strong>.</p>
    <p class="text-xs mt-1" id="srv-line">${srvLine}</p></section>
  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-2">Your logistics</h3>
    <p class="text-sm muted mb-2">Stored only on this device. Included in drafts so the bots have what they need.</p>
    <div class="grid gap-3 md:grid-cols-2">${LOGI_FIELDS.map(([k, l]) => `<div><label class="lbl" for="lg-${k}">${l}</label><textarea id="lg-${k}" class="input" rows="2" data-logi="${k}">${esc(L[k] || '')}</textarea></div>`).join('')}</div></section>
  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-2">Compose</h3>
    <div class="grid gap-3 md:grid-cols-2">
      <div><label class="lbl" for="sy-topic">Topic</label><select id="sy-topic" class="input">${D.topics.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('')}</select></div>
      <div><label class="lbl" for="sy-bot">Which bot</label><input id="sy-bot" class="input" value="${esc(LS.get('wdw.bot', 'Travel Manager'))}" placeholder="Travel Manager, or All bots" /></div></div>
    <label class="lbl mt-3" for="sy-q">Question or request (optional for a plain sync)</label>
    <textarea id="sy-q" class="input" rows="3" placeholder="e.g. Can you confirm the shuttle pickup times for Nov 1?"></textarea>
    <div class="flex flex-wrap gap-2 mt-2">${D.quickAsks.map((q, i) => `<button class="chip" data-act="quick" data-i="${i}">${esc(q)}</button>`).join('')}</div>
    <div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="draft" data-kind="sync">Sync with Travel Manager</button><button class="btn" data-act="draft" data-kind="ask">Ask Grok Bots</button></div></section>
  ${d ? `<section class="card p-4 mt-4" id="draft-card"><h3 class="display font-bold text-lg mb-2">Draft</h3>
    <div class="grid gap-3 md:grid-cols-2"><div><label class="lbl" for="dr-to">To</label><input id="dr-to" class="input" value="${esc(d.to)}"/></div>
      <div><label class="lbl" for="dr-sub">Subject</label><input id="dr-sub" class="input" value="${esc(d.subject)}"/></div></div>
    <label class="lbl mt-3" for="dr-body">Body</label><textarea id="dr-body" class="input" rows="16">${esc(d.text)}</textarea>
    <div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="send-draft">Send now</button><button class="btn" data-act="copy-draft">Copy to clipboard</button>
      <button class="btn" data-act="gmail-draft">Open in Gmail</button><a class="btn" id="mailto-link" href="#" data-act="mailto-draft">Default mail app</a></div>
    <p id="draft-msg" class="text-sm mt-2" role="status">${esc(d.msg || '')}</p></section>` : ''}`;
}

/* ---------- DEALS & ALERTS ---------- */
function toggle(path, label, checked, hint) {
  return `<label class="flex items-start gap-2 py-1"><input type="checkbox" class="mt-1" data-pref="${path}" ${checked ? 'checked' : ''}/><span><span class="font-semibold text-sm">${label}</span>${hint ? `<br/><span class="text-xs muted">${hint}</span>` : ''}</span></label>`;
}
function viewDeals() {
  const p = S.prefs; const log = LS.get(KEY.log, []);
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const wl = watchList(); const wr = watchRestaurants();
  const dl = S.deals;
  return `<section class="card p-4"><div class="flex items-center justify-between gap-2"><h2 class="display text-2xl font-extrabold">Short-notice deals</h2><button class="btn btn-sm" data-act="reload-deals">${dl.loading ? 'Loading…' : '↻ Check now'}</button></div>
    <p class="text-sm muted">Headlines from public Disney blogs that look like discounts or offers. Always verify details on the source site.</p>
    <ul class="mt-2">${dl.items.length ? dl.items.slice(0, 12).map((x) => `<li class="py-2 border-t first:border-t-0" style="border-color:var(--line)"><a class="link" target="_blank" rel="noopener" href="${esc(x.link)}">${esc(x.title)}</a><div class="text-xs muted">${esc(x.source)}${x.date ? ' · ' + esc(new Date(x.date).toLocaleDateString()) : ''}</div></li>`).join('') : `<li class="text-sm muted py-2">${dl.error ? esc(dl.error) : dl.loading ? 'Loading…' : 'No deal headlines right now.'}</li>`}</ul>
    <div class="flex flex-wrap gap-2 mt-3">${D.dealLinks.map((l) => `<a class="btn btn-sm" target="_blank" rel="noopener" href="${l.url}">${esc(l.label)}</a>`).join('')}</div></section>

  <section class="card p-4 mt-4"><h2 class="display text-xl font-bold mb-2">Alert settings</h2>
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-1">
        ${toggle('inApp.enabled', 'In-app and browser alerts', p.inApp.enabled, 'Banner in the app plus a system notification while it is open or installed.')}
        <div class="flex flex-wrap items-center gap-2 my-1"><button class="btn btn-sm" data-act="perm">Allow browser notifications</button><span class="text-xs muted">Permission: ${perm}</span></div>
        <div class="grid grid-cols-2 gap-2 mt-2"><div><label class="lbl" for="pf-max">Default wait limit (min)</label><input id="pf-max" class="input" type="number" min="0" max="240" step="5" data-pref="defaultMax" data-num="1" value="${p.defaultMax}"/></div>
          <div><label class="lbl" for="pf-phone">Phone for SMS</label><input id="pf-phone" class="input" type="tel" inputmode="tel" placeholder="+14075550123" data-pref="phone" value="${esc(p.phone)}"/></div></div>
        ${toggle('sms.enabled', 'Send SMS alerts (Twilio)', p.sms.enabled, 'Use full number with country code.')}
        ${toggle('priorityAlerts', 'Watch every Must-ride', p.priorityAlerts, 'Uses the default limit for the whole priority list.')}
      </div>
      <div class="space-y-1"><div class="font-semibold text-sm">What to alert on</div>
        ${toggle('rules.waitDrop', 'Wait drops to my limit', p.rules.waitDrop)}${toggle('rules.reopen', 'Ride reopens after being down', p.rules.reopen)}
        ${toggle('rules.restaurant', 'Walk-up table opens (when published)', p.rules.restaurant)}${toggle('rules.hours', 'Park hours change', p.rules.hours)}${toggle('rules.deal', 'New deal headline', p.rules.deal)}</div></div>
    <hr class="my-3" style="border-color:var(--line)"/>
    <div class="grid gap-4 md:grid-cols-2">
      <div><h3 class="font-semibold">Alerts when the app is closed</h3>
        ${toggle('cloud.enabled', 'Cloud alerts (checks every 5 min)', p.cloud.enabled, 'A scheduled Netlify function sends SMS / email for you. In-app alerts keep working too.')}
        <label class="lbl mt-2" for="pf-pass">App passcode (only if you set APP_PASSCODE)</label><input id="pf-pass" class="input" type="password" autocomplete="off" data-pref="cloud.passcode" value="${esc(p.cloud.passcode)}"/>
        <div class="flex items-center gap-2 mt-2"><button class="btn btn-sm" data-act="sync-cloud">Save to cloud now</button><span id="cloud-msg" class="text-xs muted">${esc(S.cloudMsg)}</span></div></div>
      <div><h3 class="font-semibold">Grok bot emails</h3>
        ${toggle('email.enabled', 'Auto-email important events', p.email.enabled, 'Sent as “[WDW Dashboard] Travel Update – …” with a JSON block.')}
        <div class="grid grid-cols-2 gap-2"><div><label class="lbl" for="pf-to">To</label><input id="pf-to" class="input" type="email" data-pref="email.to" value="${esc(p.email.to)}"/></div>
          <div><label class="lbl" for="pf-from">From / reply-to</label><input id="pf-from" class="input" type="email" placeholder="you@example.com" data-pref="email.from" value="${esc(p.email.from)}"/></div></div>
        <label class="lbl mt-2" for="pf-gap">At most one auto-email every (min)</label><input id="pf-gap" class="input" type="number" min="5" max="720" step="5" data-pref="email.minMinutes" data-num="1" value="${p.email.minMinutes}"/></div></div>
    <div class="flex flex-wrap gap-2 mt-4"><button class="btn" data-act="test-browser">Test browser alert</button><button class="btn" data-act="test-sms">Send test SMS</button><button class="btn" data-act="test-email">Send test email</button></div>
    <p id="test-msg" class="text-sm mt-2" role="status"></p></section>

  <section class="card p-4 mt-4"><h3 class="display font-bold text-lg mb-1">Watching now</h3>
    <ul>${wl.concat(wr.map((r) => ({ ...r, table: true }))).map((w) => `<li class="flex items-center gap-2 py-1.5 border-t first:border-t-0" style="border-color:var(--line)"><span class="flex-1 text-sm"><strong>${esc(w.name)}</strong> <span class="muted">${w.table ? 'table opens' : `≤ ${w.max} min or reopen`}</span></span><button class="btn btn-sm" data-act="unwatch" data-id="${w.id}">Remove</button></li>`).join('') || '<li class="text-sm muted py-2">Nothing yet. Tap 🔕 on any ride, or use the Must-rides tab.</li>'}</ul></section>

  <section class="card p-4 mt-4"><div class="flex items-center justify-between"><h3 class="display font-bold text-lg">Recent alerts</h3><button class="btn btn-sm" data-act="clear-log">Clear</button></div>
    <ul>${log.length ? log.slice(0, 15).map((l) => `<li class="py-1.5 border-t first:border-t-0 text-sm" style="border-color:var(--line)"><strong>${esc(l.title)}</strong><div class="text-xs muted">${esc(l.detail)} · ${ago(l.t)}</div></li>`).join('') : '<li class="text-sm muted py-2">No alerts yet.</li>'}</ul></section>`;
}

/* ---------- HELP ---------- */
function viewHelp() {
  const se = S.server.email, ss = S.server.sms;
  const ok = (v) => (v == null ? '…' : v ? '✅ ready' : '⚠️ not set up');
  return `<section class="card p-4"><h2 class="display text-2xl font-extrabold">Help</h2>
    <div class="grid gap-2 sm:grid-cols-3 mt-2 text-sm"><div class="card-flat p-3"><div class="font-semibold">Live data</div>${S.lastRefresh ? 'Updated ' + ago(S.lastRefresh) : 'Not loaded yet'}</div>
      <div class="card-flat p-3"><div class="font-semibold">Email to bots</div>${ok(se?.configured)}</div><div class="card-flat p-3"><div class="font-semibold">SMS (Twilio)</div>${ok(ss?.configured)}</div></div></section>
  <section class="card p-4 mt-4 text-sm space-y-3"><h3 class="display font-bold text-lg">Install on your phone</h3>
    <p><strong>iPhone:</strong> open in Safari, tap Share, then Add to Home Screen. <strong>Android:</strong> open in Chrome, tap the menu, then Install app. Installed apps keep the last known data when offline.</p></section>
  <section class="card p-4 mt-4 text-sm space-y-2"><h3 class="display font-bold text-lg">Turn on one-click email to your Grok bots</h3>
    <ol class="list-decimal pl-5 space-y-1.5"><li>Sign in to the Gmail account that will send the messages (it can be grokbotaccess@gmail.com itself).</li>
      <li>Turn on 2-Step Verification: Google Account, Security.</li><li>Open <a class="link" target="_blank" rel="noopener" href="https://myaccount.google.com/apppasswords">myaccount.google.com/apppasswords</a>, create an app password named “WDW Dashboard”, and copy the 16 characters.</li>
      <li>In Netlify: Site configuration, Environment variables. Add <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code>.</li><li>Trigger a new deploy, then use “Send test email” in Deals & Alerts.</li></ol>
    <p class="muted">Prefer Resend? Set <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> instead. The README covers both.</p></section>
  <section class="card p-4 mt-4 text-sm space-y-2"><h3 class="display font-bold text-lg">Turn on SMS</h3>
    <ol class="list-decimal pl-5 space-y-1.5"><li>Create a Twilio account and buy or verify a sending number.</li><li>Copy your Account SID and Auth Token from the Twilio Console.</li>
      <li>In Netlify add <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, <code>TWILIO_FROM</code>, and <code>ALLOWED_SMS_NUMBERS</code> (your number, like +14075550123).</li><li>Redeploy and use “Send test SMS”.</li></ol></section>
  <section class="card p-4 mt-4 text-sm space-y-2"><h3 class="display font-bold text-lg">How the bots get your updates</h3>
    <p>Each message has a clear subject like <em>[WDW Dashboard] Travel Update – Sync Request</em>, a plain-text summary, and a JSON block for easy parsing. Replies come back to the address you put in “From / reply-to”.</p></section>
  <section class="card p-4 mt-4 text-sm space-y-2"><h3 class="display font-bold text-lg">Good to know</h3><ul class="list-disc pl-5 space-y-1.5">
    <li>The bottom banner keeps scrolling even if your phone's Reduce Motion setting is on. Tap ⏸ to pause it; your choice is remembered.</li>
    <li>Waits are standby estimates from ThemeParks.wiki and can lag a few minutes. Confirm in the official Disney app.</li>
    <li>Restaurant walk-up data and menus are only shown when published. Menu links open a web search.</li>
    <li>Cloud alerts watch the same rides you set here. Open Deals & Alerts, flip Cloud alerts on, and tap Save to cloud now.</li>
    <li>Nothing leaves your device except what you send: alerts, drafts, and your alert settings if you enable cloud alerts.</li></ul>
    <p class="mt-2">Data: <a class="link" href="https://themeparks.wiki" target="_blank" rel="noopener">ThemeParks.wiki</a>. Deals: public blog feeds.</p></section>`;
}

/* ---------- Floating buttons + Must-Ride Now panel ---------- */
function renderFab() {
  const root = $('#fab-root'); if (!root) return;
  const open = LS.get(KEY.fab, false);
  const items = resolvePriority().filter((x) => x.def.type === 'ATTRACTION')
    .sort((a, b) => ((a.ent?.status === 'OPERATING' && a.ent.wait != null) ? a.ent.wait : 999) - ((b.ent?.status === 'OPERATING' && b.ent.wait != null) ? b.ent.wait : 999));
  const sheet = open ? `<div class="fab-sheet card" role="dialog" aria-label="Must-ride waits now"><div class="flex items-center justify-between px-3 pt-3"><div class="display font-bold">Must-ride now</div><button class="btn btn-sm" data-act="fab" aria-label="Close panel">✕</button></div>
      <ul class="px-3 pb-2">${items.map(({ def, ent }) => `<li class="flex items-center gap-2 py-1.5 border-t first:border-t-0" style="border-color:var(--line)"><span class="dot" style="--pc:${parkDef(def.park).color}"></span><span class="flex-1 text-sm font-semibold leading-tight">${esc(def.label)}</span>${pill(ent)}</li>`).join('')}</ul>
      <div class="px-3 pb-3 text-xs muted">${S.lastRefresh ? 'Updated ' + fmtTime(S.lastRefresh) : 'Loading…'}</div></div>` : '';
  root.innerHTML = `<div class="fab-col">${sheet}
    <button class="fab-round" data-act="camera" aria-label="Take a photo" title="Take a photo">📷</button>
    <button class="fab-round" data-act="map" aria-label="Park map and directions" title="Park map and directions">📍</button>
    <button class="btn btn-primary" data-act="fab" aria-expanded="${open}" style="border-radius:999px;padding:.7rem 1.1rem;box-shadow:var(--shadow)">🎢 Must-ride now</button></div>`;
}

/* ---------- Grok-bot drafts ---------- */
function buildDraft(kind) {
  const topic = D.topics.find((t) => t.id === ($('#sy-topic')?.value || 'general'))?.label || 'General trip sync';
  const bot = ($('#sy-bot')?.value || 'Travel Manager').trim() || 'Travel Manager';
  const q = ($('#sy-q')?.value || '').trim();
  LS.set('wdw.bot', bot);
  const L = LS.get(KEY.logi, {}); const plan = LS.get(KEY.plan, {});
  const planName = Object.fromEntries(PLAN_OPTS);
  const must = resolvePriority().map(({ def, ent }) => ({ name: def.label, park: parkDef(def.park).name, status: ent?.status || 'UNKNOWN', waitMinutes: ent?.wait ?? null }));
  const hours = D.parks.map((p) => { const h = hoursFor(p.key, S.viewDate); return { park: p.name, date: S.viewDate, open: h.open ? fmtTime(h.open) : null, close: h.close ? fmtTime(h.close) : null, events: h.events.map((x) => x.description || 'Special event'), extraHours: h.extra.map((x) => x.description || 'Extra hours') }; });
  const subject = kind === 'sync' ? `[WDW Dashboard] Travel Update – Sync Request: ${topic}` : `[WDW Dashboard] Travel Update – Question for ${bot}: ${topic}`;
  const et = new Date().toLocaleString('en-US', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' });
  const recent = LS.get(KEY.log, []).slice(0, 5);
  const logistics = Object.fromEntries(LOGI_FIELDS.map(([k]) => [k, (L[k] || '').trim()]).filter(([, v]) => v));
  const lines = [
    `TO: ${bot}`, `FROM: WDW Trip Dashboard`, `Generated: ${et} ET`,
    `Type: ${kind === 'sync' ? 'Sync request' : 'Question'} | Topic: ${topic}`, '',
    'TRIP', `- Dates: ${D.trip.start} to ${D.trip.end}`, `- Travelers: ${D.trip.adults} adults`, `- Hotel: ${D.trip.hotel}`, `- Scope: Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom, Disney Springs`, '',
    q ? 'QUESTION / REQUEST' : 'REQUEST', q || 'Please review the details below and reply with anything missing, conflicting, or worth changing.', '',
    'DAY PLAN', ...days.map((d) => `- ${fmtDay(d)}: ${planName[plan[d] || ''] || 'Not set'}`), '',
    `PARK HOURS (${fmtDay(S.viewDate)})`, ...hours.map((h) => `- ${h.park}: ${h.open ? `${h.open} – ${h.close}` : 'not published'}${h.events.length ? ' | ' + h.events.join('; ') : ''}`), '',
    'MUST-DO WAITS (live)', ...must.map((m) => `- ${m.name} (${m.park}): ${m.status === 'OPERATING' ? (m.waitMinutes != null ? m.waitMinutes + ' min' : 'open') : m.status.toLowerCase()}`), '',
    'LOGISTICS ON FILE', ...(Object.keys(logistics).length ? LOGI_FIELDS.filter(([k]) => logistics[k]).map(([k, l]) => `- ${l.split(':')[0].split(' (')[0]}: ${logistics[k].replace(/\n/g, ' / ')}`) : ['- (none entered)']), '',
    ...(S.lastRefresh ? [`Live data last updated: ${fmtTime(S.lastRefresh)} ET`, ''] : []),
    '--- JSON ---',
    JSON.stringify({ source: 'wdw-dashboard', type: kind === 'sync' ? 'sync' : 'question', generatedAt: new Date().toISOString(), addressedTo: bot, topic, question: q || null,
      trip: { start: D.trip.start, end: D.trip.end, adults: D.trip.adults, hotel: 'Westgate Lakes Resort & Spa' }, dayPlan: Object.fromEntries(days.map((d) => [d, planName[plan[d] || ''] || null])),
      parkHours: hours, mustRides: must, logistics, recentAlerts: recent.map((r) => ({ title: r.title, detail: r.detail })) }, null, 2)
  ];
  return { to: S.prefs.email.to, subject, text: lines.join('\n'), msg: '' };
}
const readDraft = () => ({ to: $('#dr-to')?.value.trim() || S.prefs.email.to, subject: $('#dr-sub')?.value || '', text: $('#dr-body')?.value || '' });
const setMsg = (id, t, bad) => { const el = $('#' + id); if (el) { el.textContent = t; el.style.color = bad ? 'var(--bad-ink)' : 'var(--ok-ink)'; } };
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ } ta.remove(); return ok;
  }
}
async function sendEmailNow(payload, msgId) {
  setMsg(msgId, 'Sending…');
  try {
    const j = await post('/api/send-email', { ...payload, replyTo: S.prefs.email.from || undefined });
    if (j.ok) setMsg(msgId, `Sent to ${j.to}.`);
    else if (j.configured === false) setMsg(msgId, `${j.message} Your draft is still here: use Copy or Open in Gmail.`, true);
    else setMsg(msgId, j.message || `Could not send (${j.error}).`, true);
  } catch (e) { setMsg(msgId, `${e.message} Use Copy or Open in Gmail instead.`, true); }
}

/* ---------- render ---------- */
const LIVE_TABS = ['overview', 'mk', 'epcot', 'hs', 'ak', 'favs', 'skyliner'];
function shouldRerender() {
  const a = document.activeElement;
  return LIVE_TABS.includes(S.tab) && !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName));
}
function setStatus() {
  const el = $('#status-line'); if (!el) return;
  const ok = Object.values(S.parks).filter((p) => p.live?.length && !p.error).length;
  el.textContent = S.loading ? 'Refreshing live data…' : S.lastRefresh
    ? `${S.fromCache ? 'Saved data from ' : 'Updated '}${fmtTime(S.lastRefresh)} · ${ok}/4 parks live · ${ago(S.lastRefresh)}`
    : 'Waiting for live data…';
  const b = $('#btn-refresh'); if (b) b.textContent = S.loading ? '… Refreshing' : '↻ Refresh';
  const nb = $('#net-badge'); if (nb) nb.classList.toggle('hidden', navigator.onLine);
  renderTicker();
}
function render() {
  _pid = null;
  const tabs = $('#tabs');
  tabs.innerHTML = TABS.map(([k, l]) => `<button role="tab" class="tab" data-tab="${k}" aria-selected="${S.tab === k}" style="--tc:${TAB_COLOR[k] || 'var(--accent)'}">${l}</button>`).join('');
  const v = { overview: viewOverview, springs: viewSprings, favs: viewFavs, skyliner: viewSkyliner, photos: viewPhotos, sync: viewSync, deals: viewDeals, help: viewHelp }[S.tab];
  $('#view').innerHTML = v ? v() : viewPark(S.tab);
  const sel = tabs.querySelector('[aria-selected="true"]'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (S.tab === 'deals') loadDeals();
  if (S.tab === 'photos') loadGallery();
  if (S.tab === 'sync') { const a = $('#mailto-link'); if (a && S.draft) a.href = `mailto:${enc(S.draft.to)}?subject=${enc(S.draft.subject)}&body=${enc(S.draft.text.slice(0, 1800))}`; }
  renderFab();
}
function go(tab) { S.tab = TABS.some(([k]) => k === tab) ? tab : 'overview'; S.filters.q = ''; render(); window.scrollTo({ top: 0 }); }

/* ---------- events ---------- */
document.addEventListener('click', async (ev) => {
  const t = ev.target.closest('[data-tab]');
  if (t) { location.hash = t.dataset.tab; return; }
  const el = ev.target.closest('[data-act]');
  if (!el || el.matches('select,input')) return;
  const act = el.dataset.act; const id = el.dataset.id;
  const p = S.prefs;
  if (act === 'star') { const i = p.favorites.indexOf(id); if (i >= 0) p.favorites.splice(i, 1); else p.favorites.push(id); savePrefs(); render(); }
  else if (act === 'bell') toggleBell(id);
  else if (act === 'kind') { S.filters.kind = el.dataset.v; render(); }
  else if (act === 'favonly') { S.filters.fav = !S.filters.fav; render(); }
  else if (act === 'fab') { LS.set(KEY.fab, !LS.get(KEY.fab, false)); renderFab(); }
  else if (act === 'perm') { if ('Notification' in window) Notification.requestPermission().then(() => render()); }
  else if (act === 'reload-deals') loadDeals(true).then(() => render());
  else if (act === 'sync-cloud') { S.cloudDirty = true; $('#cloud-msg').textContent = 'Saving…'; syncCloud(); }
  else if (act === 'clear-log') { LS.set(KEY.log, []); render(); }
  else if (act === 'unwatch') {
    if (p.rides[id]) p.rides[id].on = false; if (p.restaurants[id]) p.restaurants[id].on = false; savePrefs();
    if (p.priorityAlerts && [...PRIORITY_IDS()].includes(id)) toast('Still watched', 'Turn off “Watch every Must-ride” to stop alerts for this one.');
    render();
  }
  else if (act === 'quick') { const q = $('#sy-q'); if (q) q.value = D.quickAsks[+el.dataset.i]; }
  else if (act === 'draft') { S.draft = buildDraft(el.dataset.kind); render(); $('#draft-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'send-draft') { const d = readDraft(); S.draft = { ...S.draft, ...d }; await sendEmailNow(d, 'draft-msg'); }
  else if (act === 'copy-draft') { const d = readDraft(); setMsg('draft-msg', (await copyText(`To: ${d.to}\nSubject: ${d.subject}\n\n${d.text}`)) ? 'Copied. Paste into any email app.' : 'Copy failed. Select the text and copy it manually.', false); }
  else if (act === 'gmail-draft') {
    const d = readDraft(); const body = d.text.length > 1800 ? d.text.slice(0, 1800) + '\n\n[Truncated for the link. Full text was copied to your clipboard; paste it here.]' : d.text;
    if (d.text.length > 1800) await copyText(d.text);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${enc(d.to)}&su=${enc(d.subject)}&body=${enc(body)}`, '_blank', 'noopener');
  }
  else if (act === 'mailto-draft') { const d = readDraft(); el.href = `mailto:${enc(d.to)}?subject=${enc(d.subject)}&body=${enc(d.text.slice(0, 1800))}`; }
  else if (act === 'test-browser') {
    if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    toast('Test alert', 'In-app alerts are working.'); browserNotify('WDW Dashboard test', 'Browser notifications are working.', 'test'); setMsg('test-msg', 'Test alert shown.');
  }
  else if (act === 'test-sms') {
    if (!p.phone) return setMsg('test-msg', 'Enter your phone number first.', true);
    setMsg('test-msg', 'Sending SMS…');
    try { const j = await post('/api/send-sms', { to: p.phone, message: 'WDW Dashboard test: SMS alerts are working.' }); setMsg('test-msg', j.ok ? 'Test SMS sent.' : (j.message || `Could not send (${j.error}).`), !j.ok); } catch (e) { setMsg('test-msg', e.message, true); }
  }
  else if (act === 'test-email') {
    setMsg('test-msg', 'Sending email…');
    try { const j = await post('/api/send-email', { to: p.email.to, replyTo: p.email.from || undefined, events: [{ kind: 'test', title: 'Test message from WDW Dashboard', detail: 'If you can read this, auto-emails to the Grok bots work.' }] });
      setMsg('test-msg', j.ok ? `Test email sent to ${j.to}.` : (j.message || `Could not send (${j.error}).`), !j.ok); } catch (e) { setMsg('test-msg', e.message, true); }
  }
});

function toggleBell(id, force) {
  const e = S.index[id]; if (!e) return; const p = S.prefs;
  if (e.type === 'RESTAURANT') { const on = force ?? !p.restaurants[id]?.on; p.restaurants[id] = { on, name: e.name, park: e.park }; }
  else { const on = force ?? !p.rides[id]?.on; p.rides[id] = { ...(p.rides[id] || {}), on, name: e.name, park: e.park }; }
  savePrefs(); render();
  if (!p.inApp.enabled && !p.sms.enabled && !p.email.enabled) toast('Alert saved', 'Turn on alerts in Deals & Alerts to be notified.');
}

document.addEventListener('change', (ev) => {
  const t = ev.target; const p = S.prefs;
  if (t.dataset.pref) {
    const val = t.type === 'checkbox' ? t.checked : t.dataset.num ? Number(t.value) : t.value.trim();
    setPath(p, t.dataset.pref, val); savePrefs();
    if (t.dataset.pref === 'cloud.enabled') { S.cloudDirty = true; syncCloud(); }
    if (t.type === 'checkbox') render();
    return;
  }
  const act = t.dataset.act; if (!act) return;
  if (act === 'bell') toggleBell(t.dataset.id, t.checked);
  else if (act === 'max') { const id = t.dataset.id; const e = S.index[id]; p.rides[id] = { ...(p.rides[id] || { on: false }), max: Number(t.value), name: e?.name, park: e?.park }; savePrefs(); }
  else if (act === 'date') { S.viewDate = t.value; render(); }
  else if (act === 'plan') { const pl = LS.get(KEY.plan, {}); pl[t.dataset.day] = t.value; LS.set(KEY.plan, pl); }
  else if (act === 'collect') { const c = LS.get(KEY.collect, {}); c[t.dataset.id] = t.checked; LS.set(KEY.collect, c); }
  else if (act === 'status') { S.filters.status = t.value; refreshList(); }
  else if (act === 'sort') { S.filters.sort = t.value; refreshList(); }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'gq') { S.gq = t.value; refreshGlobal(); if (!MAP.loaded) loadPois(); }
  else if (t.id === 'pq') { S.filters.q = t.value; refreshList(); }
  else if (t.dataset.logi) { const L = LS.get(KEY.logi, {}); L[t.dataset.logi] = t.value; LS.set(KEY.logi, L); }
  else if (t.dataset.pref && t.type !== 'checkbox') { setPath(S.prefs, t.dataset.pref, t.dataset.num ? Number(t.value) : t.value.trim()); savePrefs(); }
});
function refreshList() { const ul = $('#plist'); if (ul) ul.innerHTML = parkList(ul.dataset.park); }

$('#btn-refresh').addEventListener('click', () => refresh(true));
$('#btn-theme').addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark'); LS.set(KEY.theme, dark ? 'dark' : 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1326' : '#1e40af');
});
window.addEventListener('hashchange', () => go(location.hash.slice(1)));
window.addEventListener('online', () => { setStatus(); refresh(); });
window.addEventListener('offline', setStatus);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - (S.lastRefresh || 0) > 2 * 60e3) refresh(); });


/* ======================================================================
   GEOLOCATION (shared by weather, map and photo tagging)
   Location stays in the browser. Rounded coordinates go to the weather
   service and the walking-route service only when those features run.
   ====================================================================== */
const Geo = { pos: LS.get(KEY.lastPos, null), watchId: null, perm: 'unknown', err: null, subs: new Set() };
Geo.fresh = (ms = 30 * 60e3) => !!(Geo.pos && Date.now() - Geo.pos.t < ms);
Geo.set = (p) => {
  Geo.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
  Geo.err = null; LS.set(KEY.lastPos, Geo.pos); Geo.subs.forEach((f) => f(Geo.pos));
};
Geo.once = (opts = {}) => new Promise((res) => {
  if (!navigator.geolocation) { Geo.err = { code: 0, message: 'Location is not supported on this device' }; return res(null); }
  navigator.geolocation.getCurrentPosition((p) => { Geo.set(p); res(Geo.pos); }, (e) => { Geo.err = e; res(null); },
    { enableHighAccuracy: false, maximumAge: 5 * 60e3, timeout: 12000, ...opts });
});
Geo.watch = () => {
  if (Geo.watchId != null || !navigator.geolocation) return;
  Geo.watchId = navigator.geolocation.watchPosition(Geo.set, (e) => { Geo.err = e; Geo.subs.forEach((f) => f(Geo.pos)); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 });
};
Geo.stop = () => { if (Geo.watchId != null) { navigator.geolocation.clearWatch(Geo.watchId); Geo.watchId = null; } };
try {
  navigator.permissions?.query({ name: 'geolocation' }).then((r) => {
    Geo.perm = r.state; if (r.state === 'granted') loadWeather(true); renderTicker();
    r.onchange = () => { Geo.perm = r.state; if (r.state === 'granted') loadWeather(true); renderTicker(); };
  }).catch(() => {});
} catch { /* permissions API unavailable */ }

const dist = (la1, lo1, la2, lo2) => {
  const R = 6371000, r = Math.PI / 180, dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const fmtDist = (m) => (m < 305 ? `${Math.round(m * 3.281 / 10) * 10} ft` : `${(m / 1609.34).toFixed(m < 1609 ? 2 : 1)} mi`);
const walkMin = (m) => Math.max(1, Math.round(m / 80));
const areaName = (k) => D.areas.find((a) => a.key === k)?.name || (k === 'resorts' ? 'Resorts & other WDW' : '');
const areaColor = (k) => D.areas.find((a) => a.key === k)?.color || '#475569';
const normName = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function areaFor(lat, lon) {
  let best = null, bd = 1e12;
  D.areas.forEach((a) => { const d = dist(lat, lon, a.lat, a.lon); if (d < bd) { bd = d; best = a; } });
  return best && bd <= best.r * 1.25 ? best : null;
}
const nearestArea = (lat, lon) => D.areas.reduce((b, a) => (dist(lat, lon, a.lat, a.lon) < dist(lat, lon, b.lat, b.lon) ? a : b), D.areas[0]);

/* ======================================================================
   WEATHER: Open-Meteo first, National Weather Service as fallback
   ====================================================================== */
const W = { data: null, err: null, at: 0, busy: false, alerts: [] };
function heatIndexF(t, rh) {           // NWS Rothfusz regression with the standard adjustments
  if (t < 70 || rh == null) return t;
  const simple = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if (simple < 80) return simple;
  let hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t - 0.05481717 * rh * rh
    + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  return hi;
}
const HI_LABEL = (h) => (h >= 125 ? 'extreme danger' : h >= 103 ? 'danger' : h >= 91 ? 'extreme caution' : h >= 80 ? 'caution' : 'comfortable');
const wmo = (c) => (c === 0 ? 'Clear' : c === 1 ? 'Mostly clear' : c === 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Fog' : c <= 57 ? 'Drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Showers' : c >= 95 ? 'Thunderstorms' : '');
async function getJ(url, ms = 9000, headers) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal, headers }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); } finally { clearTimeout(t); }
}
async function omWeather(lat, lon) {
  const j = await getJ(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`);
  const c = j.current; if (!c || c.temperature_2m == null) throw new Error('no data');
  return { tempF: c.temperature_2m, rh: c.relative_humidity_2m, hiF: heatIndexF(c.temperature_2m, c.relative_humidity_2m), cond: wmo(c.weather_code), windMph: c.wind_speed_10m, src: 'Open-Meteo' };
}
async function nwsWeather(lat, lon) {
  const H = { Accept: 'application/geo+json' };
  const pt = await getJ(`https://api.weather.gov/points/${lat},${lon}`, 9000, H);
  const st = await getJ(pt.properties.observationStations, 9000, H);
  for (const f of (st.features || []).slice(0, 3)) {
    const o = await getJ(`${f.id}/observations/latest`, 9000, H); const p = o.properties || {};
    if (p.temperature?.value == null) continue;
    const tF = p.temperature.value * 9 / 5 + 32; const rh = p.relativeHumidity?.value ?? null;
    const hi = p.heatIndex?.value != null ? p.heatIndex.value * 9 / 5 + 32 : heatIndexF(tF, rh);
    return { tempF: tF, rh: rh != null ? Math.round(rh) : null, hiF: hi, cond: p.textDescription || '', windMph: p.windSpeed?.value != null ? p.windSpeed.value * 0.621371 : null, src: 'NWS' };
  }
  throw new Error('no station data');
}
async function nwsAlerts(lat, lon) {
  const j = await getJ(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, 9000, { Accept: 'application/geo+json' });
  return [...new Set((j.features || []).map((f) => f.properties?.event).filter(Boolean))].slice(0, 3);
}
async function loadWeather(force) {
  if (W.busy) { if (force) W.again = true; return; }
  if (!force && Date.now() - W.at < 9 * 60e3) return;
  W.busy = true;
  let loc = Geo.fresh() ? Geo.pos : null; let where = 'Your location';
  if (!loc && Geo.perm === 'granted') loc = await Geo.once({ maximumAge: 10 * 60e3 });
  if (!loc) { loc = { lat: 28.4177, lon: -81.5812 }; where = 'Orlando area'; }
  const lat = +loc.lat.toFixed(3), lon = +loc.lon.toFixed(3);
  let d = null;
  try { d = await omWeather(lat, lon); } catch { try { d = await nwsWeather(lat, lon); } catch { W.err = 'unavailable'; } }
  if (d) { d.where = where; W.data = d; W.err = null; W.at = Date.now(); }
  nwsAlerts(lat, lon).then((a) => { W.alerts = a; renderTicker(); }).catch(() => {});
  W.busy = false; renderTicker();
  if (W.again) { W.again = false; loadWeather(true); }
}

/* ======================================================================
   LIVE NEWS + BOTTOM TICKER
   ====================================================================== */
function pushNews(kind, text, href) {
  const now = Date.now(); const n = LS.get(KEY.news, []).filter((x) => now - x.t < 3 * 3600e3);
  if (n.some((x) => x.text === text && now - x.t < 20 * 60e3)) return;
  n.unshift({ t: now, kind, text, href }); LS.set(KEY.news, n.slice(0, 30));
}
function tickerItems() {
  const it = [];
  if (W.data) {
    const d = W.data; const hi = Math.round(d.hiF);
    it.push({ c: 'wx', t: `🌡️ ${d.where}: ${Math.round(d.tempF)}°F · Heat index ${hi}°F (${HI_LABEL(d.hiF)})${d.rh != null ? ` · ${Math.round(d.rh)}% humidity` : ''}${d.cond ? ` · ${d.cond}` : ''}${d.windMph != null ? ` · wind ${Math.round(d.windMph)} mph` : ''}` });
    if (d.hiF >= 91) it.push({ c: 'warn', t: '💧 High heat index: take shade and water breaks' });
  } else it.push({ c: 'wx', t: W.err ? '🌡️ Weather is unavailable right now' : '🌡️ Loading weather…' });
  W.alerts.forEach((a) => it.push({ c: 'warn', t: `⚠️ NWS alert: ${a}` }));
  LS.get(KEY.news, []).filter((x) => Date.now() - x.t < 3 * 3600e3).slice(0, 12).forEach((n) => it.push({ c: n.kind, t: `${fmtTime(n.t)} ${n.text}`, href: n.href }));
  const best = resolvePriority().filter((x) => x.def.type === 'ATTRACTION' && x.ent?.status === 'OPERATING' && x.ent.wait != null).sort((a, b) => a.ent.wait - b.ent.wait)[0];
  if (best) it.push({ c: 'info', t: `⏱️ Shortest must-ride wait: ${best.def.label}, ${best.ent.wait} min` });
  S.deals.items.slice(0, 3).forEach((d) => it.push({ c: 'deal', t: `💸 ${d.title}`, href: d.link }));
  if (it.length < 3) it.push({ c: 'info', t: '✅ No ride closures reported since the last check' });
  return it;
}
let tkSig = '';
function setTickerPaused(p) {
  const t = $('#ticker'), b = $('#tk-pause'); if (!t || !b) return;
  t.classList.toggle('paused', p); b.textContent = p ? '▶' : '⏸';
  b.setAttribute('aria-label', p ? 'Resume scrolling' : 'Pause scrolling'); b.title = b.getAttribute('aria-label');
  LS.set('wdw.tkPaused', p);
}
function renderTicker() {
  const el = $('#tk-track'); if (!el) return;
  const loc = $('#tk-loc'); if (loc) loc.classList.toggle('hidden', Geo.perm === 'granted');
  const items = tickerItems();
  const sig = JSON.stringify(items.map((i) => [i.c, i.t, i.href || '']));
  if (sig === tkSig) return; tkSig = sig;
  const mk = (dup) => items.map((i) => `<span class="tk-item tk-${i.c}">${i.href ? `<a href="${esc(i.href)}" target="_blank" rel="noopener"${dup ? ' tabindex="-1"' : ''}>${esc(i.t)}</a>` : esc(i.t)}</span>`).join('<span class="tk-sep" aria-hidden="true">•</span>');
  const chars = items.reduce((n, i) => n + i.t.length + 4, 0);
  el.style.setProperty('--tk-dur', Math.max(30, Math.round(chars * 0.17)) + 's');
  el.innerHTML = `<span class="tk-group">${mk(false)}</span><span class="tk-group tk-dup" aria-hidden="true">${mk(true)}</span>`;
}

/* ======================================================================
   MODAL helper
   ====================================================================== */
let modalCleanup = null;
function openModal(html, onClose) {
  const m = $('#modal'); m.innerHTML = `<div class="modal card" role="document">${html}</div>`; m.classList.remove('hidden'); modalCleanup = onClose || null;
  m.querySelector('[data-act="modal-close"]')?.focus();
}
function closeModal() {
  const m = $('#modal'); if (!m || m.classList.contains('hidden')) return;
  m.classList.add('hidden'); m.innerHTML = ''; if (modalCleanup) { try { modalCleanup(); } catch { /* ignore */ } modalCleanup = null; }
}

/* ======================================================================
   MAP OVERLAY (Leaflet + OpenStreetMap, walking routes from routing.openstreetmap.de)
   ====================================================================== */
const MAP = { map: null, markers: null, userDot: null, userAcc: null, pinMk: null, destMk: null, line: null, pois: [], by: {}, loaded: false, loading: false,
  park: 'all', cat: 'must', q: '', pin: null, pinMode: false, dest: null, lastFrom: null, lastAt: 0, open: false, note: '', init: false };
const catDef = (k) => D.poiCats.find((c) => c.k === k) || { k, label: k, icon: '📍' };
const mapOrigin = () => MAP.pin || (Geo.fresh(5 * 60e3) ? Geo.pos : null);
const googleDir = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=walking`;
const appleDir = (p) => `https://maps.apple.com/?daddr=${p.lat},${p.lon}&dirflg=w`;

function classify(t) {
  const n = t.name || '';
  if (/first aid/i.test(n) || ['first_aid', 'clinic', 'doctors'].includes(t.amenity)) return 'firstaid';
  if (/baby care/i.test(n)) return 'baby';
  if (/guest (relations|services)|lost\s*(and|&)\s*found/i.test(n)) return 'guest';
  if (t.aerialway === 'station') return 'skyliner';
  if (t.highway === 'bus_stop' || t.amenity === 'bus_station') return 'bus';
  if (t.amenity === 'toilets') return 'restroom';
  if (t.amenity === 'parking') return 'parking';
  if (t.entrance || /entrance|main gate|turnstile/i.test(n)) return 'entrance';
  if (t.shop) return 'shop';
  if (t.tourism === 'attraction' || t.attraction) return 'ride';
  if (['restaurant', 'fast_food', 'cafe', 'bar', 'pub', 'ice_cream', 'biergarten', 'food_court'].includes(t.amenity)) return 'dining';
  return null;
}
const DEFAULT_NAME = { restroom: 'Restroom', bus: 'Bus stop', skyliner: 'Skyliner station', parking: 'Parking', firstaid: 'First aid' };
function overpassQuery() {
  const around = D.areas.map((a) => `(around:${a.r},${a.lat},${a.lon})`);
  const f = (sel) => around.map((ar) => `nwr${sel}${ar};`).join('');
  const bb = `(${D.bbox.join(',')})`;   // whole Walt Disney World property: shops, kiosks, dining, rides, resorts
  return `[out:json][timeout:90];(${f('["amenity"="toilets"]')}${f('["amenity"~"^(first_aid|clinic|doctors)$"]')}${f('["name"~"First Aid|Guest Relations|Guest Services|Baby Care|Lost and Found",i]')}${f('["highway"="bus_stop"]')}${f('["amenity"="bus_station"]')}${f('["amenity"="parking"]["name"]')}${f('["entrance"]["name"]')}${f('["name"~"Main Entrance|Park Entrance|Turnstile",i]["highway"!~"."]')}nwr["shop"]["name"]${bb};nwr["tourism"="attraction"]["name"]${bb};nwr["attraction"]["name"]${bb};nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|bar|pub|ice_cream|biergarten)$"]["name"]${bb};nwr["aerialway"="station"](28.32,-81.60,28.39,-81.50););out center tags;`;
}
async function overpass(q) {
  for (const u of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 85000);
    try { const r = await fetch(u, { method: 'POST', body: 'data=' + enc(q), headers: { 'content-type': 'application/x-www-form-urlencoded' }, signal: ctl.signal }); if (r.ok) return await r.json(); } catch { /* try the next mirror */ } finally { clearTimeout(t); }
  }
  throw new Error('Overpass unavailable');
}
function poiCacheSync() {
  const tp = LS.get(KEY.poiTp, null), osm = LS.get(KEY.poiOsm, null);
  if (tp || osm) { buildPois(tp?.list || [], osm?.list || []); MAP.loaded = !!(tp && osm); }
}
function buildPois(tp, osm) {
  const out = [];
  tp.forEach((x) => out.push({ id: 't:' + x.i, eid: x.i, name: x.n, cat: x.c, lat: x.la, lon: x.lo, park: x.p }));
  const tpBy = {}; tp.forEach((x) => (tpBy[x.c] ||= []).push({ n: normName(x.n), la: x.la, lo: x.lo }));
  osm.forEach((x) => {
    if (['ride', 'dining', 'show'].includes(x.c) && tpBy[x.c]) {          // skip OSM copies of things ThemeParks.wiki already lists
      const nn = normName(x.n);
      if (nn.length >= 4 && tpBy[x.c].some((t) => (t.n === nn || (nn.length >= 5 && t.n.includes(nn)) || (t.n.length >= 5 && nn.includes(t.n))) && dist(x.la, x.lo, t.la, t.lo) < 250)) return;
    }
    const ar = areaFor(x.la, x.lo);
    out.push({ id: 'o:' + x.i, name: x.n, cat: x.c, lat: x.la, lon: x.lo, park: ar ? ar.key : 'resorts' });
  });
  MAP.pois = out; MAP.by = Object.fromEntries(out.map((p) => [p.id, p]));
}
async function loadPois() {
  if (MAP.loading) return;
  const tpC = LS.get(KEY.poiTp, null), osmC = LS.get(KEY.poiOsm, null);
  const freshTp = tpC && Date.now() - tpC.t < 7 * 864e5, freshOsm = osmC && Date.now() - osmC.t < 14 * 864e5;
  if (freshTp && freshOsm) { buildPois(tpC.list, osmC.list); MAP.loaded = true; updateStatus(); updateList(); drawMarkers(); refreshGlobal(); return; }
  MAP.loading = true; MAP.note = ''; updateStatus(); updateList(); refreshGlobal();
  const [a, b] = await Promise.allSettled([
    freshTp ? Promise.resolve(tpC.list) : (async () => {
      if (!Object.keys(S.parkIds).length) await discoverParks();
      const list = [];
      await Promise.allSettled(D.parks.map(async (p) => {
        const j = await api(`/entity/${S.parkIds[p.key]}/children`);
        (j.children || []).forEach((c) => {
          const la = Number(c.location?.latitude), lo = Number(c.location?.longitude);
          const cat = { ATTRACTION: 'ride', SHOW: 'show', RESTAURANT: 'dining' }[c.entityType];
          if (cat && Number.isFinite(la) && Number.isFinite(lo) && la && lo) list.push({ i: c.id, n: c.name, c: cat, la, lo, p: p.key });
        });
      }));
      if (list.length) LS.set(KEY.poiTp, { t: Date.now(), list });
      return list;
    })(),
    freshOsm ? Promise.resolve(osmC.list) : (async () => {
      const j = await overpass(overpassQuery()); const seen = new Set(); const list = [];
      (j.elements || []).forEach((el) => {
        const t = el.tags || {}; const c = classify(t); if (!c) return;
        const la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon; if (la == null || lo == null) return;
        const n = t.name || DEFAULT_NAME[c]; if (!n) return;
        const id = el.type[0] + el.id; if (seen.has(id)) return; seen.add(id);
        list.push({ i: id, n, c, la: +la.toFixed(6), lo: +lo.toFixed(6) });
      });
      if (list.length) LS.set(KEY.poiOsm, { t: Date.now(), list });
      return list;
    })()
  ]);
  const tp = a.status === 'fulfilled' ? a.value : (tpC?.list || []); const osm = b.status === 'fulfilled' ? b.value : (osmC?.list || []);
  buildPois(tp, osm);
  const bits = [];
  if (!tp.length) bits.push('Ride and restaurant positions could not be loaded from ThemeParks.wiki.');
  if (!osm.length) bits.push('Restroom, first aid, shop, bus and parking data could not be loaded from OpenStreetMap.');
  MAP.note = bits.join(' '); MAP.loaded = !!(tp.length || osm.length); MAP.loading = false;
  updateStatus(); updateList(); drawMarkers(); renderFab(); refreshGlobal();
}

function mapDom() {
  if ($('#mapov')) return;
  $('#overlays').innerHTML = `<div id="mapov" class="mapov hidden" role="dialog" aria-modal="true" aria-label="Park map and directions">
    <div class="mapov-head"><div class="display font-bold text-lg">Park map</div><button id="mp-close" class="btn btn-sm" data-act="map-close">✕ Close</button></div>
    <div class="mapov-body"><div id="mp-map" role="application" aria-label="Map"></div>
      <div class="mapov-panel"><div class="p-3 space-y-2">
        <div class="flex gap-2"><button class="btn btn-primary flex-1" data-act="here">📍 Here I am</button><button id="mp-pin" class="btn" data-act="pin">Pin my spot</button></div>
        <div id="mp-status" class="text-sm" aria-live="polite"></div><div id="mp-route"></div>
        <div class="grid grid-cols-2 gap-2"><div><label class="sr-only" for="mp-park">Park</label><select id="mp-park" class="input"><option value="all">All areas</option>${D.areas.map((a) => `<option value="${a.key}">${a.name}</option>`).join('')}<option value="resorts">Resorts &amp; other WDW</option></select></div>
          <div><label class="sr-only" for="mp-q">Directions to</label><input id="mp-q" class="input" type="search" placeholder="Directions to…" autocomplete="off"/></div></div>
        <div id="mp-chips" class="flex flex-wrap gap-1.5" role="group" aria-label="Place type"></div></div>
        <ul id="mp-list" class="px-3 pb-3"></ul>
        <p class="px-3 pb-6 text-xs muted">Map © OpenStreetMap contributors. Ride and restaurant positions: ThemeParks.wiki. Other places come from OpenStreetMap and may be incomplete, so ask a Cast Member if you can't find something. Walking routes: routing.openstreetmap.de.</p></div></div></div>`;
}
function updateChips() {
  const el = $('#mp-chips'); if (!el) return;
  el.innerHTML = D.poiCats.map((c) => `<button class="chip" data-act="mcat" data-v="${c.k}" aria-pressed="${MAP.cat === c.k && !MAP.q}">${c.icon} ${c.label}</button>`).join('');
}
function filteredPois() {
  const q = MAP.q.trim().toLowerCase(); const o = mapOrigin();
  const must = new Set(resolvePriority().map((x) => x.ent?.id).filter(Boolean));
  const l = MAP.pois.filter((p) => (MAP.park === 'all' || p.park === MAP.park)
    && (q ? (p.name.toLowerCase().includes(q) || catDef(p.cat).label.toLowerCase().includes(q)) : (MAP.cat === 'all' || (MAP.cat === 'must' ? must.has(p.eid) : p.cat === MAP.cat))));
  l.forEach((p) => { p._d = o ? dist(o.lat, o.lon, p.lat, p.lon) : null; });
  l.sort((a, b) => (o ? a._d - b._d : a.name.localeCompare(b.name)));
  return l;
}
function updateList() {
  const ul = $('#mp-list'); if (!ul) return;
  if (MAP.loading && !MAP.pois.length) { ul.innerHTML = '<li class="py-2"><div class="skel h-12 mb-2"></div><div class="skel h-12 mb-2"></div><div class="skel h-12"></div></li>'; return; }
  const l = filteredPois().slice(0, 60);
  ul.innerHTML = l.length ? l.map((p) => {
    const e = p.eid ? S.index[p.eid] : null; const c = catDef(p.cat);
    const meta = [areaName(p.park), p._d != null ? `${fmtDist(p._d)} · ${walkMin(p._d * 1.25)} min walk` : null].filter(Boolean).join(' · ');
    return `<li class="flex items-center gap-2 py-2 border-t" style="border-color:var(--line)"><span aria-hidden="true">${c.icon}</span><div class="min-w-0 flex-1"><div class="font-semibold text-sm leading-snug">${esc(p.name)}</div><div class="text-xs muted">${esc(meta)}</div></div>${e && e.type === 'ATTRACTION' ? pill(e) : ''}<button class="btn btn-sm" data-act="route" data-pid="${esc(p.id)}">Go</button></li>`;
  }).join('') : `<li class="muted text-sm py-3">${MAP.loaded ? 'Nothing matches. Try another category or clear the search.' : 'Waiting for map data…'}</li>`;
}
function updateStatus() {
  const el = $('#mp-status'); if (!el) return;
  const o = mapOrigin(); let h = '';
  if (MAP.loading) h += '<div class="muted">Loading map data. First load can take a few seconds…</div>';
  if (MAP.pinMode) h += '<div><strong>Tap the map</strong> where you are standing.</div>';
  else if (MAP.pin) h += '<div>Using the spot you pinned.</div>';
  else if (o) { const a = areaFor(o.lat, o.lon); h += `<div>${a ? `You're in <strong>${esc(a.name)}</strong>` : 'You appear to be outside the parks'} · accuracy about ${Math.round(o.acc || 0)} m</div>`; }
  else if (Geo.err?.code === 1) h += '<div class="text-sm" style="color:var(--bad-ink)">Location is blocked for this site. Allow it in your browser settings, or tap “Pin my spot” and tap the map.</div>';
  else if (Geo.err) h += `<div class="text-sm" style="color:var(--bad-ink)">Couldn't get your location (${esc(Geo.err.message || 'unknown')}). Try again outdoors, or pin your spot.</div>`;
  else h += '<div class="muted">Tap “Here I am” to use your location, or pin your spot on the map.</div>';
  if (o) {
    const near = MAP.pois.filter((p) => p.eid && resolvePriority().some((x) => x.ent?.id === p.eid)).map((p) => ({ p, d: dist(o.lat, o.lon, p.lat, p.lon) })).sort((a, b) => a.d - b.d).slice(0, 3);
    if (near.length) h += `<div class="mt-1"><span class="font-semibold">Nearest must-dos:</span> ${near.map(({ p, d }) => `<button class="chip" style="min-height:28px" data-act="route" data-pid="${esc(p.id)}">${esc(p.name.split(/[:,–-]/)[0].trim())} · ${fmtDist(d)}</button>`).join(' ')}</div>`;
  }
  if (MAP.note) h += `<div class="text-xs muted mt-1">${esc(MAP.note)}</div>`;
  if (!window.L) h += '<div class="text-xs mt-1" style="color:var(--bad-ink)">The map tiles library couldn\'t load (offline?). Lists and external directions still work.</div>';
  el.innerHTML = h;
  const pb = $('#mp-pin'); if (pb) pb.textContent = MAP.pin ? 'Use GPS instead' : MAP.pinMode ? 'Cancel pin' : 'Pin my spot';
}
function setRoute(html) { const el = $('#mp-route'); if (el) el.innerHTML = html; }

function ensureMap() {
  if (MAP.map || !window.L) return;
  const L = window.L;
  const start = D.areas.find((a) => a.key === S.tab) || D.areas[0];
  const m = L.map('mp-map', { zoomControl: true }).setView([start.lat, start.lon], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
  MAP.markers = L.layerGroup().addTo(m);
  m.on('click', (e) => { if (MAP.pinMode) setPin(e.latlng.lat, e.latlng.lng); });
  m.on('popupopen', (e) => { e.popup.getElement()?.querySelectorAll('[data-pid]').forEach((b) => b.addEventListener('click', () => { m.closePopup(); routeTo(MAP.by[b.dataset.pid]); })); });
  MAP.map = m;
}
function drawMarkers() {
  if (!MAP.map) return; const L = window.L; MAP.markers.clearLayers();
  filteredPois().slice(0, 200).forEach((p) => {
    const mk = L.circleMarker([p.lat, p.lon], { radius: 8, color: areaColor(p.park), weight: 3, fillColor: '#ffffff', fillOpacity: 1 });
    mk.bindPopup(`<strong>${esc(p.name)}</strong><br/>${esc(catDef(p.cat).label)}<br/><button class="btn btn-sm" style="margin-top:6px" data-pid="${esc(p.id)}">Directions</button>`);
    mk.addTo(MAP.markers);
  });
}
function drawUser() {
  if (!MAP.map) return; const L = window.L; const o = mapOrigin();
  [MAP.userDot, MAP.userAcc, MAP.pinMk].forEach((x) => x && MAP.map.removeLayer(x)); MAP.userDot = MAP.userAcc = MAP.pinMk = null;
  if (!o) return;
  if (MAP.pin) MAP.pinMk = L.marker([o.lat, o.lon], { icon: L.divIcon({ className: '', html: '<div class="you-pin">📍</div>', iconSize: [30, 30], iconAnchor: [15, 28] }) }).addTo(MAP.map);
  else {
    if (o.acc) MAP.userAcc = L.circle([o.lat, o.lon], { radius: Math.min(o.acc, 150), color: '#2563eb', weight: 1, fillColor: '#2563eb', fillOpacity: 0.12 }).addTo(MAP.map);
    MAP.userDot = L.circleMarker([o.lat, o.lon], { radius: 9, color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(MAP.map);
  }
}
function setPin(lat, lon) { MAP.pin = { lat, lon, acc: 0, t: Date.now() }; MAP.pinMode = false; $('#mp-map')?.classList.remove('pinning'); drawUser(); updateStatus(); updateList(); drawMarkers(); if (MAP.dest) routeTo(MAP.dest); }

async function fetchRoute(from, to) {
  const j = await getJ(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`, 9000);
  if (j.code !== 'Ok' || !j.routes?.[0]) throw new Error('no route');
  return j.routes[0];
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function stepText(s) {
  const m = s.maneuver || {}; const nm = s.name ? ` onto ${s.name}` : ''; const mod = (m.modifier || '').replace('slight ', 'bear ');
  if (m.type === 'depart') return `Start${s.name ? ' on ' + s.name : ''}`;
  if (m.type === 'arrive') return 'Arrive at your destination';
  if (m.type === 'turn' || m.type === 'end of road') return `Turn ${mod}${nm}`;
  return `${cap(mod || 'continue')}${nm}`;
}
async function routeTo(p, silent) {
  if (!p) return; MAP.dest = p; drawDest(p);
  const o = mapOrigin(); const ext = `<div class="flex flex-wrap gap-2 mt-2"><a class="btn btn-sm" target="_blank" rel="noopener" href="${googleDir(p)}">Google Maps</a><a class="btn btn-sm" target="_blank" rel="noopener" href="${appleDir(p)}">Apple Maps</a></div>`;
  if (!o) { setRoute(`<div class="card-flat p-3 text-sm"><strong>${esc(p.name)}</strong><br/>Tap “Here I am” or pin your spot to get walking directions.${ext}</div>`); MAP.map?.setView([p.lat, p.lon], 18); return; }
  MAP.lastFrom = { lat: o.lat, lon: o.lon }; MAP.lastAt = Date.now();
  if (!silent) setRoute(`<div class="card-flat p-3 text-sm">Finding a walking route to <strong>${esc(p.name)}</strong>…</div>`);
  let r = null; try { r = await fetchRoute(o, p); } catch { /* fall back below */ }
  if (MAP.dest !== p) return;
  const L = window.L; if (MAP.line && MAP.map) MAP.map.removeLayer(MAP.line); MAP.line = null;
  const straight = dist(o.lat, o.lon, p.lat, p.lon); const meters = r ? r.distance : straight * 1.25;
  if (MAP.map) {
    MAP.line = r ? L.geoJSON(r.geometry, { style: { color: '#2563eb', weight: 6, opacity: 0.85 } }).addTo(MAP.map)
      : L.polyline([[o.lat, o.lon], [p.lat, p.lon]], { color: '#2563eb', weight: 4, dashArray: '8 8' }).addTo(MAP.map);
    if (!silent) MAP.map.fitBounds(MAP.line.getBounds(), { padding: [40, 40], maxZoom: 18 });
  }
  const steps = r?.legs?.[0]?.steps || [];
  setRoute(`<div class="card-flat p-3 text-sm"><div class="flex items-start justify-between gap-2"><div><div class="font-semibold">${esc(p.name)}</div>
    <div>${r ? '' : 'About '}<strong>${fmtDist(meters)}</strong> · ${walkMin(meters)} min walk</div>${r ? '' : '<div class="text-xs muted">Straight-line estimate. The walking-route service is unavailable right now.</div>'}</div>
    <button class="btn btn-sm" data-act="route-clear">Clear</button></div>
    ${steps.length ? `<details class="mt-1"><summary>Step by step (${steps.length})</summary><ol class="list-decimal pl-5 mt-1 space-y-0.5">${steps.map((s) => `<li>${esc(stepText(s))}${s.distance > 5 ? ` <span class="muted">(${fmtDist(s.distance)})</span>` : ''}</li>`).join('')}</ol></details>` : ''}${ext}</div>`);
}
function drawDest(p) {
  if (!MAP.map) return; const L = window.L; if (MAP.destMk) MAP.map.removeLayer(MAP.destMk);
  MAP.destMk = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', html: `<div class="dest-pin">${catDef(p.cat).icon}</div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(MAP.map).bindTooltip(p.name, { permanent: false });
}
function clearRoute() {
  MAP.dest = null; setRoute('');
  [MAP.line, MAP.destMk].forEach((x) => x && MAP.map?.removeLayer(x)); MAP.line = MAP.destMk = null;
}
async function hereIAm() {
  MAP.pin = null; MAP.pinMode = false; $('#mp-map')?.classList.remove('pinning');
  const st = $('#mp-status'); if (st) st.innerHTML = '<div class="muted">Finding you…</div>';
  const p = await Geo.once({ enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  if (p) { Geo.watch(); MAP.map?.setView([p.lat, p.lon], 17); loadWeather(true); }
  drawUser(); updateStatus(); updateList(); drawMarkers(); if (p && MAP.dest) routeTo(MAP.dest);
}
function onGeo() {
  if (!MAP.open) return;
  drawUser(); updateStatus(); updateList();
  const o = mapOrigin();
  if (MAP.dest && !MAP.pin && o && MAP.lastFrom && dist(o.lat, o.lon, MAP.lastFrom.lat, MAP.lastFrom.lon) > 50 && Date.now() - MAP.lastAt > 20000) routeTo(MAP.dest, true);
}
async function openMap(opts = {}) {
  mapDom(); $('#mapov').classList.remove('hidden'); document.body.style.overflow = 'hidden'; MAP.open = true;
  if (!MAP.init) { MAP.init = true; Geo.subs.add(onGeo); }
  ensureMap(); if (MAP.map) setTimeout(() => MAP.map.invalidateSize(), 80);
  if (Geo.perm === 'granted') Geo.watch();
  updateChips(); updateStatus(); updateList(); drawUser(); drawMarkers(); $('#mp-close')?.focus();
  const o = mapOrigin(); if (o && MAP.map && !opts.eid) MAP.map.setView([o.lat, o.lon], 17);
  await loadPois();
  if (opts.pid) { const p = MAP.by[opts.pid]; if (p) { MAP.q = ''; const q = $('#mp-q'); if (q) q.value = ''; routeTo(p); } }
  else if (opts.eid) {
    const p = MAP.pois.find((x) => x.eid === opts.eid);
    if (p) { MAP.q = ''; const q = $('#mp-q'); if (q) q.value = ''; routeTo(p); }
    else { const e = S.index[opts.eid]; toast('No exact map position yet', 'Opening Google Maps search instead.'); window.open(`https://www.google.com/maps/search/?api=1&query=${enc((e?.name || '') + ' Walt Disney World')}`, '_blank', 'noopener'); }
  }
}
function closeMap() { $('#mapov')?.classList.add('hidden'); document.body.style.overflow = ''; MAP.open = false; Geo.stop(); }

/* ======================================================================
   PHOTOS: camera, IndexedDB gallery (nothing leaves the device)
   ====================================================================== */
const PH = { dbp: null, urls: [], cur: null };
function idb() {
  return (PH.dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('wdw-photos', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('meta', { keyPath: 'id' }); r.result.createObjectStore('full'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
}
async function dbDo(store, mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction(store, mode); const rq = fn(t.objectStore(store)); t.oncomplete = () => res(rq?.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
}
async function processImage(blob, max, q) {
  let bmp; try { bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { bmp = await createImageBitmap(blob); }
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode image'))), 'image/jpeg', q));
}
const fmtDT = (ts) => new Date(ts).toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const parkOpts = (sel) => [['', 'Not set'], ...D.areas.map((a) => [a.key, a.name]), ['resort', 'Hotel / other']].map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${l}</option>`).join('');
const parkTag = (k) => (k === 'resort' ? 'Hotel / other' : areaName(k) || '');
function nearestPlace(lat, lon) {
  let best = null, bd = 90;
  MAP.pois.forEach((p) => { if (!['ride', 'dining', 'show'].includes(p.cat)) return; const d = dist(lat, lon, p.lat, p.lon); if (d < bd) { bd = d; best = p; } });
  return best?.name || '';
}
async function saveToPhone(blob, name, title) {
  const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: title || 'Trip photo' }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
function openCamera() {
  openModal(`<div class="p-4"><div class="flex items-center justify-between mb-2"><h3 class="display font-bold text-lg">Take a photo</h3><button class="btn btn-sm" data-act="modal-close">✕</button></div>
    <p class="text-sm muted mb-3">Photos are kept on this device. Add a caption, tag the park, and use “Save to phone” to put a copy in your camera roll.</p>
    <div class="grid gap-2"><button class="btn btn-primary" data-act="ph-cam">📷 Open camera</button><button class="btn" data-act="ph-live">🎥 Live camera in the app</button><button class="btn" data-act="ph-lib">🖼️ Choose from photo library</button><button class="btn" data-act="ph-gallery">View trip gallery</button></div>
    <input id="ph-in-cam" type="file" accept="image/*" capture="environment" hidden/><input id="ph-in-lib" type="file" accept="image/*" multiple hidden/></div>`);
}
async function startEditor(files, fromCamera) {
  const list = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)); if (!list.length) return;
  PH.queue = list.slice(1).map((f) => ({ f, cam: fromCamera }));
  await editorFor(list[0], fromCamera);
}
async function editorFor(blob, camera) {
  const takenAt = camera ? Date.now() : (blob.lastModified || Date.now());
  let pos = null; if (camera) pos = Geo.fresh(5 * 60e3) ? Geo.pos : (Geo.perm === 'denied' ? null : await Geo.once({ timeout: 5000 }));
  const a = pos ? areaFor(pos.lat, pos.lon) : null;
  PH.cur = { blob, url: URL.createObjectURL(blob), takenAt, lat: pos?.lat ?? null, lon: pos?.lon ?? null, park: a?.key || '', near: pos ? nearestPlace(pos.lat, pos.lon) : '' };
  const s = PH.cur; const left = PH.queue?.length || 0;
  openModal(`<div class="p-4"><div class="flex items-center justify-between mb-2"><h3 class="display font-bold text-lg">New photo${left ? ` (${left} more waiting)` : ''}</h3><button class="btn btn-sm" data-act="modal-close" aria-label="Close">✕</button></div>
    <img src="${s.url}" alt="Photo preview" class="w-full rounded-xl object-contain" style="max-height:42vh;background:var(--surface2)"/>
    <div class="grid gap-2 mt-3"><div><label class="lbl" for="ph-cap">Caption</label><input id="ph-cap" class="input" maxlength="140" placeholder="What's happening?"/></div>
      <div class="grid grid-cols-2 gap-2"><div><label class="lbl" for="ph-park">Park</label><select id="ph-park" class="input">${parkOpts(s.park)}</select></div><div><label class="lbl" for="ph-near">Near / ride</label><input id="ph-near" class="input" maxlength="80" value="${esc(s.near)}"/></div></div>
      <div class="text-xs muted">Taken ${fmtDT(s.takenAt)}${s.lat ? ' · location tagged' : ''}</div></div>
    <div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="ph-save">Save to trip gallery</button><button class="btn" data-act="ph-phone-new">Save to phone</button><button class="btn" data-act="ph-discard">Discard</button></div><p id="ph-msg" class="text-sm mt-2" role="status"></p></div>`,
  () => { if (PH.cur?.url) URL.revokeObjectURL(PH.cur.url); PH.cur = null; PH.queue = []; stopLive(); });
}
let liveStream = null;
function stopLive() { if (liveStream) { liveStream.getTracks().forEach((t) => t.stop()); liveStream = null; } }
async function liveCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('Live camera not available', 'Use “Open camera” instead.'); return; }
  try { liveStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
  catch { toast('Camera blocked', 'Allow camera access in your browser settings, or use “Open camera”.'); return; }
  openModal(`<div class="p-4"><div class="flex items-center justify-between mb-2"><h3 class="display font-bold text-lg">Live camera</h3><button class="btn btn-sm" data-act="modal-close">✕</button></div>
    <video id="ph-video" class="w-full rounded-xl" playsinline muted autoplay style="background:#000;max-height:60vh"></video>
    <div class="flex gap-2 mt-3"><button class="btn btn-primary flex-1" data-act="ph-shoot">Take photo</button></div></div>`, stopLive);
  $('#ph-video').srcObject = liveStream;
}
async function shoot() {
  const v = $('#ph-video'); if (!v?.videoWidth) return;
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92)); stopLive(); closeModal(); await editorFor(blob, true);
}
async function savePhoto() {
  const s = PH.cur; if (!s) return; setMsg('ph-msg', 'Saving…');
  try {
    const [full, thumb] = await Promise.all([processImage(s.blob, 2000, 0.88), processImage(s.blob, 480, 0.78)]);
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random().toString(16).slice(2);
    const meta = { id, takenAt: s.takenAt, caption: $('#ph-cap').value.trim(), park: $('#ph-park').value, near: $('#ph-near').value.trim(), lat: s.lat != null ? +s.lat.toFixed(5) : null, lon: s.lon != null ? +s.lon.toFixed(5) : null, size: full.size, thumb };
    await dbDo('full', 'readwrite', (st) => st.put(full, id)); await dbDo('meta', 'readwrite', (st) => st.put(meta));
    navigator.storage?.persist?.().catch(() => {});
    const next = PH.queue?.shift(); const q = PH.queue || [];
    closeModal(); toast('Saved to trip gallery', meta.caption || parkTag(meta.park) || 'Photo saved');
    if (next) { PH.queue = q; await editorFor(next.f, next.cam); } else if (S.tab === 'photos') render();
  } catch (e) { setMsg('ph-msg', `Couldn't save: ${e.message || e}. Storage may be full or blocked (private browsing).`, true); }
}
function viewPhotos() {
  const f = S.photoFilter || 'all';
  return `<section class="card p-4"><div class="flex flex-wrap items-center justify-between gap-2"><h2 class="display text-2xl font-extrabold">Trip photos</h2><button class="btn btn-primary" data-act="camera">📷 Take a photo</button></div>
    <p class="text-sm muted mt-1">Stored privately on this device. Use Save to phone to copy one to your camera roll. Clearing the browser's site data deletes them.</p>
    <div class="flex flex-wrap gap-2 mt-3" role="group" aria-label="Filter photos">${[['all', 'All'], ...D.areas.map((a) => [a.key, a.name]), ['resort', 'Hotel / other']].map(([k, l]) => `<button class="chip" data-act="phfilter" data-v="${k}" aria-pressed="${f === k}">${l}</button>`).join('')}</div>
    <div id="gal" class="mt-3"><div class="skel h-24"></div></div><p id="ph-usage" class="text-xs muted mt-2"></p></section>`;
}
async function loadGallery() {
  const box = $('#gal'); if (!box) return;
  PH.urls.forEach((u) => URL.revokeObjectURL(u)); PH.urls = [];
  try {
    const all = (await dbDo('meta', 'readonly', (st) => st.getAll())) || []; all.sort((a, b) => b.takenAt - a.takenAt);
    const f = S.photoFilter || 'all'; const list = all.filter((p) => f === 'all' || p.park === f);
    box.innerHTML = list.length ? `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">${list.map((p) => { const u = URL.createObjectURL(p.thumb); PH.urls.push(u);
      return `<button class="ph-tile" data-act="ph-open" data-id="${p.id}" aria-label="${esc(p.caption || 'Trip photo')}, ${esc(fmtDT(p.takenAt))}"><img src="${u}" alt="${esc(p.caption || 'Trip photo')}" loading="lazy"/><span class="ph-tag">${esc(parkTag(p.park) || fmtDT(p.takenAt))}</span></button>`; }).join('')}</div>`
      : `<div class="card-flat p-4 text-sm">${all.length ? 'No photos with this tag.' : 'No photos yet. Tap “Take a photo” to start your trip album.'}</div>`;
    const est = await navigator.storage?.estimate?.(); const u = $('#ph-usage');
    if (u) u.textContent = `${all.length} photo${all.length === 1 ? '' : 's'}${est?.usage ? ` · about ${(est.usage / 1048576).toFixed(0)} MB used on this device` : ''}`;
  } catch { box.innerHTML = '<div class="card-flat p-4 text-sm" role="alert">Photo storage isn\'t available (private browsing or blocked). You can still use “Save to phone” right after taking a picture.</div>'; }
}
async function openPhoto(id) {
  const meta = await dbDo('meta', 'readonly', (st) => st.get(id)); const full = await dbDo('full', 'readonly', (st) => st.get(id)); if (!meta || !full) return;
  const url = URL.createObjectURL(full); PH.viewId = id;
  openModal(`<div class="p-4"><div class="flex items-center justify-between mb-2"><h3 class="display font-bold text-lg">${esc(fmtDT(meta.takenAt))}</h3><button class="btn btn-sm" data-act="modal-close" aria-label="Close">✕</button></div>
    <img src="${url}" alt="${esc(meta.caption || 'Trip photo')}" class="w-full rounded-xl object-contain" style="max-height:50vh;background:var(--surface2)"/>
    <div class="grid gap-2 mt-3"><div><label class="lbl" for="pv-cap">Caption</label><input id="pv-cap" class="input" maxlength="140" data-pv="caption" value="${esc(meta.caption)}"/></div>
      <div class="grid grid-cols-2 gap-2"><div><label class="lbl" for="pv-park">Park</label><select id="pv-park" class="input" data-pv="park">${parkOpts(meta.park)}</select></div><div><label class="lbl" for="pv-near">Near / ride</label><input id="pv-near" class="input" maxlength="80" data-pv="near" value="${esc(meta.near)}"/></div></div></div>
    <div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="ph-phone" data-id="${id}">Save to phone</button><button class="btn" data-act="ph-del" data-id="${id}">Delete</button></div><p id="ph-msg" class="text-sm mt-2" role="status"></p></div>`,
  () => { URL.revokeObjectURL(url); PH.viewId = null; if (S.tab === 'photos') loadGallery(); });
}

/* ---------- handlers for the features above ---------- */
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  if (el.id === 'modal' ) return;
  const a = el.dataset.act;
  if (a === 'camera') openCamera();
  else if (a === 'map') openMap();
  else if (a === 'goto') openMap({ eid: el.dataset.id });
  else if (a === 'goto-poi') openMap({ pid: el.dataset.pid });
  else if (a === 'gcat') { S.gcat = el.dataset.v; refreshGlobal(); if (!MAP.loaded) loadPois(); }
  else if (a === 'map-close') closeMap();
  else if (a === 'here') hereIAm();
  else if (a === 'pin') { if (MAP.pin) { MAP.pin = null; drawUser(); } else { MAP.pinMode = !MAP.pinMode; $('#mp-map')?.classList.toggle('pinning', MAP.pinMode); } updateStatus(); updateList(); drawMarkers(); if (!MAP.pin && !MAP.pinMode && MAP.dest) routeTo(MAP.dest); }
  else if (a === 'mcat') { MAP.cat = el.dataset.v; MAP.q = ''; const q = $('#mp-q'); if (q) q.value = ''; updateChips(); updateList(); drawMarkers(); }
  else if (a === 'route') routeTo(MAP.by[el.dataset.pid]);
  else if (a === 'route-clear') clearRoute();
  else if (a === 'modal-close') closeModal();
  else if (a === 'ph-cam') $('#ph-in-cam')?.click();
  else if (a === 'ph-lib') $('#ph-in-lib')?.click();
  else if (a === 'ph-live') { closeModal(); liveCamera(); }
  else if (a === 'ph-shoot') shoot();
  else if (a === 'ph-gallery') { closeModal(); location.hash = 'photos'; }
  else if (a === 'ph-save') savePhoto();
  else if (a === 'ph-discard') closeModal();
  else if (a === 'ph-phone-new') { const r = await saveToPhone(PH.cur.blob, `wdw-${etDate(new Date(PH.cur.takenAt))}-${Date.now().toString(36)}.jpg`, $('#ph-cap')?.value); setMsg('ph-msg', r === 'cancelled' ? '' : r === 'shared' ? 'Use “Save Image” in the share sheet to add it to your photos.' : 'Downloaded. Check your Downloads or Photos app.'); }
  else if (a === 'ph-open') openPhoto(el.dataset.id);
  else if (a === 'phfilter') { S.photoFilter = el.dataset.v; render(); }
  else if (a === 'ph-phone') { const id = el.dataset.id; const meta = await dbDo('meta', 'readonly', (st) => st.get(id)); const full = await dbDo('full', 'readonly', (st) => st.get(id));
    const r = await saveToPhone(full, `wdw-${etDate(new Date(meta.takenAt))}-${id.slice(0, 6)}.jpg`, meta.caption); setMsg('ph-msg', r === 'cancelled' ? '' : r === 'shared' ? 'Use “Save Image” in the share sheet to add it to your photos.' : 'Downloaded. Check your Downloads or Photos app.'); }
  else if (a === 'ph-del') { if (!confirm('Delete this photo from the trip gallery?')) return; const id = el.dataset.id; await dbDo('meta', 'readwrite', (st) => st.delete(id)); await dbDo('full', 'readwrite', (st) => st.delete(id)); closeModal(); toast('Photo deleted'); }
  else if (a === 'tk-pause') { setTickerPaused(!$('#ticker').classList.contains('paused')); }
  else if (a === 'tk-loc') { const p = await Geo.once({ maximumAge: 0 }); if (!p) toast('Location not available', Geo.err?.code === 1 ? 'Allow location for this site in your browser settings. Showing Orlando-area weather.' : 'Showing Orlando-area weather.'); loadWeather(true); }
});
document.addEventListener('change', async (ev) => {
  const t = ev.target;
  if (t.id === 'ph-in-cam' || t.id === 'ph-in-lib') { const files = t.files; if (files?.length) { closeModal(); await startEditor(files, t.id === 'ph-in-cam'); } }
  else if (t.id === 'mp-park') { MAP.park = t.value; updateList(); drawMarkers(); const a = D.areas.find((x) => x.key === t.value); if (a && MAP.map) MAP.map.setView([a.lat, a.lon], 16); }
  else if (t.dataset.pv && PH.viewId) { const m = await dbDo('meta', 'readonly', (st) => st.get(PH.viewId)); if (m) { m[t.dataset.pv] = t.value.trim ? t.value.trim() : t.value; await dbDo('meta', 'readwrite', (st) => st.put(m)); setMsg('ph-msg', 'Saved.'); } }
});
document.addEventListener('input', (ev) => { if (ev.target.id === 'mp-q') { MAP.q = ev.target.value; updateChips(); updateList(); drawMarkers(); } });
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (!$('#modal').classList.contains('hidden')) closeModal(); else if (MAP.open) closeMap();
});
$('#modal').addEventListener('click', (ev) => { if (ev.target.id === 'modal') closeModal(); });

/* ---------- init ---------- */
async function fetchServerStatus() {
  for (const [k, u] of [['email', '/api/send-email'], ['sms', '/api/send-sms']]) {
    try { const r = await fetch(u); const j = await r.json(); S.server[k] = j; } catch { S.server[k] = { configured: false, provider: null, defaultTo: S.prefs.email.to, unreachable: true }; }
  }
  if (['sync', 'help'].includes(S.tab) && shouldRerenderStatic()) { const l = $('#srv-line'); if (l) render(); }
}
const shouldRerenderStatic = () => !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');

async function init() {
  const c = LS.get(KEY.cache, null);
  if (c) { S.parks = c.parks || {}; S.sched = c.sched || {}; S.lastRefresh = c.t; S.fromCache = true; rebuildIndex(); }
  const ids = LS.get(KEY.ids, null); if (ids) S.parkIds = ids.ids;
  S.tab = TABS.some(([k]) => k === location.hash.slice(1)) ? location.hash.slice(1) : 'overview';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.classList.contains('dark') ? '#0a1326' : '#1e40af');
  try { localStorage.removeItem('wdw.poi.osm'); } catch { /* ignore */ }
  poiCacheSync(); render(); setStatus(); loadWeather(); setTickerPaused(!!LS.get('wdw.tkPaused', false));
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  fetchServerStatus();
  await refresh();
  loadDeals();
  setInterval(() => {
    setStatus();
    if (document.hidden) return;
    loadWeather();
    const gap = parksActive() ? 3 * 60e3 : 15 * 60e3;
    if (Date.now() - (S.lastRefresh || 0) >= gap) refresh();
  }, 60e3);
}
init();
})();
