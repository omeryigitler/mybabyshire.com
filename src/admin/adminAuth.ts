export const ADMIN_TOKEN_KEY = 'little-wonders-admin-token-v2';

export const getStoredAdminToken = () => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const loginAdmin = async (email: string, password: string) => {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Admin login failed.');
  }

  localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data.token as string;
};

export const getAdminToken = () => {
  const token = getStoredAdminToken();

  if (!token) {
    throw new Error('Please sign in to continue.');
  }

  return token;
};
