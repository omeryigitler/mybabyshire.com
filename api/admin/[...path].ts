import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import apiRoutes from '../../server/api.js';
import { requireAdmin } from '../../lib/auth.js';
import { prisma } from '../../lib/prisma.js';
import { encodeProductImageFocus, parseProductImageFocus } from '../../lib/products.js';
import { ensureProductPurchaseFields } from '../../lib/purchase.js';
import { ensureProductVariantsTable, mapProductVariant, normalizeVariantPayload } from '../../lib/variants.js';

const legacyApp = express();
legacyApp.use(express.json({ limit: '25mb' }));
legacyApp.use('/api', apiRoutes);

const getPathParts = (req: VercelRequest) => {
  try {
    const pathname = new URL(req.url || '/', 'https://mybabyshire.local').pathname;
    const marker = '/api/admin/';
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return pathname
        .slice(markerIndex + marker.length)
        .split('/')
        .map((part) => decodeURIComponent(part))
        .filter(Boolean);
    }
  } catch {
    // Fall through to the query representation used by local adapters.
  }

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

const normalizeImages = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((image: any, index) => ({
      image_url: String(image?.url || image?.imageUrl || '').trim(),
      public_id: String(image?.publicId || '').trim() || null,
      alt_text: encodeProductImageFocus(image),
      is_primary: index === 0,
      sort_order: index,
    }))
    .filter((image) => /^https?:\/\//i.test(image.image_url) || image.image_url.startsWith('/'))
    .slice(0, 2);
};

const mapImageForAdmin = (image: any) => {
  const focus = parseProductImageFocus(image);
  return {
    id: image.id,
    url: image.image_url,
    publicId: image.public_id || undefined,
    primary: image.is_primary,
    sortOrder: image.sort_order,
    focusX: focus.focusX,
    focusY: focus.focusY,
    zoom: focus.zoom,
    cropX: focus.cropX,
    cropY: focus.cropY,
    cropWidth: focus.cropWidth,
    cropHeight: focus.cropHeight,
  };
};

const handleProductImages = async (req: VercelRequest, res: VercelResponse) => {
  try {
    requireAdmin(getAuthorization(req));
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || 'Unauthorized' });
  }

  try {
    const productId = String(req.query.productId || req.body?.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

    const product = await prisma.products.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (req.method === 'GET') {
      const images = await prisma.product_images.findMany({
        where: { product_id: productId },
        orderBy: { sort_order: 'asc' },
      });
      return res.status(200).json(images.map(mapImageForAdmin));
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
        orderBy: { sort_order: 'asc' },
      });

      return res.status(200).json(saved.map(mapImageForAdmin));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(400).json({
      error: 'Product images request failed.',
      details: (error as Error).message,
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = getPathParts(req);

  if (parts[0] === 'products' || parts[0] === 'product-images') {
    await ensureProductPurchaseFields();
  }

  if (parts[0] === 'variants') {
    return handleVariants(req, res, parts);
  }

  if (parts[0] === 'product-images') {
    return handleProductImages(req, res);
  }

  return legacyApp(req as any, res as any);
}
