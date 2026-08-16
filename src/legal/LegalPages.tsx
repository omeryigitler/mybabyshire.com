import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useSeo } from '../utils/seo';

const EFFECTIVE_DATE = 'August 16, 2026';
const SUPPORT_EMAIL = 'hello@mybabyshire.com';
const STORE_NAME = 'MY BABY SHIRE';

const LEGAL_LINKS = [
  { to: '/policies/shipping', label: 'Shipping Policy' },
  { to: '/policies/returns', label: 'Returns & Refunds' },
  { to: '/policies/privacy', label: 'Privacy Policy' },
  { to: '/policies/terms', label: 'Terms of Service' },
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
          <Section title="Contact"><p>Questions about this policy can be sent to <MailLink />.</p></Section>
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
    <LegalLayout title="Shipping Policy" currentPath="/policies/shipping" intro="This page explains how order preparation, shipping selections and tracking are handled by MY BABY SHIRE.">
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
      <Section title="Customized Items"><p>Items made with customer-supplied names, dates, messages or other custom details may not be eligible for a standard change-of-mind return after production has started. If an order contains customization, review all submitted details carefully before purchase.</p></Section>
      <Section title="Damaged, Defective or Incorrect Items"><p>If an item arrives damaged, defective or materially different from the order, contact <MailLink /> with the order reference and evidence of the issue so the request can be reviewed.</p></Section>
      <Section title="Cancellations & Changes"><p>Contact us as quickly as possible if an order needs to be changed or cancelled. Whether a change can be made depends on the current production and fulfillment status.</p></Section>
      <Section title="Standard Items"><p>Eligibility, return window, return shipping responsibility and refund amount for non-customized merchandise are subject to the store’s active return policy at the time of purchase. If these details are not shown on the order, contact support before sending anything back.</p></Section>
      <Section title="Refund Processing"><p>Approved refunds are returned through the payment method used for the transaction when supported by the payment provider. Posting time after a refund is initiated depends on the provider and financial institution.</p></Section>
    </LegalLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" currentPath="/policies/privacy" intro={`${STORE_NAME} uses customer information to operate the store, fulfill orders, maintain accounts and provide support.`}>
      <Section title="Information We Collect"><Bullets items={['Contact information such as name and email address.','Shipping and order information supplied during checkout.','Customization details supplied for products that require them.','Account information and order history when an account is used.','An email address submitted voluntarily through the newsletter form.','Limited technical and security information needed to operate and protect the site.']} /></Section>
      <Section title="Payments"><p>Full card credentials are handled by the payment service used for checkout rather than being stored directly in the MY BABY SHIRE application database. The exact payment provider available to a customer is the provider presented during checkout.</p></Section>
      <Section title="How Information Is Used"><Bullets items={['To process and fulfill orders.','To provide order, account and tracking functionality.','To send transactional communications and support replies.','To send newsletter or store updates when an email address is voluntarily submitted for that purpose.','To prevent fraud, abuse and unauthorized access.','To maintain and improve store functionality.']} /></Section>
      <Section title="Newsletter"><p>Newsletter signup is optional. Subscription emails are stored separately from order data so the store can maintain the subscriber list. A subscriber may ask to be removed by contacting <MailLink />. If a dedicated email marketing provider is connected later, subscriber data may be shared with that provider only as needed to send the requested communications.</p></Section>
      <Section title="Service Providers"><p>Information may be shared with service providers only as needed to operate functions such as payment processing, hosting, media storage, email delivery, authentication and order fulfillment. The providers actually used can change as the store configuration changes.</p><p>MY BABY SHIRE does not sell customer personal information to advertisers.</p></Section>
      <Section title="Data Retention"><p>Order and account information may be retained as needed for fulfillment, customer support, security, accounting and applicable legal requirements. Newsletter subscription records may be retained until the subscription is withdrawn or removal is requested.</p></Section>
      <Section title="Privacy Requests"><p>Requests to access, correct or delete personal information, including requests to remove a newsletter subscription, can be sent to <MailLink />. The scope of available rights depends on the customer’s jurisdiction and applicable law.</p></Section>
      <Section title="Children"><p>The storefront is intended for adult purchasers. Product sizing or personalization information about children should only be supplied by an adult authorized to place the order.</p></Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" currentPath="/policies/terms" intro={`These terms govern use of the ${STORE_NAME} storefront and purchases made through it.`}>
      <Section title="Orders & Product Information"><p>Customers are responsible for providing accurate contact, shipping and customization information. Product descriptions, available options, prices and inventory may change as the catalog is updated.</p></Section>
      <Section title="Customization"><p>When a product requires customer-supplied customization details, production may rely on the information exactly as submitted. Review names, dates, selections and other custom data before completing the order.</p></Section>
      <Section title="Pricing & Payment"><p>Prices displayed by the storefront are in the currency shown at checkout. An order is treated as paid only after the payment provider and server-side order records confirm successful payment.</p></Section>
      <Section title="Shipping & Returns"><p>Fulfillment is governed by the <PolicyLink to="/policies/shipping">Shipping Policy</PolicyLink> and <PolicyLink to="/policies/returns">Returns & Refunds Policy</PolicyLink> active for the order.</p></Section>
      <Section title="Acceptable Use"><p>Do not misuse the site, attempt unauthorized access, interfere with store operations or submit unlawful content through customization, review or account features.</p></Section>
      <Section title="Availability & Changes"><p>We may update products, inventory, prices, features and these policies as the store changes. Material policy updates should be reflected by the revision date shown on the relevant policy page.</p></Section>
    </LegalLayout>
  );
}
