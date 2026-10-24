import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useSeo } from '../utils/seo';

const EFFECTIVE_DATE = 'October 2026';
const SUPPORT_EMAIL = 'hello@mybabyshire.com';
const STORE_NAME = 'MY BABY SHIRE';
// These must be verified against the actual business registration before production release.
const OPERATOR_NAME = import.meta.env.VITE_BUSINESS_LEGAL_NAME || '';
const OPERATOR_ADDRESS = import.meta.env.VITE_BUSINESS_POSTAL_ADDRESS || '';
const OPERATOR_PHONE = import.meta.env.VITE_BUSINESS_PHONE || '';
const OPERATOR_REGISTRATION = import.meta.env.VITE_BUSINESS_REGISTRATION || '';
const OPERATOR_STATE_REGISTRATION = import.meta.env.VITE_BUSINESS_STATE_REGISTRATION || '';


const LEGAL_LINKS = [
  { to: '/policies/shipping', label: 'Shipping Policy' },
  { to: '/policies/returns', label: 'Returns & Refunds' },
  { to: '/policies/privacy', label: 'Privacy Policy' },
  { to: '/policies/terms', label: 'Terms & Conditions' },
  { to: '/policies/cookies', label: 'Cookie Policy' },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8 first:mt-0">
    <h2 className="text-xl font-semibold tracking-[-0.015em] text-[#202020] sm:text-2xl">{title}</h2>
    <div className="mt-3 space-y-3 text-[15px] leading-7 text-[#666]">{children}</div>
  </section>
);

const Bullets = ({ items }: { items: React.ReactNode[] }) => <ul className="space-y-2 pl-5">{items.map((item, index) => <li key={index} className="list-disc marker:text-[#999]">{item}</li>)}</ul>;
const PolicyLink = ({ to, children }: { to: string; children: React.ReactNode }) => <Link to={to} className="font-semibold text-[#202020] underline underline-offset-2">{children}</Link>;
const MailLink = () => <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#202020] underline underline-offset-2">{SUPPORT_EMAIL}</a>;

function LegalLayout({ title, intro, currentPath, children }: { title: string; intro: string; currentPath: string; children: React.ReactNode }) {
  useSeo({ title, description: intro });
  useEffect(() => { window.scrollTo({ top: 0 }); }, [currentPath]);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#202020]">
      <header className="border-b border-[#e8e8e8] bg-white">
        <div className="mx-auto grid min-h-[72px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="commerce-focus inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#202020]"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back to shop</span></Link>
          <Link to="/" aria-label="MY BABY SHIRE home"><BrandLogo variant="nav" className="!h-[42px] !drop-shadow-none" /></Link>
          <div className="justify-self-end text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Policies</div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <article className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-8 lg:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">{STORE_NAME}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-xs text-[#999]">Last updated: {EFFECTIVE_DATE}</p>
          <p className="mt-5 text-[15px] leading-7 text-[#666]">{intro}</p>
          <div className="mt-8 border-t border-[#eeeeee] pt-8">{children}</div>
          <Section title="Business operator & contact">
            <p>Trading name: MY BABY SHIRE. {OPERATOR_NAME ? <>Legal business name: {OPERATOR_NAME}. </> : null}For enquiries, contact <MailLink />.</p>
            {OPERATOR_ADDRESS && <p>Business postal address: {OPERATOR_ADDRESS}</p>}
            {OPERATOR_PHONE && <p>Telephone: {OPERATOR_PHONE}</p>}
            {OPERATOR_REGISTRATION && <p>Business registration: {OPERATOR_REGISTRATION}</p>}
            {OPERATOR_STATE_REGISTRATION && <p>State business registration: {OPERATOR_STATE_REGISTRATION}</p>}
          </Section>
        </article>

        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#666]">
          {LEGAL_LINKS.map((link) => <Link key={link.to} to={link.to} className={link.to === currentPath ? 'font-semibold text-[#202020]' : 'hover:text-[#202020]'}>{link.label}</Link>)}
        </nav>
      </main>
    </div>
  );
}


export function ShippingPolicyPage() {
  return <LegalLayout title="Shipping Policy" currentPath="/policies/shipping"
    intro="Shipping and order fulfillment for U.S. customers, including New York. Please check the checkout channel for each item.">
    <Section title="Etsy purchases"><p>When you select “Buy on Etsy,” Etsy opens the specific seller listing. Check its shipping destinations, processing time, estimated arrival, postage and total before paying. Tracking, cancellations and delivery questions for that order should be raised from the Etsy order.</p></Section>
    <Section title="Direct MY BABY SHIRE purchases"><p>For orders paid through our website, delivery addresses, shipping choices and charges are shown before payment. We offer U.S. checkout for direct orders. Preparation time may vary with customization; any advertised dispatch estimate applies to the product shown.</p></Section>
    <Section title="Shipping promises and delays"><p>Under the FTC Mail, Internet, or Telephone Order Merchandise Rule, sellers must have a reasonable basis for the stated shipping date or, if no date is stated, for shipping within 30 days after a properly completed order. If a direct order cannot be shipped on time, we will offer the choice to agree to a revised shipping date or cancel for a prompt refund, as required by law. We will not treat a delivery estimate as a guarantee.</p></Section>
    <Section title="Address, tracking and delivery problems"><p>Check your shipping address before placing an order. For website orders, the <PolicyLink to="/track-order">Track Order</PolicyLink> page provides available status information. Email <MailLink /> about errors, loss, damage or a late website order. For Etsy orders, use Etsy's order help tools first.</p></Section>
  </LegalLayout>;
}

export function RefundPolicyPage() {
  return <LegalLayout title="Returns & Refunds" currentPath="/policies/returns"
    intro="Return terms for direct MY BABY SHIRE orders in the United States, including New York. Etsy purchases use the seller's policies displayed at Etsy checkout.">
    <Section title="Where you purchased"><p>If you completed your payment on Etsy, the seller's return and cancellation policy shown on the Etsy listing and at checkout governs that order, subject to applicable law. Request help or a refund through the Etsy order. Our website cannot process Etsy payment refunds.</p><p>If you paid through the MY BABY SHIRE website, the direct-order policy below applies.</p></Section>
    <Section title="Standard, non-personalized merchandise"><p>For direct website orders, you may request a return within 30 calendar days after delivery. Merchandise must be unworn, unwashed, undamaged and in its original condition. This option also applies to regularly marked-down standard items unless a specific lawful final-sale exception was clearly disclosed before purchase. Please provide an order number or other reliable proof of purchase.</p><p>To request a return, email <MailLink /> within the return period for instructions and a return address. For change-of-mind returns, you pay the return postage unless we agree otherwise. No restocking fee is charged. Refunds for accepted returns are made to the original payment method rather than store credit. Original outward shipping charges are not refunded for ordinary change-of-mind returns, except where law requires otherwise. Ask for a written copy of this policy at any time.</p></Section>
    <Section title="Made-to-order and personalized items"><p>For direct orders, items produced specifically with your chosen name, date, unique message or approved custom artwork are final sale for a change of mind, provided that restriction was disclosed before purchase. A standard-size or ordinary printed product is not automatically treated as personalized merely because it is printed. The final-sale policy never excludes applicable remedies for goods that are defective, wrongly made, damaged or not as described.</p></Section>
    <Section title="Incorrect, damaged or defective items"><p>Contact <MailLink /> with your order number, a description and photographs where helpful. We will assess an appropriate refund, replacement or other remedy under applicable consumer protection law. Return shipping for an item supplied incorrectly or defective will not be charged to the customer where required by law.</p></Section>
    <Section title="Changes, cancellations and refunds"><p>Contact us promptly for cancellation or changes before production or shipping. If we cannot ship a direct order within the promised period, the applicable FTC delay, cancellation and refund rights apply. Approved refunds are sent back through the original payment provider; processing time may vary by bank and payment service.</p></Section>
    <Section title="New York return-policy notice"><p>This policy is provided before requesting payment information and linked near items for sale, consistent with New York General Business Law §218-a. It discloses the window, proof-of-purchase requirement, refund method, sale-item treatment, fees and return shipping responsibility. Nothing here excludes rights that cannot lawfully be waived.</p></Section>
  </LegalLayout>;
}

export function PrivacyPolicyPage() {
  return <LegalLayout title="Privacy Policy" currentPath="/policies/privacy"
    intro="How MY BABY SHIRE collects and uses information when U.S. customers browse the website, place direct orders or follow Etsy listings.">
    <Section title="Who operates the website"><p>MY BABY SHIRE is the trading name displayed on this site. The legal operator and contact information appear in the business-contact section below when verified. The site targets adult purchasers. Etsy operates its own separate checkout, account and privacy practices when you follow an Etsy listing.</p></Section>
    <Section title="Data we collect"><Bullets items={[
      'Account and contact details including name and email.',
      'Shipping addresses, order details, customization instructions and customer support messages for direct orders.',
      'Optional newsletter subscription and product reviews.',
      'Technical security and diagnostic information used to operate the site.',
      'Optional analytics and marketing events if the relevant preference has been enabled.'
    ]}/></Section>
    <Section title="Purposes and disclosures"><p>We use this information to serve product pages, complete direct orders, support customers, prevent fraud, maintain site security, send order notices and, where requested, send marketing email. Necessary information may be processed by hosting, payment, email, shipping and other service providers. Stripe and PayPal process direct-checkout payments; Etsy processes its own checkout. We do not store full card details in the application database.</p></Section>
    <Section title="Analytics, marketing and cookies"><p>Google Analytics 4 and, if configured, Meta Pixel are optional. Our site's cookie preference panel keeps these tags off until you make a choice to allow them. This is a voluntary privacy control for our U.S.-focused service, not a claim that New York imposes an EU-style cookie-consent law. You may reopen Cookie settings from the footer.</p><p>Etsy-hosted listing photographs may send limited technical request information to the image host, and Etsy's own privacy terms apply when you navigate there. See our <PolicyLink to="/policies/cookies">Cookie Policy</PolicyLink>.</p></Section>
    <Section title="Security and retention"><p>We seek to limit access to customer information, use service providers for necessary operations and retain data as needed for orders, accounting, support, fraud prevention and legal obligations. New York's SHIELD Act may require reasonable administrative, technical and physical safeguards and breach notifications as applicable. Security procedures must be assessed operationally; this notice does not promise absolute security.</p></Section>
    <Section title="Privacy inquiries"><p>You can request information about your account or ask us to correct or delete information where appropriate, subject to necessary record retention and applicable legal requirements, by contacting <MailLink />. Specific state privacy rights vary based on residence, business size, processing activities and applicable law. This notice does not imply every visitor is entitled to an identical deletion right.</p></Section>
    <Section title="Children"><p>Our products may be designed for babies and children, but this shopping site is intended for adults, not children under 13. We do not knowingly solicit account registrations or orders from children under 13. If we learn that information has been collected directly from a child in circumstances covered by COPPA, we will address it in accordance with applicable law.</p></Section>
  </LegalLayout>;
}

export function TermsPage() {
  return <LegalLayout title="Terms & Conditions" currentPath="/policies/terms"
    intro="Terms for browsing MY BABY SHIRE and understanding whether an order is placed directly through our site or on Etsy.">
    <Section title="Two separate checkout channels"><p>Products with a “Buy on Etsy” link open the relevant Etsy listing; the Etsy seller identified there provides the goods and the order is paid through Etsy. Review Etsy's seller terms, product options, delivery, taxes and refund policy before checkout. Purchases made through this website's own cart and Stripe or PayPal checkout are direct website orders.</p></Section>
    <Section title="Products and customizations"><p>Review size, color, description, personalization spelling and any customer-supplied details before purchase. Product details, availability and prices may change; the total shown at the relevant checkout controls the actual payment.</p></Section>
    <Section title="Pricing, tax and payments"><p>Direct website prices are shown in U.S. dollars. Any applicable sales tax and shipping charges must be calculated and clearly displayed before payment. Etsy calculates and displays its own order totals at checkout. Tax obligations depend on the business's physical presence, transaction volume and other applicable nexus rules; this statement does not claim MY BABY SHIRE is registered in New York.</p></Section>
    <Section title="Shipping and refunds"><p>Review our <PolicyLink to="/policies/shipping">Shipping Policy</PolicyLink> and <PolicyLink to="/policies/returns">Returns &amp; Refunds Policy</PolicyLink> before ordering. For direct website transactions, promised shipping dates and legally required delay/cancellation options apply. New York shoppers should see the return policy near products and before billing details.</p></Section>
    <Section title="Reviews and acceptable use"><p>Reviews must reflect genuine customer experiences. We may moderate spam, abusive or irrelevant content without suppressing truthful negative ratings solely because they are unfavorable. Do not misuse the website, attempt unauthorized access or post unlawful content.</p></Section>
    <Section title="Customer support, governing rules"><p>Questions or complaints about direct orders can be sent to <MailLink />. Mandatory federal, state and local consumer protections continue to apply regardless of these terms. These terms do not claim a universal waiver of consumer rights or impose an exclusive forum for all customers.</p></Section>
    <Section title="Etsy independence"><p>This website is independently operated and uses Etsy's API for authorized catalog integration. Etsy has not endorsed or certified this website. Etsy's own terms and privacy practices apply at its checkout.</p></Section>
  </LegalLayout>;
}

export function CookiesPolicyPage() {
  return <LegalLayout title="Cookie Policy" currentPath="/policies/cookies" intro="Learn about optional measurement and marketing technologies and how to control them.">
    <Section title="Necessary storage"><p>Functional storage is used for features such as cart contents, log-in sessions, security and your cookie preferences. These technologies are necessary for the services you request.</p></Section>
    <Section title="Analytics"><p>We use Google Analytics 4 (GA4) only after you enable analytics. It can use cookies to understand site visits and shopping interactions. Without consent, GA4 is not initialised by our application.</p></Section>
    <Section title="Marketing"><p>If configured, Meta Pixel is used for advertising measurement only when you separately allow marketing cookies. Marketing is off by default.</p></Section>
    <Section title="Changing your choice"><p>Choose “Reject optional”, “Accept all” or individual categories on the preference panel. You can reopen this panel through the “Cookie settings” link in the page footer. You can also delete cookies using your browser settings.</p></Section>
    <Section title="External destinations"><p>Following a “Buy on Etsy” link takes you to Etsy, where its own cookies and privacy practices apply. See <a href="https://www.etsy.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="underline">Etsy's Privacy Policy</a>.</p></Section>
  </LegalLayout>;
}
