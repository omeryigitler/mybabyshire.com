import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { encodeCardDesign } from '../utils/cardDesign';
import type { ProductWizardDraft } from './productWizardDraft';

export const WizardReviewStep = ({ draft, categoryName }: { draft: ProductWizardDraft; categoryName: string }) => {
  const preview = draft.images[0] ? {
    id: 'wizard-preview', name: draft.name || 'New baby gift', description: draft.description || '', price: Number(draft.price) || 0,
    imageUrl: draft.images[0].url, bgImage: encodeCardDesign({ cloud: draft.cloudShape, panel: draft.panelShape, color: draft.cardColor }),
    badge: draft.promotionBadge === 'bestseller' ? 'Bestseller' : draft.promotionBadge === 'newArrival' ? 'New' : undefined,
    personalizationRequired: draft.personalizationRequired, personalizationFields: draft.personalizationFields,
  } : null;

  const rows = [
    ['Name', draft.name || 'Missing'], ['Price', draft.price ? `$${Number(draft.price).toFixed(2)}` : 'Missing'],
    ['Image', draft.images.length ? 'Ready' : 'Missing'], ['Category', categoryName], ['Status', draft.status],
    ['Made-for-you fields', draft.personalizationRequired ? String(draft.personalizationFields.length) : 'Off'],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="rounded-[1.5rem] bg-[#fffaf3] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-boutique-brown/50">Final check</p><div className="mt-4 divide-y divide-boutique-brown/10">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-5 py-3 text-sm"><span className="text-boutique-brown-light">{label}</span><span className="text-right font-bold text-boutique-brown">{value}</span></div>)}</div></div>
      <div><p className="mb-3 text-sm font-bold text-boutique-brown">Storefront card preview</p>{preview ? <div className="overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-boutique-bg bg-pattern bg-[length:280px_280px] px-3 py-5"><ProductCard product={preview} preview /></div> : <div className="flex min-h-72 items-center justify-center rounded-[1.5rem] border-2 border-dashed border-boutique-brown/10 text-sm text-boutique-brown-light">Add a product image to preview the card.</div>}</div>
    </div>
  );
};
