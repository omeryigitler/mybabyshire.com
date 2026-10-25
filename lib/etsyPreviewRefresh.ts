/**
 * Splits Etsy preview items into small, bounded server requests.
 * Fresh native products are never sent to the Etsy sync endpoint.
 */
export type PreviewRefreshCandidate = { source: string; id: string; staleData?: boolean };
export function planEtsyPreviewRefresh(
  items: readonly PreviewRefreshCandidate[],
  staleOnly = true,
  batchSize = 20,
): string[][] {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 25) {
    throw new Error('Invalid Etsy preview refresh size.');
  }
  const ids = new Set<string>();
  for (const item of items) {
    if (item.source !== 'etsy' || !/^\d{1,20}$/.test(item.id)) continue;
    if (staleOnly && !item.staleData) continue;
    ids.add(item.id);
  }
  const list = [...ids];
  const result: string[][] = [];
  for (let index = 0; index < list.length; index += batchSize) {
    result.push(list.slice(index, index + batchSize));
  }
  return result;
}
