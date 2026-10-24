# U.S. / New York legal and Reviews release audit — 24 October 2026

## Target market
- This storefront primarily serves U.S. customers, with New York as a key target. Do **not** state it is legally incorporated or physically based in New York without verified registration and address details.
- Consumer notices were rewritten away from the previous EU/Malta default. The prior 14-day EU withdrawal language no longer applies as a blanket statement for U.S. orders. Other states/countries may have independent mandatory requirements.
- Draft direct-channel return terms: **30 calendar days after delivery for unused standard items**, proof of purchase, original-payment refunds, no restocking fees, customer return postage for change of mind; clearly personalized work is final sale for change of mind but defects and misdescribed items retain remedies.
- This is a binding commercial choice once released. The merchant **must confirm and approve these return terms** before deployment. Etsy checkout purchases follow the Etsy listing's seller terms, subject to law.
- New York GBL §218-a: accessible refund policy near goods or before payment information; disclose refund conditions, final-sale treatment, proof of purchase, deadline, refund form, fees, written copy on request.
- FTC 16 CFR Part 435: advertised dispatch time must have a reasonable basis, otherwise the general 30-day shipment default; provide legally required delay/cancellation options and prompt refunds.
- NY SHIELD Act: operational data security safeguards, breach response and recordkeeping; policy prose alone is insufficient.
- NY tax: verify physical-presence nexus and remote economic-nexus rules, including $500,000 receipts **and** more than 100 NY sales over four prior sales tax quarters for remote sellers under NY's published threshold; marketplace sales count. Some apparel is exempt, and rates depend on address and details. Do not assume the checkout implementation is tax compliant without end-to-end verification.
- FTC COPPA: audience is intended to be adults buying children's clothing; whether it is child-directed depends on substance and marketing, not disclaimer alone.
- FTC review rules: do not approve reviews based solely on favorable ratings or manipulate average sentiment; genuine negative reviews must not be disproportionately excluded.

## Technical fix: Reviews
- Admin Reviews now uses `/api/review-moderation` through the existing general-purpose API function instead of a potentially unmatched nested catch-all route.
- All GET/PUT/DELETE actions preserve requireAdmin authorization and use the same existing review handlers.
- The UI validates Content-Type and does not attempt to parse HTML/error text as JSON.
- Tests cover successful JSON, malformed JSON, unexpected HTML, and route selection.
- Production behavior still requires one authorized read-only review fetch, one controlled moderation action, and confirmation that approved reviews appear publicly. Code-level tests cannot confirm Vercel's live routing.

## Publication blockers
1. Confirm legal business name, state of incorporation/registration if applicable, business mailing/contact address and appropriate tax registrations without inventing data.
2. Confirm the proposed direct-order 30-day standard return terms, personalised items rule, defective-goods remedies, return postage and no-restocking-fee promise.
3. Confirm actual direct checkout shipping and tax calculations for a New York address and FTC late-delivery cancellation operations.
4. Assess COPPA, SHIELD, newsletter unsubscribes/CAN-SPAM and FTC reviews workflows, plus Etsy API permission and content cache age.
5. Once authorized, run one controlled Production deploy after CI passes; do not automatically publish products.

## Primary sources
- New York General Business Law §218-a: https://law.justia.com/codes/new-york/gbs/article-12-b/218-a/
- FTC mail/internet order rule: https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule
- NY SHIELD: https://ag.ny.gov/resources/organizations/data-breach-reporting/shield-act
- NY sales tax nexus: https://www.tax.ny.gov/pubs_and_bulls/publications/sales/nexus.htm
- FTC customer reviews rule: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers
- FTC COPPA: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- Etsy API terms: https://www.etsy.com/legal/api
