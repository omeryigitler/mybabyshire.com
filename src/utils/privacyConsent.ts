export const PRIVACY_CONSENT_KEY = 'mybabyshire-privacy-consent-v1';
export const OPEN_PRIVACY_SETTINGS = 'mybabyshire:privacy-settings';
export type PrivacyConsent = { analytics: boolean; marketing: boolean };

export const readPrivacyConsent = (): PrivacyConsent | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.analytics === 'boolean' && typeof data.marketing === 'boolean') {
      return { analytics: data.analytics, marketing: data.marketing };
    }
  } catch { /* storage can be unavailable */ }
  return null;
};

export const savePrivacyConsent = (consent: PrivacyConsent) => {
  try { window.localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent)); } catch { /* ignore */ }
};

export const openPrivacySettings = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_PRIVACY_SETTINGS));
};
