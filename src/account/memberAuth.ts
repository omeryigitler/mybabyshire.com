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
  window.location.assign('/api/admin/login');
};

export const getMemberAuthErrorFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('auth_error');

  if (!error) return '';

  params.delete('auth_error');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  return error;
};

export const getMemberToken = () => {
  const token = getStoredMemberToken();

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  return token;
};

const accountApiPath = (path: string) => {
  if (path.endsWith('/me')) return '/api/admin/login?accountRoute=me';
  if (path.endsWith('/orders')) return '/api/admin/login?accountRoute=orders';
  return path;
};

export const memberFetch = async <T>(path: string): Promise<T> => {
  const response = await fetch(accountApiPath(path), {
    headers: {
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
