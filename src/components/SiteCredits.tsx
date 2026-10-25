import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { openPrivacySettings } from '../utils/privacyConsent';

const footerSections = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/collections/all' },
      { label: 'New Arrivals', to: '/collections/new-arrivals' },
      { label: 'Best Sellers', to: '/collections/best-sellers' },
      { label: 'Baby', to: '/collections/baby' },
      { label: 'Adult', to: '/collections/adult' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'My Account', to: '/account' },
      { label: 'Track Order', to: '/track-order' },
      { label: 'Shipping', to: '/policies/shipping' },
      { label: 'Returns & Refunds', to: '/policies/returns' },
    ],
  },
  {
    title: 'Information',
    links: [
      { label: 'Terms & Conditions', to: '/policies/terms' },
      { label: 'Privacy Policy', to: '/policies/privacy' },
      { label: 'Cookie Policy', to: '/policies/cookies' },
    ],
  },
] as const;

const footerLinkClass = 'inline-flex min-h-7 w-fit items-center text-[13px] leading-6 text-[#bbbbbb] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export function SiteCredits() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer id="site-footer" className="relative w-full bg-[#151515] text-white">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-x-7 gap-y-11 border-b border-white/15 py-12 sm:gap-x-10 sm:py-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-x-14 lg:py-16">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" aria-label="MY BABY SHIRE home" className="inline-flex w-fit rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <BrandLogo variant="nav" className="!h-[48px] !w-auto !max-w-[260px] !drop-shadow-none brightness-0 invert" />
            </Link>
            <p className="mt-6 max-w-[290px] text-[14px] leading-7 text-[#b8b8b8]">
              Everyday apparel and custom-ready essentials for little ones and grown-ups.
            </p>
            <a href="mailto:hello@mybabyshire.com" className="mt-5 inline-flex items-center gap-1.5 border-b border-white/45 pb-1 text-[13px] font-medium text-white transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Get in touch <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title} className="min-w-0">
              <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#919191]">{section.title}</h2>
              <div className="flex flex-col items-start gap-2">
                {section.links.map((item) => (
                  <Link key={item.to} to={item.to} className={footerLinkClass}>{item.label}</Link>
                ))}
                {section.title === 'Information' && (
                  <>
                    <button type="button" onClick={openPrivacySettings} className={footerLinkClass}>Cookie settings</button>
                    <a href="mailto:hello@mybabyshire.com" className={footerLinkClass}>Contact</a>
                  </>
                )}
              </div>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-b border-white/15 py-6 text-[11px] leading-[1.8] text-[#969696] sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="max-w-[900px]">
            <p>Selected items link to Etsy. Orders placed there are completed on Etsy, under the seller's listing and checkout policies.</p>
            <p className="mt-1">Etsy is a trademark of Etsy, Inc. This application uses Etsy's API but is not endorsed or certified by Etsy.</p>
          </div>
          <a href="https://babyshirekids.etsy.com/" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 self-start whitespace-nowrap text-[12px] font-medium text-[#ededed] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Etsy shop <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="flex flex-col gap-4 py-6 text-[11px] leading-5 text-[#929292] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <span>© {new Date().getFullYear()} MY BABY SHIRE. All rights reserved.</span>
          <a href="https://omeryigitler.com" target="_blank" rel="noopener noreferrer" className="inline-flex w-fit flex-wrap items-center gap-x-1.5 gap-y-1 rounded-sm text-[11px] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span>Designed &amp; developed by</span>
            <span className="font-semibold tracking-[0.02em] text-white">Ömer YİĞİTLER</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
