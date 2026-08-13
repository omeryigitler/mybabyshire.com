import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function CroFooter() {
  return <footer id="our-story" className="scroll-mt-24 relative z-20 mt-6 w-full border-t border-boutique-brown/10 bg-boutique-bg pb-4 pt-5">
    <div className="mx-auto grid max-w-[1300px] grid-cols-1 divide-y divide-boutique-brown/15 px-6 md:grid-cols-4 md:divide-x md:divide-y-0">
      <div className="py-4 md:pr-8"><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to home"><BrandLogo variant="footer" className="!w-[150px]" /></button><p className="mt-3 max-w-xs text-xs leading-relaxed text-boutique-brown-light">Thoughtful baby gifts for first hellos, little milestones and keepsake moments.</p></div>
      <div className="py-4 md:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-boutique-brown">Shop</p><div className="mt-3 flex flex-col gap-2 text-xs text-boutique-brown-light"><a href="#shop">All Gifts</a><a href="#featured-gifts">Made for Them</a></div></div>
      <div className="py-4 md:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-boutique-brown">Help</p><div className="mt-3 flex flex-col gap-2 text-xs text-boutique-brown-light"><Link to="/policies/shipping">Shipping</Link><Link to="/policies/returns">Returns</Link><Link to="/track-order">Track Order</Link></div></div>
      <div className="py-4 md:pl-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-boutique-brown">Legal</p><div className="mt-3 flex flex-col gap-2 text-xs text-boutique-brown-light"><Link to="/policies/privacy">Privacy</Link><Link to="/policies/terms">Terms</Link></div></div>
    </div>
    <p className="mx-auto mt-4 max-w-[1300px] px-6 text-[10px] text-boutique-brown-light/70">© {new Date().getFullYear()} MY BABY SHIRE. All rights reserved.</p>
  </footer>;
}
