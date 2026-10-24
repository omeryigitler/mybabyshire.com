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
const OPERATOR_VAT = import.meta.env.VITE_BUSINESS_VAT_NUMBER || '';


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
            {OPERATOR_VAT && <p>VAT registration: {OPERATOR_VAT}</p>}
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
  return (
    <LegalLayout title="Shipping Policy" currentPath="/policies/shipping" intro="Shipping arrangements differ depending on whether you pay on Etsy or use MY BABY SHIRE's own checkout.">
      <Section title="Where You Place the Order"><p>Some product pages open the specific Etsy listing for checkout. For those orders, the shipping destinations, dispatch estimates, delivery charges and carrier services shown at Etsy checkout are the terms presented before you pay. Other products may be purchased directly through this website using its own checkout.</p><p>Always check the order confirmation from the checkout service where you completed your purchase. Etsy and MY BABY SHIRE may display different estimates if product options, destinations, or taxes differ.</p></Section>
      <Section title="Order Preparation"><p>Preparation time can vary by product and by whether customization is required. The preparation estimate shown on the product page or order record applies to that item.</p><p>Preparation time is separate from carrier transit time.</p></Section>
      <Section title="Shipping Methods & Rates"><p>Available shipping methods, rates and delivery estimates are shown during checkout based on the shipping configuration active at the time of purchase.</p><p>Carrier names, rates and delivery windows are not guaranteed until they are shown on the customer’s checkout or order confirmation. Carrier delivery estimates are estimates rather than guaranteed delivery dates unless explicitly stated by the carrier.</p></Section>
      <Section title="Tracking"><p>When tracking information has been assigned to an order, it can be viewed from the <PolicyLink to="/track-order">Track Order</PolicyLink> page using the order reference or tracking number together with the verification information requested there.</p></Section>
      <Section title="Address Accuracy"><p>Customers should review the shipping address before completing an order. If an address needs to be corrected, contact us as soon as possible. Changes may not be possible after an order has entered fulfillment or been transferred to a carrier.</p></Section>
      <Section title="Delays, Loss or Damage"><p>If an order appears delayed, lost or damaged, contact <MailLink /> with the order reference and available tracking information. Resolution options depend on the order status, carrier information and the circumstances of the shipment.</p></Section>
    </LegalLayout>
  );
}

export function RefundPolicyPage() {
  return (
    <LegalLayout title="Returns & Refunds" currentPath="/policies/returns" intro="Return eligibility can depend on whether an item is standard merchandise or was customized specifically for the customer.">
      <Section title="Personalised Items"><p>Under applicable EU consumer rules, goods made to a customer's specifications or clearly personalised can be excluded from the usual 14-day change-of-mind withdrawal right. This exception does not automatically apply to every printed shirt or ready-made size and does not take away statutory remedies if goods are faulty, damaged or incorrectly supplied.</p><p>Read the individual listing and the checkout terms before ordering. Once the order is placed, contact the seller promptly to request any changes.</p></Section>
      <Section title="Damaged, Defective or Incorrect Items"><p>If an item arrives damaged, defective or materially different from the order, contact <MailLink /> with the order reference and evidence of the issue so the request can be reviewed.</p></Section>
      <Section title="Cancellations & Changes"><p>Contact us as quickly as possible if an order needs to be changed or cancelled. Whether a change can be made depends on the current production and fulfillment status.</p></Section>
      <Section title="Standard Items & Withdrawal"><p>For eligible distance purchases by EU consumers, the statutory withdrawal period is generally 14 days after delivery of the goods. Exceptions apply under consumer law. This policy does not restrict statutory cancellation or legal guarantee rights. Return shipping costs and the required withdrawal procedure must be disclosed before purchase.</p><p>If you bought through Etsy, request a return via the Etsy order and seller communication tools; Etsy's dispute and case processes may also apply. If you used this site's own checkout, contact <MailLink /> and identify the order. Do not send returns without the correct return address and instructions.</p></Section>
      <Section title="Refund Processing"><p>Refunds and statutory reimbursements are processed through the payment channel used for the order, subject to the buyer's applicable legal rights. Etsy orders must be handled through the Etsy seller/payment process; this website cannot process a refund for a transaction completed on Etsy.</p></Section>
    </LegalLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" currentPath="/policies/privacy" intro={`${STORE_NAME} uses customer information to operate the store, fulfill orders, maintain accounts and provide support.`}>
      <Section title="Controller & Checkout Destinations"><p>MY BABY SHIRE operates this website. Some product links take you to Etsy, which separately operates its own website, checkout and privacy notices. When you move to Etsy, your use of that service is subject to Etsy's privacy information. We do not collect your Etsy card details on this website.</p><p>For legal-operator details see the business operator section below; those details must be confirmed before these notices can be treated as final.</p></Section>
      <Section title="Information We Collect"><Bullets items={['Contact information such as name and email address.','Shipping and order information supplied during checkout.','Customization details supplied for products that require them.','Account information and order history when an account is used.','An email address submitted voluntarily through the newsletter form.','Limited technical and security information needed to operate and protect the site.']} /></Section>
      <Section title="Payments"><p>Full card credentials are handled by the payment service used for checkout rather than being stored directly in the MY BABY SHIRE application database. The exact payment provider available to a customer is the provider presented during checkout.</p></Section>
      <Section title="How Information Is Used"><Bullets items={['To process and fulfill orders.','To provide order, account and tracking functionality.','To send transactional communications and support replies.','To send newsletter or store updates when an email address is voluntarily submitted for that purpose.','To prevent fraud, abuse and unauthorized access.','To maintain and improve store functionality.']} /></Section>
      <Section title="Newsletter"><p>Newsletter signup is optional. Subscription emails are stored separately from order data so the store can maintain the subscriber list. A subscriber may ask to be removed by contacting <MailLink />. If a dedicated email marketing provider is connected later, subscriber data may be shared with that provider only as needed to send the requested communications.</p></Section>
      <Section title="Service Providers"><p>Information may be shared with service providers only as needed to operate functions such as payment processing, hosting, media storage, email delivery, authentication and order fulfillment. The providers actually used can change as the store configuration changes.</p><p>MY BABY SHIRE does not sell customer personal information to advertisers.</p></Section>
      <Section title="Lawful Basis & Analytics"><p>Order fulfilment and customer support use data necessary for the contract; security and fraud prevention may rely on legitimate interests; accounting records may be retained to meet legal obligations. Optional analytics and marketing tags require a separate affirmative choice. Google Analytics 4 and, if configured, Meta Pixel are not loaded by this website until the related consent is granted. You may withdraw your choice in the cookie settings linked from the page footer.</p><p>Service providers may process personal data outside the European Economic Area; applicable transfer safeguards and provider-specific details must be confirmed and documented.</p></Section>
      <Section title="Data Retention"><p>Order and account information may be retained as needed for fulfillment, customer support, security, accounting and applicable legal requirements. Newsletter subscription records may be retained until the subscription is withdrawn or removal is requested.</p></Section>
      <Section title="Privacy Requests"><p>You may request access, correction, erasure, restriction, portability where applicable, object to certain processing or withdraw consent. Email <MailLink /> to exercise a privacy right. You may also complain to your relevant data-protection supervisory authority, including Malta's Information and Data Protection Commissioner where applicable.</p></Section>
      <Section title="Children"><p>The storefront is intended for adult purchasers. Product sizing or personalization information about children should only be supplied by an adult authorized to place the order.</p></Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" currentPath="/policies/terms" intro={`These terms describe use of the ${STORE_NAME} website and clarify which checkout and seller terms apply to each product.`}>
      <Section title="Two Purchase Channels"><p>This website has two types of product listings. A button marked “Buy on Etsy” opens the relevant listing on Etsy, where the seller is identified and the order, payment, personalisation, taxes, delivery and returns are confirmed. Purchases made there are concluded through Etsy, not through this website's payment system.</p><p>Where a product offers MY BABY SHIRE's own checkout, that order is made directly through this website and the information shown immediately before payment applies. Do not assume prices or postage shown on this website are the final total for an Etsy order.</p></Section>
      <Section title="Orders & Product Information"><p>Customers are responsible for providing accurate contact, shipping and customization information. Product descriptions, available options, prices and inventory may change as the catalog is updated.</p></Section>
      <Section title="Customization"><p>When a product requires customer-supplied customization details, production may rely on the information exactly as submitted. Review names, dates, selections and other custom data before completing the order.</p></Section>
      <Section title="Pricing & Payment"><p>Products may use different currencies. Pricing, availability, taxes, delivery charges and accepted payment methods must be confirmed in the checkout where the order is actually submitted. For Etsy items, the Etsy listing and checkout determine the final price. For direct website purchases, the applicable website checkout and payment provider determine the payable total.</p></Section>
      <Section title="Shipping, Returns & Consumer Rights"><p>See the <PolicyLink to="/policies/shipping">Shipping Policy</PolicyLink> and <PolicyLink to="/policies/returns">Returns & Refunds Policy</PolicyLink>. For Etsy orders, also review the seller's applicable Etsy terms and order details. Nothing in these terms removes mandatory consumer guarantees, statutory remedies, or other non-waivable rights under applicable law.</p></Section>
      <Section title="Trader Identity & Complaints"><p>MY BABY SHIRE is the trading name displayed by this website. The legal operator's identity, business address, and any required register/VAT information must be verified and provided before these terms can be considered complete. Please contact <MailLink /> about complaints or an order. European consumers may also have access to appropriate alternative dispute resolution bodies.</p></Section>
      <Section title="Etsy Relationship"><p>The product-listing integration uses Etsy's API, but this website is independently operated and is not endorsed or certified by Etsy. Etsy's services have their own terms and privacy notices. We do not act as Etsy itself.</p></Section>
      <Section title="Acceptable Use"><p>Do not misuse the site, attempt unauthorized access, interfere with store operations or submit unlawful content through customization, review or account features.</p></Section>
      <Section title="Availability & Changes"><p>We may update products, inventory, prices, features and these policies as the store changes. Material policy updates should be reflected by the revision date shown on the relevant policy page.</p></Section>
    </LegalLayout>
  );
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
