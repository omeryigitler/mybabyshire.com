-- Member profile, shipping address, and Stripe payment-method reference tables.
-- No card number, CVV, or raw payment credentials are stored here.

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "phone" TEXT,
  "stripe_customer_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_id_key" ON "user_profiles"("user_id");

ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Home',
  "full_name" TEXT NOT NULL,
  "phone" TEXT,
  "address_line1" TEXT NOT NULL,
  "address_line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "postal_code" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'US',
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_addresses_user_id_idx" ON "user_addresses"("user_id");

ALTER TABLE "user_addresses"
  ADD CONSTRAINT "user_addresses_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_payment_methods" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "stripe_payment_method_id" TEXT NOT NULL,
  "brand" TEXT,
  "last4" TEXT,
  "exp_month" INTEGER,
  "exp_year" INTEGER,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_payment_methods_stripe_payment_method_id_key" ON "user_payment_methods"("stripe_payment_method_id");
CREATE INDEX IF NOT EXISTS "user_payment_methods_user_id_idx" ON "user_payment_methods"("user_id");

ALTER TABLE "user_payment_methods"
  ADD CONSTRAINT "user_payment_methods_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
