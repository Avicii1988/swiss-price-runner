import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSwissPrice } from "@/lib/pricing/calculator";

/**
 * POST /api/cron/sync-prices
 *
 * Main daily sync endpoint. Designed to be triggered by Vercel Cron
 * or an external scheduler. Authenticates via CRON_SECRET header.
 *
 * Flow:
 *  1. Authenticate request.
 *  2. Fetch latest prices from all integration sources.
 *  3. Calculate Swiss landed cost (EUR→CHF + taxes + customs).
 *  4. Upsert prices into the database.
 *  5. Evaluate active user alerts and queue notifications.
 */
export async function POST(request: Request) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // --- 1. Load all tracked products ---
    const products = await db.product.findMany({
      select: { id: true, gtin: true, category: true },
    });

    if (products.length === 0) {
      return NextResponse.json({
        status: "ok",
        message: "No products to sync",
      });
    }

    // --- 2. Fetch exchange rate (placeholder – swap for real API) ---
    const exchangeRate = await getExchangeRate();

    // --- 3. Process each product ---
    let synced = 0;
    let alertsTriggered = 0;

    for (const product of products) {
      // TODO: Iterate over registered integration clients and aggregate prices.
      // For now we store a placeholder to prove the pipeline works end-to-end.

      const breakdown = calculateSwissPrice({
        amountEur: 0, // will be replaced by real fetched price
        exchangeRate,
        category: "standard",
        clearanceType: "vereinfacht",
      });

      // Upsert latest price
      await db.price.create({
        data: {
          productId: product.id,
          amountChf: breakdown.totalChf,
          amountEur: breakdown.originalEur,
          sourceId: "sync",
          timestamp: new Date(),
        },
      });

      synced++;

      // --- 4. Evaluate alerts ---
      const triggeredAlerts = await db.userAlert.findMany({
        where: {
          productId: product.id,
          isActive: true,
          targetPrice: { gte: breakdown.totalChf },
        },
      });

      alertsTriggered += triggeredAlerts.length;
      // TODO: Queue notification jobs for triggered alerts
    }

    return NextResponse.json({
      status: "ok",
      synced,
      alertsTriggered,
      exchangeRate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[sync-prices] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getExchangeRate(): Promise<number> {
  // TODO: Replace with real exchange rate API (e.g. ECB, Fixer, exchangerate.host)
  // Fallback to a sensible default for development
  return 0.94;
}
