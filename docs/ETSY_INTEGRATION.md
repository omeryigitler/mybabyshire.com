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

- Native products live in `products` and use direct Stripe/PayPal checkout.
- Linked native products retain native content but redirect to their Etsy listing;
  `etsy_product_links` enforces one-to-one mapping. The historical matching APIs
  remain available to authenticated administrators.
- Imported Etsy products live in `etsy_catalog_items`, with `etsy-<id>` URLs and
  Etsy checkout. Refresh preserves custom display titles, categories and publishing.
  Up to eight current Etsy images are available in the product gallery.

The combined public catalog and sitemap exclude imported duplicates of linked
native products. Server-side checkout rejects imported and linked Etsy products.
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
