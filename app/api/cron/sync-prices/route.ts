import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateSwissPrice } from "@/lib/pricing/calculator";
import { sendPriceAlertEmail } from "@/lib/email/send-alert";

/**
 * POST /api/cron/sync-prices
 *
 * Daily sync endpoint (Vercel Cron). Authenticates via CRON_SECRET.
 *
 * Flow:
 *  1. Authenticate.
 *  2. Fetch latest prices from integration sources.
 *  3. Calculate Swiss landed cost (EUR→CHF + taxes + customs).
 *  4. Upsert prices into the database.
 *  5. Evaluate active alerts and send email notifications in batches.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db.product.findMany({
      select: { id: true, gtin: true, category: true, title: true, imageUrl: true },
    });

    if (products.length === 0) {
      return NextResponse.json({ status: "ok", message: "No products to sync" });
    }

    const exchangeRate = await getExchangeRate();
    let synced = 0;
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const product of products) {
      // TODO: Replace with real integration client calls
      const breakdown = calculateSwissPrice({
        amountEur: 0,
        exchangeRate,
        category: "standard",
        clearanceType: "vereinfacht",
      });

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

      // ── Alert processing (batched to avoid cron timeout) ──────────
      // Fetch alerts where: active, not yet notified, target >= current price
      const triggeredAlerts = await db.userAlert.findMany({
        where: {
          productId: product.id,
          isActive: true,
          isNotified: false,
          targetPrice: { gte: breakdown.totalChf },
        },
        take: 50, // batch limit per product to prevent timeout
      });

      if (triggeredAlerts.length === 0) continue;

      // Mark all as notified FIRST (idempotent — prevents double-send on retry)
      const alertIds = triggeredAlerts.map((a) => a.id);
      await db.userAlert.updateMany({
        where: { id: { in: alertIds } },
        data: { isNotified: true },
      });

      // Send emails concurrently in batches of 10
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
              currentPriceChf: Number(breakdown.totalChf),
              targetPriceChf: Number(alert.targetPrice),
              bestSource: "Sync",
              shopUrl: "#",
              alertId: alert.id,
            }),
          ),
        );

        for (const r of results) {
          if (r.status === "fulfilled") emailsSent++;
          else {
            emailsFailed++;
            console.error("[sync-prices] Email send failed:", r.reason);
          }
        }
      }
    }

    return NextResponse.json({
      status: "ok",
      synced,
      emailsSent,
      emailsFailed,
      exchangeRate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[sync-prices] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getExchangeRate(): Promise<number> {
  // TODO: Replace with real exchange rate API
  return 0.94;
}
