# Full-site technical / legal audit — release gate (24 October 2026)

This is a technical review and a consumer-information checklist, **not a legal opinion**.
The current production deployment is NOT updated by this branch.

## Prepared code changes
- All publicly visible pages display footer links, the existing Ömer YİĞİTLER credit (https://omeryigitler.com), and the Etsy API trademark/non-endorsement notice.
- A cookie preferences panel gives separate default-OFF controls for Google Analytics and Meta marketing; no optional tracking is initialised before consent, and choices can be withdrawn from the footer.
- Separate Cookie Policy plus updated Privacy, Terms, Shipping and Returns sections describe two payment routes: native MY BABY SHIRE checkout vs external Etsy.
- Old ProductForm browser alerts use the administrator's in-app notice system. Inactive Etsy matching screen confirms through existing in-app admin confirmation mechanism. Removed the global override of window.alert.
- The active custom-select and product reviews have monochrome styling; dormant legacy components were not removed because they are not part of the currently mounted storefront.
- Etsy listings older than the conservative four-hour refresh threshold display generic MY BABY SHIRE placeholders and a canonical Etsy destination rather than old Etsy titles, images, descriptions, prices or quantities. This is essential: Etsy API terms restrict ALL listing content to six hours, not just price.
- The pending PR #19 safety fixes (duplicates, stale-price gating, bulk selection) remain the base of this branch.

## Legal / operational blockers requiring verified business information

1. **Confirm legal operator**: VITE_BUSINESS_LEGAL_NAME, VITE_BUSINESS_POSTAL_ADDRESS, VITE_BUSINESS_PHONE (where available), VITE_BUSINESS_REGISTRATION (if applicable), and VITE_BUSINESS_VAT_NUMBER (if applicable). Do not invent values. Confirm publicly accessible trader-identification details before treating the policies as complete. Contact email currently used: hello@mybabyshire.com (verify mailbox is working).
2. **Confirm whether native Stripe/PayPal checkout is still active**. If yes, review and test tax, delivery country restrictions, statutory cancellation/return rights, merchant identity, accessibility, legal guarantees, refund execution, order confirmation and information directly before payment. If Etsy-only is desired, native checkout and cart must be disabled in a separate reviewed release, not merely described as Etsy-only.
3. **Approve final legal texts with a Malta/EU-qualified professional**, including correct trader identity, withdrawal exceptions for genuinely personalised goods, after-sales guarantees, warranty and refund handling, privacy processing records, international data transfers, and ADR information. EU ODR website was permanently shut down 20 July 2025 — do not add an obsolete ODR link.
4. **Etsy developer permission**: confirm that app purpose, personal/commercial access and use of catalogue data and photos on mybabyshire.com are consistent with the approved Etsy Developer account and current API Terms. Use the exact required trademark statement.
5. **Product safety (EU GPSR) and textile labels**: confirm manufacturer, EU responsible person where applicable, any safety warnings, fibre composition, age and safety information are available before purchase where required; add product-specific data fields to catalog as needed. This is important for infant/kids clothing.
6. **Privacy records**: verify retention periods and processors (hosting, analytics, optional Meta Pixel, emailing, payments, Etsy), consent logs, DPA agreements, and country transfers. Existing newsletter flow must be checked for verifiable opt-in and unsubscribe.
7. **Accessibility**: complete browser/keyboard/screen reader and mobile checkout tests; this code-only audit does not establish full compliance with applicable accessibility legislation.

## Next release once Vercel quota is available
- Keep preview deployments disabled by default. Merge the audit PR stack after passing GitHub CI.
- One reviewed production release, then smoke-test home/products/collections, policy routes, credit link, consent reject/accept/withdraw, a catalog selection, and **one authorised product publication and return to draft**.
- Confirm no unapproved item is published. Verify Etsy URL and final seller on Etsy, and old cache redaction after a forced stale response.
- No automatic release is scheduled by this document. Do not presume production readiness without real database and business/legal-owner checks.

## Official references
- https://www.etsy.com/legal/api
- https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011L0083
- https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02023R0988-20260529
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32011R1007
- https://www.edpb.europa.eu/edpb-cookie-policy_en
