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

import AdmZip from "adm-zip";
import { PrismaClient, Prisma } from "@prisma/client";
import { extractAttributes } from "../lib/attributes";
import {
  CATEGORY_MAP,
  FEED_CATEGORY_DEFAULTS,
  BEAUTY_KEYWORD_RULES,
  resolveCategory,
  resolveCategoryDeep,
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
  jelmoli: {
    id: "jelmoli",
    // Jelmoli Technik — Adtraction feed (pfid=2014). Swiss department-store
    // technik vertical: TVs, home audio, kitchen appliances. CHF-native so
    // it rides the Swiss-shop path (buildSwissShopBreakdown). URL override
    // via JELMOLI_FEED_URL.
    url: process.env.JELMOLI_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1703190487&asid=2064719298&gsh=1&pfid=2014&gt=1",
    shopName: "Jelmoli",
    sourceType: "adtraction_feed",
  },
  "jelmoli-mode": {
    id: "jelmoli-mode",
    // Jelmoli Mode — sibling feed to `jelmoli` (same apid, pfid=1615).
    // Fashion vertical: premium menswear / womenswear. Rich variant data
    // (g:item_group_id, g:size, g:color) — the shared parser + grouping
    // logic added for Ackermann Mode applies here without changes.
    // URL override via JELMOLI_MODE_FEED_URL.
    url: process.env.JELMOLI_MODE_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1703190487&asid=2064719298&gsh=1&pfid=1615&gt=1",
    shopName: "Jelmoli Mode",
    sourceType: "adtraction_feed",
  },
  bijouteria: {
    id: "bijouteria",
    // Bijouteria — Adtraction feed (pfid=863). Swiss jewelry retailer:
    // silver / gold / titanium schmuck, piercings, earrings, rings,
    // bracelets. CHF-native so it rides the Swiss-shop path
    // (buildSwissShopBreakdown). The parser already captures
    // g:description which is the main signal for material grade
    // ("925 Silber", "750 Gold") — see BEAUTY_KEYWORD_RULES-style
    // description scan inside resolveCategory. URL override via
    // BIJOUTERIA_FEED_URL.
    url: process.env.BIJOUTERIA_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1628909729&asid=2064719298&gsh=1&pfid=863&gt=1",
    shopName: "Bijouteria",
    sourceType: "adtraction_feed",
  },
  bergfreunde: {
    id: "bergfreunde",
    // Bergfreunde — Adtraction feed (pfid=1213, zip=0 → plain XML, gsh=0 → net CHF,
    // flat=1 → flat-rate structure). Container tag: <ad>. Outdoor gear: climbing,
    // hiking, skiing, trail running. URL can be overridden via BERGFREUNDE_FEED_URL.
    url: process.env.BERGFREUNDE_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=0&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=1&apid=1686076672&asid=2064719298&gsh=0&pfid=1213&gt=1",
    shopName: "Bergfreunde",
    sourceType: "adtraction_feed",
  },
  "ochsner-sport": {
    id: "ochsner-sport",
    // Ochsner Sport — Swiss sport & outdoor retailer. Adtraction feed
    // (apid=1631001329, pfid=1600, zip=0, gsh=0, flat=1). Container tag: <ad>.
    // Wide range: running, fitness, team sports, outdoor, ski & snowboard.
    // URL can be overridden via OCHSNER_SPORT_FEED_URL.
    url: process.env.OCHSNER_SPORT_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=0&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=1&apid=1631001329&asid=2064719298&gsh=0&pfid=1600&gt=1",
    shopName: "Ochsner Sport",
    sourceType: "adtraction_feed",
  },
  "ochsner-shoes": {
    id: "ochsner-shoes",
    // Ochsner Shoes — Swiss footwear specialist. Adtraction feed
    // (apid=1629102021, pfid=1237, zip=0, gsh=0, flat=1). Container tag: <ad>.
    // Broad assortment: sneakers, boots, dress shoes, sandals, kids' shoes.
    // URL can be overridden via OCHSNER_SHOES_FEED_URL.
    url: process.env.OCHSNER_SHOES_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=0&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=1&apid=1629102021&asid=2064719298&gsh=0&pfid=1237&gt=1",
    shopName: "Ochsner Shoes",
    sourceType: "adtraction_feed",
  },
  mobilezone: {
    id: "mobilezone",
    // Mobilezone — Swiss mobile + telecoms retailer. Adtraction feed
    // (pfid=1418, gsh=1 → gross CHF, gt=0). CHF-native so prices run
    // through buildSwissShopBreakdown like every other Swiss-shop feed.
    // URL override via MOBILEZONE_FEED_URL.
    url: process.env.MOBILEZONE_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=0&apid=1703574016&asid=2064719298&gsh=1&pfid=1418&gt=0",
    shopName: "Mobilezone",
    sourceType: "adtraction_feed",
  },
  nettoshop: {
    id: "nettoshop",
    // Nettoshop.ch — Swiss general-merchandise discounter. Adtraction feed
    // (apid=1631005848, pfid=1040, zip=0 → plain XML, gsh=0 → net CHF,
    // flat=1 → flat-rate structure, gt=0). Container tag: <ad>.
    // Wide assortment: electronics, household, toys, sport, fashion.
    // URL override via NETTOSHOP_FEED_URL.
    url: process.env.NETTOSHOP_FEED_URL
      || "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=0&cdelim=tab&tdelim=singlequote&sd=1&sn=1&flat=1&apid=1631005848&asid=2064719298&gsh=0&pfid=1040&gt=0",
    shopName: "Nettoshop",
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
  console.log(`⬇️  Starting download… (timeout 5 min)`);
  const t0 = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);

  // Stream the response body so we can log progress for large feeds
  // (Jelmoli Mode can exceed 100 MB compressed). Falls back to a single
  // arrayBuffer() read when the runtime doesn't expose a body stream.
  let bytes: Uint8Array;
  if (res.body) {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    let nextLog = 10 * 1024 * 1024; // first log at 10 MB
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (received >= nextLog) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`⬇️  ${(received / 1024 / 1024).toFixed(1)} MB received (${elapsed}s)`);
        nextLog += 10 * 1024 * 1024;
      }
    }
    const totalBytes = chunks.reduce((s, c) => s + c.length, 0);
    bytes = new Uint8Array(totalBytes);
    let p = 0;
    for (const c of chunks) { bytes.set(c, p); p += c.length; }
  } else {
    const buffer = await res.arrayBuffer();
    bytes = new Uint8Array(buffer);
  }

  let xml: string;
  try {
    xml = extractFeedContent(bytes);
  } catch (err) {
    console.warn(`⚠️  ZIP extraction failed (${err instanceof Error ? err.message : err}), falling back to raw decode`);
    xml = new TextDecoder().decode(bytes);
  }
  console.log(`⬇️  Feed ready: ${(xml.length / 1024 / 1024).toFixed(1)} MB in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return xml;
}

/**
 * Extract the XML content from a feed download.
 *
 * The old hand-rolled parser read the local file header's compressed-size
 * field (bytes 18-21), but many ZIP producers set that to 0 when using the
 * data-descriptor extension (bit 3 of the general-purpose flag). The fallback
 * `data.length - headerOffset - 100` passed central-directory bytes into
 * DecompressionStream which silently failed, the outer catch fell back to
 * treating the raw binary as UTF-8 text, and buildItemIndex found 0 items.
 *
 * adm-zip reads the central directory at the END of the archive (the
 * authoritative record) so it is immune to that class of bug. It also
 * handles Deflate, Stored, and Deflate64 entries correctly.
 *
 * Memory note: ZIP feeds are downloaded entirely before this call, so the
 * bytes are already in memory. adm-zip decompresses into a second Buffer.
 * For a 15 MB zip → 100 MB XML that peak is ~115 MB — well within the
 * Node.js default heap. If feeds ever exceed ~500 MB uncompressed, switch
 * to the streaming `unzipper` library.
 */
function extractFeedContent(data: Uint8Array): string {
  // Not a ZIP — plain XML or gzipped content (gzip handled separately).
  if (data[0] !== 0x50 || data[1] !== 0x4b) {
    return new TextDecoder().decode(data);
  }

  console.log(`📦 ZIP signature detected — using adm-zip to extract…`);
  const zip = new AdmZip(Buffer.from(data));
  const entries = zip.getEntries();

  if (entries.length === 0) throw new Error("ZIP archive contains no entries");

  // Pick the first non-directory entry; for Adtraction feeds there is
  // always exactly one file inside the archive.
  const entry = entries.find((e) => !e.isDirectory);
  if (!entry) throw new Error("ZIP archive contains only directories");

  const uncompressedMb = (entry.header.size / 1024 / 1024).toFixed(1);
  console.log(`📦 Extracting "${entry.entryName}" (${uncompressedMb} MB uncompressed, method=${entry.header.method})`);

  const buf = zip.readFile(entry);
  if (!buf) throw new Error(`adm-zip returned null for entry "${entry.entryName}"`);

  return buf.toString("utf-8");
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

/** Container tag — Adtraction feeds vary: <item>, <product>, <ad>, <offer>, <entry>. */
type ContainerTag = "item" | "product" | "ad" | "offer" | "entry";

interface FeedIndex {
  starts: number[];
  container: ContainerTag;
}

// Priority order for container auto-detection. <item> is the Google Merchant
// standard used by most Adtraction feeds; <ad> is used by some programme
// types (e.g. Bergfreunde). <product>, <offer>, <entry> cover the long tail.
const CONTAINER_CANDIDATES: ContainerTag[] = ["item", "product", "ad", "offer", "entry"];

/**
 * Build an index of item-container start positions.
 * Probes CONTAINER_CANDIDATES in order and returns the first one that has
 * at least one occurrence. Emits a diagnostic log so the operator can see
 * which container was matched — or a warning with the first 500 chars of
 * the feed XML when no known tag is found (helps identify unusual feeds).
 */
function buildItemIndex(xml: string): FeedIndex {
  for (const container of CONTAINER_CANDIDATES) {
    const starts = scanContainer(xml, `<${container}>`);
    if (starts.length > 0) {
      console.log(`🏷️  Container <${container}> detected (${starts.length.toLocaleString()} occurrences)`);
      return { starts, container };
    }
  }
  console.warn(
    `⚠️  No known container tag found. Tried: ${CONTAINER_CANDIDATES.map((c) => `<${c}>`).join(", ")}\n` +
    `   First 500 chars of feed:\n${xml.slice(0, 500)}`,
  );
  return { starts: [], container: "item" };
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
// Original single-group regex restored — two-alternative form broke unit[1]/unit[2]
// references when the second branch matched. The 5G-as-grams exclusion is
// handled by a post-match guard below instead.
const SIZE_UNIT_RE = /(\d+(?:[.,]\d+)?)\s?(ml|g|kg|l|oz|cl|pcs?|stk|stück|paar|gr)\.?/i;
const SHOE_SIZE_RE = /\bgr(?:össe|oesse|\.|e)?\s?(\d{1,3}(?:[.,]\d+)?)\b/i;

// Cellular / connectivity generations — must never be stored as a size label.
const NETWORK_GEN_RE = /^\d+\s?G$/i;

interface TitleSplit { baseTitle: string; sizeLabel: string | null; }

function splitTitleBySize(raw: unknown): TitleSplit {
  const title = typeof raw === "string" ? raw : String(raw ?? "");
  if (!title.trim()) return { baseTitle: "", sizeLabel: null };

  // 1. Try unit-based sizes (ml, g, kg, oz, pcs, paar, …) — scan the whole
  //    title, keep the FIRST match (closest to product name), strip it.
  const unit = SIZE_UNIT_RE.exec(title);
  if (unit && unit[1] != null && unit[2] != null) {
    const amount = unit[1].replace(",", ".");
    const unitNorm = unit[2].toLowerCase().replace("stück", "stk");
    // Skip cellular-generation markers (5G, 4G, …) that matched bare 'g'
    if (unitNorm === "g" && /^\d$/.test(amount)) {
      // fall through — not a size unit
    } else {
      const raw2 = unit[0];
      const stripped = (title.slice(0, unit.index) + " " + title.slice(unit.index + raw2.length))
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[-–,]\s*$/, "")
        .trim();
      return { baseTitle: stripped || title, sizeLabel: `${amount} ${unitNorm}` };
    }
  }

  // 2. Try "Gr. 42" style shoe sizes.
  const shoe = SHOE_SIZE_RE.exec(title);
  if (shoe && shoe[1] != null) {
    const raw3 = shoe[0];
    const stripped = (title.slice(0, shoe.index) + " " + title.slice(shoe.index + raw3.length))
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
  displayAttributes: string | null;
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
      ${p.description}, ${p.displayAttributes},
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
        "displayAttributes" = EXCLUDED."displayAttributes",
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
        "displayAttributes" = COALESCE(NULLIF(EXCLUDED."displayAttributes", ''), "Product"."displayAttributes"),
        "isActive" = true,
        "updatedAt" = NOW()`;

  const productResults = await db.$queryRaw<{ id: string; gtin: string }[]>`
    INSERT INTO "Product" (
      id, gtin, title, brand,
      category, "categoryName", "imageUrl", "isActive",
      price, "originalPriceChf",
      "shippingCostChf", "priceIsNet",
      "groupId", "baseTitle", "sizeLabel",
      description, "displayAttributes",
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

// Maximum rows per single DB transaction. Reduced to 20 to keep each
// statement well under Supabase Nano's CPU budget on a 500k-row table.
const DB_BATCH_SIZE = 20;

// Pause between consecutive DB transactions. 500ms gives the Nano instance
// time to flush WAL, release the connection back to PgBouncer, and cool the
// CPU between writes — prevents the "Unhealthy" spike pattern.
const DB_BATCH_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { feed: feedKey, limit, scrub, offset: startOffset } = parseArgs();
  const feed = FEEDS[feedKey];

  // --limit controls how many XML items are parsed into memory per outer loop
  // iteration (the "parse window"). DB writes are always capped at DB_BATCH_SIZE
  // regardless of --limit, so a large parse window just means more in-memory
  // preparation before the same small sequential DB writes.
  const parseWindow = Math.max(limit, DB_BATCH_SIZE);

  console.log(`🚀 Import ${feed.shopName} (${feed.id}) — parseWindow=${parseWindow} dbBatch=${DB_BATCH_SIZE} scrub=${scrub}`);
  const db = new PrismaClient();
  console.time("total");

  try {
    // ── 1. Download + index ──────────────────────────────────────────
    const xml = await downloadFeed(feed.url);
    const feedIdx = buildItemIndex(xml);
    const total = feedIdx.starts.length;
    console.log(`📦 ${total.toLocaleString()} items in feed (container=<${feedIdx.container}>)`);

    // ── 2. Resume from last offset (unless explicit --offset) ────────
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

    // ── 3. Outer loop: parse a window of XML items ───────────────────
    let totalImported = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let outerBatch = 0;

    while (offset < total) {
      outerBatch++;
      const slice = parseFeedSlice(xml, feedIdx, offset, parseWindow);
      if (slice.length === 0) break;

      // ── 3a. Prepare all items in this parse window ─────────────────
      const prepared: PreparedItem[] = [];
      let windowSkipped = 0;

      for (let i = 0; i < slice.length; i++) {
        const item = slice[i];
        try {
          const rawGtin = (item.gtin || "").trim();
          const rawMpn  = (item.mpn  || "").trim();
          const gtin = rawGtin || rawMpn || `feed_${hashStr(item.link || `${offset + i}`)}`;
          const priceChf = parseSwissPrice(item.price);
          const rawOriginal = parseSwissPrice(item.originalPrice);
          const originalPriceChf = rawOriginal && priceChf && rawOriginal > priceChf ? rawOriginal : null;
          const affiliateLink = cleanUrl(item.link);

          if (!priceChf || !affiliateLink || affiliateLink === "#") { windowSkipped++; continue; }
          if (priceChf > 50000) { windowSkipped++; continue; }

          const lower = (item.title + " " + item.description).toLowerCase();
          if (/\b(rx|rezeptpflichtig|verschreibungspflichtig|prescription[- ]only)\b/i.test(lower)) {
            windowSkipped++;
            continue;
          }

          const shippingCostChf = parseSwissPrice(item.shippingCost);
          const priceIsNet = item.priceType === "net";

          const decodedTitle       = decodeHtml(item.title || gtin);
          const decodedDescription = decodeHtml(item.description || "");
          const decodedBrand       = decodeHtml(item.brand || feed.shopName).slice(0, 200);
          const feedSize           = decodeHtml(item.size  || "").trim();
          const feedColor          = decodeHtml(item.color || "").trim();

          let titleSplit: TitleSplit = { baseTitle: decodedTitle || gtin, sizeLabel: null };
          if (decodedTitle) {
            try { titleSplit = splitTitleBySize(decodedTitle); } catch { /* keep defaults */ }
          }
          const baseTitle  = titleSplit.baseTitle;
          const rawSize    = feedSize || titleSplit.sizeLabel;
          const sizeLabel  = rawSize && (
            /^\d{8,14}$/.test(rawSize) || NETWORK_GEN_RE.test(rawSize.trim())
          ) ? null : rawSize;
          const groupId = computeGroupId(item.itemGroupId, decodedBrand, baseTitle, feedColor);

          const { path: catPath, name: catName } = resolveCategoryDeep(
            item.productType, decodedTitle, decodedDescription,
            decodedBrand, feed.id, item.productType,
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
            catSlug: leafSlug,
            catName,
            catPath,
            imageUrl: item.imageLink ? cleanUrl(item.imageLink) : null,
            title:   decodedTitle.slice(0, 500),
            brand:   decodedBrand,
            groupId,
            baseTitle: baseTitle.slice(0, 500),
            sizeLabel,
            description: decodedDescription ? decodedDescription.slice(0, 2000) : null,
            displayAttributes: (() => {
              try {
                if (!decodedTitle) return "{}";
                return JSON.stringify(
                  extractAttributes(decodedTitle, decodedDescription, leafSlug, feedSize || undefined, feedColor || undefined).all,
                );
              } catch { return "{}"; }
            })(),
          });
        } catch (err) {
          console.warn(`[import] prepare error item ${(item as {gtin?: string}).gtin ?? offset + i}: ${err instanceof Error ? err.message : err}`);
          windowSkipped++;
        }
      }

      // ── 3b. Ensure category rows exist once for the whole window ───
      // This is idempotent (ON CONFLICT DO NOTHING) and cheap vs. per-chunk.
      try {
        await ensureCategories(db, prepared.map((p) => ({ path: p.catPath, name: p.catName })));
      } catch (err) {
        console.warn(`[import] ensureCategories failed (offset=${offset}): ${err instanceof Error ? err.message : err}`);
      }

      // ── 3c. Write in strict DB_BATCH_SIZE chunks — sequential, never parallel ──
      // Each chunk is its own SQL transaction. A failure here skips those
      // 50 rows and logs the error; the outer loop continues unaffected.
      let windowImported = 0;
      let windowErrors   = 0;
      const totalChunks  = Math.ceil(prepared.length / DB_BATCH_SIZE);

      for (let chunkStart = 0; chunkStart < prepared.length; chunkStart += DB_BATCH_SIZE) {
        const chunk     = prepared.slice(chunkStart, chunkStart + DB_BATCH_SIZE);
        const chunkIdx  = Math.floor(chunkStart / DB_BATCH_SIZE) + 1;
        const globalPct = Math.round(((offset + (chunkStart + chunk.length)) / total) * 100);

        try {
          const t0 = Date.now();
          const { imported, errors } = await bulkUpsertBatch(db, chunk, feed, scrub);
          const ms = Date.now() - t0;
          windowImported += imported;
          windowErrors   += errors;
          console.log(
            `  [${outerBatch}.${chunkIdx}/${totalChunks}] ${globalPct}%` +
            ` | +${imported} ok, ${errors} err | ${ms}ms`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          windowErrors += chunk.length;
          // Log the first GTIN in the failed chunk for easier debugging
          console.error(
            `  [${outerBatch}.${chunkIdx}/${totalChunks}] ⚠ DB chunk failed` +
            ` (${chunk.length} items, first gtin=${chunk[0]?.gtin ?? "?"}): ${msg.slice(0, 200)}`,
          );
        }

        // Yield between DB writes — lets PgBouncer recycle connections
        // and prevents write bursts that exhaust Supabase's pool.
        if (chunkStart + DB_BATCH_SIZE < prepared.length) {
          await sleep(DB_BATCH_DELAY_MS);
        }
      }

      totalImported += windowImported;
      totalSkipped  += windowSkipped;
      totalErrors   += windowErrors;
      offset        += slice.length;

      const pct = Math.round((offset / total) * 100);
      console.log(
        `[${outerBatch}] ${pct}% complete` +
        ` | window: +${windowImported} ok, ${windowSkipped} skip, ${windowErrors} err` +
        ` | offset=${offset}/${total}`,
      );

      // Save progress to ImportLog every 5 outer batches
      if (outerBatch % 5 === 0) {
        await db.importLog.create({
          data: {
            feedId: feed.id, currentSkip: offset, totalItems: total,
            imported: totalImported, errors: totalErrors,
            status: "completed",
            message: `Runner batch ${outerBatch}: ${totalImported} total imported`,
          },
        }).catch(() => {});
      }
    }

    // ── 4. Final log ─────────────────────────────────────────────────
    await db.importLog.create({
      data: {
        feedId: feed.id, currentSkip: 0, totalItems: total,
        imported: totalImported, errors: totalErrors,
        status: "cycle_complete",
        message: `Runner done: ${totalImported}/${total} imported, ${totalSkipped} skipped, ${totalErrors} errors`,
      },
    }).catch(() => {});

    // ── 5. ANALYZE — refresh query-planner statistics ─────────────
    // Runs after every successful cycle so Postgres immediately sees
    // the updated row counts and doesn't pick a bad index scan plan.
    // VACUUM is intentionally omitted: Supabase's autovacuum handles
    // dead-tuple reclamation; VACUUM also cannot run through PgBouncer
    // in transaction mode. ANALYZE is safe with any role + any pooler.
    console.log("📊 Running ANALYZE to refresh planner statistics…");
    try {
      await db.$executeRawUnsafe(`ANALYZE "Product"`);
      await db.$executeRawUnsafe(`ANALYZE "Price"`);
      console.log("   ANALYZE complete.");
    } catch (err) {
      console.warn("   ANALYZE failed (non-fatal):", err instanceof Error ? err.message : err);
    }

    console.log(`\n🎉 Import complete`);
    console.log(`   ${totalImported.toLocaleString()} imported`);
    console.log(`   ${totalSkipped.toLocaleString()} skipped`);
    console.log(`   ${totalErrors.toLocaleString()} errors`);
    console.log(`   ${outerBatch} outer batches`);
  } finally {
    await db.$disconnect();
    console.timeEnd("total");
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
