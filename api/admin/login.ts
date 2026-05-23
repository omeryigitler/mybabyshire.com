import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (email === 'admin@boutique.com' && password === 'admin') {
    const token = jwt.sign(
      { id: 'admin1', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      token,
      user: {
        email,
        role: 'admin',
      },
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
