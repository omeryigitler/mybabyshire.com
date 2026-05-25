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
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    sku: product.sku || '',
    stockQuantity: product.stock_quantity || 0,
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
    featured: product.featured,
    newArrival: product.new_arrival,
    bestseller: product.bestseller,
    genderTag: product.gender_tag || '',
    ageRange: product.age_range || '',
    material: product.material || '',
    careInstructions: product.care_instructions || '',
    preparationTime: product.preparation_time || '',
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
