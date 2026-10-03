// Server-side helpers for ThemeParks.wiki (used by the scheduled alerts function) + short-notice deals feed.
const BASE = 'https://api.themeparks.wiki/v1';

export const PARKS = [
  { key: 'mk', name: 'Magic Kingdom', id: '75ea578a-adc8-4116-a54d-dccb60765ef9' },
  { key: 'epcot', name: 'EPCOT', id: '47f90d2c-e191-4239-a466-5892ef59a88b' },
  { key: 'hs', name: 'Hollywood Studios', id: '288747d1-8b4f-4a64-867e-ea7c9b27bad8' },
  { key: 'ak', name: "Animal Kingdom", id: '1c84a229-8862-4648-9c71-378ddd2c7693' },
];

async function getJson(url, ms = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: 'application/json', 'user-agent': 'wdw-trip-dashboard/1.0' } });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

/** Resolve park ids by name from /destinations; fall back to the hard-coded ids. */
export async function resolveParks() {
  try {
    const j = await getJson(`${BASE}/destinations`);
    const dest = (j.destinations || []).find((d) => /walt disney world/i.test(d.name));
    if (!dest) return PARKS;
    return PARKS.map((p) => {
      const m = (dest.parks || []).find((x) => x.name.toLowerCase().includes(p.name.toLowerCase()));
      return { ...p, id: m?.id || p.id };
    });
  } catch { return PARKS; }
}

export async function fetchLive(parkId) {
  const j = await getJson(`${BASE}/entity/${parkId}/live`);
  return (j.liveData || []).filter((e) => ['ATTRACTION', 'RESTAURANT', 'SHOW'].includes(e.entityType));
}

export async function fetchSchedule(parkId, year, month) {
  const j = await getJson(`${BASE}/entity/${parkId}/schedule/${year}/${month}`);
  return j.schedule || [];
}

/* ---------- Short-notice deals (headline + link only) from public blog RSS feeds ---------- */
const FEEDS = [
  { source: 'Disney Tourist Blog', url: 'https://disneytouristblog.com/feed/' },
  { source: 'Disney Food Blog', url: 'https://www.disneyfoodblog.com/feed/' },
  { source: 'WDWNT', url: 'https://wdwnt.com/feed/' },
];
const DEAL_RE = /(discount|deal|offer|save|savings|sale|promo|special|free|short[- ]notice|last[- ]minute|ticket|bogo|\$\d+ off|% off)/i;
const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#8217;|&#039;|&#x27;/g, "'").replace(/&#8211;|&#8212;/g, '-').replace(/&#8220;|&#8221;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};

export async function fetchDeals() {
  const out = [];
  await Promise.allSettled(FEEDS.map(async (f) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10000);
    try {
      const r = await fetch(f.url, { signal: ctl.signal, headers: { 'user-agent': 'wdw-trip-dashboard/1.0' } });
      if (!r.ok) return;
      const xml = await r.text();
      const items = xml.split(/<item[ >]/i).slice(1, 25);
      for (const it of items) {
        const title = tag(it, 'title');
        const link = tag(it, 'link');
        if (!title || !link || !DEAL_RE.test(title)) continue;
        out.push({ id: link, title, link, source: f.source, date: tag(it, 'pubDate') });
      }
    } catch { /* ignore a failing feed */ } finally { clearTimeout(t); }
  }));
  out.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return out.slice(0, 20);
}
