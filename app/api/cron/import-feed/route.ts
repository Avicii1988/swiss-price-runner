import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, rateLimit, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const DEFAULT_LIMIT = 50;
const SAFETY_TIMEOUT_MS = 6500;

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
  import_parfumerie: {
    id: "import_parfumerie",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1629076403&asid=2064719298&gsh=1&pfid=1000&gt=1",
    shopName: "Import Parfumerie",
    sourceType: "adtraction_feed",
  },
};

const DEFAULT_FEED_KEY = "xxl_parfum";

// ── In-memory feed cache (per feed key, survives within same serverless instance) ──
const feedCache = new Map<string, { items: FeedItem[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

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

    // ── 2. Get feed items (cached per feed key, or fresh) ──
    let items: FeedItem[];
    const cached = feedCache.get(feedKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      items = cached.items;
    } else {
      if (elapsed() > 2000) {
        return jsonResponse(false, { offset, total: 0, message: "Nicht genug Zeit für Download, bitte erneut versuchen.", durationMs: elapsed() });
      }

      const feedRes = await fetch(feed.url, { signal: AbortSignal.timeout(4000) });
      if (!feedRes.ok) {
        return jsonResponse(false, { offset, total: 0, message: `Feed HTTP ${feedRes.status}`, durationMs: elapsed() });
      }

      const buffer = await feedRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      let xml: string;
      try { xml = await decompressZip(bytes); } catch { xml = new TextDecoder().decode(bytes); }

      items = parseFeed(xml);
      feedCache.set(feedKey, { items, timestamp: Date.now() });
    }

    const total = items.length;
    if (total === 0) {
      return jsonResponse(true, { offset: 0, total: 0, imported: 0, isComplete: true, message: "Feed leer", durationMs: elapsed() });
    }

    // ── 3. Slice batch ────────────────────────────────────
    const batch = items.slice(offset, offset + limit);

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
      // Relaxed timeout for debugging — only stop at 9s (Vercel max is 10s)
      if (elapsed() > 9000) { stoppedEarly = true; break; }

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
        // Step A: Find or create Product by GTIN
        const existing = await db.product.findUnique({
          where: { gtin },
          select: { id: true, title: true, imageUrl: true, price: true, category: true },
        });

        let productId: string;

        if (existing) {
          const updates: Record<string, unknown> = {
            isActive: true,
            updatedAt: new Date(),
          };

          if (scrub) {
            updates.title = title;
            updates.brand = brand;
            updates.category = catSlug;
            updates.categoryName = catName;
            if (imageUrl) updates.imageUrl = imageUrl;
            updates.price = priceChf;
          } else {
            if (title.length > existing.title.length) {
              updates.title = title;
              updates.brand = brand;
            }
            if (!existing.imageUrl && imageUrl) {
              updates.imageUrl = imageUrl;
            }
            if (!existing.category) {
              updates.category = catSlug;
              updates.categoryName = catName;
            }
            const existingPrice = existing.price ? Number(existing.price) : Infinity;
            if (priceChf < existingPrice) {
              updates.price = priceChf;
            }
          }

          await db.product.update({ where: { gtin }, data: updates });
          productId = existing.id;
        } else {
          const created = await db.product.create({
            data: {
              gtin, title, brand,
              category: catSlug, categoryName: catName,
              imageUrl, isActive: true, price: priceChf,
            },
            select: { id: true },
          });
          productId = created.id;
        }

        // Step B: Write price for this shop (delete+create)
        await db.price.deleteMany({
          where: { productId, sourceId: feed.id },
        });
        await db.price.create({
          data: {
            productId,
            sourceId: feed.id,
            shopName: feed.shopName,
            amountChf: priceChf,
            amountEur: 0,
            url: affiliateLink,
          },
        });

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

function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
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
