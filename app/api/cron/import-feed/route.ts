import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 200;
const FEED_ID = "xxl_parfum";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Check Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  // Check ?secret= query param (for browser use)
  const urlSecret = req.nextUrl.searchParams.get("secret");
  if (urlSecret === secret) return true;
  return false;
}

function wantsBrowserUI(req: NextRequest): boolean {
  const accept = req.headers.get("accept") || "";
  return accept.includes("text/html");
}

/** Core import logic — used by both GET and POST */
async function runImportBatch(req: NextRequest) {
  const startMs = Date.now();

  // 1. Get current skip
  const lastLog = await db.importLog.findFirst({
    where: { feedId: FEED_ID, status: { in: ["completed", "cycle_complete"] } },
    orderBy: { createdAt: "desc" },
    select: { currentSkip: true, totalItems: true },
  });

  const skip = lastLog?.currentSkip ?? 0;
  const knownTotal = lastLog?.totalItems ?? 0;

  // 2. Call import endpoint
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
        imported: 0, errors: 0, status: "error",
        message: result.error || result.message || `HTTP ${importRes.status}`,
      },
    });
    return {
      ok: false, skip, imported: 0, errors: 0,
      total: knownTotal, nextSkip: skip, percent: 0,
      isComplete: false, message: result.error || "Import failed",
      durationMs: Date.now() - startMs,
    };
  }

  // 3. Next skip
  const totalInFeed = result.totalInFeed ?? 0;
  const nextSkip = result.nextSkip ?? skip + BATCH_SIZE;
  const isComplete = nextSkip >= totalInFeed || result.processed === 0;
  const savedSkip = isComplete ? 0 : nextSkip;
  const percent = totalInFeed > 0 ? Math.round((nextSkip / totalInFeed) * 100) : 0;
  const batchNum = Math.ceil(nextSkip / BATCH_SIZE);
  const totalBatches = Math.ceil(totalInFeed / BATCH_SIZE);

  // 4. Log
  await db.importLog.create({
    data: {
      feedId: FEED_ID, currentSkip: savedSkip, totalItems: totalInFeed,
      imported: result.imported ?? 0, errors: result.errors ?? 0,
      status: isComplete ? "cycle_complete" : "completed",
      message: isComplete
        ? `Zyklus fertig. ${totalInFeed} Produkte. Reset auf 0.`
        : `Batch ${batchNum}/${totalBatches}: skip=${skip}→${nextSkip}, ${result.imported} importiert.`,
    },
  });

  return {
    ok: true, skip, imported: result.imported ?? 0, errors: result.errors ?? 0,
    total: totalInFeed, nextSkip: savedSkip, percent,
    isComplete, batchNum, totalBatches,
    message: isComplete ? "Import komplett!" : `Batch ${batchNum}/${totalBatches}`,
    durationMs: Date.now() - startMs,
  };
}

// ── GET & POST handlers ──────────────────────────────────────

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check for stop flag
  const stopParam = req.nextUrl.searchParams.get("stop");
  if (stopParam === "1") {
    const html = renderHtml({
      ok: true, skip: 0, imported: 0, errors: 0, total: 0,
      nextSkip: 0, percent: 0, isComplete: false, batchNum: 0,
      totalBatches: 0, message: "Import gestoppt.", durationMs: 0,
    }, req.nextUrl.searchParams.get("secret") || "", true);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  try {
    const result = await runImportBatch(req);
    const secret = req.nextUrl.searchParams.get("secret") || "";

    if (wantsBrowserUI(req)) {
      const html = renderHtml(result, secret, false);
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    try {
      await db.importLog.create({
        data: { feedId: FEED_ID, currentSkip: 0, status: "error", message: errMsg.slice(0, 500) },
      });
    } catch { /* ignore */ }

    if (wantsBrowserUI(req)) {
      const html = renderHtml({
        ok: false, skip: 0, imported: 0, errors: 0, total: 0,
        nextSkip: 0, percent: 0, isComplete: false,
        message: errMsg, durationMs: 0,
      }, req.nextUrl.searchParams.get("secret") || "", false);
      return new NextResponse(html, { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return NextResponse.json({ error: "Import failed", message: errMsg }, { status: 500 });
  }
}

// ── HTML Dashboard ───────────────────────────────────────────

function renderHtml(r: Record<string, unknown>, secret: string, stopped: boolean): string {
  const percent = Number(r.percent || 0);
  const isComplete = Boolean(r.isComplete);
  const autoRefresh = !stopped && !isComplete && r.ok !== false;
  const secretParam = secret ? `?secret=${encodeURIComponent(secret)}` : "";
  const stopUrl = `/api/cron/import-feed${secretParam}${secret ? "&" : "?"}stop=1`;
  const continueUrl = `/api/cron/import-feed${secretParam}`;

  const barColor = r.ok === false ? "#ef4444" : isComplete ? "#22c55e" : "#D81E05";
  const statusEmoji = r.ok === false ? "&#10060;" : isComplete ? "&#9989;" : "&#9203;";
  const statusText = r.ok === false ? "Fehler" : isComplete ? "Komplett" : stopped ? "Gestoppt" : "L&auml;uft...";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PreisAlarm — Feed Import</title>
  ${autoRefresh ? `<meta http-equiv="refresh" content="10;url=${continueUrl}">` : ""}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; background: #0c0c0c; color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1a1a1a; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; margin: 16px; }
    .logo { font-size: 20px; font-weight: 900; margin-bottom: 24px; }
    .logo span { color: #D81E05; }
    .status { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
    .bar-bg { background: #2a2a2a; border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 8px; }
    .bar-fill { height: 100%; border-radius: 8px; transition: width 0.5s; background: ${barColor}; }
    .percent { text-align: right; font-size: 13px; color: #9ca3af; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .stat { background: #222; border-radius: 10px; padding: 12px; }
    .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 4px; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .msg { background: #222; border-radius: 10px; padding: 12px; font-size: 13px; color: #9ca3af; margin-bottom: 20px; word-break: break-all; }
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; display: block; text-align: center; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; }
    .btn-red { background: #D81E05; color: white; }
    .btn-red:hover { background: #b91a04; }
    .btn-gray { background: #333; color: #ccc; }
    .btn-gray:hover { background: #444; }
    .timer { text-align: center; margin-top: 16px; font-size: 12px; color: #6b7280; }
    .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #444; border-top-color: #D81E05; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Preis<span>Alarm</span> — Feed Import</div>

    <div class="status">${statusEmoji} ${statusText}</div>

    <div class="bar-bg"><div class="bar-fill" style="width: ${percent}%"></div></div>
    <div class="percent">${percent}%${r.batchNum ? ` &mdash; Batch ${r.batchNum}/${r.totalBatches}` : ""}</div>

    <div class="grid">
      <div class="stat"><div class="stat-label">Importiert</div><div class="stat-value">${r.imported}</div></div>
      <div class="stat"><div class="stat-label">Fehler</div><div class="stat-value">${r.errors}</div></div>
      <div class="stat"><div class="stat-label">Total im Feed</div><div class="stat-value">${r.total ? Number(r.total).toLocaleString("de-CH") : "—"}</div></div>
      <div class="stat"><div class="stat-label">Dauer</div><div class="stat-value">${r.durationMs ? (Number(r.durationMs) / 1000).toFixed(1) + "s" : "—"}</div></div>
    </div>

    <div class="msg">${r.message || "—"}</div>

    <div class="actions">
      ${autoRefresh
        ? `<a href="${stopUrl}" class="btn btn-gray">&#9724; Stop</a>`
        : `<a href="${continueUrl}" class="btn btn-red">&#9654; ${isComplete ? "Neuer Zyklus" : "Weiter"}</a>`
      }
    </div>

    ${autoRefresh ? `<div class="timer"><span class="spinner"></span> N&auml;chster Batch in <span id="cd">10</span>s...</div>
    <script>let s=10;setInterval(()=>{s--;if(s>=0)document.getElementById("cd").textContent=s;},1000);</script>` : ""}
  </div>
</body>
</html>`;
}
