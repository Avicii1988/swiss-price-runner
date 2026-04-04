import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateImageEmbedding,
  generateImageEmbeddingFromUrl,
  generateTextEmbedding,
} from "@/lib/ai/embeddings";

/**
 * POST /api/search/visual
 *
 * Visual search: receive image → describe via vision → embed → pgvector query.
 *
 * Accepts:
 *   - multipart/form-data with "image" file
 *   - JSON { imageUrl: "https://..." }
 *   - JSON { imageBase64: "...", mimeType: "image/jpeg" }
 *
 * Returns top 5 most similar products by cosine similarity.
 */
export async function POST(request: Request) {
  try {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const contentType = request.headers.get("content-type") ?? "";

    let queryEmbedding: number[] | null = null;
    let description = "";
    let fallbackText = "";

    // ── Extract image and generate embedding ────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      if (hasOpenAI) {
        // Convert file to base64
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const result = await generateImageEmbedding(base64, file.type);
        queryEmbedding = result.embedding;
        description = result.description;
      }

      fallbackText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    } else {
      const body = await request.json();

      if (body.imageBase64 && hasOpenAI) {
        const result = await generateImageEmbedding(
          body.imageBase64,
          body.mimeType ?? "image/jpeg",
        );
        queryEmbedding = result.embedding;
        description = result.description;
      } else if (body.imageUrl) {
        if (hasOpenAI) {
          const result = await generateImageEmbeddingFromUrl(body.imageUrl);
          queryEmbedding = result.embedding;
          description = result.description;
        }
        fallbackText = body.imageUrl.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "";
      } else {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
    }

    // ── Query for similar products ──────────────────────────────────
    let results: Array<{
      gtin: string;
      title: string;
      brand: string;
      category: string;
      imageUrl: string | null;
      similarity: number;
    }> = [];

    if (queryEmbedding) {
      // Try pgvector cosine similarity first
      try {
        const vectorStr = `[${queryEmbedding.join(",")}]`;
        const pgResults = await db.$queryRawUnsafe<
          Array<{ id: string; gtin: string; title: string; brand: string; category: string; "imageUrl": string | null; similarity: number }>
        >(
          `SELECT id, gtin, title, brand, category, "imageUrl",
                  1 - (embedding_vec <=> $1::vector) as similarity
           FROM "Product"
           WHERE embedding_vec IS NOT NULL
           ORDER BY embedding_vec <=> $1::vector
           LIMIT 5`,
          vectorStr,
        );
        results = pgResults.map((r) => ({
          ...r,
          similarity: Number(r.similarity),
        }));
      } catch {
        // pgvector not set up — fall back to in-memory cosine similarity
        console.log("[visual-search] pgvector not available, using in-memory cosine");

        const productsWithEmb = await db.product.findMany({
          where: { NOT: { embedding: null } },
          select: { gtin: true, title: true, brand: true, category: true, imageUrl: true, embedding: true },
        });

        const scored = productsWithEmb
          .map((p) => {
            const emb = JSON.parse(p.embedding!) as number[];
            const sim = cosineSimilarity(queryEmbedding!, emb);
            return { ...p, similarity: sim };
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);

        results = scored;
      }
    }

    // Fallback: text-based search if no embeddings available
    if (results.length === 0 && (fallbackText || description)) {
      const searchText = description || fallbackText;
      const words = searchText.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);

      const textResults = await db.product.findMany({
        where: {
          OR: words.map((w) => ({
            OR: [
              { title: { contains: w, mode: "insensitive" as const } },
              { brand: { contains: w, mode: "insensitive" as const } },
            ],
          })),
        },
        take: 5,
        select: { gtin: true, title: true, brand: true, category: true, imageUrl: true },
      });

      results = textResults.map((p) => ({ ...p, similarity: 0 }));
    }

    // Final fallback: return newest products
    if (results.length === 0) {
      const newest = await db.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { gtin: true, title: true, brand: true, category: true, imageUrl: true },
      });
      results = newest.map((p) => ({ ...p, similarity: 0 }));
    }

    return NextResponse.json({
      status: "ok",
      method: queryEmbedding ? "vector_similarity" : "text_fallback",
      description: description || undefined,
      results: results.map((r) => ({
        gtin: r.gtin,
        title: r.title,
        brand: r.brand,
        category: r.category,
        imageUrl: r.imageUrl,
        similarity: r.similarity ? Math.round(r.similarity * 100) : undefined,
      })),
    });
  } catch (error) {
    console.error("[visual-search] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * Cosine similarity between two vectors (in-memory fallback).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
