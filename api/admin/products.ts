import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';

const DEFAULT_CLOUD_VARIANTS = [
  { label: 'Blue', image: '/product-card-cloud-blue.png' },
  { label: 'Peach', image: '/product-card-cloud-peach.png' },
  { label: 'Mint', image: '/product-card-cloud-mint.png' },
];

const requireAdmin = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authorization.split(' ')[1];
  return jwt.verify(token, JWT_SECRET);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const uniqueSlug = async (name: string) => {
  const baseSlug = slugify(name) || `product-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.products.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const mapProductForAdmin = (product: any) => {
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
    categoryId: product.category_id || '',
    stockQuantity: product.stock_quantity || 0,
    imageUrl: primaryImage?.image_url || '',
    publicId: primaryImage?.public_id || '',
    bgImage: product.card_bg_image || '/product-card-cloud-blue.png',
    badge: product.bestseller ? 'Bestseller' : product.new_arrival ? 'New' : undefined,
    personalizationRequired: product.personalization_required,
    personalizationEnabled: product.personalization_required,
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

const normalizePrice = (value: unknown) => {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const normalizeCloudVariants = (body: any) => {
  if (Array.isArray(body.cloudVariants) && body.cloudVariants.length > 1) {
    return body.cloudVariants
      .map((variant: any) => ({
        label: String(variant.label || '').trim(),
        image: String(variant.image || '').trim(),
      }))
      .filter((variant: any) => variant.label && variant.image)
      .slice(0, 6);
  }

  if (body.createCloudVariants) return DEFAULT_CLOUD_VARIANTS;

  return [
    {
      label: '',
      image: String(body.bgImage || '/product-card-cloud-blue.png'),
    },
  ];
};

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

      return res.status(200).json(products.map(mapProductForAdmin));
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
        salePrice,
        imageUrl,
        publicId,
        bgImage,
        sku,
        status = 'active',
        personalizationRequired = true,
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
      } = req.body;

      const normalizedPrice = normalizePrice(price);
      const variants = normalizeCloudVariants(req.body);

      if (!name || !normalizedPrice || !imageUrl) {
        return res.status(400).json({
          error: 'name, positive price and imageUrl are required.',
        });
      }

      if (variants.length === 0) {
        return res.status(400).json({ error: 'Select at least one cloud color.' });
      }

      const createdProducts = [];

      for (const variant of variants) {
        const productName = variants.length > 1 ? `${name} - ${variant.label}` : name;
        const variantSku = sku && variants.length > 1 ? `${sku}-${variant.label.toUpperCase()}` : sku;
        const slug = await uniqueSlug(productName);

        const product = await prisma.products.create({
          data: {
            name: productName,
            slug,
            description,
            price: normalizedPrice,
            sale_price: salePrice ? Number(salePrice) : null,
            sku: variantSku || null,
            card_bg_image: variant.image || bgImage || '/product-card-cloud-blue.png',
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
            images: {
              create: [
                {
                  image_url: imageUrl,
                  public_id: publicId || null,
                  alt_text: productName,
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

        createdProducts.push(product);
      }

      const mappedProducts = createdProducts.map(mapProductForAdmin);

      if (mappedProducts.length > 1) {
        return res.status(201).json({
          products: mappedProducts,
          primaryProduct: mappedProducts[0],
          createdCount: mappedProducts.length,
        });
      }

      return res.status(201).json(mappedProducts[0]);
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to create product',
        details: (error as Error).message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
