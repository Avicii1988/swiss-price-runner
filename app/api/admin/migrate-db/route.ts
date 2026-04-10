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
 * GET /api/admin/migrate-db?secret=...
 *
 * Adds the "price" column to the Product table if it doesn't exist.
 * Temporary route — delete after first successful run.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    await db.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "price" DECIMAL(10, 2)`
    );

    return NextResponse.json({
      ok: true,
      message: 'Spalte "price" erfolgreich hinzugefügt (oder existierte bereits).',
      durationMs: Date.now() - startMs,
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
