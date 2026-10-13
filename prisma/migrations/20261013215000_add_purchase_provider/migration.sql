ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "purchase_provider" TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS "purchase_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "etsy_listing_id" TEXT,
  ADD COLUMN IF NOT EXISTS "external_purchase_url" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "products_etsy_listing_id_key"
  ON "products"("etsy_listing_id");

CREATE INDEX IF NOT EXISTS "products_purchase_provider_idx"
  ON "products"("purchase_provider");
