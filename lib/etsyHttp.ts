// Shared server-only transport. Retry transient failures within one bounded timeout.
export async function etsyRequest(path: string): Promise<any> {
  const key = process.env.ETSY_API_KEY;
  const secret = process.env.ETSY_SHARED_SECRET;
  if (!key || !secret) throw new Error('Etsy credentials are missing.');
  const signal = AbortSignal.timeout(12000);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.etsy.com/v3/application' + path, {
      headers: { 'x-api-key': `${key}:${secret}`, Accept: 'application/json' },
      signal, cache: 'no-store',
    });
    if (response.ok) return response.json();
    const retryAfter = Number(response.headers.get('retry-after'));
    const delay = response.status === 429 ? (retryAfter > 0 ? retryAfter * 1000 : 1000) : 300;
    if (attempt === 0 && (response.status === 429 || response.status >= 500) && delay <= 1000) {
      await response.body?.cancel();
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    if (response.status === 401 || response.status === 403) throw new Error('Etsy rejected API access. Check approved app credentials and permissions.');
    throw new Error(`Etsy API request failed (HTTP ${response.status}).`);
  }
}
