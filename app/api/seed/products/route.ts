import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SEED_PRODUCTS } from "@/prisma/seed";
import { calculateSwissPrice } from "@/lib/pricing/calculator";

/**
 * POST /api/seed/products
 *
 * Upserts all 67 seed products + price snapshots into Supabase.
 * No table creation — tables must already exist.
 *
 * curl -X POST https://swiss-price-runner.vercel.app/api/seed/products \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const EXCHANGE_RATE = 0.94;
  let productsOk = 0;
  let productsFailed = 0;
  let pricesOk = 0;
  const errors: string[] = [];

  for (const seed of SEED_PRODUCTS) {
    try {
      // Upsert product
      const product = await db.product.upsert({
        where: { gtin: seed.gtin },
        select: { id: true },
        create: {
          gtin: seed.gtin,
          title: seed.title,
          brand: seed.brand,
          category: seed.category,
          imageUrl: seed.imageUrl,
        },
        update: {
          title: seed.title,
          brand: seed.brand,
          category: seed.category,
          imageUrl: seed.imageUrl,
        },
      });
      productsOk++;

      // Write price snapshots per source
      for (const source of seed.sources) {
        try {
          const bd = calculateSwissPrice({
            amountEur: source.currentPriceEur,
            exchangeRate: EXCHANGE_RATE,
          });

          await db.price.create({
            data: {
              productId: product.id,
              amountChf: bd.totalChf,
              amountEur: bd.originalEur,
              sourceId: source.sourceId,
              timestamp: new Date(),
            },
          });
          pricesOk++;
        } catch {
          // Price may already exist — skip
        }
      }
    } catch (err) {
      productsFailed++;
      errors.push(`${seed.gtin}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  const totalProducts = await db.product.count();
  const totalPrices = await db.price.count();

  return NextResponse.json({
    status: productsFailed === 0 ? "ok" : "partial",
    seedCount: SEED_PRODUCTS.length,
    productsOk,
    productsFailed,
    pricesOk,
    totalProducts,
    totalPrices,
    errors: errors.slice(0, 5),
  });
}
