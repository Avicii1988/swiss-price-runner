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
import {
  CATEGORY_MAP,
  FEED_CATEGORY_DEFAULTS,
  BEAUTY_KEYWORD_RULES,
  resolveCategory,
} from "../lib/category-rules";

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
  parfum_ch: {
    id: "parfum_ch",
    // Parfum.ch — Adtraction feed. URL can be overridden at runtime via PARFUM_CH_FEED_URL env var.
    url: process.env.PARFUM_CH_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1551177423&asid=2064719298&gsh=1&pfid=871&gt=1",
    shopName: "Parfum.ch",
    sourceType: "adtraction_feed",
  },
  ackermann_ch: {
    id: "ackermann_ch",
    // Ackermann Technik — Adtraction feed. URL can be overridden at runtime via ACKERMANN_FEED_URL env var.
    url: process.env.ACKERMANN_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1703604881&asid=2064719298&gsh=1&pfid=1994&gt=1",
    shopName: "Ackermann Technik",
    sourceType: "adtraction_feed",
  },
  "ackermann-mode": {
    id: "ackermann-mode",
    // Ackermann Mode — Adtraction feed (pfid=1616, same apid as the Ackermann
    // Technik feed). Fashion vertical with rich variant data (g:item_group_id,
    // g:size, g:color all present on every item); URL can be overridden via
    // ACKERMANN_MODE_FEED_URL for ad-hoc runs.
    url: process.env.ACKERMANN_MODE_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1703604881&asid=2064719298&gsh=1&pfid=1616&gt=1",
    shopName: "Ackermann Mode",
    sourceType: "adtraction_feed",
  },
  bergfreunde: {
    id: "bergfreunde",
    // Bergfreunde — Adtraction feed (pfid=1213, gsh=1 → gross CHF, gt=1 → tagged).
    // Outdoor gear: climbing, hiking, skiing, trail running. CHF-native so it
    // flows through the Swiss-shop path (buildSwissShopBreakdown) just like
    // parfum_ch / ackermann_ch. URL can be overridden via BERGFREUNDE_FEED_URL.
    url: process.env.BERGFREUNDE_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1686076672&asid=2064719298&gsh=1&pfid=1213&gt=1",
    shopName: "Bergfreunde",
    sourceType: "adtraction_feed",
  },
};

// CATEGORY_MAP, FEED_CATEGORY_DEFAULTS, BEAUTY_KEYWORD_RULES, resolveCategory
// are imported from lib/category-rules.ts — see that file for definitions.

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
  /** Raw feed shipping cost string (e.g. "5.90 CHF") or empty when not provided. */
  shippingCost: string;
  /** "net" | "gross" | "" — rare, but some feeds set this explicitly. */
  priceType: string;
  /** g:item_group_id — Google Merchant parent SKU used for variant grouping. */
  itemGroupId: string;
  /** g:size — explicit size string when the feed provides it, more reliable
   *  than parsing it out of the title (fashion feeds like Ackermann Mode). */
  size: string;
  /** g:color — colour variant label, used to split groupId when the feed
   *  does not set g:item_group_id (so reds don't merge with blues). */
  color: string;
}

/** Container tag — most Adtraction feeds use <item>, some use <product>. */
type ContainerTag = "item" | "product";

interface FeedIndex {
  starts: number[];
  container: ContainerTag;
}

/**
 * Build an index of item/product container start positions.
 * Tries <item> first (Google Merchant standard), falls back to <product>.
 */
function buildItemIndex(xml: string): FeedIndex {
  const itemStarts = scanContainer(xml, "<item>");
  if (itemStarts.length > 0) return { starts: itemStarts, container: "item" };
  const productStarts = scanContainer(xml, "<product>");
  return { starts: productStarts, container: "product" };
}

function scanContainer(xml: string, openTag: string): number[] {
  const starts: number[] = [];
  let pos = 0;
  while (true) {
    pos = xml.indexOf(openTag, pos);
    if (pos === -1) break;
    starts.push(pos);
    pos += openTag.length;
  }
  return starts;
}

function parseFeedSlice(xml: string, idx: FeedIndex, offset: number, limit: number): FeedItem[] {
  const items: FeedItem[] = [];
  const openLen = idx.container.length + 2;            // "<item>" / "<product>"
  const closeTag = `</${idx.container}>`;
  const end = Math.min(offset + limit, idx.starts.length);
  for (let i = offset; i < end; i++) {
    const start = idx.starts[i] + openLen;
    const bound = i + 1 < idx.starts.length ? idx.starts[i + 1] : xml.length;
    const closeIdx = xml.indexOf(closeTag, start);
    if (closeIdx === -1 || closeIdx > bound) continue;
    const block = xml.slice(start, closeIdx);
    items.push({
      // Title aliases: Google Merchant <g:title>, plain <title>, Adtraction <name> / <productName>.
      title: tag(block, "g:title") || tag(block, "title") || tag(block, "name") || tag(block, "productName") || "",
      price: tag(block, "g:sale_price") || tag(block, "sale_price") || tag(block, "g:price") || tag(block, "price") || tag(block, "salePrice") || "",
      originalPrice: tag(block, "g:price") || tag(block, "price") || tag(block, "originalPrice") || "",
      link: tag(block, "g:link") || tag(block, "link") || tag(block, "productUrl") || tag(block, "url") || "",
      imageLink: tag(block, "g:image_link") || tag(block, "image_link") || tag(block, "productImage") || tag(block, "imageUrl") || "",
      brand: tag(block, "g:brand") || tag(block, "brand") || tag(block, "manufacturer") || "",
      gtin: tag(block, "g:gtin") || tag(block, "g:ean") || tag(block, "ean") || tag(block, "EAN") || tag(block, "gtin") || "",
      mpn: tag(block, "g:mpn") || tag(block, "g:id") || tag(block, "id") || tag(block, "sku") || tag(block, "productId") || "",
      productType: tag(block, "g:product_type") || tag(block, "g:google_product_category") || tag(block, "category") || tag(block, "categoryName") || "",
      description: tag(block, "g:description") || tag(block, "description") || "",
      availability: tag(block, "g:availability") || tag(block, "availability") || tag(block, "inStock") || "",
      // Shipping aliases — Google Merchant nests <g:shipping><g:price>…</g:price></g:shipping>.
      // We probe the flat <g:shipping_price> first, fall back to scanning for any nested
      // <g:price> inside a <g:shipping> block, then to plain <shipping> / <shippingCost>.
      shippingCost:
        tag(block, "g:shipping_price") ||
        nestedShippingPrice(block) ||
        tag(block, "shipping") ||
        tag(block, "shippingCost") ||
        "",
      priceType: (tag(block, "g:price_type") || tag(block, "priceType") || "").toLowerCase(),
      itemGroupId: tag(block, "g:item_group_id") || tag(block, "item_group_id") || tag(block, "parentSku") || "",
      // g:size / g:color — fashion feeds (Ackermann Mode) set these per
      // variant; parsed so the importer can prefer the feed-supplied value
      // over what splitTitleBySize() guesses from the product title.
      size: tag(block, "g:size") || tag(block, "size") || "",
      color: tag(block, "g:color") || tag(block, "g:colour") || tag(block, "color") || tag(block, "colour") || "",
    });
  }
  return items;
}

function tag(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

/**
 * Google Merchant nests shipping like:
 *   <g:shipping>
 *     <g:country>CH</g:country>
 *     <g:price>5.90 CHF</g:price>
 *   </g:shipping>
 * We extract the first nested price from any <g:shipping> block — good enough
 * for Swiss-only feeds where one country is advertised.
 */
function nestedShippingPrice(xml: string): string {
  const block = /<g:shipping[^>]*>([\s\S]*?)<\/g:shipping>/i.exec(xml);
  if (!block) return "";
  const price = /<g:price[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/g:price>/i.exec(block[1]);
  return price ? price[1].trim() : "";
}

// ═══════════════════════════════════════════════════════════════════
// Variant-grouping helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Detect a size suffix at the end of a product title and split the title
 * into `baseTitle` + `sizeLabel`. Handles:
 *   "Dior Sauvage EDP 50ml"       → base="Dior Sauvage EDP"  size="50 ml"
 *   "Dior Sauvage 100 ml Spray"   → base="Dior Sauvage Spray" size="100 ml"
 *   "Nike Air Max 90 Gr. 42"      → base="Nike Air Max 90"   size="Gr. 42"
 *   "Dior Sauvage"                → base=<title>            size=null
 */
const SIZE_UNIT_RE = /(\d+(?:[.,]\d+)?)\s?(ml|g|kg|l|oz|cl|pcs?|stk|stück|paar|gr)\.?/i;
const SHOE_SIZE_RE = /\bgr(?:össe|oesse|\.|e)?\s?(\d{1,3}(?:[.,]\d+)?)\b/i;

interface TitleSplit { baseTitle: string; sizeLabel: string | null; }

function splitTitleBySize(title: string): TitleSplit {
  if (!title) return { baseTitle: title, sizeLabel: null };

  // 1. Try unit-based sizes (ml, g, kg, oz, pcs, paar, …) — scan the whole
  //    title, keep the FIRST match (closest to product name), strip it.
  const unit = SIZE_UNIT_RE.exec(title);
  if (unit) {
    const raw = unit[0];
    const stripped = (title.slice(0, unit.index) + " " + title.slice(unit.index + raw.length))
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[-–,]\s*$/, "")
      .trim();
    const amount = unit[1].replace(",", ".");
    const unitNorm = unit[2].toLowerCase().replace("stück", "stk");
    return { baseTitle: stripped || title, sizeLabel: `${amount} ${unitNorm}` };
  }

  // 2. Try "Gr. 42" style shoe sizes.
  const shoe = SHOE_SIZE_RE.exec(title);
  if (shoe) {
    const raw = shoe[0];
    const stripped = (title.slice(0, shoe.index) + " " + title.slice(shoe.index + raw.length))
      .replace(/\s+/g, " ")
      .trim();
    return { baseTitle: stripped || title, sizeLabel: `Gr. ${shoe[1].replace(",", ".")}` };
  }

  return { baseTitle: title, sizeLabel: null };
}

/**
 * Compute a deterministic group id shared by all variants of a product.
 * Preference:
 *   1. Feed-provided `g:item_group_id`                    (most reliable)
 *   2. `brand|baseTitle|color` SHA-like hash              (fallback)
 *
 * Colour is folded into the hash so a fashion feed without g:item_group_id
 * doesn't collapse a "T-Shirt Red / S" and a "T-Shirt Blue / S" into the
 * same group (the VariantSelector would otherwise show both colours under
 * one size chip set). When the feed supplies a proper item_group_id the
 * colour is irrelevant — that ID is the authoritative parent.
 *
 * Returns NULL when neither signal is usable (keeps Product.groupId NULL
 * for truly single-variant SKUs).
 */
function computeGroupId(
  itemGroupId: string,
  brand: string,
  baseTitle: string,
  color: string = "",
): string | null {
  const explicit = (itemGroupId || "").trim();
  if (explicit) return `igi_${hashStr(explicit.toLowerCase())}`;
  const parts = [brand, baseTitle, color].map((p) => (p || "").trim().toLowerCase());
  const key = parts.join("|");
  if (!key.replace(/\|/g, "")) return null;
  return `grp_${hashStr(key)}`;
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

/**
 * Upsert every node along the supplied category paths with correct parent-id
 * linking. One INSERT per depth-level (≤ 3 statements per batch) so roots
 * exist before children try to resolve their parent.
 *
 * Cheap-to-display names for intermediate L1/L2 segments that aren't the leaf
 * of any rule are filled from a local fallback (title-case of the slug).
 */
async function ensureCategories(
  db: PrismaClient,
  pairs: Iterable<{ path: string[]; name: string }>,
): Promise<void> {
  // 1. Collect unique slugs with depth + parent + preferred name.
  //    Category.slug is @unique, so the SAME slug can't live under two parents.
  const byDepth = new Map<number, Map<string, { name: string; parent: string | null }>>();
  for (const { path, name } of pairs) {
    for (let i = 0; i < path.length; i++) {
      const slug = path[i];
      const parent = i === 0 ? null : path[i - 1];
      const isLeaf = i === path.length - 1;
      const level = byDepth.get(i) ?? new Map();
      const prev = level.get(slug);
      // Prefer the leaf name if we're at the leaf; otherwise keep whatever we saw first
      const effectiveName = isLeaf ? name : prev?.name ?? titleCase(slug);
      level.set(slug, { name: effectiveName, parent });
      byDepth.set(i, level);
    }
  }
  if (byDepth.size === 0) return;

  // 2. Insert level-by-level so parents exist before children reference them.
  const maxDepth = Math.max(...byDepth.keys());
  for (let depth = 0; depth <= maxDepth; depth++) {
    const level = byDepth.get(depth);
    if (!level || level.size === 0) continue;

    const rows = Prisma.join(
      Array.from(level.entries()).map(([slug, { name, parent }]) =>
        parent === null
          ? Prisma.sql`(${generateId()}, ${name}, ${slug}, NULL, ${depth}, NOW())`
          : Prisma.sql`(${generateId()}, ${name}, ${slug}, (SELECT id FROM "Category" WHERE slug = ${parent} LIMIT 1), ${depth}, NOW())`,
      ),
    );

    await db.$executeRaw`
      INSERT INTO "Category" (id, name, slug, "parentId", "sortOrder", "createdAt")
      VALUES ${rows}
      ON CONFLICT (slug) DO UPDATE SET
        "parentId"  = COALESCE("Category"."parentId",  EXCLUDED."parentId"),
        "sortOrder" = CASE WHEN "Category"."sortOrder" = 0 THEN EXCLUDED."sortOrder" ELSE "Category"."sortOrder" END
    `;
  }
}

function titleCase(slug: string): string {
  return slug.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ═══════════════════════════════════════════════════════════════════
// Bulk upsert
// ═══════════════════════════════════════════════════════════════════

interface PreparedItem {
  newId: string; gtin: string;
  priceChf: number;
  /** UVP / original price (pre-discount). Null if not supplied by feed or ≤ priceChf. */
  originalPriceChf: number | null;
  /** Shipping cost to CH in CHF from the feed. NULL = unknown; 0 = free. */
  shippingCostChf: number | null;
  /** True only when the feed explicitly declares a NET price. */
  priceIsNet: boolean;
  affiliateLink: string;
  catSlug: string; catName: string;
  /** Full category path root → … → leaf. Used by ensureCategories(). */
  catPath: string[];
  imageUrl: string | null;
  title: string; brand: string;
  /** Variant grouping. NULL = singleton, else shared across size siblings. */
  groupId: string | null;
  /** Title with size stripped (e.g. "Dior Sauvage EDP"). */
  baseTitle: string | null;
  /** Extracted size label ("50 ml", "Gr. 42"). NULL if no size detected. */
  sizeLabel: string | null;
  /** Feed <g:description>, truncated. Persisted so the recategorize
   *  runner has richer keyword signal than the title alone. */
  description: string | null;
}

async function bulkUpsertBatch(
  db: PrismaClient,
  prepared: PreparedItem[],
  feed: FeedConfig,
  scrub: boolean,
): Promise<{ imported: number; errors: number }> {
  if (prepared.length === 0) return { imported: 0, errors: 0 };

  // De-duplicate within this batch by gtin (the @unique key on Product).
  // Some feeds (e.g. parfum_ch) list the same product multiple times with
  // different variant IDs but identical GTINs — PostgreSQL's ON CONFLICT
  // refuses to update the same target row twice in one statement.
  // Keep the LAST occurrence so the newest data wins.
  // NOTE: Cross-shop deduping is not affected — each feed runs its own
  // bulkUpsertBatch call with its own feed.id, so different shops can
  // still share a GTIN (separate Price rows via @@unique([productId, sourceId])).
  const dedupedMap = new Map<string, PreparedItem>();
  for (const p of prepared) dedupedMap.set(p.gtin, p);
  const deduped = Array.from(dedupedMap.values());
  const droppedDupes = prepared.length - deduped.length;

  const productRows = Prisma.join(
    deduped.map((p) => Prisma.sql`(
      ${p.newId}, ${p.gtin}, ${p.title}, ${p.brand},
      ${p.catSlug}, ${p.catName}, ${p.imageUrl}, true,
      ${p.priceChf}, ${p.originalPriceChf},
      ${p.shippingCostChf}, ${p.priceIsNet},
      ${p.groupId}, ${p.baseTitle}, ${p.sizeLabel},
      ${p.description},
      ${feed.sourceType}, NOW(), NOW()
    )`),
  );

  const updateClause = scrub
    ? Prisma.sql`
        title = EXCLUDED.title,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        "categoryName" = EXCLUDED."categoryName",
        "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Product"."imageUrl"),
        price = EXCLUDED.price,
        "originalPriceChf" = EXCLUDED."originalPriceChf",
        "shippingCostChf" = EXCLUDED."shippingCostChf",
        "priceIsNet" = EXCLUDED."priceIsNet",
        "groupId" = EXCLUDED."groupId",
        "baseTitle" = EXCLUDED."baseTitle",
        "sizeLabel" = EXCLUDED."sizeLabel",
        description = EXCLUDED.description,
        "isActive" = true,
        "updatedAt" = NOW()`
    : Prisma.sql`
        title = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.title ELSE "Product".title END,
        brand = CASE WHEN LENGTH(EXCLUDED.title) > LENGTH("Product".title) THEN EXCLUDED.brand ELSE "Product".brand END,
        "imageUrl" = COALESCE("Product"."imageUrl", EXCLUDED."imageUrl"),
        category = COALESCE(NULLIF("Product".category, ''), EXCLUDED.category),
        "categoryName" = COALESCE(NULLIF("Product"."categoryName", ''), EXCLUDED."categoryName"),
        price = CASE WHEN EXCLUDED.price < COALESCE("Product".price, 9999999) THEN EXCLUDED.price ELSE "Product".price END,
        "originalPriceChf" = CASE WHEN EXCLUDED."originalPriceChf" IS NOT NULL AND EXCLUDED."originalPriceChf" > COALESCE("Product"."originalPriceChf", 0) THEN EXCLUDED."originalPriceChf" ELSE "Product"."originalPriceChf" END,
        "shippingCostChf" = COALESCE(EXCLUDED."shippingCostChf", "Product"."shippingCostChf"),
        "priceIsNet" = EXCLUDED."priceIsNet",
        "groupId" = COALESCE(EXCLUDED."groupId", "Product"."groupId"),
        "baseTitle" = COALESCE(EXCLUDED."baseTitle", "Product"."baseTitle"),
        "sizeLabel" = COALESCE(EXCLUDED."sizeLabel", "Product"."sizeLabel"),
        description = COALESCE(NULLIF(EXCLUDED.description, ''), "Product".description),
        "isActive" = true,
        "updatedAt" = NOW()`;

  const productResults = await db.$queryRaw<{ id: string; gtin: string }[]>`
    INSERT INTO "Product" (
      id, gtin, title, brand,
      category, "categoryName", "imageUrl", "isActive",
      price, "originalPriceChf",
      "shippingCostChf", "priceIsNet",
      "groupId", "baseTitle", "sizeLabel",
      description,
      "sourceType", "createdAt", "updatedAt"
    )
    VALUES ${productRows}
    ON CONFLICT (gtin) DO UPDATE SET ${updateClause}
    RETURNING id, gtin
  `;

  const idByGtin = new Map(productResults.map((r) => [r.gtin, r.id]));

  const priceRows = Prisma.join(
    deduped.flatMap((p) => {
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

  if (droppedDupes > 0) {
    console.log(`   ↳ deduped ${droppedDupes} in-batch gtin duplicate${droppedDupes === 1 ? "" : "s"}`);
  }

  return { imported: productResults.length, errors: deduped.length - productResults.length };
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
    const feedIdx = buildItemIndex(xml);
    const total = feedIdx.starts.length;
    console.log(`📦 ${total.toLocaleString()} items in feed (container=<${feedIdx.container}>)`);

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
      const slice = parseFeedSlice(xml, feedIdx, offset, limit);
      if (slice.length === 0) break;

      const prepared: PreparedItem[] = [];
      let batchSkipped = 0;

      for (let i = 0; i < slice.length; i++) {
        const item = slice[i];
        const rawGtin = (item.gtin || "").trim();
        const rawMpn = (item.mpn || "").trim();
        const gtin = rawGtin || rawMpn || `feed_${hashStr(item.link || `${offset + i}`)}`;
        const priceChf = parseSwissPrice(item.price);
        const rawOriginal = parseSwissPrice(item.originalPrice);
        // Only record originalPrice as UVP if it is strictly higher than current price.
        const originalPriceChf = rawOriginal && priceChf && rawOriginal > priceChf ? rawOriginal : null;
        const affiliateLink = cleanUrl(item.link);

        if (!priceChf || !affiliateLink || affiliateLink === "#") { batchSkipped++; continue; }

        // Rx filter (Swiss pharmacy regulation)
        const lower = (item.title + " " + item.description).toLowerCase();
        if (/\b(rx|rezeptpflichtig|verschreibungspflichtig|prescription[- ]only)\b/i.test(lower)) {
          batchSkipped++;
          continue;
        }

        // ── Parse shipping + NET/GROSS flag from feed ──
        const shippingCostChf = parseSwissPrice(item.shippingCost);
        const priceIsNet = item.priceType === "net";

        // ── Variant detection: prefer feed-supplied size/colour over
        //    title heuristics (fashion feeds such as Ackermann Mode set
        //    g:size and g:color per variant explicitly). Falls back to
        //    splitTitleBySize() when the feed is silent. Colour is also
        //    folded into the groupId hash when g:item_group_id is missing
        //    so colour variants don't collapse into one size chip set. ──
        const decodedTitle = decodeHtml(item.title || gtin);
        const decodedDescription = decodeHtml(item.description || "");
        const decodedBrand = decodeHtml(item.brand || feed.shopName).slice(0, 200);
        const feedSize = decodeHtml(item.size || "").trim();
        const feedColor = decodeHtml(item.color || "").trim();
        const titleSplit = splitTitleBySize(decodedTitle);
        const baseTitle = titleSplit.baseTitle;
        const sizeLabel = feedSize || titleSplit.sizeLabel;
        const groupId = computeGroupId(item.itemGroupId, decodedBrand, baseTitle, feedColor);

        // ── Category resolution (in-memory, BEFORE DB write) ──
        const { path: catPath, name: catName } = resolveCategory(
          item.productType,
          decodedTitle,
          decodedDescription,
          feed.id,
        );
        const leafSlug = catPath[catPath.length - 1];

        prepared.push({
          newId: generateId(),
          gtin,
          priceChf,
          originalPriceChf,
          shippingCostChf,
          priceIsNet,
          affiliateLink,
          catSlug: leafSlug,   // Product.category = leaf of the path
          catName,
          catPath,             // full path → ensureCategories walks this
          imageUrl: item.imageLink ? cleanUrl(item.imageLink) : null,
          title: decodedTitle.slice(0, 500),
          brand: decodedBrand,
          groupId,
          baseTitle: baseTitle.slice(0, 500),
          sizeLabel,
          description: decodedDescription ? decodedDescription.slice(0, 2000) : null,
        });
      }

      // Guarantee every referenced Category row (and its ancestors) exists
      // before the Product upsert — products are always born under a valid
      // root → L2 → L3 chain with correct parentId linking.
      await ensureCategories(db, prepared.map((p) => ({ path: p.catPath, name: p.catName })));

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
