export const ADMIN_TOKEN_KEY = 'mybabyshire-admin-token-v1';

export const getStoredAdminToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const isAuthErrorMessage = (message = '') => {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('invalid signature') ||
    normalized.includes('jwt expired') ||
    normalized.includes('unauthorized') ||
    normalized.includes('missing token') ||
    normalized.includes('please sign in')
  );
};

export const handleAdminAuthError = (error: unknown) => {
  const message = (error as Error).message || '';

  if (isAuthErrorMessage(message)) {
    clearAdminSession();
    window.location.assign('/admin');
    return true;
  }

  return false;
};

export const loginAdmin = async (email: string, password: string) => {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    clearAdminSession();
    throw new Error(data.error || 'Admin login failed.');
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data.token as string;
};

export const startGoogleAdminLogin = () => {
  window.location.assign('/api/admin-google-start');
};

export const getAdminAuthErrorFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('auth_error');

  if (!error) return '';

  params.delete('auth_error');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  return error;
};

export const getAdminToken = () => {
  const token = getStoredAdminToken();

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  return token;
};
