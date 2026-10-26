# Etsy integration — current architecture

Storefront: https://www.mybabyshire.com · shop: babyshirekids

## Admin workflow

`/admin/etsy` renders `AdminEtsyImport`, not the historical matching screen.
Load active listings (100 per Etsy page), select visible products, import in groups
of 25 as unpublished records, then review category and publish in
`/admin/site-preview`. Searches clear selection. Publishing validates positive
finite price, images, stock, active state, category, freshness and duplicates.
The legacy catalog-manage endpoint delegates publishing/category operations to
this same handler; title updates are separate. Category + publication writes are atomic.

## Three product types

- Native products remain in `products` as catalog references. New direct checkout is disabled.
- Linked native products retain native content but redirect to their Etsy listing;
  `etsy_product_links` enforces one-to-one mapping. The historical matching APIs
  remain available to authenticated administrators.
- Imported Etsy products live in `etsy_catalog_items`, with `etsy-<id>` URLs and
  Etsy checkout. Refresh preserves custom display titles, categories and publishing.
  Up to eight current Etsy images are available in the product gallery.

The combined public catalog and sitemap exclude imported duplicates of linked
native products. Server-side checkout rejects all new direct payments in Etsy-only mode.
Orders, variants, personalization, shipping, taxes and refunds on Etsy remain on
Etsy; this integration does not synchronize Etsy orders or write to Etsy.

## Authentication and environment

Every admin path validates an HS256 JWT with an admin identity and role. Customer
and OAuth-state tokens are rejected even when signed by the same application key.
ETSY_API_KEY and ETSY_SHARED_SECRET are server-only and sent as
`x-api-key: keystring:shared_secret`. Never prefix credentials with VITE_.

Production needs DATABASE_URL, JWT_SECRET and configured admin authentication.
A future preview needs its own database and authentication secrets. Etsy credentials
alone are insufficient; never copy production database/authentication secrets into
an unreviewed preview. This release does not provision a preview or enable deployments.

## Refresh and resilience

Public list/detail handlers return the database snapshot immediately and register
refresh through Vercel waitUntil. Published items become refresh candidates after
three hours, before the four-hour stale-content cutoff. Twenty items are claimed
at a time using atomic PostgreSQL leases shared across function instances; failures
can retry after five minutes without advancing content timestamps. Per-instance
throttling also avoids repeated checks. Missing batch results are individually
verified with at most four concurrent requests; transient failures never deactivate
an item. Admin sync accepts at most 25 items per call.

The shared Etsy transport uses a 12-second request budget and one retry for 5xx
or a short rate-limit response. Long Retry-After responses are not retried inside
the request. Product and admin functions have a 120-second limit.

Expired title, description, price and images are suppressed, while the approved
catalog slot and Etsy link remain. Refresh failures cannot turn a cached product
detail into a 503. A database failure can still fail the request.

This is request-driven refresh, not a scheduled always-on service. Idle sites may
show the safe placeholder until background refresh completes and the page reloads.

## Schema and releases

Idempotent table initialization establishes `etsy_product_links` before reads;
`etsy_refresh_leases` coordinates refresh, and the catalog table is established
on import. Existing products, orders and publication choices are not migrated.

Run `npm run lint`, `node --import tsx --test tests/*.test.ts`, and `npm run build`
before one reviewed production push. The integrity workflow checks all lib/API/
server/frontend changes and also runs on main. Do not create repeated preview
builds to test changes. Inspect the exact production SHA and perform read-only
catalog/detail/sitemap/authentication smoke checks after deployment.

## Etsy-only transition (October 2026)

`src/config/commerce.ts` is shared by client and server; `ETSY_ONLY_MODE = true`
is independent of environment variables. Re-enabling direct commerce requires
a reviewed release after payment, shipping and tax configuration is complete.

- No new cart synchronization or Stripe/PayPal order creation. Both route adapters
  and checkout/order helpers enforce the block before database/provider calls.
- Existing Stripe webhooks, verification, PayPal capture, account orders and tracking
  remain intact. No provider sessions, credentials or order records are deleted.
- Legacy prices, stock, variant selectors and structured Offer data are hidden;
  current imported Etsy prices can still display with Etsy checkout disclosures.
- Legacy product URLs/content remain. Unlinked items clearly say they cannot be
  purchased here and offer a separate shop-browsing link. No guessed listing URLs.
- The first production catalog request starts a bounded, one-time transition via
  waitUntil. A PostgreSQL lease prevents duplicate execution. At most five Etsy
  pages are fetched; incomplete/changing snapshots abort without linking. Only
  globally unique normalized whole titles match, with no fuzzy/prefix matching.
  Existing links are never overwritten. A transaction persists links and audit.
- `etsy_transition_runs` retains the result, including unmatched product IDs/names
  and aggregate order counts by payment status (no customer data). Admin Etsy
  shows it through the authenticated `transition-status` action. Unmatched items
  need manual verification before a product-specific Etsy link can be assigned.
- Linked native products continue to suppress their imported duplicate in the
  public catalog and sitemap. No products are deleted or unpublished by migration.

Validation: `npm run lint`, `node --import tsx --test tests/*.test.ts`,
`npm run build`; inspect live creation endpoints for 409 ETSY_ONLY_CHECKOUT,
product links and transition log/report after the single production release.

## Etsy-only storefront and clean workspace (26 October 2026)

This supersedes the earlier legacy-catalog transition above. Public list, detail,
sitemap and standalone server now expose only published Etsy imports while
`SALES_CHANNEL_MODE` is `etsy`. Legacy product URLs lead to the collection.
Native creation/editing remains available but active submissions are saved as drafts;
site-preview publication rejects native products in this mode.

`commerceCleanup.ts` performs one transactional, recoverable archive, with a fixed
08:59:06 UTC cutoff. Older native products (including drafts) become archived. Old
orders are excluded from current admin lists via `commerce_archive`; their payment
status, line items, callbacks and customer history remain unchanged. Archive views
and authenticated restore actions are available for products/orders. Newer records
are excluded by the cutoff, and completion prevents re-archiving restored records.
No Etsy catalog record, draft, publication flag or upstream Etsy listing is deleted.

Admin Site Preview supports unpublish (published=false), re-publish with validation,
category and title edits. Unpublish works even when Etsy is unavailable, and sync
never re-publishes an item automatically.

Future dual sales: after payments/shipping/tax are verified, change the shared sales
mode to `dual`. A locally managed, stocked product linked to an Etsy listing then
shows both Etsy and direct-site purchase options. Imported Etsy data alone never
becomes local inventory: create/link a native product first. Direct checkout still
verifies local prices, variants and stock server-side. No payment credentials or
shipping rates are activated by this release.
