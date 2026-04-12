import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, rateLimit, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_LIMIT = 50;
const SAFETY_TIMEOUT_MS = 280_000; // stop 20s before Vercel kills us

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
  import_parfumerie: {
    id: "import_parfumerie",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1718945489&asid=2064719298&gsh=1&pfid=1087&gt=1",
    shopName: "Import Parfumerie",
    sourceType: "adtraction_feed",
  },
  coop_vitality: {
    id: "coop_vitality",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1937274155&asid=2064719298&gsh=1&pfid=2492&gt=1",
    shopName: "Coop Vitality",
    sourceType: "adtraction_feed",
  },
};

const DEFAULT_FEED_KEY = "xxl_parfum";

// ── In-memory feed cache: RAW XML + pre-computed item positions for O(1) slicing ──
interface CachedFeed {
  xml: string;
  itemStarts: number[]; // byte positions of each <item> tag — enables direct offset lookup
  total: number;
  timestamp: number;
}
const feedCache = new Map<string, CachedFeed>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

// Known totals for instant progress bar on first request
const KNOWN_TOTALS: Record<string, number> = {
  xxl_parfum: 16355,
  parfumsale: 8578,
  import_parfumerie: 10000,
  coop_vitality: 8000,
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
    let itemStarts: number[];
    let total: number;
    const cached = feedCache.get(feedKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      feedXml = cached.xml;
      itemStarts = cached.itemStarts;
      total = cached.total;
    } else {
      // First request for this feed — download + decompress
      const feedRes = await fetch(feed.url, { signal: AbortSignal.timeout(6500) });
      if (!feedRes.ok) {
        return jsonResponse(false, { offset, total: KNOWN_TOTALS[feedKey] ?? 0, message: `Feed HTTP ${feedRes.status}`, durationMs: elapsed() });
      }

      const buffer = await feedRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      try { feedXml = await decompressZip(bytes); } catch { feedXml = new TextDecoder().decode(bytes); }

      // Build position index ONCE (O(n) scan, ~50ms for 41k items)
      // Subsequent slices are O(1) direct lookup — offset=40000 as fast as offset=0
      itemStarts = buildItemIndex(feedXml);
      total = itemStarts.length;
      feedCache.set(feedKey, { xml: feedXml, itemStarts, total, timestamp: Date.now() });

      console.log(`[Import ${feed.id}] Feed ready: ${total} items, ${(feedXml.length / 1024).toFixed(0)} KB, ${elapsed()}ms`);

      // If download took most of our time, return success with 0 imported
      // The cache is warm now — next request will be fast
      if (elapsed() > SAFETY_TIMEOUT_MS) {
        return jsonResponse(true, {
          offset, total, imported: 0, skipped: 0, errors: 0,
          nextOffset: offset, percent: Math.round((offset / total) * 100),
          isComplete: false, limit, stoppedEarly: true,
          totalBatches: Math.ceil(total / limit),
          message: `Feed geladen (${(elapsed() / 1000).toFixed(1)}s) — nächster Batch aus Cache`,
          durationMs: elapsed(),
        });
      }
    }

    if (total === 0) {
      return jsonResponse(true, { offset: 0, total: 0, imported: 0, isComplete: true, message: "Feed leer", durationMs: elapsed() });
    }

    // ── 3. Parse ONLY the batch we need (O(1) direct slice via index) ──
    const batch = parseFeedSliceIndexed(feedXml, itemStarts, offset, limit);

    if (batch.length === 0) {
      await logImport(feed.id, 0, total, 0, 0, "cycle_complete", "Zyklus fertig.");
      return jsonResponse(true, { offset, total, imported: 0, nextOffset: 0, percent: 100, isComplete: true, limit, message: "Import komplett!", durationMs: elapsed() });
    }

    // ── 4. Match & Merge: parallel GTIN upsert + per-shop price ─
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const stoppedEarly = false;
    const debugErrors: string[] = [];

    // Pre-validate and prepare all items
    interface PreparedItem {
      gtin: string; priceChf: number; originalPriceChf: number | null;
      affiliateLink: string;
      catSlug: string; catName: string; imageUrl: string | null;
      title: string; brand: string;
    }
    const prepared: PreparedItem[] = [];

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const rawGtin = (item.gtin || "").trim();
      const rawMpn = (item.mpn || "").trim();
      const gtin = rawGtin || rawMpn || `feed_${hashStr(item.link || `${offset + i}`)}`;

      const priceChf = parseSwissPrice(item.price);
      const originalPriceChf = parseSwissPrice(item.originalPrice);
      const affiliateLink = cleanUrl(item.link);

      if (!priceChf) {
        skipped++;
        if (skipped <= 3) debugErrors.push(`skip: no price gtin=${gtin}`);
        continue;
      }
      if (!affiliateLink || affiliateLink === "#") {
        skipped++;
        if (skipped <= 3) debugErrors.push(`skip: no link gtin=${gtin}`);
        continue;
      }

      // Pharmacy Rx filter: skip prescription-only products (Swiss regulation)
      const lowerTitle = (item.title || "").toLowerCase();
      const lowerDesc = (item.description || "").toLowerCase();
      const isRx = /\b(rx|rezeptpflichtig|verschreibungspflichtig|prescription[- ]only|nur auf rezept)\b/i.test(lowerTitle + " " + lowerDesc);
      if (isRx) {
        skipped++;
        if (skipped <= 3) debugErrors.push(`skip: Rx product gtin=${gtin}`);
        continue;
      }

      if (prepared.length === 0 && offset === 0) {
        console.log(`[Import ${feed.id}] First item:`, JSON.stringify({
          gtin: item.gtin, mpn: item.mpn, price: item.price, origPrice: item.originalPrice,
          title: (item.title || "").slice(0, 60), brand: item.brand,
        }));
      }

      const { slug: catSlug, name: catName } = mapCategory(item.productType);
      prepared.push({
        gtin,
        priceChf,
        // Only use originalPrice if it's strictly higher (= real discount)
        originalPriceChf: originalPriceChf && originalPriceChf > priceChf ? originalPriceChf : null,
        affiliateLink,
        catSlug,
        catName,
        imageUrl: item.imageLink ? cleanUrl(item.imageLink) : null,
        title: decodeHtml(item.title || gtin).slice(0, 500),
        brand: decodeHtml(item.brand || feed.shopName).slice(0, 200),
      });
    }

    // Process all prepared items in parallel (Promise.allSettled)
    const PARALLEL_CHUNK = 10; // process 10 at a time to avoid overwhelming Supabase
    for (let c = 0; c < prepared.length; c += PARALLEL_CHUNK) {
      if (elapsed() > SAFETY_TIMEOUT_MS) break;

      const chunk = prepared.slice(c, c + PARALLEL_CHUNK);
      const results = await Promise.allSettled(
        chunk.map((p) => processItem(p, feed, scrub))
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          imported++;
        } else {
          errors++;
          const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
          debugErrors.push(`err: ${msg.slice(0, 100)}`);
          if (errors <= 5) console.error(`[Import ${feed.id}]`, msg.slice(0, 200));
        }
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

/**
 * Process a single product: 2 round-trips (was 4) via INSERT ON CONFLICT.
 * - Product: upsert by gtin with smart enrichment in SQL CASE expressions
 * - Price: upsert by (productId, sourceId) — single statement, no DELETE+INSERT
 */
async function processItem(
  p: { gtin: string; priceChf: number; originalPriceChf: number | null; affiliateLink: string; catSlug: string; catName: string; imageUrl: string | null; title: string; brand: string },
  feed: FeedConfig,
  scrub: boolean,
) {
  const newId = generateId();

  // Step 1: UPSERT Product (single round-trip)
  // - Scrub mode: overwrite everything
  // - Enrichment mode: longer title wins, lowest price wins, fill missing image/category
  // - Bypasses pgvector column entirely (not listed in INSERT/UPDATE)
  const productRows = scrub
    ? await db.$queryRaw<{ id: string }[]>`
        INSERT INTO "Product" (id, gtin, title, brand, category, "categoryName", "imageUrl", "isActive", price, "sourceType", "createdAt", "updatedAt")
        VALUES (${newId}, ${p.gtin}, ${p.title}, ${p.brand}, ${p.catSlug}, ${p.catName}, ${p.imageUrl}, true, ${p.priceChf}, ${feed.sourceType}, NOW(), NOW())
        ON CONFLICT (gtin) DO UPDATE SET
          title = EXCLUDED.title,
          brand = EXCLUDED.brand,
          category = EXCLUDED.category,
          "categoryName" = EXCLUDED."categoryName",
          "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Product"."imageUrl"),
          price = EXCLUDED.price,
          "isActive" = true,
          "updatedAt" = NOW()
        RETURNING id
      `
    : await db.$queryRaw<{ id: string }[]>`
        INSERT INTO "Product" (id, gtin, title, brand, category, "categoryName", "imageUrl", "isActive", price, "sourceType", "createdAt", "updatedAt")
        VALUES (${newId}, ${p.gtin}, ${p.title}, ${p.brand}, ${p.catSlug}, ${p.catName}, ${p.imageUrl}, true, ${p.priceChf}, ${feed.sourceType}, NOW(), NOW())
        ON CONFLICT (gtin) DO UPDATE SET
          title = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.title ELSE "Product".title END,
          brand = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.brand ELSE "Product".brand END,
          "imageUrl" = COALESCE("Product"."imageUrl", EXCLUDED."imageUrl"),
          category = COALESCE(NULLIF("Product".category, ''), EXCLUDED.category),
          "categoryName" = COALESCE(NULLIF("Product"."categoryName", ''), EXCLUDED."categoryName"),
          price = CASE WHEN EXCLUDED.price < COALESCE("Product".price, 9999999) THEN EXCLUDED.price ELSE "Product".price END,
          "isActive" = true,
          "updatedAt" = NOW()
        RETURNING id
      `;

  const productId = productRows[0]?.id ?? newId;

  // Step 2: UPSERT Price via unique constraint (productId, sourceId)
  await db.$executeRaw`
    INSERT INTO "Price" (id, "productId", "sourceId", "shopName", "amountChf", "amountEur", url, timestamp)
    VALUES (${generateId()}, ${productId}, ${feed.id}, ${feed.shopName}, ${p.priceChf}, 0, ${p.affiliateLink}, NOW())
    ON CONFLICT ("productId", "sourceId") DO UPDATE SET
      "amountChf" = EXCLUDED."amountChf",
      "shopName" = EXCLUDED."shopName",
      url = EXCLUDED.url,
      timestamp = NOW()
  `;
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
  originalPrice: string; description: string; availability: string;
}

/**
 * Build a position index of all <item> start positions.
 * Runs once per feed cache lifetime (~50ms for 41k items).
 * Enables O(1) offset lookup — offset=40000 is as fast as offset=0.
 */
function buildItemIndex(xml: string): number[] {
  const starts: number[] = [];
  let pos = 0;
  while (true) {
    pos = xml.indexOf("<item>", pos);
    if (pos === -1) break;
    starts.push(pos);
    pos += 6;
  }
  return starts;
}

/**
 * O(1) indexed slice: directly jumps to item N using the pre-computed index.
 * Only parses the items in [offset, offset+limit].
 * Streaming-like behavior: other items never touched.
 */
function parseFeedSliceIndexed(xml: string, itemStarts: number[], offset: number, limit: number): FeedItem[] {
  const items: FeedItem[] = [];
  const end = Math.min(offset + limit, itemStarts.length);

  for (let i = offset; i < end; i++) {
    const start = itemStarts[i] + 6; // skip "<item>"
    // Find </item> — bounded search (next item's start or end of XML)
    const limit = i + 1 < itemStarts.length ? itemStarts[i + 1] : xml.length;
    const closeIdx = xml.indexOf("</item>", start);
    if (closeIdx === -1 || closeIdx > limit) continue;
    const block = xml.slice(start, closeIdx);
    items.push(extractItem(block));
  }
  return items;
}

/** Extract all fields from a single item block. Handles g: namespace + plain tags. */
function extractItem(block: string): FeedItem {
  return {
    title: tag(block, "g:title") || tag(block, "title") || "",
    price: tag(block, "g:sale_price") || tag(block, "sale_price") || tag(block, "g:price") || tag(block, "price") || "",
    originalPrice: tag(block, "g:price") || tag(block, "price") || "",
    link: tag(block, "g:link") || tag(block, "link") || "",
    imageLink: tag(block, "g:image_link") || tag(block, "image_link") || "",
    brand: tag(block, "g:brand") || tag(block, "brand") || "",
    gtin: tag(block, "g:gtin") || tag(block, "g:ean") || "",
    mpn: tag(block, "g:mpn") || tag(block, "g:id") || tag(block, "id") || "",
    productType: tag(block, "g:product_type") || tag(block, "g:google_product_category") || "",
    description: tag(block, "g:description") || tag(block, "description") || "",
    availability: tag(block, "g:availability") || tag(block, "availability") || "",
  };
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
  // Fallback: use first segment before ">"
  const firstPart = productType.split(">")[0].trim();
  if (firstPart && !/^\d+$/.test(firstPart) && firstPart.length > 2) {
    const name = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    return { slug: slugify(firstPart), name };
  }
  // Numeric IDs or unknown → default to parfum
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
