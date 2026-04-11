import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, rateLimit, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const DEFAULT_LIMIT = 15;
const SAFETY_TIMEOUT_MS = 8500;

// ── Feed Registry: Add new shops here ────────────────────
interface FeedConfig {
  id: string;
  url: string;
  shopName: string;
  sourceType: string;
}

const FEEDS: Record<string, FeedConfig> = {
  xxl_parfum: {
    id: "xxl_parfum",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1710426239&asid=2064719298&gsh=1&pfid=1022&gt=1",
    shopName: "XXL Parfum",
    sourceType: "adtraction_feed",
  },
  parfumsale: {
    id: "parfumsale",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1629076403&asid=2064719298&gsh=1&pfid=1000&gt=1",
    shopName: "Parfumsale",
    sourceType: "adtraction_feed",
  },
};

const DEFAULT_FEED_KEY = "xxl_parfum";

// ── In-memory feed cache: stores RAW XML + total count (not parsed items) ──
const feedCache = new Map<string, { xml: string; total: number; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Known totals for instant progress bar on first request
const KNOWN_TOTALS: Record<string, number> = {
  xxl_parfum: 16355,
  parfumsale: 8578,
};

export async function GET(req: NextRequest) { return handleRequest(req); }
export async function POST(req: NextRequest) { return handleRequest(req); }

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit(req, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const startMs = Date.now();
  const elapsed = () => Date.now() - startMs;

  // ── Parse query params ──────────────────────────────────
  const params = req.nextUrl.searchParams;
  const limitParam = params.get("limit");
  const offsetParam = params.get("offset") ?? params.get("skip"); // backward compat
  const feedKey = params.get("feed") ?? DEFAULT_FEED_KEY;
  const feed = FEEDS[feedKey] ?? FEEDS[DEFAULT_FEED_KEY];
  const limit = limitParam ? Math.max(1, Math.min(200, Math.floor(Number(limitParam)))) : DEFAULT_LIMIT;
  const scrub = params.get("scrub") === "true"; // force overwrite all product fields with clean feed data

  try {
    // ── 0. Fast init: return known total + last offset (no download) ──
    if (params.get("init") === "true") {
      const knownTotal = KNOWN_TOTALS[feedKey] ?? 0;
      const lastLog = await db.importLog.findFirst({
        where: { feedId: feed.id, status: { in: ["completed", "cycle_complete"] } },
        orderBy: { createdAt: "desc" },
        select: { currentSkip: true },
      }).catch(() => null);
      const lastOffset = lastLog?.currentSkip ?? 0;
      const pct = knownTotal > 0 ? Math.round((lastOffset / knownTotal) * 100) : 0;
      return jsonResponse(true, {
        offset: lastOffset, nextOffset: lastOffset, total: knownTotal,
        imported: 0, percent: pct, isComplete: lastOffset === 0 && pct === 100,
        limit, totalBatches: Math.ceil(knownTotal / limit),
        message: `${feed.shopName}: ${knownTotal} Produkte${lastOffset > 0 ? `, weiter bei ${lastOffset}` : ""}`,
        durationMs: elapsed(),
      });
    }

    // ── 1. Determine offset: query param → DB fallback ────
    let offset: number;
    if (offsetParam !== null && !isNaN(Number(offsetParam))) {
      offset = Math.max(0, Math.floor(Number(offsetParam)));
    } else {
      const lastLog = await db.importLog.findFirst({
        where: { feedId: feed.id, status: { in: ["completed", "cycle_complete"] } },
        orderBy: { createdAt: "desc" },
        select: { currentSkip: true },
      });
      offset = lastLog?.currentSkip ?? 0;
    }

    // ── 2. Get or download feed XML ────────────────────────
    let feedXml: string;
    let total: number;
    const cached = feedCache.get(feedKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      feedXml = cached.xml;
      total = cached.total;
    } else {
      if (elapsed() > 2500) {
        // Not enough time to download — return known total for progress bar
        return jsonResponse(false, {
          offset, total: KNOWN_TOTALS[feedKey] ?? 0,
          message: "Nicht genug Zeit für Download, bitte erneut versuchen.",
          durationMs: elapsed(),
        });
      }

      const feedRes = await fetch(feed.url, { signal: AbortSignal.timeout(5000) });
      if (!feedRes.ok) {
        return jsonResponse(false, { offset, total: 0, message: `Feed HTTP ${feedRes.status}`, durationMs: elapsed() });
      }

      const buffer = await feedRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      try { feedXml = await decompressZip(bytes); } catch { feedXml = new TextDecoder().decode(bytes); }

      // Fast count: just count <item> occurrences (no full parsing)
      total = countItems(feedXml);
      feedCache.set(feedKey, { xml: feedXml, total, timestamp: Date.now() });

      console.log(`[Import ${feed.id}] Feed downloaded: ${total} items, ${(feedXml.length / 1024).toFixed(0)} KB, ${elapsed()}ms`);
    }

    if (total === 0) {
      return jsonResponse(true, { offset: 0, total: 0, imported: 0, isComplete: true, message: "Feed leer", durationMs: elapsed() });
    }

    // ── 3. Parse ONLY the batch we need (lazy slice) ──────
    const batch = parseFeedSlice(feedXml, offset, limit);

    if (batch.length === 0) {
      await logImport(feed.id, 0, total, 0, 0, "cycle_complete", "Zyklus fertig.");
      return jsonResponse(true, { offset, total, imported: 0, nextOffset: 0, percent: 100, isComplete: true, limit, message: "Import komplett!", durationMs: elapsed() });
    }

    // ── 4. Match & Merge: GTIN-based upsert + per-shop price ─
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let stoppedEarly = false;
    const debugErrors: string[] = [];

    for (const item of batch) {
      if (elapsed() > SAFETY_TIMEOUT_MS) { stoppedEarly = true; break; }

      // GTIN sanitization: trim whitespace, use EAN/MPN/hash as fallback
      const rawGtin = (item.gtin || "").trim();
      const rawMpn = (item.mpn || "").trim();
      const gtin = rawGtin || rawMpn || `feed_${hashStr(item.link || `${offset + imported + skipped + errors}`)}`;

      const priceChf = parseSwissPrice(item.price);
      const affiliateLink = cleanUrl(item.link);

      // Relaxed validation: only GTIN + price are truly required
      if (!priceChf) {
        skipped++;
        if (skipped <= 3) debugErrors.push(`skip: no price for gtin=${gtin} raw="${item.price}"`);
        continue;
      }
      if (!affiliateLink || affiliateLink === "#") {
        skipped++;
        if (skipped <= 3) debugErrors.push(`skip: no link for gtin=${gtin}`);
        continue;
      }

      // Log first item's raw data for debugging
      if (offset === 0 && imported === 0 && skipped === 0 && errors === 0) {
        console.log(`[Import ${feed.id}] First item:`, JSON.stringify({
          gtin: item.gtin, mpn: item.mpn, price: item.price,
          title: (item.title || "").slice(0, 60), brand: item.brand,
          link: (item.link || "").slice(0, 80),
        }));
      }

      const { slug: catSlug, name: catName } = mapCategory(item.productType);
      const imageUrl = item.imageLink ? cleanUrl(item.imageLink) : null;
      const title = decodeHtml(item.title || gtin).slice(0, 500);
      const brand = decodeHtml(item.brand || feed.shopName).slice(0, 200);

      try {
        // Step A: Find existing product via raw SQL (bypasses pgvector deserialization)
        const rows = await db.$queryRaw<{ id: string; title: string; imageUrl: string | null; price: number | null; category: string | null }[]>`
          SELECT id, title, "imageUrl", price::float, category
          FROM "Product" WHERE gtin = ${gtin} LIMIT 1
        `;
        const existing = rows[0] ?? null;

        let productId: string;

        if (existing) {
          // Step A1: Update product via raw SQL (never touches embedding_vec)
          if (scrub) {
            await db.$executeRaw`
              UPDATE "Product" SET
                title = ${title}, brand = ${brand},
                category = ${catSlug}, "categoryName" = ${catName},
                "imageUrl" = COALESCE(${imageUrl}, "imageUrl"),
                price = ${priceChf}, "isActive" = true, "updatedAt" = NOW()
              WHERE gtin = ${gtin}
            `;
          } else {
            // Smart enrichment: only update if data is better
            const betterTitle = title.length > existing.title.length;
            const needsImage = !existing.imageUrl && imageUrl;
            const lowerPrice = priceChf < (existing.price ?? Infinity);
            const needsCategory = !existing.category;

            await db.$executeRaw`
              UPDATE "Product" SET
                title = CASE WHEN ${betterTitle} THEN ${title} ELSE title END,
                brand = CASE WHEN ${betterTitle} THEN ${brand} ELSE brand END,
                "imageUrl" = CASE WHEN ${needsImage ?? false} THEN ${imageUrl} ELSE "imageUrl" END,
                category = CASE WHEN ${needsCategory ?? false} THEN ${catSlug} ELSE category END,
                "categoryName" = CASE WHEN ${needsCategory ?? false} THEN ${catName} ELSE "categoryName" END,
                price = CASE WHEN ${lowerPrice} THEN ${priceChf} ELSE price END,
                "isActive" = true, "updatedAt" = NOW()
              WHERE gtin = ${gtin}
            `;
          }
          productId = existing.id;
        } else {
          // Step A2: Create new product via raw SQL
          const newId = generateId();
          await db.$executeRaw`
            INSERT INTO "Product" (id, gtin, title, brand, category, "categoryName", "imageUrl", "isActive", price, "sourceType", "createdAt", "updatedAt")
            VALUES (${newId}, ${gtin}, ${title}, ${brand}, ${catSlug}, ${catName}, ${imageUrl}, true, ${priceChf}, ${feed.sourceType}, NOW(), NOW())
          `;
          productId = newId;
        }

        // Step B: Write price for this shop (delete+create — avoids unique constraint issues)
        await db.$executeRaw`DELETE FROM "Price" WHERE "productId" = ${productId} AND "sourceId" = ${feed.id}`;
        await db.$executeRaw`
          INSERT INTO "Price" (id, "productId", "sourceId", "shopName", "amountChf", "amountEur", url, timestamp)
          VALUES (${generateId()}, ${productId}, ${feed.id}, ${feed.shopName}, ${priceChf}, 0, ${affiliateLink}, NOW())
        `;

        imported++;
      } catch (err) {
        errors++;
        const msg = err instanceof Error ? err.message : String(err);
        debugErrors.push(`err gtin=${gtin}: ${msg.slice(0, 120)}`);
        console.error(`[Import ${feed.id}] gtin=${gtin}:`, msg.slice(0, 200));
      }
    }

    // ── 5. Progress ───────────────────────────────────────
    const processed = imported + skipped + errors;
    const nextOffset = offset + processed;
    const isComplete = nextOffset >= total;
    const savedOffset = isComplete ? 0 : nextOffset;
    const percent = Math.min(100, Math.round((nextOffset / total) * 100));
    const totalBatches = Math.ceil(total / limit);
    const batchNum = Math.min(totalBatches, Math.ceil(nextOffset / limit));

    await logImport(feed.id, savedOffset, total, imported, errors,
      isComplete ? "cycle_complete" : "completed",
      stoppedEarly
        ? `Timeout nach ${imported}/${processed}. Weiter bei ${nextOffset}.`
        : `Batch ${batchNum}/${totalBatches}: ${imported} ok, ${skipped} skip, ${errors} err.`,
    );

    return jsonResponse(true, {
      offset, limit, imported, skipped, errors, total,
      nextOffset: savedOffset, percent: isComplete ? 100 : percent,
      isComplete, batchNum, totalBatches, stoppedEarly,
      message: isComplete ? "Import komplett!" : `Batch ${batchNum}/${totalBatches}`,
      durationMs: elapsed(),
      debug: debugErrors.length > 0 ? debugErrors.slice(0, 10) : undefined,
    });
  } catch (error) {
    const internalMsg = error instanceof Error ? error.message : String(error);
    console.error("[import-feed]", internalMsg);
    await logImport(feed.id, 0, 0, 0, 0, "error", internalMsg.slice(0, 500));
    return jsonResponse(false, { offset: 0, total: 0, message: safeErrorMessage(error), durationMs: elapsed() });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonResponse(ok: boolean, data: Record<string, any>) {
  return NextResponse.json({
    ok,
    offset: 0, limit: DEFAULT_LIMIT, imported: 0, skipped: 0, errors: 0, total: 0,
    nextOffset: 0, percent: 0, isComplete: false,
    batchNum: 0, totalBatches: 0, stoppedEarly: false,
    message: "", durationMs: 0,
    ...data,
  });
}

async function logImport(feedId: string, skip: number, total: number, imported: number, errors: number, status: string, message: string) {
  await db.importLog.create({
    data: { feedId, currentSkip: skip, totalItems: total, imported, errors, status, message },
  }).catch(() => {});
}

// ── ZIP ──────────────────────────────────────────────────────

async function decompressZip(data: Uint8Array): Promise<string> {
  if (data[0] !== 0x50 || data[1] !== 0x4b) {
    return new TextDecoder().decode(data);
  }
  const method = data[8] | (data[9] << 8);
  const compSize = data[18] | (data[19] << 8) | (data[20] << 16) | (data[21] << 24);
  const fnLen = data[26] | (data[27] << 8);
  const exLen = data[28] | (data[29] << 8);
  const headerOffset = 30 + fnLen + exLen;
  const size = compSize > 0 ? compSize : data.length - headerOffset - 100;
  const compressed = data.slice(headerOffset, headerOffset + size);

  if (method === 0) return new TextDecoder().decode(compressed);
  if (method === 8) {
    const ds = new DecompressionStream("deflate-raw");
    const w = ds.writable.getWriter();
    w.write(compressed);
    w.close();
    const r = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await r.read();
      if (done) break;
      chunks.push(value);
    }
    const totalBytes = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalBytes);
    let p = 0;
    for (const c of chunks) { result.set(c, p); p += c.length; }
    return new TextDecoder().decode(result);
  }
  throw new Error(`ZIP method ${method}`);
}

// ── XML ──────────────────────────────────────────────────────

interface FeedItem {
  title: string; price: string; link: string; imageLink: string;
  brand: string; gtin: string; mpn: string; productType: string;
}

/** Fast count: counts <item> tags without parsing content (~10x faster than full parse) */
function countItems(xml: string): number {
  let count = 0;
  let pos = 0;
  while (true) {
    pos = xml.indexOf("<item>", pos);
    if (pos === -1) break;
    count++;
    pos += 6;
  }
  return count;
}

/** Lazy parser: only fully parses items in [offset, offset+limit] range */
function parseFeedSlice(xml: string, offset: number, limit: number): FeedItem[] {
  const items: FeedItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  let index = 0;
  const end = offset + limit;

  while ((m = re.exec(xml)) !== null) {
    if (index >= end) break; // Stop early — we have enough
    if (index >= offset) {
      // Only parse items in our window
      const b = m[1];
      items.push({
        title: tag(b, "g:title") || tag(b, "title") || "",
        price: tag(b, "g:sale_price") || tag(b, "sale_price") || tag(b, "g:price") || tag(b, "price") || "",
        link: tag(b, "g:link") || tag(b, "link") || "",
        imageLink: tag(b, "g:image_link") || tag(b, "image_link") || "",
        brand: tag(b, "g:brand") || tag(b, "brand") || "",
        gtin: tag(b, "g:gtin") || tag(b, "g:ean") || "",
        mpn: tag(b, "g:mpn") || tag(b, "g:id") || tag(b, "id") || "",
        productType: tag(b, "g:product_type") || tag(b, "g:google_product_category") || "",
      });
    }
    index++;
  }
  return items;
}

function tag(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

// ── Utils ────────────────────────────────────────────────────

/** Parse Swiss price strings: "89.90 CHF", "75,00", "100", "CHF 120.50" → number */
function parseSwissPrice(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : Math.round(n * 100) / 100;
}

function decodeHtml(s: string): string {
  let prev = "";
  let current = s;
  for (let i = 0; i < 3 && current !== prev; i++) {
    prev = current;
    current = current
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));
  }
  return current;
}

function cleanUrl(s: string): string {
  return decodeHtml(s).trim();
}

// ── Category Mapping ─────────────────────────────────────────

const CATEGORY_MAP: { pattern: string; slug: string; name: string }[] = [
  { pattern: "men's fragrance", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "men's eau de", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "aftershave", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "cologne", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "women's fragrance", slug: "damendufte", name: "Damendüfte" },
  { pattern: "women's eau de", slug: "damendufte", name: "Damendüfte" },
  { pattern: "unisex fragrance", slug: "unisex-dufte", name: "Unisex-Düfte" },
  { pattern: "unisex eau de", slug: "unisex-dufte", name: "Unisex-Düfte" },
  { pattern: "fragrance", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "perfume", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "eau de parfum", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "eau de toilette", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "skin care", slug: "pflege", name: "Pflege" },
  { pattern: "skincare", slug: "pflege", name: "Pflege" },
  { pattern: "face care", slug: "pflege", name: "Pflege" },
  { pattern: "body care", slug: "pflege", name: "Pflege" },
  { pattern: "moisturi", slug: "pflege", name: "Pflege" },
  { pattern: "serum", slug: "pflege", name: "Pflege" },
  { pattern: "cleanser", slug: "pflege", name: "Pflege" },
  { pattern: "make up", slug: "make-up", name: "Make-Up" },
  { pattern: "makeup", slug: "make-up", name: "Make-Up" },
  { pattern: "cosmetic", slug: "make-up", name: "Make-Up" },
  { pattern: "lipstick", slug: "make-up", name: "Make-Up" },
  { pattern: "mascara", slug: "make-up", name: "Make-Up" },
  { pattern: "foundation", slug: "make-up", name: "Make-Up" },
  { pattern: "hair care", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "hair", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "shampoo", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "conditioner", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "bath", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "shower", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "body", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "deodorant", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "gift set", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "gift", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "set", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "sun", slug: "sonnenpflege", name: "Sonnenpflege" },
  { pattern: "spf", slug: "sonnenpflege", name: "Sonnenpflege" },
];

function mapCategory(productType: string | undefined): { slug: string; name: string } {
  if (!productType) return { slug: "parfum", name: "Parfum & Düfte" };
  const lower = productType.toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (lower.includes(entry.pattern)) return { slug: entry.slug, name: entry.name };
  }
  const firstPart = productType.split(">")[0].trim();
  if (firstPart) {
    const name = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    return { slug: slugify(firstPart), name };
  }
  return { slug: "parfum", name: "Parfum & Düfte" };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[äà]/g, "a").replace(/[öò]/g, "o")
    .replace(/[üù]/g, "u").replace(/[éèê]/g, "e")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Generate a cuid-like unique ID (avoids Prisma's default which touches the model) */
function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${ts}${rand}`;
}
