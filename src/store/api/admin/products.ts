import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { mapProductForStorefront, uniqueSlug } from '../../../../lib/products';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req.headers.authorization);
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message });
  }

  if (req.method === 'GET') {
    try {
      const products = await prisma.products.findMany({
        include: {
          images: true,
          category: true,
        },
        orderBy: { created_at: 'desc' },
      });

      return res.status(200).json(products.map(mapProductForStorefront));
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch admin products',
        details: (error as Error).message,
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        price,
        imageUrl,
        publicId,
        bgImage,
        status = 'active',
        personalizationRequired = true,
        stockQuantity = 0,
        categoryId,
      } = req.body;

      if (!name || !price || !imageUrl) {
        return res.status(400).json({
          error: 'name, price and imageUrl are required.',
        });
      }

      const slug = await uniqueSlug(name);

      const product = await prisma.products.create({
        data: {
          name,
          slug,
          description,
          price,
          sku: bgImage || '/product-card-cloud-blue.png',
          card_bg_image: bgImage || '/product-card-cloud-blue.png',
          category_id: categoryId || null,
          stock_quantity: Number(stockQuantity) || 0,
          status,
          personalization_required: Boolean(personalizationRequired),
          images: {
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
        include: {
          images: true,
          category: true,
        },
      });

      return res.status(201).json(mapProductForStorefront(product));
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to create product',
        details: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
