# Site Preview & Publish — Etsy + MyBabyShire catalog

## Authoring flow
- **Admin > Products**: Add native product. New products are always saved with `status=draft`, regardless of any old browser draft state.
- **Admin > Etsy Import**: Load active Etsy listings and see image, description, native currency price and listing URL. Select one or multiple; **Move to Preview** writes them to the separate `etsy_catalog_items` staging table, with `published=false`. Imports are keyed by immutable Etsy listing IDs and are idempotent.
- **Admin > Site Preview & Publish**: Both draft sources appear together. Preview, assign a MyBabyShire category, optionally shorten the displayed Etsy name and publish/unpublish one or many. The publish operation requires an explicit selection and confirmation. Multiple sources are sent as separate batches.
- All previously live site products remain published. No Etsy listing is published automatically.

## Website behavior
- Native products retain their current storefront and checkout behavior. Published Etsy products have a local detail page and a canonical Etsy listing checkout link.
- Etsy money is displayed in its source currency. Variations, personalization, final price, shipping and tax are finalized on Etsy.
- Only recently synced, active Etsy items that have images and positive stock are visible publicly.
- Etsy data is refreshed opportunistically during storefront requests in bounded batches when the cached Etsy data is older than four hours; items older than five hours are not shown until verified. Admins can force refresh at any time from the preview queue.
- The Etsy catalog is stored in a standalone table and does not overwrite current native product rows. Category selections, publishing and custom display titles are preserved across Etsy refreshes.
- Etsy listings already associated with existing native products via `etsy_product_links` are not imported again. Separately titled lookalikes should still be reviewed before publishing to prevent visual duplicates.

## Rollout safety
- Etsy API keys live server-side in Vercel environment variables.
- Importing, categorizing and publishing are admin-only actions. The storefront does not expose the unpublished queue.
- The table is created on first authorized Etsy catalog import; no destructive migrations or existing data resets.
- Batch limits: 25 IDs for import or publish management, 100 IDs for refresh. Client-side bulk operations split selections into bounded calls.
- Import does not publish; a separate explicit action changes published state.
- The integration does not write products or orders back to Etsy.
- There is no guaranteed background scheduler on all Vercel plans. The automatic refresh here is request-triggered; fail-closed freshness protects users from stale Etsy catalog data. A dedicated cron/queue service can later provide more consistent refresh even during periods of no traffic.
- Production and Preview app versions may not share databases; production is not used as an isolated test fixture.

## Admin routes
- `GET /api/admin/etsy?action=catalog-preview&offset=0` — one page of Etsy listing details with prices and images
- `GET /api/admin/etsy?action=catalog-managed` — imported Etsy entries
- `POST /api/admin/etsy?action=catalog-import` — `{ ids: string[] }`
- `POST /api/admin/etsy?action=catalog-sync` — `{ ids: string[] }`
- `GET /api/admin/etsy?action=site-preview` — unified queue of native and Etsy items and available categories
- `POST /api/admin/etsy?action=site-preview` — `{ source, ids, operation: 'publish'|'unpublish'|'category', categoryId? }`
- `POST /api/admin/etsy?action=catalog-manage` — Etsy-only local display-name edits, never writes to Etsy

See `docs/ETSY_INTEGRATION.md` for previous native association feature.
