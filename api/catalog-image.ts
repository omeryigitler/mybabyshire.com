import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCatalogArtwork } from '../lib/catalogArtwork.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
  const svg = getCatalogArtwork(name);

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).send(svg);
}
