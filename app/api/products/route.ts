import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().min(1).max(200),
  num: z.coerce.number().int().min(1).max(40).default(20),
});

export const dynamic = "force-dynamic";

/**
 * GET /api/products?q=iPhone+15&num=20
 *
 * Proxies to SearchApi.io Google Shopping with Swiss localization.
 * Returns normalized product data for the frontend.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.SEARCHAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SEARCHAPI_API_KEY not configured" },
      { status: 503 },
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, num } = parsed.data;

  try {
    const url = new URL("https://www.searchapi.io/api/v1/search");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", q);
    url.searchParams.set("location", "Switzerland");
    url.searchParams.set("hl", "de");
    url.searchParams.set("gl", "ch");
    url.searchParams.set("num", String(num));
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // cache for 5 min
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("SearchApi error:", res.status, text);
      return NextResponse.json(
        { error: "SearchApi request failed", status: res.status },
        { status: 502 },
      );
    }

    const data = await res.json();
    const results: ShoppingResult[] = (data.shopping_results ?? []).map(
      (item: RawShoppingResult) => ({
        title: item.title ?? "",
        price: item.price ?? item.extracted_price ?? null,
        extractedPrice: item.extracted_price ?? null,
        currency: item.currency ?? "CHF",
        source: item.source ?? "",
        thumbnail: item.thumbnail ?? null,
        link: item.link ?? item.product_link ?? "#",
        rating: item.rating ?? null,
        reviews: item.reviews ?? null,
        delivery: item.delivery ?? null,
      }),
    );

    return NextResponse.json({ query: q, count: results.length, results });
  } catch (err) {
    console.error("SearchApi fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch search results" },
      { status: 500 },
    );
  }
}

// ── Types ────────────────────────────────────────────────────

interface RawShoppingResult {
  title?: string;
  price?: string;
  extracted_price?: number;
  currency?: string;
  source?: string;
  thumbnail?: string;
  link?: string;
  product_link?: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
}

interface ShoppingResult {
  title: string;
  price: string | null;
  extractedPrice: number | null;
  currency: string;
  source: string;
  thumbnail: string | null;
  link: string;
  rating: number | null;
  reviews: number | null;
  delivery: string | null;
}
