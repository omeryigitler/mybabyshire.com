import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReviewApiResponse, REVIEW_MODERATION_PATH } from '../src/admin/reviewApi.js';

test('uses the existing generic catch-all review route', () => {
  assert.equal(REVIEW_MODERATION_PATH, '/api/review-moderation');
});
test('readable errors for HTML 404 instead of unexpected token', async () => {
  const response = new Response('The page could not be found', { status: 404, headers: { 'Content-Type': 'text/html' } });
  await assert.rejects(parseReviewApiResponse(response), /invalid response \(HTTP 404\)/);
});
test('rejects malformed JSON response', async () => {
  const response = new Response('{not json', { status: 200, headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(parseReviewApiResponse(response), /invalid JSON/);
});
test('accepts a well-formed review list', async () => {
  const response = new Response('[{"id":"abc"}]', { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  assert.deepEqual(await parseReviewApiResponse(response), [{ id: 'abc' }]);
});
