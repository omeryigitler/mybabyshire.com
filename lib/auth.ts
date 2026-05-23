import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

export const getAdminCredentials = () => ({
  email: process.env.ADMIN_EMAIL?.trim(),
  password: process.env.ADMIN_PASSWORD,
});

export const hasConfiguredAdminCredentials = () => {
  const { email, password } = getAdminCredentials();
  return Boolean(email && password);
};

export const isConfiguredAdminLogin = (email?: string, password?: string) => {
  const adminCredentials = getAdminCredentials();

  if (!adminCredentials.email || !adminCredentials.password || !email || !password) {
    return false;
  }

  return (
    email.trim().toLowerCase() === adminCredentials.email.toLowerCase() &&
    password === adminCredentials.password
  );
};

export const createAdminToken = (email = getAdminCredentials().email || 'admin') => {
  return jwt.sign({ id: 'admin1', email, role: 'admin' }, JWT_SECRET, {
    expiresIn: '1d',
  });
};

export const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorization.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
};
