#!/usr/bin/env tsx
/**
 * Standalone feed importer — runs in GitHub Actions (or any Node.js env).
 *
 * Usage:
 *   npx tsx scripts/import-runner.ts --feed new_balance [--limit 100] [--scrub]
 *
 * Replaces the Vercel-hosted /api/cron/import-feed route for bulk imports.
 * Connects directly to the DB via DATABASE_URL env var, so Vercel is not
 * involved — no function-seconds cost, no 300s timeout, no HTTP overhead.
 */

import { PrismaClient, Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════
// Feed registry — keep in sync with app/api/cron/import-feed/route.ts
// ═══════════════════════════════════════════════════════════════════

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
  new_balance: {
    id: "new_balance",
    url: "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1654928248&asid=2064719298&gsh=1&pfid=683&gt=1",
    shopName: "New Balance",
    sourceType: "adtraction_feed",
  },
};

const FEED_CATEGORY_DEFAULTS: Record<string, { slug: string; name: string }> = {
  xxl_parfum: { slug: "parfum", name: "Parfum & Düfte" },
  parfumsale: { slug: "parfum", name: "Parfum & Düfte" },
  import_parfumerie: { slug: "parfum", name: "Parfum & Düfte" },
  coop_vitality: { slug: "parfum", name: "Parfum & Düfte" },
  new_balance: { slug: "schuhe", name: "Schuhe" },
};

// ═══════════════════════════════════════════════════════════════════
// CLI argument parsing
// ═══════════════════════════════════════════════════════════════════

function parseArgs(): { feed: string; limit: number; scrub: boolean; offset: number } {
  const args = process.argv.slice(2);
  let feed = "";
  let limit = 100;
  let offset = -1; // -1 = resume from DB
  let scrub = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--feed") feed = args[++i];
    else if (args[i] === "--limit") limit = parseInt(args[++i], 10);
    else if (args[i] === "--offset") offset = parseInt(args[++i], 10);
    else if (args[i] === "--scrub") scrub = true;
  }
  if (!feed || !FEEDS[feed]) {
    console.error(`Usage: tsx scripts/import-runner.ts --feed <${Object.keys(FEEDS).join("|")}> [--limit 100] [--offset 0] [--scrub]`);
    process.exit(1);
  }
  return { feed, limit, scrub, offset };
}

// ═══════════════════════════════════════════════════════════════════
// Feed download + XML parsing
// ═══════════════════════════════════════════════════════════════════

async function downloadFeed(url: string): Promise<string> {
  console.log(`⬇️  Downloading feed...`);
  const t0 = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let xml: string;
  try { xml = await decompressZip(bytes); } catch { xml = new TextDecoder().decode(bytes); }
  console.log(`⬇️  Downloaded ${(xml.length / 1024 / 1024).toFixed(1)} MB in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return xml;
}

async function decompressZip(data: Uint8Array): Promise<string> {
  if (data[0] !== 0x50 || data[1] !== 0x4b) return new TextDecoder().decode(data);
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
    w.write(compressed); w.close();
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

interface FeedItem {
  title: string; price: string; originalPrice: string; link: string; imageLink: string;
  brand: string; gtin: string; mpn: string; productType: string; description: string; availability: string;
}

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

function parseFeedSlice(xml: string, itemStarts: number[], offset: number, limit: number): FeedItem[] {
  const items: FeedItem[] = [];
  const end = Math.min(offset + limit, itemStarts.length);
  for (let i = offset; i < end; i++) {
    const start = itemStarts[i] + 6;
    const bound = i + 1 < itemStarts.length ? itemStarts[i + 1] : xml.length;
    const closeIdx = xml.indexOf("</item>", start);
    if (closeIdx === -1 || closeIdx > bound) continue;
    const block = xml.slice(start, closeIdx);
    items.push({
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
    });
  }
  return items;
}

function tag(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

// ═══════════════════════════════════════════════════════════════════
// Normalization helpers
// ═══════════════════════════════════════════════════════════════════

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

function cleanUrl(s: string): string { return decodeHtml(s).trim(); }

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

const CATEGORY_MAP: { pattern: string; slug: string; name: string }[] = [
  { pattern: "men's fragrance", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "aftershave", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "cologne", slug: "herrendufte", name: "Herrendüfte" },
  { pattern: "women's fragrance", slug: "damendufte", name: "Damendüfte" },
  { pattern: "unisex fragrance", slug: "unisex-dufte", name: "Unisex-Düfte" },
  { pattern: "fragrance", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "perfume", slug: "parfum", name: "Parfum & Düfte" },
  { pattern: "skin care", slug: "pflege", name: "Pflege" },
  { pattern: "make up", slug: "make-up", name: "Make-Up" },
  { pattern: "makeup", slug: "make-up", name: "Make-Up" },
  { pattern: "hair care", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "shampoo", slug: "haarpflege", name: "Haarpflege" },
  { pattern: "body", slug: "koerperpflege", name: "Körperpflege" },
  { pattern: "gift set", slug: "geschenksets", name: "Geschenksets" },
  { pattern: "sun", slug: "sonnenpflege", name: "Sonnenpflege" },
  { pattern: "sneaker", slug: "schuhe", name: "Schuhe" },
  { pattern: "running shoe", slug: "schuhe", name: "Schuhe" },
  { pattern: "laufschuh", slug: "schuhe", name: "Schuhe" },
  { pattern: "footwear", slug: "schuhe", name: "Schuhe" },
  { pattern: "shoes", slug: "schuhe", name: "Schuhe" },
  { pattern: "apparel", slug: "mode", name: "Mode & Bekleidung" },
  { pattern: "clothing", slug: "mode", name: "Mode & Bekleidung" },
  { pattern: "jacket", slug: "mode", name: "Mode & Bekleidung" },
  { pattern: "t-shirt", slug: "mode", name: "Mode & Bekleidung" },
];

function mapCategory(productType: string, feedId: string): { slug: string; name: string } {
  const fallback = FEED_CATEGORY_DEFAULTS[feedId] || { slug: "parfum", name: "Parfum & Düfte" };
  if (!productType) return fallback;
  const lower = productType.toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (lower.includes(entry.pattern)) return { slug: entry.slug, name: entry.name };
  }
  return fallback;
}

// ═══════════════════════════════════════════════════════════════════
// Bulk upsert
// ═══════════════════════════════════════════════════════════════════

interface PreparedItem {
  newId: string; gtin: string; priceChf: number; affiliateLink: string;
  catSlug: string; catName: string; imageUrl: string | null;
  title: string; brand: string;
}

async function bulkUpsertBatch(
  db: PrismaClient,
  prepared: PreparedItem[],
  feed: FeedConfig,
  scrub: boolean,
): Promise<{ imported: number; errors: number }> {
  if (prepared.length === 0) return { imported: 0, errors: 0 };

  const productRows = Prisma.join(
    prepared.map((p) => Prisma.sql`(${p.newId}, ${p.gtin}, ${p.title}, ${p.brand}, ${p.catSlug}, ${p.catName}, ${p.imageUrl}, true, ${p.priceChf}, ${feed.sourceType}, NOW(), NOW())`),
  );

  const updateClause = scrub
    ? Prisma.sql`title = EXCLUDED.title, brand = EXCLUDED.brand, category = EXCLUDED.category, "categoryName" = EXCLUDED."categoryName", "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Product"."imageUrl"), price = EXCLUDED.price, "isActive" = true, "updatedAt" = NOW()`
    : Prisma.sql`title = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.title ELSE "Product".title END, brand = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.brand ELSE "Product".brand END, "imageUrl" = COALESCE("Product"."imageUrl", EXCLUDED."imageUrl"), category = COALESCE(NULLIF("Product".category, ''), EXCLUDED.category), "categoryName" = COALESCE(NULLIF("Product"."categoryName", ''), EXCLUDED."categoryName"), price = CASE WHEN EXCLUDED.price < COALESCE("Product".price, 9999999) THEN EXCLUDED.price ELSE "Product".price END, "isActive" = true, "updatedAt" = NOW()`;

  const productResults = await db.$queryRaw<{ id: string; gtin: string }[]>`
    INSERT INTO "Product" (id, gtin, title, brand, category, "categoryName", "imageUrl", "isActive", price, "sourceType", "createdAt", "updatedAt")
    VALUES ${productRows}
    ON CONFLICT (gtin) DO UPDATE SET ${updateClause}
    RETURNING id, gtin
  `;

  const idByGtin = new Map(productResults.map((r) => [r.gtin, r.id]));

  const priceRows = Prisma.join(
    prepared.flatMap((p) => {
      const productId = idByGtin.get(p.gtin);
      if (!productId) return [];
      return [Prisma.sql`(${generateId()}, ${productId}, ${feed.id}, ${feed.shopName}, ${p.priceChf}, 0, ${p.affiliateLink}, NOW())`];
    }),
  );

  await db.$executeRaw`
    INSERT INTO "Price" (id, "productId", "sourceId", "shopName", "amountChf", "amountEur", url, timestamp)
    VALUES ${priceRows}
    ON CONFLICT ("productId", "sourceId") DO UPDATE SET
      "amountChf" = EXCLUDED."amountChf",
      "shopName" = EXCLUDED."shopName",
      url = EXCLUDED.url,
      timestamp = NOW()
  `;

  return { imported: productResults.length, errors: prepared.length - productResults.length };
}

// ═══════════════════════════════════════════════════════════════════
// Main loop
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const { feed: feedKey, limit, scrub, offset: startOffset } = parseArgs();
  const feed = FEEDS[feedKey];

  console.log(`🚀 Import ${feed.shopName} (${feed.id}) — limit=${limit} scrub=${scrub}`);
  const db = new PrismaClient();
  console.time("total");

  try {
    // 1. Download + index
    const xml = await downloadFeed(feed.url);
    const itemStarts = buildItemIndex(xml);
    const total = itemStarts.length;
    console.log(`📦 ${total.toLocaleString()} items in feed`);

    // 2. Resume from last offset (unless explicit --offset)
    let offset = startOffset >= 0 ? startOffset : 0;
    if (startOffset < 0) {
      const lastLog = await db.importLog.findFirst({
        where: { feedId: feed.id, status: { in: ["completed", "cycle_complete"] } },
        orderBy: { createdAt: "desc" },
        select: { currentSkip: true },
      }).catch(() => null);
      offset = lastLog?.currentSkip ?? 0;
      if (offset > 0) console.log(`⏩ Resuming at offset ${offset}`);
    }

    // 3. Process batches until done
    let totalImported = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let batch = 0;

    while (offset < total) {
      batch++;
      const slice = parseFeedSlice(xml, itemStarts, offset, limit);
      if (slice.length === 0) break;

      const prepared: PreparedItem[] = [];
      let batchSkipped = 0;

      for (let i = 0; i < slice.length; i++) {
        const item = slice[i];
        const rawGtin = (item.gtin || "").trim();
        const rawMpn = (item.mpn || "").trim();
        const gtin = rawGtin || rawMpn || `feed_${hashStr(item.link || `${offset + i}`)}`;
        const priceChf = parseSwissPrice(item.price);
        const affiliateLink = cleanUrl(item.link);

        if (!priceChf || !affiliateLink || affiliateLink === "#") { batchSkipped++; continue; }

        // Rx filter (Swiss pharmacy regulation)
        const lower = (item.title + " " + item.description).toLowerCase();
        if (/\b(rx|rezeptpflichtig|verschreibungspflichtig|prescription[- ]only)\b/i.test(lower)) {
          batchSkipped++;
          continue;
        }

        const { slug: catSlug, name: catName } = mapCategory(item.productType, feed.id);
        prepared.push({
          newId: generateId(),
          gtin,
          priceChf,
          affiliateLink,
          catSlug,
          catName,
          imageUrl: item.imageLink ? cleanUrl(item.imageLink) : null,
          title: decodeHtml(item.title || gtin).slice(0, 500),
          brand: decodeHtml(item.brand || feed.shopName).slice(0, 200),
        });
      }

      const t0 = Date.now();
      const { imported, errors } = await bulkUpsertBatch(db, prepared, feed, scrub);
      const ms = Date.now() - t0;

      totalImported += imported;
      totalSkipped += batchSkipped;
      totalErrors += errors;
      offset += slice.length;

      const pct = Math.round((offset / total) * 100);
      console.log(`[${batch}] ${pct}% | +${imported} ok, ${batchSkipped} skip, ${errors} err | offset=${offset}/${total} | ${ms}ms`);

      // Save progress to ImportLog every 10 batches
      if (batch % 10 === 0) {
        await db.importLog.create({
          data: {
            feedId: feed.id, currentSkip: offset, totalItems: total,
            imported: totalImported, errors: totalErrors,
            status: "completed",
            message: `Runner batch ${batch}: ${totalImported} total imported`,
          },
        }).catch(() => {});
      }
    }

    // Final log
    await db.importLog.create({
      data: {
        feedId: feed.id, currentSkip: 0, totalItems: total,
        imported: totalImported, errors: totalErrors,
        status: "cycle_complete",
        message: `Runner done: ${totalImported}/${total} imported, ${totalSkipped} skipped, ${totalErrors} errors`,
      },
    }).catch(() => {});

    console.log(`\n🎉 Import complete`);
    console.log(`   ${totalImported.toLocaleString()} imported`);
    console.log(`   ${totalSkipped.toLocaleString()} skipped`);
    console.log(`   ${totalErrors.toLocaleString()} errors`);
    console.log(`   ${batch} batches`);
  } finally {
    await db.$disconnect();
    console.timeEnd("total");
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
