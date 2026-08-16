import { prisma } from './prisma.js';

let variantTableReady: Promise<void> | null = null;

export const ensureProductVariantsTable = async () => {
  if (!variantTableReady) {
    variantTableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "product_variants" (
          "id" TEXT NOT NULL,
          "product_id" TEXT NOT NULL,
          "sku" TEXT NOT NULL,
          "color" TEXT,
          "size" TEXT,
          "price" DECIMAL(65,30),
          "stock_quantity" INTEGER NOT NULL DEFAULT 0,
          "active" BOOLEAN NOT NULL DEFAULT TRUE,
          "sort_order" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku")');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "product_variants_product_id_active_idx" ON "product_variants"("product_id", "active")');
    })().catch((error) => {
      variantTableReady = null;
      throw error;
    });
  }

  await variantTableReady;
};

const cleanText = (value: unknown, maxLength = 120) =>
  String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);

export const mapProductVariant = (variant: any) => ({
  id: variant.id,
  productId: variant.product_id,
  sku: variant.sku,
  color: variant.color || '',
  size: variant.size || '',
  price: variant.price === null || variant.price === undefined ? null : Number(variant.price),
  stockQuantity: Number(variant.stock_quantity) || 0,
  active: Boolean(variant.active),
  sortOrder: Number(variant.sort_order) || 0,
  createdAt: variant.created_at,
  updatedAt: variant.updated_at,
});

export const normalizeVariantPayload = (body: any) => {
  const productId = cleanText(body?.productId || body?.product_id, 80);
  const sku = cleanText(body?.sku, 80).toUpperCase();
  const color = cleanText(body?.color, 80) || null;
  const size = cleanText(body?.size, 40) || null;
  const rawPrice = body?.price;
  const parsedPrice = rawPrice === '' || rawPrice === null || rawPrice === undefined ? null : Number(rawPrice);
  const stockQuantity = Math.max(0, Math.floor(Number(body?.stockQuantity ?? body?.stock_quantity ?? 0) || 0));
  const sortOrder = Math.max(0, Math.floor(Number(body?.sortOrder ?? body?.sort_order ?? 0) || 0));

  if (!productId) throw new Error('Product is required.');
  if (!sku) throw new Error('Variant SKU is required.');
  if (!color && !size) throw new Error('Add at least a color or size to this variant.');
  if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
    throw new Error('Variant price must be greater than zero or left blank to use the product price.');
  }

  return {
    product_id: productId,
    sku,
    color,
    size,
    price: parsedPrice,
    stock_quantity: stockQuantity,
    active: body?.active !== false,
    sort_order: sortOrder,
  };
};

export const variantDisplayName = (variant: { color?: string | null; size?: string | null }) =>
  [variant.color, variant.size].filter(Boolean).join(' / ') || 'Default';
