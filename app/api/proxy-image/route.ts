import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ── Known bot / crawler User-Agent substrings ─────────────────────
// Block immediately before any I/O — these clients have no legitimate
// need to proxy product images.
const BLOCKED_UA_PATTERNS = [
  "claudebot", "claude-web", "anthropic-ai",
  "gptbot", "chatgpt-user", "oai-searchbot",
  "google-extended", "gemini-ai",
  "perplexitybot", "youbot", "cohere-ai",
  "bytespider",
  "ahrefsbot", "semrushbot", "dotbot", "mj12bot", "petalbot",
  "scrapy", "python-requests", "curl/", "wget/",
  "go-http-client", "java/", "okhttp",
];

// ── Per-instance in-memory rate limiter ──────────────────────────
// Vercel spins up multiple function instances; each instance tracks
// its own window. This doesn't give a global cap, but it does prevent
// a single bot from exhausting ANY individual warm instance.
const RATE_WINDOW_MS  = 60_000; // 1 minute
const RATE_MAX        = 20;     // requests per window per IP

interface RateEntry { count: number; windowStart: number; }
const rateMap = new Map<string, RateEntry>();

// Prune stale entries every ~5 minutes to avoid unbounded growth.
let lastPrune = Date.now();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Prune entries older than one window
  if (now - lastPrune > 5 * 60_000) {
    for (const [key, entry] of rateMap) {
      if (now - entry.windowStart > RATE_WINDOW_MS) rateMap.delete(key);
    }
    lastPrune = now;
  }

  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return true; // allow
  }
  entry.count++;
  return entry.count <= RATE_MAX;
}

/**
 * GET /api/proxy-image?url=https://...
 * Proxies product images to bypass referrer blocks (403).
 * Caches successful responses for 1 year via Cache-Control.
 *
 * Protection layers:
 *   1. Bot UA block  — instant 403 for known crawlers
 *   2. Rate limit    — 20 req/min per IP per instance → 429
 *   3. HTTPS-only    — rejects non-HTTPS URLs
 *   4. X-Robots-Tag  — tells crawlers not to index this endpoint
 */
export async function GET(req: NextRequest) {
  // ── 1. Bot User-Agent block ────────────────────────────────────
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  if (BLOCKED_UA_PATTERNS.some((pat) => ua.includes(pat))) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  // ── 2. Per-IP rate limiting ────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // ── 3. URL validation ──────────────────────────────────────────
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return new NextResponse("Invalid url encoding", { status: 400 });
  }

  if (!decoded.startsWith("https://")) {
    return new NextResponse("Only HTTPS URLs allowed", { status: 400 });
  }

  // ── 4. Proxy the image ─────────────────────────────────────────
  try {
    const res = await fetch(decoded, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PreisAlarm/1.0)",
        "Accept": "image/*",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        // 1-year immutable cache — images don't change once fetched.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "X-Proxy": "preisalarm",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
