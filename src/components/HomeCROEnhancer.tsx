import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { HomeCommerceHero } from './HomeCommerceHero';
import { HomeRealFeaturedGifts } from './HomeRealFeaturedGifts';
import { HomeOrderReassurance } from './HomeOrderReassurance';

export function HomeCROEnhancer() {
  const products = useStore((state) => state.products);
  const [topTarget, setTopTarget] = useState<HTMLElement | null>(null);
  const [bottomTarget, setBottomTarget] = useState<HTMLElement | null>(null);

  const moments = useMemo(() => {
    const find = (term: string) => products.find((product) => `${product.name} ${product.description} ${product.ageRange || ''}`.toLowerCase().includes(term));
    return [
      { title: 'The First Hello', detail: 'Newborn moments', product: find('newborn') },
      { title: 'First Birthday', detail: 'One very big little milestone', product: find('birthday') },
      { title: 'Made with Their Name', detail: 'A detail that makes it theirs', product: find('name') },
    ].filter((item) => item.product) as Array<{ title: string; detail: string; product: (typeof products)[number] }>;
  }, [products]);

  useLayoutEffect(() => {
    const main = document.querySelector('main');
    const shop = document.getElementById('shop');
    if (!main || !shop) return;

    const top = document.createElement('div');
    const bottom = document.createElement('div');
    top.id = 'cro-home-top';
    bottom.id = 'cro-home-bottom';
    top.className = 'contents';
    bottom.className = 'contents';
    main.insertBefore(top, shop);
    main.insertBefore(bottom, shop.nextSibling);

    const hidden: Array<{ node: HTMLElement; display: string }> = [];
    Array.from(main.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child === top || child === shop || child === bottom) return;
      if (child.compareDocumentPosition(shop) & Node.DOCUMENT_POSITION_FOLLOWING) {
        hidden.push({ node: child, display: child.style.display });
        child.style.display = 'none';
      }
    });

    const textChanges: Array<{ node: Element; value: string }> = [];
    const replaceExactText = (selector: string, from: string, to: string) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (node.textContent?.trim() === from) {
          textChanges.push({ node, value: node.textContent });
          node.textContent = to;
        }
      });
    };

    replaceExactText('header button', 'Personalization', 'Made for Them');
    replaceExactText('footer button', 'Personalized Gifts', 'Made-for-you Gifts');
    replaceExactText('footer button', 'Personalization Help', 'Made-for-you Help');

    const footerDescription = Array.from(document.querySelectorAll('footer p')).find((node) => node.textContent?.includes('Crafting expertly personalized baby gifts'));
    if (footerDescription) {
      textChanges.push({ node: footerDescription, value: footerDescription.textContent || '' });
      footerDescription.textContent = 'Crafting thoughtful baby gifts and nursery keepsakes with love and care.';
    }

    const shopHeading = shop.querySelector('h2');
    const shopSubtitle = shop.querySelector('p');
    const oldHeading = shopHeading?.textContent || '';
    const oldSubtitle = shopSubtitle?.textContent || '';
    if (shopHeading) shopHeading.textContent = 'Shop All Gifts';
    if (shopSubtitle) shopSubtitle.textContent = 'Browse the full collection with the existing prices, options and made-for-you details.';

    setTopTarget(top);
    setBottomTarget(bottom);
    return () => {
      hidden.forEach(({ node, display }) => { node.style.display = display; });
      textChanges.forEach(({ node, value }) => { node.textContent = value; });
      if (shopHeading) shopHeading.textContent = oldHeading;
      if (shopSubtitle) shopSubtitle.textContent = oldSubtitle;
      top.remove();
      bottom.remove();
    };
  }, []);

  if (!topTarget || !bottomTarget) return null;
  const goToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const momentSection = moments.length >= 2 ? <section className="relative z-20 mx-auto mt-10 w-full max-w-[1480px] px-4 sm:px-6 md:mt-14 md:px-8">
    <div className="mb-5 text-center"><span className="text-[10px] font-bold uppercase tracking-[.2em] text-boutique-wood">Every little milestone has a feeling</span><h2 className="mt-2 font-serif text-3xl text-boutique-brown md:text-[40px]">Shop by Moment</h2></div>
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:px-0">
      {moments.map(({ title, detail, product }) => <Link key={title} to={`/products/${product.slug || product.id}`} className="group relative min-h-[205px] w-[82vw] max-w-[430px] flex-none snap-center overflow-hidden rounded-[1.7rem] border border-boutique-brown/10 bg-white/70 p-5 text-left shadow-[0_14px_38px_rgba(58,37,26,.08)] transition-transform hover:-translate-y-0.5 md:w-auto">
        <div className="relative z-10 w-[56%]"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-boutique-wood">{detail}</span><h3 className="mt-2 font-serif text-2xl leading-tight text-boutique-brown">{title}</h3><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-boutique-brown">See the gift <ArrowRight className="h-3.5 w-3.5" /></span></div>
        <div className="absolute bottom-3 right-2 top-3 flex w-[42%] items-center justify-center rounded-[1.25rem] bg-[#fffaf3]/80"><img src={product.imageUrl} alt={product.name} loading="lazy" className="h-[90%] w-[90%] object-contain transition-transform group-hover:scale-105" /></div>
      </Link>)}
    </div>
  </section> : null;

  return <>
    {createPortal(<><HomeCommerceHero products={products} /><HomeRealFeaturedGifts products={products} onShopAll={goToShop} />{momentSection}</>, topTarget)}
    {createPortal(<HomeOrderReassurance />, bottomTarget)}
  </>;
}
