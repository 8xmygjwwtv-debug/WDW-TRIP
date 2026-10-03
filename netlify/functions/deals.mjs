import { fetchDeals } from '../lib/themeparks.mjs';

export default async () => {
  const deals = await fetchDeals();
  return new Response(JSON.stringify({ deals, fetchedAt: new Date().toISOString() }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=900' },
  });
};
export const config = { path: '/api/deals' };
