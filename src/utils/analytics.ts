// -------------------------------------------------------------------------
// Analytics: Google Analytics 4 (active) + Meta Pixel (ready, opt-in via env)
// -------------------------------------------------------------------------
// GA4 measurement ID is public (it appears in the browser), so a default is
// baked in. Override either value with VITE_GA4_ID / VITE_META_PIXEL_ID env.
// Meta Pixel stays OFF until VITE_META_PIXEL_ID is provided.
// -------------------------------------------------------------------------

import { readPrivacyConsent } from './privacyConsent';

const env = (import.meta as any).env || {};
const GA_ID: string = env.VITE_GA4_ID || 'G-WS8BX178V0';
const META_PIXEL_ID: string = env.VITE_META_PIXEL_ID || '';

let gaInitialized = false;
let metaInitialized = false;
const consent = () => readPrivacyConsent() || { analytics: false, marketing: false };

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  const allowed = consent();
  const w = window as any;

  if (GA_ID && allowed.analytics && !gaInitialized) {
    gaInitialized = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer.push(arguments);
    };
    w.gtag('js', new Date());
    // page_view is sent manually on route changes for accurate SPA tracking
    w.gtag('config', GA_ID, { send_page_view: false });
  }

  if (META_PIXEL_ID && allowed.marketing && !metaInitialized) {
    metaInitialized = true;
    /* eslint-disable */
    (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(w, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    w.fbq('init', META_PIXEL_ID);
    w.fbq('track', 'PageView');
  }
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (GA_ID && consent().analytics && typeof w.gtag === 'function') {
    w.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
  if (META_PIXEL_ID && consent().marketing && typeof w.fbq === 'function') {
    w.fbq('track', 'PageView');
  }
}

const PENDING_PURCHASE_KEY = 'lw_pending_purchase';

// Stash the order total before redirecting to the payment provider, so the
// success page can fire an accurate purchase conversion when the user returns.
export function rememberPendingPurchase(orderNumber?: string | null, value?: number) {
  if (typeof window === 'undefined' || !orderNumber) return;
  try {
    window.sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify({ orderNumber, value: Number(value) || 0 }));
  } catch {
    /* ignore storage errors */
  }
}

// Read and clear a stashed purchase. Returns null if none matches the order.
export function consumePendingPurchase(orderNumber?: string | null): { orderNumber: string; value: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (orderNumber && data.orderNumber !== orderNumber) return null;
    window.sessionStorage.removeItem(PENDING_PURCHASE_KEY);
    return data;
  } catch {
    return null;
  }
}

// Track a completed purchase (call from the payment success page).
export function trackPurchase(params: { orderNumber: string; value: number; currency?: string }) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (GA_ID && consent().analytics && typeof w.gtag === 'function') {
    w.gtag('event', 'purchase', {
      transaction_id: params.orderNumber,
      value: params.value,
      currency: params.currency || 'USD',
    });
  }
  if (META_PIXEL_ID && consent().marketing && typeof w.fbq === 'function') {
    w.fbq('track', 'Purchase', { value: params.value, currency: params.currency || 'USD' });
  }
}

export function disableAnalytics() {
  if (typeof window === 'undefined') return;
  if (GA_ID) (window as any)['ga-disable-' + GA_ID] = true;
  for (const key of document.cookie.split(';').map(v => v.trim().split('=')[0])) {
    if (/^_ga(?:_|$)|^_gid$|^_gat/.test(key)) {
      document.cookie = key + '=; Max-Age=0; Path=/; SameSite=Lax';
    }
  }
}
