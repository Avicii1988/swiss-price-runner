import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/proxy-image?url=https://...
 * Proxies product images to bypass referrer blocks (403).
 * Caches successful responses for 24h via Cache-Control.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(url);
    // Only allow HTTPS image URLs
    if (!decoded.startsWith("https://")) {
      return new NextResponse("Only HTTPS URLs allowed", { status: 400 });
    }

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
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Proxy": "preisalarm",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
