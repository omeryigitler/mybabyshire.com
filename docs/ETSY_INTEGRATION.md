# Etsy product-link integration (phase 1)

Storefront: https://www.mybabyshire.com
Etsy shop: https://babyshirekids.etsy.com/
Admin route: `/admin/etsy`

## Safe rollout

1. The **Production** project currently has `ETSY_API_KEY` and `ETSY_SHARED_SECRET`. Both are server-only. Never use a `VITE_` prefix for Etsy credentials.
2. For Preview deployments, the Etsy variables are configured. A real admin test also requires an isolated Preview database and Preview-only admin authentication variables (`DATABASE_URL`, `JWT_SECRET`, and admin login credentials). **Never point an unreviewed Preview branch at the Production database or reuse Production admin secrets.**
3. Open `/admin/etsy` with an authenticated admin account. The **Connected** status confirms that Etsy responded with the expected shop ID. It is not a promise of permanent availability.
4. Click **Load all Etsy listings**; results are fetched 100 at a time, up to Etsy's maximum offset of 12,000, without writing anything to either storefront.
5. Review exact unique-title matches, then explicitly approve **Review & apply exact matches**. The server re-fetches each page and validates each match before writing its association. Any ambiguity stays unlinked.
6. Manually match exceptions by selecting an Etsy listing and searching for the local product. A listing cannot be assigned to two products, and existing product links are not silently overwritten. Remove a link to change it.
7. Verify links on product cards and detail pages. Only linked products show **Buy on Etsy**; clicking opens that specific Etsy listing in a new tab.
8. Keep `VITE_ETSY_ONLY_MODE=false` until the catalog has been checked. When true, the old /checkout route is unavailable, unmapped product detail pages are explicitly marked unavailable for Etsy checkout, and product cards route buyers to product detail pages rather than the personalization flow.

## API behavior

- Reads the publicly available active listings from `GET /v3/application/shops/{shop_id}/listings/active` with `x-api-key: <keystring>:<shared-secret>`.
- Shop identity is independently resolved using `GET /v3/application/shops?shop_name=babyshirekids` and verified by exact case-insensitive shop name.
- Private listings, draft data, Etsy order editing, and write access require separate OAuth authorization; **not** part of this phase.
- Only Etsy listing IDs are accepted by the matching API. URLs are constructed in the server as `https://www.etsy.com/listing/{id}`. Arbitrary redirect URLs and external hosts are rejected.
- The mapping is stored in a separate `etsy_product_links` table on the app's existing PostgreSQL database. It is created on the first authenticated link operation, with a foreign key to `products(id)`. Existing product, order, payment, or shipping columns are not changed.
- The Etsy API can rate-limit requests. The admin page provides progress and can be retried. If a bulk operation is interrupted, successfully written links remain preserved.

## Protected endpoints

All endpoints require existing admin bearer authentication:

- `GET /api/admin/etsy?action=status`: keys configured, shop reachable, current number of mapped products.
- `GET /api/admin/etsy?action=listings&offset=0`: 100 active Etsy listings at a time.
- `GET /api/admin/etsy?action=links`: current local mappings.
- `POST /api/admin/etsy?action=link`: verify and map a single `{ productId, listingId }`.
- `DELETE /api/admin/etsy?action=link`: unlink by `{ productId }`.
- `POST /api/admin/etsy?action=bulk-link`: map up to 100 same-page unique exact-title pairs with `{ confirmed: true, offset, pairs }`.

All Etsy requests happen on the server. No API key, shared secret, or OAuth token is sent to browsers.

## Limitations / future work

- Exact titles can differ across Etsy and mybabyshire.com. These require manual review or a future verified SKU-based matching flow.
- Etsy inventory, sizes, personalization, pricing, shipping, taxes, and buyer checkout stay owned by Etsy. Local product content is not overwritten.
- This release **does not** automatically create mybabyshire.com product records for Etsy listings not yet in the local catalog.
- Etsy listing deletion or deactivation after linking is not checked on every customer click. A scheduled reconciliation with rate-limit handling is a later stage.
- Enable Etsy-only mode only after validating all publicly offered local products and deactivating/unpublishing unmatched items as needed.
- No changes to live Production should be inferred from an unmerged feature branch.
