import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { HomeCommerceHero } from './HomeCommerceHero';
import { HomeRealFeaturedGifts } from './HomeRealFeaturedGifts';
import { HomeOrderReassurance } from './HomeOrderReassurance';

export function HomeCROEnhancer() {
  const products = useStore((state) => state.products);
  const [topTarget, setTopTarget] = useState<HTMLElement | null>(null);
  const [bottomTarget, setBottomTarget] = useState<HTMLElement | null>(null);

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
      if (shopHeading) shopHeading.textContent = oldHeading;
      if (shopSubtitle) shopSubtitle.textContent = oldSubtitle;
      top.remove();
      bottom.remove();
    };
  }, []);

  if (!topTarget || !bottomTarget) return null;
  const goToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return <>
    {createPortal(<><HomeCommerceHero products={products} /><HomeRealFeaturedGifts products={products} onShopAll={goToShop} /></>, topTarget)}
    {createPortal(<HomeOrderReassurance />, bottomTarget)}
  </>;
}
