import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import apiRoutes from '../../server/api.js';
import { requireAdmin } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { ensureProductVariantsTable, mapProductVariant, normalizeVariantPayload } from '../../lib/variants.js';

const legacyApp = express();
legacyApp.use(express.json({ limit: '25mb' }));
legacyApp.use('/api', apiRoutes);

const getPathParts = (req: VercelRequest) => {
  const value = req.query.path;
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split('/').filter(Boolean);
  return [];
};

const getAuthorization = (req: VercelRequest) => {
  const value = req.headers.authorization;
  return Array.isArray(value) ? value[0] : value;
};

const handleVariants = async (req: VercelRequest, res: VercelResponse, parts: string[]) => {
  try {
    requireAdmin(getAuthorization(req));
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || 'Unauthorized' });
  }

  try {
    await ensureProductVariantsTable();
    const variantId = parts[1] || '';

    if (req.method === 'GET' && !variantId) {
      const variants = await prisma.product_variants.findMany({
        include: { product: { select: { name: true, slug: true } } },
        orderBy: [{ product_id: 'asc' }, { sort_order: 'asc' }, { created_at: 'asc' }],
      });

      return res.status(200).json(variants.map((variant) => ({
        ...mapProductVariant(variant),
        productName: variant.product.name,
        productSlug: variant.product.slug,
      })));
    }

    if (req.method === 'POST' && !variantId) {
      const data = normalizeVariantPayload(req.body || {});
      const product = await prisma.products.findUnique({ where: { id: data.product_id }, select: { id: true } });
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      const duplicate = await prisma.product_variants.findFirst({
        where: { product_id: data.product_id, color: data.color, size: data.size },
      });
      if (duplicate) {
        return res.status(409).json({ error: 'This color / size combination already exists for the product.' });
      }

      const variant = await prisma.product_variants.create({ data });
      return res.status(201).json(mapProductVariant(variant));
    }

    if (req.method === 'PUT' && variantId) {
      const data = normalizeVariantPayload(req.body || {});
      const duplicate = await prisma.product_variants.findFirst({
        where: {
          product_id: data.product_id,
          color: data.color,
          size: data.size,
          id: { not: variantId },
        },
      });
      if (duplicate) {
        return res.status(409).json({ error: 'This color / size combination already exists for the product.' });
      }

      const variant = await prisma.product_variants.update({ where: { id: variantId }, data });
      return res.status(200).json(mapProductVariant(variant));
    }

    if (req.method === 'DELETE' && variantId) {
      await prisma.product_variants.delete({ where: { id: variantId } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = (error as Error).message || 'Variant request failed.';
    const isUnique = message.toLowerCase().includes('unique constraint');
    return res.status(isUnique ? 409 : 400).json({
      error: isUnique ? 'Variant SKU already exists.' : 'Variant request failed.',
      details: message,
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = getPathParts(req);

  if (parts[0] === 'variants') {
    return handleVariants(req, res, parts);
  }

  return legacyApp(req as any, res as any);
}
