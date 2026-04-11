-- Multi-shop price comparison: add shopName to Price + unique constraint for upsert
ALTER TABLE "Price" ADD COLUMN IF NOT EXISTS "shopName" TEXT;

-- Remove duplicate prices per product+source (keep latest) before adding unique constraint
DELETE FROM "Price" a USING "Price" b
WHERE a."productId" = b."productId"
  AND a."sourceId" = b."sourceId"
  AND a."timestamp" < b."timestamp";

-- Unique constraint: one price per product per shop (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS "Price_productId_sourceId_key"
ON "Price"("productId", "sourceId");
