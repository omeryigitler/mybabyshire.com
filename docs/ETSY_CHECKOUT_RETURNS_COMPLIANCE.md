# Etsy checkout, returns and payments — release review

## Verified Etsy policies (24 Oct 2026)
- Etsy return/exchange settings are applied to **each physical listing**. They can differ; a 30-day return term is Etsy's optional “simple return policy” template, not a universal Etsy policy.
- The independent MY BABY SHIRE site 30-day standard-item return policy applies **only to direct Stripe/PayPal orders**, subject to confirmation by the business. Do not present it as the policy for Etsy orders.
- Etsy buyers: Purchases & reviews > Help with Order; discuss returns/changes with the Etsy seller. An Etsy seller issues a refund using Etsy Shop Manager; refunding and cancelling are separate actions.
- Etsy Purchase Protection is conditional (not-delivered, damaged, significantly-not-as-described, certain late orders). Contact the seller first; eligible buyers may open an Etsy case after the required delay. Do not advertise automatic protection for every return.
- On Etsy, taxes and shipping are computed at Etsy checkout. Etsy is a marketplace facilitator and generally collects/remits applicable US marketplace sales taxes under the relevant rules. This does NOT cover separate direct site Stripe/PayPal transactions.
- Etsy's off-platform rules prohibit taking Etsy-initiated transactions outside Etsy, including extra shipping/tax payments after checkout. Our product details link **into** Etsy; we must not direct Etsy buyers to pay on mybabyshire.com.
- API data age limitation and API commercial-use approval remain separate compliance checks.

## Implemented code safeguards
- The product page explicitly distinguishes Etsy-specific returns/cancellations and link destination.
- Checkout blocks saved Etsy cart entries, while the server rejects even manually submitted native products already linked to Etsy.
- Policy documents explain the difference between Etsy and direct payment channels. They do not assert what babyshirekids' particular listing return policy is because this has not been verified from your Etsy seller account.
- Direct checkout remains a separate product and is **not certified tax-ready**; the NY flat rate must be replaced with locality + product eligibility calculations, or direct checkout must be disabled before release.

## Merchant checklist (MUST confirm before releasing policies)
1. In Etsy Shop Manager > Settings > Policy settings, verify **Cancellations**, **Privacy** and every active physical listing's **Returns & exchanges** setting.
2. For standard, personalized, made-to-order and sale items, check which Etsy return policy is attached to each and whether shipping charges and customization wording match actual fulfillment.
3. Confirm the direct website 30-day returns promise, or choose a different compliant direct-site policy and update before deploy. Do not assume Etsy policy is identical.
4. Confirm shop identity, processing times, returns address and refund workflow; buyer can contact seller through Etsy orders.
5. Complete address-based sales tax and applicable apparel exemptions for direct website checkout, or keep direct payment unavailable until ready.
6. Test one Etsy Buy button, seller identity, listing policy, Etsy order help navigation and one controlled direct-order checkout before enabling both channels.

## Source URLs
- https://help.etsy.com/hc/en-us/articles/7869401615255-How-do-I-Set-Return-Policies-on-My-Listings
- https://help.etsy.com/hc/en-us/articles/360000572888-Refunds-Returns-and-Exchanges-for-Sellers
- https://help.etsy.com/hc/en-us/articles/360002089188-How-to-Issue-a-Full-or-Partial-Refund-For-an-Order
- https://help.etsy.com/hc/en-us/articles/4402660818583-How-to-Get-Help-with-An-Order
- https://help.etsy.com/hc/en-us/articles/7471925990807-Etsy-s-Purchase-Protection-Program
- https://www.etsy.com/legal/policy/off-platform-transactions-policy/1254654515806
- https://help.etsy.com/hc/en-us/articles/360000343968-How-US-State-Sales-Tax-and-Fees-Applies-to-Etsy-Orders
- https://www.tax.ny.gov/pubs_and_bulls/publications/sales/marketplace.htm
