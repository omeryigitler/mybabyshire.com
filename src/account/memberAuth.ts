export const MEMBER_TOKEN_KEY = 'mybabyshire-member-token-v1';

export type Member = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
};

export type MemberOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  trackingReference?: string | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
};

export const getStoredMemberToken = () => localStorage.getItem(MEMBER_TOKEN_KEY);

export const clearMemberSession = () => {
  localStorage.removeItem(MEMBER_TOKEN_KEY);
};

export const startGoogleMemberLogin = () => {
  window.location.assign('/api/account/google/start');
};

const getFriendlyMemberAuthError = (error: string) => {
  const normalized = error.trim().toLowerCase();

  if (
    normalized.includes('jwt expired') ||
    normalized.includes('token expired') ||
    normalized.includes('expired') ||
    normalized.includes('invalid_grant')
  ) {
    return 'Your sign-in session expired. Please select Continue with Google and try again.';
  }

  if (
    normalized.includes('access_denied') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled')
  ) {
    return 'Google sign-in was cancelled. You can try again whenever you are ready.';
  }

  if (
    normalized.includes('invalid google state') ||
    normalized.includes('invalid google sign-in state') ||
    normalized.includes('missing google response') ||
    normalized.includes('missing google sign-in response') ||
    normalized.includes('missing google sign-in')
  ) {
    return 'We could not verify this sign-in request. For your security, please start Google sign-in again from this page.';
  }

  if (
    normalized.includes('not configured') ||
    normalized.includes('google_client') ||
    normalized.includes('jwt_secret')
  ) {
    return 'Google sign-in is temporarily unavailable. Please try again later or use email instead.';
  }

  if (
    normalized.includes('profile verification') ||
    normalized.includes('account could not be verified') ||
    normalized.includes('email_verified')
  ) {
    return 'We could not verify your Google account. Please try another Google account or use email instead.';
  }

  return 'We could not complete Google sign-in. Please try again. If the problem continues, use email instead.';
};

export const getMemberAuthErrorFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('auth_error');

  if (!error) return '';

  params.delete('auth_error');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  return getFriendlyMemberAuthError(error);
};

export const getMemberToken = () => {
  const token = getStoredMemberToken();

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  return token;
};

const accountApiPath = (path: string) => {
  if (path.endsWith('/me')) return '/api/account/me';
  if (path.endsWith('/profile')) return '/api/account/profile';
  if (path.endsWith('/addresses')) return '/api/account/addresses';
  if (path.endsWith('/orders')) return '/api/account/orders';
  return path;
};

export const memberFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(accountApiPath(path), {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getMemberToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) clearMemberSession();
    throw new Error(data.error || 'Account request failed.');
  }

  return data as T;
};
