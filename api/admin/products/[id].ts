import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma.js';
import { getJwtSecret } from '../../../lib/auth.js';
import {
  mapProductPersonalizationFields,
  normalizePersonalizationFieldCreateData,
} from '../../../lib/products.js';

const JWT_SECRET = getJwtSecret();

const getProductId = (req: VercelRequest) => {
  const value = req.query.id;
  return Array.isArray(value) ? value[0] : value;
};

const requireAdmin = (req: VercelRequest, res: VercelResponse) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return false;
  }

  try {
    jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return true;
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return false;
  }
};

const normalizePrice = (value: unknown) => {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const mapProductForAdmin = (product: any) => {
  const primaryImage =
    product.images?.find((image: any) => image.is_primary) || product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    sku: product.sku || '',
    categoryId: product.category_id || '',
    stockQuantity: product.stock_quantity || 0,
    imageUrl: primaryImage?.image_url || '',
    publicId: primaryImage?.public_id || '',
    bgImage: product.card_bg_image || product.sku || '/product-card-cloud-blue.png',
    badge: product.bestseller ? 'Bestseller' : product.new_arrival ? 'New' : undefined,
    personalizationRequired: product.personalization_required,
    personalizationEnabled: product.personalization_required,
    personalizationFields: mapProductPersonalizationFields(product),
    status: product.status,
    featured: product.featured,
    newArrival: product.new_arrival,
    isNewArrival: product.new_arrival,
    bestseller: product.bestseller,
    isBestseller: product.bestseller,
    genderTag: product.gender_tag || '',
    ageRange: product.age_range || '',
    material: product.material || '',
    careInstructions: product.care_instructions || '',
    preparationTime: product.preparation_time || '',
  };
};

const readProduct = async (req: VercelRequest, res: VercelResponse, id: string) => {
  try {
    const product = await prisma.products.findUnique({
      where: { id },
      include: { images: true, category: true, personalization_fields: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found.' });

    return res.status(200).json(mapProductForAdmin(product));
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch admin product',
      details: (error as Error).message,
    });
  }
};

const updateProduct = async (req: VercelRequest, res: VercelResponse, id: string) => {
  try {
    const {
      name,
      description,
      price,
      salePrice,
      imageUrl,
      publicId,
      bgImage,
      sku,
      status = 'active',
      personalizationRequired = true,
      personalizationFields = [],
      stockQuantity = 0,
      categoryId,
      featured = false,
      newArrival = false,
      bestseller = false,
      genderTag,
      ageRange,
      material,
      careInstructions,
      preparationTime,
    } = req.body || {};

    const normalizedPrice = normalizePrice(price);

    if (!name || !normalizedPrice || !imageUrl) {
      return res.status(400).json({
        error: 'name, positive price and imageUrl are required.',
      });
    }

    const fieldCreateData = Boolean(personalizationRequired)
      ? normalizePersonalizationFieldCreateData(personalizationFields)
      : [];

    await prisma.products.update({
      where: { id },
      data: {
        name,
        description,
        price: normalizedPrice,
        sale_price: salePrice ? Number(salePrice) : null,
        sku: sku || null,
        card_bg_image: bgImage || '/product-card-cloud-blue.png',
        category_id: categoryId || null,
        stock_quantity: Number(stockQuantity) || 0,
        status,
        featured: Boolean(featured),
        new_arrival: Boolean(newArrival),
        bestseller: Boolean(bestseller),
        gender_tag: genderTag || null,
        age_range: ageRange || null,
        material: material || null,
        care_instructions: careInstructions || null,
        preparation_time: preparationTime || null,
        personalization_required: Boolean(personalizationRequired),
        personalization_fields: Boolean(personalizationRequired)
          ? { deleteMany: {}, create: fieldCreateData }
          : { deleteMany: {} },
        images: {
          deleteMany: {},
          create: [
            {
              image_url: imageUrl,
              public_id: publicId || null,
              alt_text: name,
              is_primary: true,
              sort_order: 0,
            },
          ],
        },
      },
    });

    const product = await prisma.products.findUnique({
      where: { id },
      include: { images: true, category: true, personalization_fields: true },
    });

    if (!product) return res.status(404).json({ error: 'Product not found.' });

    return res.status(200).json(mapProductForAdmin(product));
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to update product',
      details: (error as Error).message,
    });
  }
};

const deleteProduct = async (req: VercelRequest, res: VercelResponse, id: string) => {
  try {
    const orderItemCount = await prisma.order_items.count({
      where: { product_id: id },
    });

    if (orderItemCount > 0) {
      await prisma.products.update({
        where: { id },
        data: { status: 'archived' },
      });

      return res.status(200).json({
        success: true,
        archived: true,
        message: 'Product is linked to existing orders, so it was archived instead of deleted.',
      });
    }

    await prisma.products.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to delete product',
      details: (error as Error).message,
    });
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;

  const id = getProductId(req);
  if (!id) return res.status(400).json({ error: 'Product id is required.' });

  if (req.method === 'GET') return readProduct(req, res, id);
  if (req.method === 'PUT') return updateProduct(req, res, id);
  if (req.method === 'DELETE') return deleteProduct(req, res, id);

  return res.status(405).json({ error: 'Method not allowed' });
}
