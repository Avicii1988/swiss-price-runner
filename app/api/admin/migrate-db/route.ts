import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/admin/migrate-db?secret=...&step=1
 *
 * Runs migration in safe steps (one per request to avoid timeouts):
 * step=1: Schema changes (columns, indexes)
 * step=2: Price dedup + unique constraint
 * step=3: Cleanup (rename sources, fix numeric categories)
 * step=all: Run all steps (only if on Pro with 300s timeout)
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const step = req.nextUrl.searchParams.get("step") ?? "all";
  const startMs = Date.now();
  const results: string[] = [];

  try {
    // ── Step 1: Schema ──
    if (step === "1" || step === "all") {
      await db.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10, 2)`);
      await db.$executeRawUnsafe(`ALTER TABLE "Price" ADD COLUMN IF NOT EXISTS "shopName" TEXT`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_price_idx" ON "Product"("price")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_updatedAt_idx" ON "Product"("updatedAt")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_isActive_category_idx" ON "Product"("isActive", "category")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_isActive_price_idx" ON "Product"("isActive", "price")`);
      results.push("Step 1: Schema + indexes OK");
    }

    // ── Step 2: Dedup + unique constraint ──
    if (step === "2" || step === "all") {
      // Batched dedup: delete 1000 at a time to avoid timeout
      let totalDeduped = 0;
      for (let i = 0; i < 20; i++) {
        const deleted = await db.$executeRawUnsafe(`
          DELETE FROM "Price" WHERE id IN (
            SELECT a.id FROM "Price" a
            INNER JOIN "Price" b ON a."productId" = b."productId" AND a."sourceId" = b."sourceId" AND a.id < b.id
            LIMIT 1000
          )
        `);
        totalDeduped += Number(deleted);
        if (Number(deleted) === 0) break;
      }
      results.push(`Step 2: Deduped ${totalDeduped} prices`);

      await db.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Price_productId_sourceId_key"
        ON "Price"("productId", "sourceId")
      `);
      results.push("Step 2: Unique constraint OK");
    }

    // ── Step 3: Cleanup ──
    if (step === "3" || step === "all") {
      const renamed = await db.$executeRawUnsafe(`
        UPDATE "Price" SET "sourceId" = 'parfumsale', "shopName" = 'Parfumsale'
        WHERE "sourceId" = 'import_parfumerie'
      `);
      results.push(`Step 3: Renamed import_parfumerie: ${renamed}`);

      // Batched: fix numeric categories 500 at a time
      let totalFixed = 0;
      for (let i = 0; i < 40; i++) {
        const fixed = await db.$executeRawUnsafe(`
          UPDATE "Product" SET category = 'parfum', "categoryName" = 'Parfum & Düfte'
          WHERE id IN (
            SELECT id FROM "Product" WHERE category ~ '^[0-9]+$' AND "isActive" = true LIMIT 500
          )
        `);
        totalFixed += Number(fixed);
        if (Number(fixed) === 0) break;
      }
      results.push(`Step 3: Numeric categories fixed: ${totalFixed}`);
    }

    return NextResponse.json({
      ok: true,
      step,
      results,
      message: results.join(" | "),
      durationMs: Date.now() - startMs,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      step,
      results,
      message: safeErrorMessage(error),
      durationMs: Date.now() - startMs,
    }, { status: 500 });
  }
}
