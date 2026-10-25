# One-deployment release checklist — mybabyshire.com / Etsy

Release branch: `fix/etsy-catalog-release-audit` (PR #19)
Base: `main` (current production is a prior release)

## What changed
- Published Etsy items no longer disappear from the catalog when refresh is overdue; the cached price is suppressed and the buyer is sent to Etsy for the latest price and options.
- Request-driven Etsy refresh stays bounded; an incomplete Etsy batch is **not** evidence that a listing was deactivated. Missing listings are individually verified.
- Admin bulk actions operate only on the currently visible, selected products; changing search resets the selection.
- Imported Etsy items that appear to duplicate native products show warnings and require an explicit reviewed-duplicate acknowledgment, while already linked Etsy IDs cannot be published twice.
- Structured product data no longer advertises an out-of-date price and uses the real listing currency.
- Tests cover stale prices, duplicate candidates, hidden selection and API transient failures.

## Release procedure (do not run today)
1. Inspect PR #19 and the latest passing GitHub Action (TypeScript, tests, production build).
2. Check Vercel quota before any deployment. Preview deploys were temporarily disabled at project level to prevent automatic consumption during development.
3. **Do not generate repeated Preview deployments.** If an isolated production-like preview is required, re-enable Preview only for one reviewed build, then disable it again.
4. After review and when Vercel quota is available, merge PR #19 to `main`. The Git integration is expected to create **one Production deployment**.
5. Inspect the exact production commit and verify Vercel deployment state READY. Do not redeploy for unchanged files.
6. Check `/api/products`, the admin Site Preview queue, Etsy import counts, the category + publish operation for **one approved test listing**, category navigation, and the Etsy checkout destination.
7. Confirm products remain listed if a cached Etsy price is stale and that no stale price is displayed, including Product JSON-LD.
8. Review Vercel function error logs after the release.
9. Leave the main catalog unchanged unless an administrator explicitly approves publishing changes.

## Important limits
- Duplicate identification is conservative and title-based, not a full visual similarity classifier. Always review similar designs.
- Site-preview publish-to-database flows cannot be fully exercised by GitHub CI without a separate test database; they require a controlled administrator acceptance test on release.
- Product prices, personalization, shipping and tax are finalized on Etsy, not on mybabyshire.com.
- Request-driven Etsy syncing is opportunistic, not a guaranteed always-on scheduler.
