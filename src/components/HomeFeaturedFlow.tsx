import React from 'react';
import { Product } from '../store/useStore';
import { HomeOrderReassurance } from './HomeOrderReassurance';
import { HomeRealFeaturedGifts } from './HomeRealFeaturedGifts';

export function HomeFeaturedFlow({ products, onShopAll }: { products: Product[]; onShopAll: () => void }) {
  return (
    <>
      <HomeRealFeaturedGifts products={products} onShopAll={onShopAll} />
      <HomeOrderReassurance />
    </>
  );
}
