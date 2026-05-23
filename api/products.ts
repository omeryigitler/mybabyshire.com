import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mapProductForStorefront = (product: any) => {
  const primaryImage =
    product.images?.find((image: any) => image.is_primary) ||
    product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    imageUrl: primaryImage?.image_url || '',
    bgImage:
      product.card_bg_image ||
      product.sku ||
      '/product-card-cloud-blue.png',
    badge: product.bestseller
      ? 'Bestseller'
      : product.new_arrival
        ? 'New'
        : undefined,
    personalizationRequired: product.personalization_required,
    status: product.status,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      include: {
        images: true,
        category: true,
        personalization_fields: true,
      },
      orderBy: { created_at: 'asc' },
    });

    return res.status(200).json(products.map(mapProductForStorefront));
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch products',
      details: (error as Error).message,
    });
  }
}
