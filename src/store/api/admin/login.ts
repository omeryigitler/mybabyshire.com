import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminToken } from '../../../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (email === 'admin@boutique.com' && password === 'admin') {
    const token = createAdminToken();

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
