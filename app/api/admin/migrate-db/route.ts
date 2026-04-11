import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    const results: string[] = [];

    // Product.price column
    await db.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10, 2)`
    );
    results.push("Product.price OK");

    // Price.shopName column
    await db.$executeRawUnsafe(
      `ALTER TABLE "Price" ADD COLUMN IF NOT EXISTS "shopName" TEXT`
    );
    results.push("Price.shopName OK");

    // Deduplicate prices before unique constraint
    await db.$executeRawUnsafe(`
      DELETE FROM "Price" a USING "Price" b
      WHERE a."productId" = b."productId"
        AND a."sourceId" = b."sourceId"
        AND a."id" < b."id"
    `);
    results.push("Price duplicates cleaned");

    // Unique constraint for price upsert
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Price_productId_sourceId_key"
      ON "Price"("productId", "sourceId")
    `);
    results.push("Price unique constraint OK");

    // Performance indexes
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_updatedAt_idx" ON "Product"("updatedAt")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_isActive_category_idx" ON "Product"("isActive", "category")`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx" ON "Product"("isActive", "price")`);
    results.push("Performance indexes OK");

    // Cleanup: rename import_parfumerie → parfumsale in existing Price records
    const renamed = await db.$executeRawUnsafe(`
      UPDATE "Price" SET "sourceId" = 'parfumsale', "shopName" = 'Parfumsale'
      WHERE "sourceId" = 'import_parfumerie'
    `);
    results.push(`Renamed import_parfumerie prices: ${renamed}`);

    // Cleanup: move numeric category slugs to "parfum"
    const numericFixed = await db.$executeRawUnsafe(`
      UPDATE "Product" SET category = 'parfum', "categoryName" = 'Parfum & Düfte'
      WHERE category ~ '^[0-9]+$' AND "isActive" = true
    `);
    results.push(`Numeric categories fixed: ${numericFixed}`);

    return NextResponse.json({
      ok: true,
      results,
      message: results.join(" | "),
      durationMs: Date.now() - startMs,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: safeErrorMessage(error),
      durationMs: Date.now() - startMs,
    }, { status: 500 });
  }
}
