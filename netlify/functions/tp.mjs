// Caching proxy for ThemeParks.wiki so every device shares one upstream request and CORS is never an issue.
const ALLOWED = /^\/(destinations|entity\/[0-9a-f-]{36}\/(live|children|schedule(\/\d{4}\/\d{1,2})?))$/i;

export default async (req) => {
  const path = new URL(req.url).searchParams.get('path') || '';
  if (!ALLOWED.test(path)) return new Response(JSON.stringify({ error: 'path not allowed' }), { status: 400, headers: { 'content-type': 'application/json' } });
  try {
    const r = await fetch(`https://api.themeparks.wiki/v1${path}`, { headers: { accept: 'application/json', 'user-agent': 'wdw-trip-dashboard/1.0' } });
    const body = await r.text();
    const live = /\/live$/.test(path);
    return new Response(body, {
      status: r.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': r.ok ? `public, max-age=${live ? 30 : 600}, s-maxage=${live ? 60 : 900}` : 'no-store',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
export const config = { path: '/api/tp' };
