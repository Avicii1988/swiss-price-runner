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

    return NextResponse.json({
      ok: true,
      updated: result,
      message: `${result} Produkte aktualisiert in ${Date.now() - startMs}ms`,
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
