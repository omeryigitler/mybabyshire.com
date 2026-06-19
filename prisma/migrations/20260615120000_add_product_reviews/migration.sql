CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "author_name" TEXT NOT NULL,
  "author_email" TEXT,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "body" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_reviews_product_id_status_idx"
  ON "product_reviews"("product_id", "status");

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
