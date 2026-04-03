import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/health
 *
 * Health check endpoint — verifies DB connectivity and returns system status.
 */
export async function GET() {
  const checks: Record<string, "ok" | "fail" | string> = {
    timestamp: new Date().toISOString(),
    database: "pending",
    resend: process.env.RESEND_API_KEY ? "configured" : "missing",
    cron_secret: process.env.CRON_SECRET ? "configured" : "missing",
  };

  // DB connectivity check
  try {
    const result = await db.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    checks.database = "ok";
    checks.db_time = result[0].now.toISOString();
    checks.product_count = String(await db.product.count());
    checks.alert_count = String(await db.userAlert.count());
    checks.price_count = String(await db.price.count());
  } catch (err) {
    checks.database = "fail";
    checks.db_error = err instanceof Error ? err.message : "Unknown";
  }

  const allOk = checks.database === "ok";

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks },
    { status: allOk ? 200 : 503 },
  );
}
