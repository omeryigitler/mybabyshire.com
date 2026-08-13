import React from 'react';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function CroHeaderSimple({ onShop, onMade, onStory, onSearch, onCart, cartCount }: { onShop: () => void; onMade: () => void; onStory: () => void; onSearch: () => void; onCart: () => void; cartCount: number }) {
  return <header className="relative z-30 flex min-h-[82px] items-center border-b border-boutique-brown/5 bg-boutique-bg/80 px-4 backdrop-blur-md sm:px-6 md:min-h-[104px] md:px-12 lg:min-h-[112px]">
    <nav className="hidden items-center gap-7 text-sm font-medium text-boutique-brown-light lg:flex">
      <button onClick={onShop} className="hover:text-boutique-wood">Shop</button>
      <button onClick={onMade} className="hover:text-boutique-wood">Made for Them</button>
      <button onClick={onStory} className="hover:text-boutique-wood">Our Story</button>
    </nav>
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="absolute left-4 top-1/2 -translate-y-1/2 sm:left-6 md:left-1/2 md:-translate-x-1/2" aria-label="Home"><BrandLogo variant="header" /></button>
    <div className="ml-auto flex items-center gap-2 text-boutique-brown sm:gap-4">
      <button onClick={onSearch} className="hidden p-2 sm:inline-flex" aria-label="Search"><Search size={22} strokeWidth={1.5} /></button>
      <Link to="/account" className="p-2" aria-label="Account"><UserRound size={22} strokeWidth={1.5} /></Link>
      <button onClick={onCart} className="relative p-2" aria-label="Gift bag"><ShoppingBag size={22} strokeWidth={1.5} />{cartCount > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-boutique-brown text-[10px] font-bold text-white">{cartCount}</span>}</button>
    </div>
  </header>;
}
