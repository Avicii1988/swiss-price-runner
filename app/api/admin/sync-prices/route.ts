import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

/**
 * GET /api/admin/sync-prices?secret=...
 *
 * Copies the latest price from the Price table into the Product.price field.
 * Uses a single raw SQL UPDATE for maximum speed on 16k+ products.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    // Single SQL: set Product.price = latest Price.amountChf per product
    const result = await db.$executeRawUnsafe(`
      UPDATE "Product" p
      SET "price" = sub."amountChf",
          "updatedAt" = NOW()
      FROM (
        SELECT DISTINCT ON ("productId") "productId", "amountChf"
        FROM "Price"
        ORDER BY "productId", "timestamp" DESC
      ) sub
      WHERE p."id" = sub."productId"
        AND (p."price" IS NULL OR p."price" != sub."amountChf")
    `);

    const elapsed = Date.now() - startMs;

    return NextResponse.json({
      ok: true,
      updated: result,
      message: `${result} Produkte aktualisiert in ${elapsed}ms`,
      durationMs: elapsed,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      ok: false,
      message: msg,
      durationMs: Date.now() - startMs,
    }, { status: 500 });
  }
}
