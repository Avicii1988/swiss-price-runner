import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  feedUrl: z.string().url().optional(),
  shopName: z.string().min(1).max(100).default("XXL Parfum"),
  defaultCategory: z.string().min(1).max(50).default("parfum"),
  limit: z.coerce.number().int().min(0).max(10000).default(0),
});

const DEFAULT_FEED =
  "https://adtraction.com/productfeed.htm?type=feed&format=XML&encoding=UTF8&epi=1&zip=1&cdelim=tab&tdelim=singlequote&sd=0&sn=0&flat=0&apid=1710426239&asid=2064719298&gsh=1&pfid=1022&gt=0";

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
  const debugLog: string[] = [];

  const log = (msg: string) => {
    console.log(`[feed-import] ${msg}`);
    debugLog.push(msg);
  };

  try {
    // ── 1. Fetch ─────────────────────────────────────────────
    log(`Fetching feed: ${feedUrl.slice(0, 100)}`);
    const feedRes = await fetch(feedUrl, { signal: AbortSignal.timeout(60000) });
    log(`Fetch status: ${feedRes.status}, content-type: ${feedRes.headers.get("content-type")}`);

    if (!feedRes.ok) {
      return NextResponse.json(
        { error: `Feed fetch failed: ${feedRes.status}`, debugLog },
        { status: 502 },
      );
    }

    // ── 2. Read response ─────────────────────────────────────
    const contentType = feedRes.headers.get("content-type") || "";
    const isZip =
      contentType.includes("zip") ||
      contentType.includes("octet-stream") ||
      feedUrl.includes("zip=1");

    let xml: string;

    if (isZip) {
      log("Response looks like ZIP, attempting decompression...");
      const buffer = await feedRes.arrayBuffer();
      log(`Raw buffer size: ${buffer.byteLength} bytes`);

      const bytes = new Uint8Array(buffer);
      log(`First 4 bytes: [${bytes[0]}, ${bytes[1]}, ${bytes[2]}, ${bytes[3]}] (PK=80,75)`);

      try {
        xml = await decompressZip(bytes);
        log(`Decompressed XML size: ${xml.length} chars`);
      } catch (zipErr) {
        log(`ZIP decompression failed: ${zipErr}`);
        // Maybe it's not actually zipped — try as plain text
        xml = new TextDecoder().decode(bytes);
        log(`Fallback to plain text: ${xml.length} chars`);
      }
    } else {
      xml = await feedRes.text();
      log(`Plain text size: ${xml.length} chars`);
    }

    // Log first 500 chars of XML for debugging
    log(`XML preview: ${xml.slice(0, 500).replace(/\n/g, " ")}`);

    // ── 3. Parse ─────────────────────────────────────────────
    const allItems = parseGoogleShoppingXml(xml);
    log(`Parsed ${allItems.length} items from XML`);

    if (allItems.length === 0) {
      // Try to detect why no items were found
      const hasItem = xml.includes("<item>");
      const hasEntry = xml.includes("<entry>");
      const hasChannel = xml.includes("<channel>");
      log(`XML structure: hasItem=${hasItem}, hasEntry=${hasEntry}, hasChannel=${hasChannel}`);
      return NextResponse.json({
        status: "ok",
        imported: 0,
        message: "No items found in feed",
        debugLog,
      });
    }

    // Log first parsed item for debugging
    const sample = allItems[0];
    log(`Sample item[0]: title="${sample.title.slice(0, 60)}", price="${sample.price}", brand="${sample.brand}", gtin="${sample.gtin}", link="${sample.link.slice(0, 80)}"`);
    log(`Sample item[0] productType: "${sample.productType}"`);
    log(`Sample item[0] imageLink: "${sample.imageLink.slice(0, 80)}"`);

    const items = limit > 0 ? allItems.slice(0, limit) : allItems;
    log(`Processing ${items.length} of ${allItems.length} items`);

    // ── 4. Categories ────────────────────────────────────────
    const categorySet = new Set<string>();
    for (const item of items) {
      if (item.productType) {
        categorySet.add(extractLeafCategory(item.productType));
      }
    }
    log(`Found ${categorySet.size} unique categories: ${[...categorySet].slice(0, 10).join(", ")}`);

    for (const catName of categorySet) {
      const slug = slugify(catName);
      if (!slug) continue;
      try {
        await db.category.upsert({
          where: { slug },
          create: { name: catName, slug },
          update: { name: catName },
        });
      } catch (catErr) {
        log(`Category upsert error for "${catName}" (slug="${slug}"): ${catErr}`);
      }
    }

    // ── 5. Import products ───────────────────────────────────
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      try {
        // Build GTIN
        const gtin = item.gtin || item.mpn || `feed_${hashStr(item.link || `item_${idx}`)}`;

        // Parse price
        const priceChf = parsePrice(item.price);

        if (!priceChf || !item.title || !item.link) {
          if (idx < 3) log(`Skipping item[${idx}]: price=${item.price}(${priceChf}), title=${!!item.title}, link=${!!item.link}`);
          skipped++;
          continue;
        }

        const leafCategory = item.productType
          ? extractLeafCategory(item.productType)
          : null;
        const categorySlug = leafCategory ? slugify(leafCategory) : defaultCategory;

        if (idx < 3) log(`Upserting item[${idx}]: gtin="${gtin}", price=${priceChf}, cat="${categorySlug}", brand="${item.brand}"`);

        // Upsert product — select only id to avoid reading vector column
        const product = await db.product.upsert({
          where: { gtin },
          select: { id: true },
          create: {
            gtin,
            title: item.title.slice(0, 500),
            brand: (item.brand || shopName).slice(0, 200),
            category: categorySlug.slice(0, 50),
            categoryName: item.productType ? item.productType.slice(0, 200) : null,
            imageUrl: item.imageLink || null,
            shopName,
            sourceType: "adtraction_feed",
            affiliateUrl: item.link,
            isActive: true,
          },
          update: {
            title: item.title.slice(0, 500),
            brand: item.brand ? item.brand.slice(0, 200) : undefined,
            imageUrl: item.imageLink || undefined,
            categoryName: item.productType ? item.productType.slice(0, 200) : undefined,
            shopName,
            affiliateUrl: item.link,
            isActive: true,
            updatedAt: new Date(),
          },
        });

        if (idx < 3) log(`Product upserted: id=${product.id}`);

        // Price snapshot
        await db.price.create({
          data: {
            productId: product.id,
            amountChf: priceChf,
            amountEur: Math.round((priceChf / 0.94) * 100) / 100,
            sourceId: `adtraction_${slugify(shopName)}`,
            url: item.link,
            timestamp: new Date(),
          },
        });

        imported++;

        if (imported % 50 === 0) {
          await new Promise((r) => setTimeout(r, 100));
          log(`Progress: ${imported}/${items.length}`);
        }
      } catch (e: unknown) {
        errors++;
        const errMsg = e instanceof Error ? e.message : String(e);
        if (errors <= 10) {
          const detail = `Item[${idx}] error: ${errMsg} | gtin="${item.gtin}", price="${item.price}", title="${item.title?.slice(0, 40)}"`;
          log(detail);
          errorDetails.push(detail);
        }
      }
    }

    const durationMs = Date.now() - startMs;
    log(`Done in ${durationMs}ms — imported=${imported} skipped=${skipped} errors=${errors}`);

    return NextResponse.json({
      status: "ok",
      feedUrl: feedUrl.slice(0, 100),
      shopName,
      totalInFeed: allItems.length,
      processed: items.length,
      imported,
      skipped,
      errors,
      errorDetails: errorDetails.slice(0, 10),
      categoriesFound: categorySet.size,
      durationMs,
      debugLog,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack?.slice(0, 500)}` : String(error);
    log(`FATAL: ${errMsg}`);
    return NextResponse.json(
      { error: "Feed import failed", message: errMsg, debugLog },
      { status: 500 },
    );
  }
}

// ── ZIP ──────────────────────────────────────────────────────

async function decompressZip(data: Uint8Array): Promise<string> {
  // Check ZIP signature PK\x03\x04
  if (data[0] !== 0x50 || data[1] !== 0x4b) {
    console.log("[zip] Not a ZIP file, returning as text");
    return new TextDecoder().decode(data);
  }

  const compressMethod = data[8] | (data[9] << 8);
  const compressedSize = data[18] | (data[19] << 8) | (data[20] << 16) | (data[21] << 24);
  const uncompressedSize = data[22] | (data[23] << 8) | (data[24] << 16) | (data[25] << 24);
  const fileNameLen = data[26] | (data[27] << 8);
  const extraLen = data[28] | (data[29] << 8);
  const fileName = new TextDecoder().decode(data.slice(30, 30 + fileNameLen));
  const offset = 30 + fileNameLen + extraLen;

  console.log(`[zip] method=${compressMethod}, compressedSize=${compressedSize}, uncompressedSize=${uncompressedSize}, file="${fileName}", dataOffset=${offset}`);

  // Use actual compressed size, or if 0, use rest of data minus end-of-central-dir
  const endSize = compressedSize > 0 ? compressedSize : data.length - offset - 100;
  const compressedData = data.slice(offset, offset + endSize);

  if (compressMethod === 0) {
    return new TextDecoder().decode(compressedData);
  }

  if (compressMethod === 8) {
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

  throw new Error(`Unsupported ZIP method: ${compressMethod}`);
}

// ── XML ──────────────────────────────────────────────────────

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
      price: tag(block, "g:price") || tag(block, "g:sale_price") || tag(block, "price") || "",
      link: tag(block, "g:link") || tag(block, "link") || "",
      imageLink: tag(block, "g:image_link") || tag(block, "image_link") || "",
      brand: tag(block, "g:brand") || tag(block, "brand") || "",
      gtin: tag(block, "g:gtin") || tag(block, "g:ean") || tag(block, "gtin") || "",
      mpn: tag(block, "g:mpn") || tag(block, "g:id") || tag(block, "id") || "",
      productType: tag(block, "g:product_type") || tag(block, "g:google_product_category") || tag(block, "product_type") || "",
    });
  }

  return items;
}

function tag(xml: string, name: string): string {
  // Match <tag>text</tag> and <tag><![CDATA[text]]></tag>
  const re = new RegExp(
    `<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`,
    "i",
  );
  const m = re.exec(xml);
  return m ? m[1].trim() : "";
}

// ── Utils ────────────────────────────────────────────────────

function parsePrice(s: string): number | null {
  if (!s) return null;
  // Handle "49.95 CHF", "CHF 49.95", "49,95", "49.95"
  const cleaned = s.replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? null : Math.round(num * 100) / 100;
}

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
