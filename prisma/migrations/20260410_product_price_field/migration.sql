-- Add denormalized price field to Product for fast frontend reads
ALTER TABLE "Product" ADD COLUMN "price" DECIMAL(10, 2);
