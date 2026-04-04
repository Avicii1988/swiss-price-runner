import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateProductEmbedding, EMBEDDING_DIM } from "@/lib/ai/embeddings";

/**
 * POST /api/seed/embeddings
 *
 * Backfill route: generates text embeddings for all products that don't have one.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 *
 * Auth: requires CRON_SECRET.
 * Cost: ~$0.001 for 67 products (very cheap).
 *
 * After running this, set up pgvector for cosine similarity queries:
 *   1. CREATE EXTENSION IF NOT EXISTS vector;
 *   2. ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);
 *   3. UPDATE "Product" SET embedding_vec = embedding::vector WHERE embedding IS NOT NULL;
 *   4. CREATE INDEX ON "Product" USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 10);
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Get products without embeddings
    const products = await db.product.findMany({
      where: { embedding: null },
      select: { id: true, brand: true, title: true, category: true },
    });

    if (products.length === 0) {
      const total = await db.product.count();
      return NextResponse.json({
        status: "ok",
        message: "All products already have embeddings",
        totalProducts: total,
      });
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches of 5 to respect rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (product) => {
          const embedding = await generateProductEmbedding(
            product.brand,
            product.title,
            product.category,
          );

          await db.product.update({
            where: { id: product.id },
            data: { embedding: JSON.stringify(embedding) },
          });

          return product.id;
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          processed++;
        } else {
          failed++;
          errors.push(r.reason?.message ?? "Unknown");
        }
      }

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < products.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const total = await db.product.count();
    const withEmbeddings = await db.product.count({ where: { NOT: { embedding: null } } });

    return NextResponse.json({
      status: "ok",
      processed,
      failed,
      errors: errors.slice(0, 5),
      totalProducts: total,
      withEmbeddings,
      embeddingDim: EMBEDDING_DIM,
      _nextStep: "Run pgvector setup SQL to enable cosine similarity queries",
    });
  } catch (error) {
    console.error("[seed-embeddings] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
