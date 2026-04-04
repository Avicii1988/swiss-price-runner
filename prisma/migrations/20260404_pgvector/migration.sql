-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

-- Create IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS product_embedding_idx
  ON "Product" USING ivfflat (embedding_vec vector_cosine_ops)
  WITH (lists = 10);

-- Backfill: convert JSON embeddings to native vector column
-- Run this AFTER the /api/seed/embeddings route has populated the embedding column
UPDATE "Product"
SET embedding_vec = embedding::vector
WHERE embedding IS NOT NULL AND embedding_vec IS NULL;
