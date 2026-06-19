import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

const EFFECTIVE_DATE = 'June 15, 2026';
const SUPPORT_EMAIL = 'hello@mybabyshire.com';
const STORE_NAME = 'MY BABY SHIRE';

const LEGAL_LINKS: Array<{ to: string; label: string }> = [
  { to: '/policies/shipping', label: 'Shipping Policy' },
  { to: '/policies/returns', label: 'Returns & Refunds' },
  { to: '/policies/privacy', label: 'Privacy Policy' },
  { to: '/policies/terms', label: 'Terms of Service' },
];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8 first:mt-0">
    <h2 className="font-serif text-2xl text-boutique-brown md:text-[28px]">{title}</h2>
    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-boutique-brown-light">{children}</div>
  </section>
);

const Bullets = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mt-1 space-y-2 pl-5">
    {items.map((item, index) => (
      <li key={index} className="list-disc marker:text-boutique-wood">{item}</li>
    ))}
  </ul>
);

function LegalLayout({
  title,
  intro,
  currentPath,
  children,
}: {
  title: string;
  intro: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPath]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-boutique-bg font-sans text-boutique-brown">
      <div className="fixed inset-0 pointer-events-none z-0 bg-pattern bg-[length:400px_400px] opacity-40" />

      <header className="relative z-20 flex items-center justify-between border-b border-boutique-brown/10 bg-boutique-bg/80 px-4 py-4 backdrop-blur-md sm:px-6 md:px-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-boutique-brown-light hover:text-boutique-brown">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to shop</span>
        </Link>
        <Link to="/" aria-label="MY BABY SHIRE home" className="inline-flex">
          <BrandLogo variant="nav" />
        </Link>
        <div className="w-[88px]" aria-hidden />
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-10 md:py-14">
        <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/85 p-6 shadow-[0_24px_70px_rgba(58,37,26,0.10)] backdrop-blur-sm md:p-10">
          <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-16 -top-12 w-56 opacity-30 mix-blend-multiply" alt="" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown-light">{STORE_NAME}</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-boutique-brown md:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-boutique-brown-light">Last updated: {EFFECTIVE_DATE}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-boutique-brown-light">{intro}</p>

            <div className="mt-8 border-t border-boutique-brown/10 pt-8">{children}</div>

            <Section title="Contact Us">
              <p>
                Questions about this policy? Email us at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">
                  {SUPPORT_EMAIL}
                </a>{' '}
                and our team will be glad to help.
              </p>
            </Section>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-colors hover:text-boutique-wood ${
                link.to === currentPath ? 'font-bold text-boutique-brown' : 'text-boutique-brown-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

export function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Shipping Policy"
      currentPath="/policies/shipping"
      intro="Every order is made to order with care. Here is how preparation, shipping, and delivery work for gifts shipped within the United States."
    >
      <Section title="Order Preparation Time">
        <p>
          Because most of our gifts are personalized and handcrafted, each order needs preparation time
          before it ships. Personalized items are typically prepared within 2–5 business days. Any
          preparation window listed on a product page applies to that specific item.
        </p>
        <p>Preparation time is separate from shipping transit time below.</p>
      </Section>

      <Section title="Shipping Methods & Rates">
        <p>We currently ship to addresses within the United States, including PO boxes, via USPS:</p>
        <Bullets
          items={[
            <><strong className="text-boutique-brown">Standard Shipping</strong> — USPS Ground Advantage, $6.95, estimated 3–5 business days in transit.</>,
            <><strong className="text-boutique-brown">Priority Shipping</strong> — USPS Priority Mail, $12.95, estimated 2–3 business days in transit.</>,
          ]}
        />
        <p>Delivery estimates are provided by the carrier and are not guaranteed delivery dates.</p>
      </Section>

      <Section title="Order Tracking">
        <p>
          When your order ships, we email you a confirmation. You can follow your order anytime from the{' '}
          <Link to="/track-order" className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">Track Your Order</Link>{' '}
          page using your order number, and we will share carrier tracking details once a label is created.
        </p>
      </Section>

      <Section title="Address Accuracy">
        <p>
          Please double-check your shipping address at checkout. We are not able to reroute a package once
          it has shipped, and we cannot be responsible for orders sent to an incorrect address provided at
          checkout. If you notice a mistake, contact us as soon as possible and we will do our best to help
          before the order leaves our studio.
        </p>
      </Section>

      <Section title="Lost, Delayed, or Damaged Packages">
        <p>
          Once a package is handed to the carrier, delivery timing is in their hands. If your tracking shows
          an unusual delay, or your gift arrives damaged, email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">{SUPPORT_EMAIL}</a>{' '}
          and we will help resolve it, including replacing items that arrive damaged.
        </p>
      </Section>

      <Section title="International Shipping">
        <p>We currently ship within the United States only. International shipping may be added in the future.</p>
      </Section>
    </LegalLayout>
  );
}

export function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Returns & Refunds"
      currentPath="/policies/returns"
      intro="We want you to love your gift. Because most of our products are personalized and made just for you, please read how returns, cancellations, and refunds work."
    >
      <Section title="Personalized & Custom Items">
        <p>
          Personalized, custom, and made-to-order items cannot be returned or exchanged once production has
          started, because they are created specifically for you and cannot be resold. This is standard for
          custom goods. Please review your personalization details (spelling, dates, colors, and options)
          carefully before completing checkout.
        </p>
      </Section>

      <Section title="Damaged, Defective, or Incorrect Orders">
        <p>
          If your order arrives damaged or defective, or you received the wrong item, we will make it right.
          Contact us within <strong className="text-boutique-brown">14 days</strong> of delivery with your
          order number and a photo of the issue, and we will arrange a replacement or a refund.
        </p>
      </Section>

      <Section title="Order Cancellations & Changes">
        <p>
          Need to change or cancel an order? Contact us as quickly as possible. We can usually update or
          cancel an order before it enters production. Once an item has gone into production, we may not be
          able to make changes.
        </p>
      </Section>

      <Section title="Non-Personalized Items">
        <p>
          Unpersonalized items in new, unused condition may be returned within{' '}
          <strong className="text-boutique-brown">14 days</strong> of delivery. Return shipping for
          non-defective returns is the customer's responsibility, and a refund is issued once the item is
          received and inspected.
        </p>
      </Section>

      <Section title="How Refunds Are Issued">
        <p>
          Approved refunds are returned to your original payment method (the card or PayPal account used at
          checkout). Once processed, it can take several business days for your bank or payment provider to
          post the refund.
        </p>
      </Section>

      <Section title="How to Start a Request">
        <p>
          Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">{SUPPORT_EMAIL}</a>{' '}
          with your order number and a short description of the issue. We typically respond within 1–2
          business days.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      currentPath="/policies/privacy"
      intro={`${STORE_NAME} respects your privacy. This policy explains what information we collect when you shop with us, how we use it, and the choices you have.`}
    >
      <Section title="Information We Collect">
        <p>We collect information you provide when you place an order or create an account, including:</p>
        <Bullets
          items={[
            'Contact details such as your name and email address.',
            'Shipping address and phone number for delivery.',
            'Personalization details you enter for your products (names, dates, messages, and options).',
            'Order history and communications with our support team.',
          ]}
        />
        <p>
          We also collect limited technical information automatically, such as device and usage data, to
          keep the store secure and working well.
        </p>
      </Section>

      <Section title="Payment Information">
        <p>
          We do not collect or store your full card number. Payments are processed securely by our payment
          providers, Stripe and PayPal, who handle your payment details directly under their own privacy
          and security standards.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <Bullets
          items={[
            'To process, prepare, and deliver your orders.',
            'To send order confirmations, shipping updates, and support replies.',
            'To respond to your questions and provide customer service.',
            'To protect against fraud and keep the store secure.',
            'To improve our products and shopping experience.',
          ]}
        />
      </Section>

      <Section title="Service Providers We Share Data With">
        <p>We share only the information needed for these trusted providers to operate the store:</p>
        <Bullets
          items={[
            'Stripe and PayPal — payment processing.',
            'Our shipping carriers (such as USPS) — to deliver your order.',
            'Resend — to send transactional emails like order confirmations.',
            'Cloudinary — to host product and order images.',
            'Google — if you choose to sign in with your Google account.',
          ]}
        />
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="Cookies">
        <p>
          We use essential cookies and similar technologies to keep your shopping bag working and to keep
          the site secure. You can control cookies through your browser settings.
        </p>
      </Section>

      <Section title="Data Retention">
        <p>
          We keep order and account information for as long as needed to fulfill orders, provide support,
          and meet legal, tax, and accounting requirements.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>
          Depending on where you live, you may have the right to access, correct, or delete your personal
          information, or to opt out of certain uses. To make a request, email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">{SUPPORT_EMAIL}</a>.
          California residents may exercise rights under the CCPA/CPRA, and we will not discriminate against
          you for doing so.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          Our products are baby gifts, but our store is intended for adult shoppers. We do not knowingly
          collect personal information from children under 13.
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      currentPath="/policies/terms"
      intro={`These terms govern your use of the ${STORE_NAME} website and the purchase of our products. By using our store or placing an order, you agree to these terms.`}
    >
      <Section title="Eligibility">
        <p>
          You must be at least 18 years old, or have permission from a parent or guardian, to place an
          order. By placing an order you confirm that the information you provide is accurate.
        </p>
      </Section>

      <Section title="Products & Personalization">
        <p>
          We offer personalized baby gifts. You are responsible for the accuracy of the personalization
          details you submit, including spelling, dates, and selected options. Because these items are made
          to order, we produce them based on the details exactly as you enter them at checkout.
        </p>
        <p>
          We make every effort to display product colors and details accurately, but actual products may
          vary slightly due to handmade processes and screen differences.
        </p>
      </Section>

      <Section title="Pricing & Payment">
        <p>
          All prices are listed in U.S. dollars. We may update prices and product availability at any time.
          Payment is processed at checkout through Stripe or PayPal. Your order is confirmed once payment is
          successfully received.
        </p>
      </Section>

      <Section title="Shipping & Returns">
        <p>
          Order preparation, shipping, returns, and refunds are governed by our{' '}
          <Link to="/policies/shipping" className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">Shipping Policy</Link>{' '}
          and{' '}
          <Link to="/policies/returns" className="font-semibold text-boutique-brown underline decoration-boutique-wood/50 underline-offset-2 hover:text-boutique-wood">Returns &amp; Refunds</Link>{' '}
          policy, which are part of these terms.
        </p>
      </Section>

      <Section title="Intellectual Property">
        <p>
          All content on this site, including logos, designs, images, and text, is owned by {STORE_NAME} or
          its licensors and may not be copied or used without permission. You retain responsibility for any
          content or personalization text you submit and confirm you have the right to use it.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>
          You agree not to misuse the store, attempt to disrupt it, or submit personalization content that
          is unlawful, infringing, or offensive. We may refuse or cancel orders that violate these terms.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, {STORE_NAME} is not liable for indirect or incidental
          damages arising from your use of the store or products. Our total liability for any order is
          limited to the amount you paid for that order.
        </p>
      </Section>

      <Section title="Changes to These Terms">
        <p>
          We may update these terms from time to time. The latest version will always be posted here with an
          updated date. Continued use of the store means you accept the updated terms.
        </p>
      </Section>

      <Section title="Governing Law">
        <p>
          These terms are governed by the laws of the United States and the state in which {STORE_NAME}
          operates, without regard to conflict-of-law rules.
        </p>
      </Section>
    </LegalLayout>
  );
}
