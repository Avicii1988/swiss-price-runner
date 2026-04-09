-- Add affiliate/feed columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shopName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "affiliateUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS "Product_sourceType_idx" ON "Product"("sourceType");
CREATE INDEX IF NOT EXISTS "Product_isActive_idx" ON "Product"("isActive");
