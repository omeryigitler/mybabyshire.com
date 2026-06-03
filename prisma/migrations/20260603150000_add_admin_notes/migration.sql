ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "internal_note" TEXT;

CREATE TABLE IF NOT EXISTS "customer_notes" (
  "id" TEXT NOT NULL,
  "customer_email" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_notes_customer_email_key"
  ON "customer_notes"("customer_email");
