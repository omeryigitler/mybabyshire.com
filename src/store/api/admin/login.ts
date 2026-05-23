import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAdminToken,
  hasConfiguredAdminCredentials,
  isConfiguredAdminLogin,
} from '../../../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!hasConfiguredAdminCredentials()) {
    return res.status(500).json({ error: 'Admin credentials are not configured.' });
  }

  if (isConfiguredAdminLogin(email, password)) {
    const token = createAdminToken(email);

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
