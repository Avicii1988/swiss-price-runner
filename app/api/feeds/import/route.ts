import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow up to 60s for large feeds

const RequestSchema = z.object({
  feedUrl: z.string().url(),
  shopName: z.string().min(1).max(100),
  category: z.string().min(1).max(50).default("parfum"),
});

/**
 * POST /api/feeds/import
 *
 * Imports an Adtraction XML feed (Google Shopping format) into the database.
 * Auth: Bearer CRON_SECRET
 *
 * Body: { feedUrl: "https://...", shopName: "ParfumSale.ch", category: "parfum" }
 *
 * The feed is expected to contain <item> elements with:
 *   <g:title>, <g:price>, <g:link>, <g:image_link>, <g:brand>, <g:gtin>/<g:id>
 */
export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { feedUrl, shopName, category } = parsed.data;

  try {
    // Fetch the XML feed
    const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(30000) });
    if (!feedRes.ok) {
      return NextResponse.json(
        { error: `Feed fetch failed: ${feedRes.status}` },
        { status: 502 },
      );
    }

    const xml = await feedRes.text();

    // Parse items from XML (simple regex-based for Google Shopping format)
    const items = parseGoogleShoppingXml(xml);

    if (items.length === 0) {
      return NextResponse.json({ status: "ok", imported: 0, message: "No items found in feed" });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Use GTIN if available, otherwise generate from URL hash
        const gtin = item.gtin || `feed_${hashCode(item.link)}`;

        // Parse price: "49.95 CHF" or "49.95" -> 49.95
        const priceChf = parsePrice(item.price);
        if (!priceChf || !item.title) {
          skipped++;
          continue;
        }

        // Upsert product
        const product = await db.product.upsert({
          where: { gtin },
          create: {
            gtin,
            title: item.title,
            brand: item.brand || shopName,
            category,
            imageUrl: item.imageLink || null,
            shopName,
            sourceType: "adtraction_feed",
            affiliateUrl: item.link,
            isActive: true,
          },
          update: {
            title: item.title,
            brand: item.brand || shopName,
            imageUrl: item.imageLink || undefined,
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
            amountEur: priceChf / 0.94, // approximate EUR
            sourceId: `adtraction_${shopName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            url: item.link,
            timestamp: new Date(),
          },
        });

        imported++;

        // Small delay to avoid DB pressure
        if (imported % 50 === 0) {
          await new Promise((r) => setTimeout(r, 100));
        }
      } catch (e) {
        errors++;
        console.warn("[feed-import] Item error:", e);
      }
    }

    return NextResponse.json({
      status: "ok",
      feedUrl,
      shopName,
      totalInFeed: items.length,
      imported,
      skipped,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[feed-import] Error:", error);
    return NextResponse.json(
      { error: "Feed import failed" },
      { status: 500 },
    );
  }
}

// ── XML Parsing ──────────────────────────────────────────────

interface FeedItem {
  title: string;
  price: string;
  link: string;
  imageLink: string;
  brand: string;
  gtin: string;
}

function parseGoogleShoppingXml(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Match each <item>...</item> or <entry>...</entry>
  const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] || match[2];

    items.push({
      title: extractTag(block, "g:title") || extractTag(block, "title") || "",
      price: extractTag(block, "g:price") || extractTag(block, "g:sale_price") || "",
      link: extractTag(block, "g:link") || extractTag(block, "link") || "",
      imageLink: extractTag(block, "g:image_link") || extractTag(block, "image_link") || "",
      brand: extractTag(block, "g:brand") || extractTag(block, "brand") || "",
      gtin: extractTag(block, "g:gtin") || extractTag(block, "g:mpn") || extractTag(block, "g:id") || "",
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  // Handle both <g:title>text</g:title> and <g:title><![CDATA[text]]></g:title>
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const m = regex.exec(xml);
  return m ? m[1].trim() : "";
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  // "49.95 CHF" or "CHF 49.95" or "49.95" -> 49.95
  const cleaned = priceStr.replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
