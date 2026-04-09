import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for large feeds

const RequestSchema = z.object({
  feedUrl: z.string().url().optional(),
  shopName: z.string().min(1).max(100).default("XXL Parfum"),
  defaultCategory: z.string().min(1).max(50).default("parfum"),
  limit: z.coerce.number().int().min(0).max(10000).default(0), // 0 = all
});

// Default Adtraction XXL Parfum feed
const DEFAULT_FEED =
  "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=0&sn=0&flat=0&apid=1710426239&asid=2064719298&gsh=1&pfid=1022&gt=0";

/**
 * POST /api/feeds/import
 *
 * Imports Adtraction XML feed (Google Shopping format) into the database.
 * Handles both plain XML and ZIP-compressed feeds.
 * Auth: Bearer CRON_SECRET
 *
 * Body (all optional):
 *   { feedUrl, shopName, defaultCategory, limit }
 *
 * Default: imports the XXL Parfum feed with no limit.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { shopName, defaultCategory, limit } = parsed.data;
  const feedUrl = parsed.data.feedUrl || DEFAULT_FEED;
  const startMs = Date.now();

  try {
    // ── 1. Fetch the feed ────────────────────────────────────
    console.log(`[feed-import] Fetching ${feedUrl.slice(0, 80)}...`);
    const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(60000) });
    if (!feedRes.ok) {
      return NextResponse.json(
        { error: `Feed fetch failed: ${feedRes.status}` },
        { status: 502 },
      );
    }

    // ── 2. Decompress if ZIP ─────────────────────────────────
    let xml: string;
    const contentType = feedRes.headers.get("content-type") || "";
    const isZip =
      contentType.includes("zip") ||
      contentType.includes("octet-stream") ||
      feedUrl.includes("zip=1");

    if (isZip) {
      console.log("[feed-import] Decompressing ZIP...");
      const buffer = await feedRes.arrayBuffer();
      xml = await decompressZip(new Uint8Array(buffer));
    } else {
      xml = await feedRes.text();
    }

    console.log(`[feed-import] XML size: ${(xml.length / 1024).toFixed(0)} KB`);

    // ── 3. Parse items ───────────────────────────────────────
    const allItems = parseGoogleShoppingXml(xml);
    const items = limit > 0 ? allItems.slice(0, limit) : allItems;
    console.log(`[feed-import] Parsed ${allItems.length} items, processing ${items.length}`);

    if (items.length === 0) {
      return NextResponse.json({ status: "ok", imported: 0, message: "No items in feed" });
    }

    // ── 4. Auto-categorize ───────────────────────────────────
    const categorySet = new Set<string>();
    for (const item of items) {
      if (item.productType) {
        const cat = extractLeafCategory(item.productType);
        categorySet.add(cat);
      }
    }

    // Upsert categories
    for (const catName of categorySet) {
      const slug = slugify(catName);
      try {
        await db.category.upsert({
          where: { slug },
          create: { name: catName, slug },
          update: { name: catName },
        });
      } catch {
        // ignore duplicates
      }
    }

    // ── 5. Import products ───────────────────────────────────
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const gtin = item.gtin || item.mpn || `feed_${hashStr(item.link)}`;
        const priceChf = parsePrice(item.price);

        if (!priceChf || !item.title || !item.link) {
          skipped++;
          continue;
        }

        const leafCategory = item.productType
          ? extractLeafCategory(item.productType)
          : null;
        const categorySlug = leafCategory ? slugify(leafCategory) : defaultCategory;

        // Upsert product
        const product = await db.product.upsert({
          where: { gtin },
          create: {
            gtin,
            title: item.title,
            brand: item.brand || shopName,
            category: categorySlug,
            categoryName: item.productType || null,
            imageUrl: item.imageLink || null,
            shopName,
            sourceType: "adtraction_feed",
            affiliateUrl: item.link,
            isActive: true,
          },
          update: {
            title: item.title,
            brand: item.brand || undefined,
            imageUrl: item.imageLink || undefined,
            categoryName: item.productType || undefined,
            shopName,
            affiliateUrl: item.link,
            isActive: true,
            updatedAt: new Date(),
          },
        });

        // Write price snapshot
        await db.price.create({
          data: {
            productId: product.id,
            amountChf: priceChf,
            amountEur: priceChf / 0.94,
            sourceId: `adtraction_${slugify(shopName)}`,
            url: item.link,
            timestamp: new Date(),
          },
        });

        imported++;

        // Rate limit: small delay every 50 items
        if (imported % 50 === 0) {
          await new Promise((r) => setTimeout(r, 100));
          console.log(`[feed-import] Progress: ${imported}/${items.length}`);
        }
      } catch (e) {
        errors++;
        if (errors <= 5) console.warn("[feed-import] Item error:", e);
      }
    }

    const durationMs = Date.now() - startMs;
    console.log(`[feed-import] Done in ${durationMs}ms — imported=${imported} skipped=${skipped} errors=${errors}`);

    return NextResponse.json({
      status: "ok",
      feedUrl: feedUrl.slice(0, 80),
      shopName,
      totalInFeed: allItems.length,
      processed: items.length,
      imported,
      skipped,
      errors,
      categoriesFound: categorySet.size,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[feed-import] Fatal error:", error);
    return NextResponse.json(
      { error: "Feed import failed", message: String(error) },
      { status: 500 },
    );
  }
}

// ── ZIP Decompression ────────────────────────────────────────

async function decompressZip(data: Uint8Array): Promise<string> {
  // Simple ZIP extraction — find the first file and decompress
  // ZIP local file header starts with PK\x03\x04
  const pk = [0x50, 0x4b, 0x03, 0x04];
  let offset = 0;

  // Verify ZIP signature
  if (data[0] !== pk[0] || data[1] !== pk[1]) {
    // Not a ZIP — maybe it's already plain XML
    return new TextDecoder().decode(data);
  }

  // Parse local file header
  const compressMethod = data[8] | (data[9] << 8);
  const compressedSize = data[18] | (data[19] << 8) | (data[20] << 16) | (data[21] << 24);
  const fileNameLen = data[26] | (data[27] << 8);
  const extraLen = data[28] | (data[29] << 8);
  offset = 30 + fileNameLen + extraLen;

  const compressedData = data.slice(offset, offset + compressedSize);

  if (compressMethod === 0) {
    // Stored (no compression)
    return new TextDecoder().decode(compressedData);
  }

  if (compressMethod === 8) {
    // Deflate — use DecompressionStream
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write(compressedData);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLen);
    let pos = 0;
    for (const chunk of chunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return new TextDecoder().decode(result);
  }

  throw new Error(`Unsupported ZIP compression method: ${compressMethod}`);
}

// ── XML Parsing ──────────────────────────────────────────────

interface FeedItem {
  title: string;
  price: string;
  link: string;
  imageLink: string;
  brand: string;
  gtin: string;
  mpn: string;
  productType: string;
}

function parseGoogleShoppingXml(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] || match[2];
    items.push({
      title: tag(block, "g:title") || tag(block, "title") || "",
      price: tag(block, "g:price") || tag(block, "g:sale_price") || "",
      link: tag(block, "g:link") || tag(block, "link") || "",
      imageLink: tag(block, "g:image_link") || tag(block, "image_link") || "",
      brand: tag(block, "g:brand") || tag(block, "brand") || "",
      gtin: tag(block, "g:gtin") || tag(block, "g:ean") || "",
      mpn: tag(block, "g:mpn") || tag(block, "g:id") || "",
      productType: tag(block, "g:product_type") || tag(block, "g:google_product_category") || "",
    });
  }

  return items;
}

function tag(xml: string, name: string): string {
  const re = new RegExp(
    `<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`,
    "i",
  );
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

// ── Utilities ────────────────────────────────────────────────

function parsePrice(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/** "Beauty > Perfume > Men's Fragrances" → "Men's Fragrances" */
function extractLeafCategory(path: string): string {
  const parts = path.split(">").map((p) => p.trim());
  return parts[parts.length - 1] || path;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äà]/g, "a")
    .replace(/[öò]/g, "o")
    .replace(/[üù]/g, "u")
    .replace(/[éèê]/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
