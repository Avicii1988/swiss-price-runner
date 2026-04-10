-- Performance indexes for faster product queries
CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price");
CREATE INDEX IF NOT EXISTS "Product_updatedAt_idx" ON "Product"("updatedAt");
CREATE INDEX IF NOT EXISTS "Product_isActive_category_idx" ON "Product"("isActive", "category");
CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx" ON "Product"("isActive", "price");
