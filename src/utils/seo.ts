import { useEffect } from 'react';

const SITE_NAME = 'MY BABY SHIRE';
const DEFAULT_DESCRIPTION = 'Shop blank apparel and custom-ready essentials for baby, toddler, kids and adult sizes from MY BABY SHIRE.';
const DEFAULT_IMAGE = 'https://www.mybabyshire.com/brand/mybabyshire-header-horizontal-logo_2x-removebg-preview.png';

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | null;
};

const upsertMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const JSON_LD_ID = 'seo-jsonld';

export function useSeo({ title, description, image, type = 'website', jsonLd }: SeoOptions) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Blank Apparel & Custom-Ready Essentials`;
  const desc = description || DEFAULT_DESCRIPTION;
  const img = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', desc);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', img);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', img);

    const existing = document.getElementById(JSON_LD_ID);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSON_LD_ID;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const node = document.getElementById(JSON_LD_ID);
      if (node) node.remove();
    };
  }, [fullTitle, desc, img, type, jsonLd]);
}
