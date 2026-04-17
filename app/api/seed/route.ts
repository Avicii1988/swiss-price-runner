import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { SEED_PRODUCTS } from "@/prisma/seed";
import { calculateSwissPrice } from "@/lib/pricing/calculator";


/**
 * POST /api/seed
 *
 * Populates Supabase with all 55 seed products and initial price snapshots.
 * Auth: requires CRON_SECRET to prevent public abuse.
 *
 * Usage: curl -X POST https://swiss-price-runner.vercel.app/api/seed \
 *          -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const EXCHANGE_RATE = 0.94;
  let productsUpserted = 0;
  let pricesCreated = 0;

  try {
    // Ensure tables exist (raw SQL fallback for fresh Supabase)
    await ensureTables();

    for (const seed of SEED_PRODUCTS) {
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
      productsUpserted++;

      // Write one price snapshot per source
      for (const source of seed.sources) {
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
        pricesCreated++;
      }
    }

    const totalProducts = await db.product.count();
    const totalPrices = await db.price.count();

    return NextResponse.json({
      status: "ok",
      productsUpserted,
      pricesCreated,
      totalProducts,
      totalPrices,
    });
  } catch (err) {
    console.error("[seed] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown" },
      { status: 500 },
    );
  }
}

async function ensureTables() {
  try {
    await db.$queryRaw`SELECT 1 FROM "Product" LIMIT 1`;
  } catch {
    // Tables don't exist — create them
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "gtin" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
      )
    `);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Product_gtin_key" ON "Product"("gtin")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_brand_idx" ON "Product"("brand")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category")`);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Price" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "productId" TEXT NOT NULL,
        "amountChf" DECIMAL(10,2) NOT NULL,
        "amountEur" DECIMAL(10,2) NOT NULL,
        "sourceId" TEXT NOT NULL,
        "url" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Price_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      )
    `);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Price_productId_timestamp_idx" ON "Price"("productId","timestamp")`);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserAlert" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "targetPrice" DECIMAL(10,2) NOT NULL,
        "isNotified" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserAlert_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "UserAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
      )
    `);
    await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserAlert_email_productId_key" ON "UserAlert"("email","productId")`);
  }
}
