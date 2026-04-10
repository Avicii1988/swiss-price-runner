import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const BATCH_SIZE = 60;
const FEED_ID = "xxl_parfum";
const SAFETY_TIMEOUT_MS = 7500;
const DEFAULT_FEED =
  "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=0&sn=0&flat=0&apid=1710426239&asid=2064719298&gsh=1&pfid=1022&gt=0";

// ── In-memory feed cache (survives within same serverless instance) ──
let cachedItems: FeedItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

export async function GET(req: NextRequest) { return handleRequest(req); }
export async function POST(req: NextRequest) { return handleRequest(req); }

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();
  const elapsed = () => Date.now() - startMs;

  try {
    // ── 1. Get skip: prefer query param (parallel mode), else from DB ──
    const skipParam = req.nextUrl.searchParams.get("skip");
    let skip: number;

    if (skipParam !== null && !isNaN(Number(skipParam))) {
      skip = Math.max(0, Math.floor(Number(skipParam)));
    } else {
      const lastLog = await db.importLog.findFirst({
        where: { feedId: FEED_ID, status: { in: ["completed", "cycle_complete"] } },
        orderBy: { createdAt: "desc" },
        select: { currentSkip: true, totalItems: true },
      });
      skip = lastLog?.currentSkip ?? 0;
    }

    // ── 2. Get feed items (cached or fresh) ──────────────────
    let items: FeedItem[];
    if (cachedItems && Date.now() - cacheTimestamp < CACHE_TTL) {
      items = cachedItems;
    } else {
      // Check time — downloading takes ~2-3s
      if (elapsed() > 2000) {
        return timeoutResponse(skip, 0, elapsed(), "Nicht genug Zeit für Download, bitte erneut versuchen.");
      }

      const feedRes = await fetch(DEFAULT_FEED, {
        signal: AbortSignal.timeout(5000),
      });

      if (!feedRes.ok) {
        return errorResponse(skip, `Feed HTTP ${feedRes.status}`, elapsed());
      }

      const buffer = await feedRes.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      let xml: string;
      try {
        xml = await decompressZip(bytes);
      } catch {
        xml = new TextDecoder().decode(bytes);
      }

      items = parseFeed(xml);
      cachedItems = items;
      cacheTimestamp = Date.now();
    }

    const totalInFeed = items.length;

    if (totalInFeed === 0) {
      return NextResponse.json({
        ok: true, skip: 0, imported: 0, errors: 0, total: 0,
        nextSkip: 0, percent: 0, isComplete: true,
        message: "Feed leer", durationMs: elapsed(),
      });
    }

    // ── 3. Slice batch ───────────────────────────────────────
    const batch = items.slice(skip, skip + BATCH_SIZE);

    if (batch.length === 0) {
      // End of feed — reset
      await logImport(0, totalInFeed, 0, 0, "cycle_complete", "Zyklus fertig.");
      return NextResponse.json({
        ok: true, skip, imported: 0, errors: 0, total: totalInFeed,
        nextSkip: 0, percent: 100, isComplete: true,
        batchNum: Math.ceil(totalInFeed / BATCH_SIZE),
        totalBatches: Math.ceil(totalInFeed / BATCH_SIZE),
        message: "Import komplett!", durationMs: elapsed(),
      });
    }

    // ── 4. Import products with batched transaction ─────────
    let imported = 0;
    let errors = 0;
    let stoppedEarly = false;

    // Prepare all upsert operations first
    interface UpsertOp {
      gtin: string;
      title: string;
      brand: string;
      catSlug: string;
      catName: string;
      imageUrl: string | null;
      affiliateLink: string;
      priceChf: number;
    }
    const ops: UpsertOp[] = [];
    let loggedFirst = false;

    for (const item of batch) {
      if (elapsed() > SAFETY_TIMEOUT_MS) {
        stoppedEarly = true;
        break;
      }

      const gtin = item.gtin || item.mpn || `feed_${hashStr(item.link || `${skip + ops.length}`)}`;
      const rawPrice = item.price;
      const priceChf = parseSwissPrice(rawPrice);
      const affiliateLink = cleanUrl(item.link);
      if (!priceChf || !item.title || !affiliateLink) continue;

      // Debug: log first product of the very first batch
      if (skip === 0 && !loggedFirst) {
        console.log(`[Import Debug] Raw: "${rawPrice}" -> Parsed: ${priceChf} | GTIN: ${gtin} | Title: ${decodeHtml(item.title).slice(0, 60)}`);
        loggedFirst = true;
      }

      const { slug: catSlug, name: catName } = mapCategory(item.productType);
      const imageUrl = item.imageLink ? cleanUrl(item.imageLink) : null;

      ops.push({
        gtin,
        title: decodeHtml(item.title).slice(0, 500),
        brand: decodeHtml(item.brand || "XXL Parfum").slice(0, 200),
        catSlug, catName, imageUrl, affiliateLink, priceChf,
      });
    }

    // Execute all product upserts in a single transaction
    if (ops.length > 0) {
      const productResults = await db.$transaction(
        ops.map((op) =>
          db.product.upsert({
            where: { gtin: op.gtin },
            select: { id: true },
            create: {
              gtin: op.gtin,
              title: op.title,
              brand: op.brand,
              category: op.catSlug,
              categoryName: op.catName,
              imageUrl: op.imageUrl,
              shopName: "XXL Parfum",
              sourceType: "adtraction_feed",
              affiliateUrl: op.affiliateLink,
              isActive: true,
            },
            update: {
              title: op.title,
              brand: op.brand,
              category: op.catSlug,
              categoryName: op.catName,
              imageUrl: op.imageUrl || undefined,
              affiliateUrl: op.affiliateLink,
              isActive: true,
              updatedAt: new Date(),
            },
          })
        ),
      );

      // Write Price records: delete today's stale entries, then bulk create
      const productIds = productResults.map((p) => p.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.price.deleteMany({
        where: {
          productId: { in: productIds },
          sourceId: "adtraction_xxl_parfum",
          timestamp: { gte: today },
        },
      });

      await db.price.createMany({
        data: productResults.map((product, i) => ({
          productId: product.id,
          amountChf: ops[i].priceChf,
          amountEur: 0,
          sourceId: "adtraction_xxl_parfum",
          url: ops[i].affiliateLink,
        })),
      });

      imported = productResults.length;
    }

    // ── 5. Save progress ─────────────────────────────────────
    const actualProcessed = stoppedEarly ? imported : batch.length;
    const nextSkip = skip + actualProcessed;
    const isComplete = nextSkip >= totalInFeed;
    const savedSkip = isComplete ? 0 : nextSkip;
    const percent = Math.round((nextSkip / totalInFeed) * 100);
    const batchNum = Math.ceil(nextSkip / BATCH_SIZE);
    const totalBatches = Math.ceil(totalInFeed / BATCH_SIZE);

    await logImport(savedSkip, totalInFeed, imported, errors,
      isComplete ? "cycle_complete" : "completed",
      stoppedEarly
        ? `Timeout nach ${imported} Produkten. Weiter bei ${nextSkip}.`
        : `Batch ${batchNum}/${totalBatches}: ${imported} importiert.`,
    );

    return NextResponse.json({
      ok: true, skip, imported, errors, total: totalInFeed,
      nextSkip: savedSkip, percent: isComplete ? 100 : percent,
      isComplete, batchNum, totalBatches, batchSize: BATCH_SIZE,
      message: isComplete ? "Import komplett!" : `Batch ${batchNum}/${totalBatches}`,
      durationMs: elapsed(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await logImport(0, 0, 0, 0, "error", msg.slice(0, 500));
    return NextResponse.json({
      ok: false, skip: 0, imported: 0, errors: 0, total: 0,
      nextSkip: 0, percent: 0, isComplete: false,
      message: msg, durationMs: elapsed(),
    });
  }
}

async function logImport(skip: number, total: number, imported: number, errors: number, status: string, message: string) {
  await db.importLog.create({
    data: { feedId: FEED_ID, currentSkip: skip, totalItems: total, imported, errors, status, message },
  }).catch(() => {});
}

function timeoutResponse(skip: number, total: number, elapsed: number, msg: string) {
  return NextResponse.json({
    ok: false, skip, imported: 0, errors: 0, total,
    nextSkip: skip, percent: 0, isComplete: false,
    message: msg, durationMs: elapsed,
  });
}

function errorResponse(skip: number, msg: string, elapsed: number) {
  return NextResponse.json({
    ok: false, skip, imported: 0, errors: 0, total: 0,
    nextSkip: skip, percent: 0, isComplete: false,
    message: msg, durationMs: elapsed,
  });
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
  const offset = 30 + fnLen + exLen;
  const size = compSize > 0 ? compSize : data.length - offset - 100;
  const compressed = data.slice(offset, offset + size);

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
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
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
  // Run multiple passes to handle double-encoded entities like &amp;amp;
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

/** Clean a URL: decode HTML entities + trim whitespace */
function cleanUrl(s: string): string {
  return decodeHtml(s).trim();
}

// ── Category Mapping ─────────────────────────────────────────

const CATEGORY_MAP: { pattern: string; slug: string; name: string }[] = [
  // Herrendüfte
  { pattern: "men's fragrance", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "men's eau de", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "aftershave", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "cologne", slug: "herrendufte", name: "Herrendüfte" },
  // Damendüfte
  { pattern: "women's fragrance", slug: "damendufte", name: "Damendüfte" },
  { pattern: "women's eau de", slug: "damendufte", name: "Damendüfte" },
  // Unisex
  { pattern: "unisex fragrance", slug: "unisex-dufte", name: "Unisex-Düfte" },
  { pattern: "unisex eau de", slug: "unisex-dufte", name: "Unisex-Düfte" },
  // Generische Düfte
  { pattern: "fragrance", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "perfume", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "eau de parfum", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "eau de toilette", slug: "parfum", name: "Parfum & Düfte" },
  // Pflege
  { pattern: "skin care", slug: "pflege", name: "Pflege" },
  { pattern: "skincare", slug: "pflege", name: "Pflege" },
  { pattern: "face care", slug: "pflege", name: "Pflege" },
  { pattern: "body care", slug: "pflege", name: "Pflege" },
  { pattern: "moisturi", slug: "pflege", name: "Pflege" },
  { pattern: "serum", slug: "pflege", name: "Pflege" },
  { pattern: "cleanser", slug: "pflege", name: "Pflege" },
  // Make-Up
  { pattern: "make up", slug: "make-up", name: "Make-Up" },
  { pattern: "makeup", slug: "make-up", name: "Make-Up" },
  { pattern: "cosmetic", slug: "make-up", name: "Make-Up" },
  { pattern: "lipstick", slug: "make-up", name: "Make-Up" },
  { pattern: "mascara", slug: "make-up", name: "Make-Up" },
  { pattern: "foundation", slug: "make-up", name: "Make-Up" },
  // Haarpflege
  { pattern: "hair care", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "hair", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "shampoo", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "conditioner", slug: "haarpflege", name: "Haarpflege" },
  // Körperpflege
  { pattern: "bath", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "shower", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "body", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "deodorant", slug: "koerperpflege", name: "Körperpflege" },
  // Geschenksets
  { pattern: "gift set", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "gift", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "set", slug: "geschenksets", name: "Geschenksets" },
  // Sonnenpflege
  { pattern: "sun", slug: "sonnenpflege", name: "Sonnenpflege" },
  { pattern: "spf", slug: "sonnenpflege", name: "Sonnenpflege" },
];

function mapCategory(productType: string | undefined): { slug: string; name: string } {
  if (!productType) return { slug: "parfum", name: "Parfum & Düfte" };

  const lower = productType.toLowerCase();

  // Try mapping table (first match wins — order matters)
  for (const entry of CATEGORY_MAP) {
    if (lower.includes(entry.pattern)) {
      return { slug: entry.slug, name: entry.name };
    }
  }

  // Fallback: take first segment before >
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
