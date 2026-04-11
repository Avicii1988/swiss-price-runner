import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { sendPriceAlertEmail } from "@/lib/email/send-alert";
import { SEED_PRODUCTS } from "@/prisma/seed";
import { isAuthorized } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    // ── 1. Health check ─────────────────────────────────────────────
    const dbCheck = await db.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    console.log("[sync-prices] DB connected at", dbCheck[0].now.toISOString());

    // ── 2. Seed products if table is empty ──────────────────────────
    const productCount = await db.product.count();
    let seeded = 0;

    if (productCount === 0) {
      console.log("[sync-prices] Product table empty — seeding", SEED_PRODUCTS.length, "products");

      for (const p of SEED_PRODUCTS) {
        await db.product.upsert({
          where: { gtin: p.gtin },
          select: { id: true },
          create: {
            gtin: p.gtin,
            title: p.title,
            brand: p.brand,
            category: p.category,
            imageUrl: p.imageUrl,
          },
          update: {
            title: p.title,
            brand: p.brand,
            category: p.category,
            imageUrl: p.imageUrl,
          },
        });
        seeded++;
      }

      console.log("[sync-prices] Seeded", seeded, "products");
    }

    // ── 3. Load all products ────────────────────────────────────────
    const products = await db.product.findMany({
      select: { id: true, gtin: true, category: true, title: true, imageUrl: true },
    });

    if (products.length === 0) {
      return NextResponse.json({ status: "ok", message: "No products to sync" });
    }

    // ── 4. Exchange rate ────────────────────────────────────────────
    const exchangeRate = await getExchangeRate();

    let synced = 0;
    let emailsSent = 0;
    let emailsFailed = 0;

    // ── 5. Price sync per product ───────────────────────────────────
    for (const product of products) {
      // Find mock source data for this GTIN (from seed)
      const seedProduct = SEED_PRODUCTS.find((sp) => sp.gtin === product.gtin);
      const sources = seedProduct?.sources ?? [];

      for (const source of sources) {
        const breakdown = calculateSwissPrice({
          amountEur: source.currentPriceEur,
          exchangeRate,
          category: "standard",
          clearanceType: "vereinfacht",
        });

        await db.price.create({
          data: {
            productId: product.id,
            amountChf: breakdown.totalChf,
            amountEur: breakdown.originalEur,
            sourceId: source.sourceId,
            url: source.url !== "#" ? source.url : null,
            timestamp: new Date(),
          },
        });
      }

      // Also try live price from SearchApi (with rate-limit delay)
      if (process.env.SEARCHAPI_API_KEY) {
        try {
          // 500ms delay between SearchApi calls to avoid rate limits
          await new Promise((r) => setTimeout(r, 500));

          const searchUrl = new URL("https://www.searchapi.io/api/v1/search");
          searchUrl.searchParams.set("engine", "google_shopping");
          searchUrl.searchParams.set("q", product.title);
          searchUrl.searchParams.set("location", "Switzerland");
          searchUrl.searchParams.set("hl", "de");
          searchUrl.searchParams.set("gl", "ch");
          searchUrl.searchParams.set("num", "1");
          searchUrl.searchParams.set("api_key", process.env.SEARCHAPI_API_KEY);

          const searchRes = await fetch(searchUrl.toString());
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const topResult = searchData.shopping_results?.[0];
            if (topResult?.extracted_price) {
              await db.price.create({
                data: {
                  productId: product.id,
                  amountChf: topResult.extracted_price,
                  amountEur: topResult.extracted_price / exchangeRate,
                  sourceId: "searchapi_live",
                  url: topResult.link ?? null,
                  timestamp: new Date(),
                },
              });
            }
          }
        } catch (e) {
          console.warn("[sync-prices] SearchApi fetch failed for", product.gtin, e);
        }
      }

      synced++;

      // ── 6. Alert processing (batched) ─────────────────────────────
      // Get the best current CHF price for this product
      const latestPrice = await db.price.findFirst({
        where: { productId: product.id },
        orderBy: { timestamp: "desc" },
        select: { amountChf: true, sourceId: true },
      });

      if (!latestPrice) continue;

      const triggeredAlerts = await db.userAlert.findMany({
        where: {
          productId: product.id,
          isActive: true,
          isNotified: false,
          targetPrice: { gte: latestPrice.amountChf },
        },
        take: 50,
      });

      if (triggeredAlerts.length === 0) continue;

      // Mark notified FIRST (idempotent)
      const alertIds = triggeredAlerts.map((a) => a.id);
      await db.userAlert.updateMany({
        where: { id: { in: alertIds } },
        data: { isNotified: true },
      });

      // Send emails in batches of 10
      const BATCH_SIZE = 10;
      for (let i = 0; i < triggeredAlerts.length; i += BATCH_SIZE) {
        const batch = triggeredAlerts.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map((alert) =>
            sendPriceAlertEmail({
              to: alert.email,
              productTitle: product.title,
              productImage: product.imageUrl ?? "",
              productGtin: product.gtin,
              currentPriceChf: Number(latestPrice.amountChf),
              targetPriceChf: Number(alert.targetPrice),
              bestSource: latestPrice.sourceId,
              shopUrl: "#",
              alertId: alert.id,
            }),
          ),
        );

        for (const r of results) {
          if (r.status === "fulfilled") emailsSent++;
          else {
            emailsFailed++;
            console.error("[sync-prices] Email failed:", r.reason);
          }
        }
      }
    }

    // ── 7. Trigger one feed import batch ─────────────────────────
    let feedImport = null;
    try {
      const feedUrl = new URL("/api/cron/import-feed", request.url);
      const feedRes = await fetch(feedUrl.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      feedImport = await feedRes.json().catch(() => null);
      console.log("[sync-prices] Feed import batch:", feedImport?.status, feedImport?.progress?.percentDone + "%");
    } catch (e) {
      console.warn("[sync-prices] Feed import skipped:", e);
    }

    const durationMs = Date.now() - startMs;
    console.log(`[sync-prices] Done in ${durationMs}ms — synced=${synced} emails=${emailsSent}`);

    return NextResponse.json({
      status: "ok",
      seeded,
      synced,
      emailsSent,
      emailsFailed,
      exchangeRate,
      feedImport: feedImport?.progress ?? null,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const durationMs = Date.now() - startMs;
    console.error(`[sync-prices] Error after ${durationMs}ms:`, error);
    return NextResponse.json(
      { error: "Internal server error", durationMs },
      { status: 500 },
    );
  }
}

async function getExchangeRate(): Promise<number> {
  // TODO: Replace with real exchange rate API (ECB, Fixer, exchangerate.host)
  return 0.94;
}
