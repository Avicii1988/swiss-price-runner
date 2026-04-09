-- Add categoryName to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryName" TEXT;
CREATE INDEX IF NOT EXISTS "Product_categoryName_idx" ON "Product"("categoryName");

-- Create Category table
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS "Category_slug_idx" ON "Category"("slug");

-- Mark existing products as seed/mockup
UPDATE "Product" SET "sourceType" = 'seed' WHERE "sourceType" IS NULL OR "sourceType" = '';
