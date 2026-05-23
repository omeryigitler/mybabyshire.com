import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

export const createAdminToken = () => {
  return jwt.sign({ id: 'admin1', role: 'admin' }, JWT_SECRET, {
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
