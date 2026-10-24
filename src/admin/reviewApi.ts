// Reviews use the existing generic /api catch-all function, not the unreliable
// nested /api/admin catch-all. This does not add another Vercel serverless function.
export const REVIEW_MODERATION_PATH = '/api/review-moderation';

export async function parseReviewApiResponse(response: Response): Promise<any> {
  const kind = response.headers.get('content-type') || '';
  if (!kind.toLowerCase().includes('application/json')) {
    if (response.status === 401 || response.status === 403) throw new Error('Unauthorized. Please sign in again.');
    throw new Error('Reviews service returned an invalid response (HTTP ' + response.status +
      '). The API route may be unavailable; try Refresh or contact support.');
  }
  let data: any;
  try { data = await response.json(); }
  catch { throw new Error('Reviews service returned invalid JSON (HTTP ' + response.status + ').'); }
  if (!response.ok) throw new Error(String(data?.error || data?.details || 'Review request failed (HTTP ' + response.status + ').'));
  return data;
}
