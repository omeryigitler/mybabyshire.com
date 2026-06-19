CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'percent',
  "value" DECIMAL(65,30) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "min_subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "max_redemptions" INTEGER,
  "times_redeemed" INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
