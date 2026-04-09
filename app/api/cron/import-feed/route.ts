import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 200;
const FEED_ID = "xxl_parfum";

/**
 * POST /api/cron/import-feed
 *
 * Automated chunked feed import. Each call imports 200 products,
 * then saves progress in ImportLog. On the next call (or next cron tick),
 * it picks up where it left off.
 *
 * When the end of the feed is reached, skip resets to 0 for price updates.
 *
 * Auth: Bearer CRON_SECRET
 * Can also be triggered manually: same endpoint, same auth.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    // ── 1. Get current skip from last successful import ──────
    const lastLog = await db.importLog.findFirst({
      where: { feedId: FEED_ID, status: "completed" },
      orderBy: { createdAt: "desc" },
      select: { currentSkip: true, totalItems: true },
    });

    const skip = lastLog?.currentSkip ?? 0;
    const knownTotal = lastLog?.totalItems ?? 0;

    console.log(`[cron-import] Starting batch: skip=${skip}, knownTotal=${knownTotal}`);

    // ── 2. Call our own import endpoint internally ───────────
    const importUrl = new URL("/api/feeds/import", req.url);
    const importRes = await fetch(importUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ skip, limit: BATCH_SIZE }),
    });

    const result = await importRes.json();

    if (!importRes.ok || result.status !== "ok") {
      // Log the failure
      await db.importLog.create({
        data: {
          feedId: FEED_ID,
          currentSkip: skip,
          totalItems: knownTotal,
          imported: 0,
          errors: 0,
          status: "error",
          message: result.error || result.message || `HTTP ${importRes.status}`,
        },
      });

      return NextResponse.json({
        status: "error",
        skip,
        message: result.error || result.message,
        durationMs: Date.now() - startMs,
      }, { status: 502 });
    }

    // ── 3. Determine next skip ───────────────────────────────
    const totalInFeed = result.totalInFeed ?? 0;
    const nextSkip = result.nextSkip ?? skip + BATCH_SIZE;
    const isComplete = nextSkip >= totalInFeed || result.processed === 0;

    // If feed is fully imported, reset to 0 for next cycle (price updates)
    const savedSkip = isComplete ? 0 : nextSkip;

    // ── 4. Log progress ──────────────────────────────────────
    await db.importLog.create({
      data: {
        feedId: FEED_ID,
        currentSkip: savedSkip,
        totalItems: totalInFeed,
        imported: result.imported ?? 0,
        errors: result.errors ?? 0,
        status: isComplete ? "cycle_complete" : "completed",
        message: isComplete
          ? `Full cycle done. ${totalInFeed} products. Resetting to 0.`
          : `Batch skip=${skip}→${nextSkip}. Imported ${result.imported}.`,
      },
    });

    const durationMs = Date.now() - startMs;

    console.log(`[cron-import] Done in ${durationMs}ms — imported=${result.imported}, next=${savedSkip}, complete=${isComplete}`);

    return NextResponse.json({
      status: "ok",
      batch: {
        skip,
        processed: result.processed,
        imported: result.imported,
        errors: result.errors,
      },
      progress: {
        nextSkip: savedSkip,
        totalInFeed,
        percentDone: totalInFeed > 0
          ? Math.round((nextSkip / totalInFeed) * 100)
          : 0,
        isComplete,
      },
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[cron-import] Fatal:", errMsg);

    // Try to log the error
    try {
      await db.importLog.create({
        data: {
          feedId: FEED_ID,
          currentSkip: 0,
          status: "error",
          message: errMsg.slice(0, 500),
        },
      });
    } catch {
      // ignore logging failures
    }

    return NextResponse.json(
      { error: "Import failed", message: errMsg },
      { status: 500 },
    );
  }
}
