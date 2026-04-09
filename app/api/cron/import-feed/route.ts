import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const BATCH_SIZE = 40;
const FEED_ID = "xxl_parfum";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const urlSecret = req.nextUrl.searchParams.get("secret");
  if (urlSecret === secret) return true;
  return false;
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startMs = Date.now();

  try {
    const lastLog = await db.importLog.findFirst({
      where: { feedId: FEED_ID, status: { in: ["completed", "cycle_complete"] } },
      orderBy: { createdAt: "desc" },
      select: { currentSkip: true, totalItems: true },
    });

    const skip = lastLog?.currentSkip ?? 0;
    const knownTotal = lastLog?.totalItems ?? 0;

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
      await db.importLog.create({
        data: {
          feedId: FEED_ID, currentSkip: skip, totalItems: knownTotal,
          status: "error", message: result.error || result.message || `HTTP ${importRes.status}`,
        },
      }).catch(() => {});

      return NextResponse.json({
        ok: false, skip, imported: 0, errors: 0,
        total: knownTotal, nextSkip: skip, percent: 0,
        isComplete: false, message: result.error || "Import failed",
        durationMs: Date.now() - startMs,
      });
    }

    const totalInFeed = result.totalInFeed ?? 0;
    const nextSkip = result.nextSkip ?? skip + BATCH_SIZE;
    const isComplete = nextSkip >= totalInFeed || result.processed === 0;
    const savedSkip = isComplete ? 0 : nextSkip;
    const percent = totalInFeed > 0 ? Math.round((nextSkip / totalInFeed) * 100) : 0;
    const batchNum = Math.ceil(nextSkip / BATCH_SIZE);
    const totalBatches = Math.ceil(totalInFeed / BATCH_SIZE);

    await db.importLog.create({
      data: {
        feedId: FEED_ID, currentSkip: savedSkip, totalItems: totalInFeed,
        imported: result.imported ?? 0, errors: result.errors ?? 0,
        status: isComplete ? "cycle_complete" : "completed",
        message: isComplete
          ? `Zyklus fertig. ${totalInFeed} Produkte.`
          : `Batch ${batchNum}/${totalBatches}: ${result.imported} importiert.`,
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true, skip, imported: result.imported ?? 0, errors: result.errors ?? 0,
      total: totalInFeed, nextSkip: savedSkip, percent,
      isComplete, batchNum, totalBatches,
      message: isComplete ? "Import komplett!" : `Batch ${batchNum}/${totalBatches}`,
      durationMs: Date.now() - startMs,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.importLog.create({
      data: { feedId: FEED_ID, status: "error", message: msg.slice(0, 500) },
    }).catch(() => {});
    return NextResponse.json({
      ok: false, skip: 0, imported: 0, errors: 0, total: 0,
      nextSkip: 0, percent: 0, isComplete: false,
      message: msg, durationMs: Date.now() - startMs,
    });
  }
}
