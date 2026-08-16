import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';

const getAuthorization = (req: VercelRequest) => {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
};

const normalizeImages = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((image: any, index) => ({
      image_url: String(image?.url || image?.imageUrl || '').trim(),
      public_id: String(image?.publicId || '').trim() || null,
      is_primary: index === 0,
      sort_order: index,
    }))
    .filter((image) => /^https?:\/\//i.test(image.image_url) || image.image_url.startsWith('/'))
    .slice(0, 2);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(getAuthorization(req));
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || 'Unauthorized' });
  }

  const productId = String(req.query.productId || req.body?.productId || '').trim();
  if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

  const product = await prisma.products.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (req.method === 'GET') {
    const images = await prisma.product_images.findMany({
      where: { product_id: productId },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    return res.status(200).json(images.map((image) => ({
      id: image.id,
      url: image.image_url,
      publicId: image.public_id || undefined,
      primary: image.is_primary,
      sortOrder: image.sort_order,
    })));
  }

  if (req.method === 'PUT') {
    const images = normalizeImages(req.body?.images);
    if (!images.length) return res.status(400).json({ error: 'At least one valid product image is required.' });

    await prisma.$transaction([
      prisma.product_images.deleteMany({ where: { product_id: productId } }),
      prisma.product_images.createMany({ data: images.map((image) => ({ product_id: productId, ...image })) }),
    ]);

    const saved = await prisma.product_images.findMany({
      where: { product_id: productId },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });

    return res.status(200).json(saved.map((image) => ({
      id: image.id,
      url: image.image_url,
      publicId: image.public_id || undefined,
      primary: image.is_primary,
      sortOrder: image.sort_order,
    })));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
