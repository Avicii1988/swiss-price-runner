import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Timing-safe secret comparison for admin/cron routes.
 * Checks Authorization header first, then query param as fallback.
 */
export function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Prefer Authorization header (doesn't appear in logs/URLs)
  const authHeader = req.headers.get("authorization");
  if (authHeader && safeCompare(authHeader, `Bearer ${secret}`)) return true;

  // Fallback: query param (for browser-based admin access)
  const paramSecret = req.nextUrl.searchParams.get("secret");
  if (paramSecret && safeCompare(paramSecret, secret)) return true;

  return false;
}

/** Constant-time string comparison to prevent timing attacks. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to keep timing constant
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ── Simple in-memory rate limiter ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter: max `limit` requests per `windowMs` per IP.
 * Returns true if the request should be allowed.
 */
export function rateLimit(req: NextRequest, limit = 30, windowMs = 60_000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

/** Sanitize an error for client response — never expose internals. */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Log full error server-side
    console.error("[API Error]", error.message);
  }
  return "Ein interner Fehler ist aufgetreten.";
}
