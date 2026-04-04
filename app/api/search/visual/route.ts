import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/search/visual
 *
 * Visual search endpoint. Receives an image (multipart/form-data or JSON with
 * base64/URL), generates embeddings via AI, and returns the most similar products.
 *
 * Architecture:
 *   1. Receive image (file upload or URL)
 *   2. Generate embedding via OpenAI CLIP / Anthropic Claude Vision
 *   3. Query Supabase pgvector for nearest neighbors
 *   4. Return top-N matching products with prices
 *
 * Prerequisites:
 *   - Supabase: enable pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
 *   - Product table: add column embedding vector(512)
 *   - Index: CREATE INDEX ON "Product" USING ivfflat (embedding vector_cosine_ops)
 *
 * For now: returns mock results (text similarity) until AI model is connected.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let searchText = "";

    if (contentType.includes("multipart/form-data")) {
      // File upload — extract filename as proxy search term for now
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      // In production: send file to CLIP model for embedding
      // const embedding = await generateEmbedding(file);
      searchText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    } else {
      // JSON body with URL or base64
      const body = await request.json();
      const imageUrl = body.imageUrl as string | undefined;
      if (!imageUrl) {
        return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
      }
      // In production: download image, send to CLIP
      // const embedding = await generateEmbeddingFromUrl(imageUrl);
      searchText = imageUrl.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "";
    }

    // Mock: text-based search as placeholder for vector similarity
    const products = await db.product.findMany({
      where: {
        OR: [
          { title: { contains: searchText, mode: "insensitive" } },
          { brand: { contains: searchText, mode: "insensitive" } },
          { category: { contains: searchText, mode: "insensitive" } },
        ],
      },
      take: 5,
      include: {
        prices: {
          orderBy: { timestamp: "desc" },
          take: 3,
        },
      },
    });

    // If no text match, return random products
    const results = products.length > 0
      ? products
      : await db.product.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            prices: {
              orderBy: { timestamp: "desc" },
              take: 3,
            },
          },
        });

    return NextResponse.json({
      status: "ok",
      method: "mock_text_similarity",
      query: searchText,
      results: results.map((p) => ({
        gtin: p.gtin,
        title: p.title,
        brand: p.brand,
        category: p.category,
        imageUrl: p.imageUrl,
        latestPriceChf: p.prices[0] ? Number(p.prices[0].amountChf) : null,
      })),
      _info: "Production: replace with pgvector cosine similarity query on CLIP embeddings",
    });
  } catch (error) {
    console.error("[visual-search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
