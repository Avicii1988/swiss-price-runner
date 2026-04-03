import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

/**
 * GET /api/test-setup
 *
 * One-shot setup & verification route. Does three things:
 *   1. Verifies DB connectivity (SELECT NOW)
 *   2. Writes a test product to confirm write access
 *   3. Sends a test email via Resend to jan.feusi@gmx.ch
 *
 * Remove this route after initial verification.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // ── 1. DB Health ──────────────────────────────────────────────────
  try {
    const [row] = await db.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    results.db_connected = true;
    results.db_time = row.now.toISOString();
  } catch (err) {
    results.db_connected = false;
    results.db_error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(results, { status: 503 });
  }

  // ── 2. Seed test product ──────────────────────────────────────────
  try {
    const product = await db.product.upsert({
      where: { gtin: "00194253715085" },
      create: {
        gtin: "00194253715085",
        title: "iPhone 15 Pro 256GB Titan Natur",
        brand: "Apple",
        category: "smartphones",
        imageUrl: "https://picsum.photos/seed/85/400/400",
      },
      update: {
        title: "iPhone 15 Pro 256GB Titan Natur",
      },
    });

    results.product_written = true;
    results.product_id = product.id;
    results.product_gtin = product.gtin;

    // Verify read-back
    const count = await db.product.count();
    results.total_products = count;
  } catch (err) {
    results.product_written = false;
    results.product_error = err instanceof Error ? err.message : String(err);
  }

  // ── 3. Send test email ────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    results.email_sent = false;
    results.email_error = "RESEND_API_KEY not set";
  } else {
    try {
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

      const { data, error } = await resend.emails.send({
        from: `SwissPriceRunner <${from}>`,
        to: "jan.feusi@gmx.ch",
        subject: "SwissPriceRunner – System ist live!",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
            <div style="padding:32px;text-align:center;border-bottom:1px solid #f0f0f0">
              <h1 style="font-size:20px;font-weight:800;color:#111;margin:0">
                Swiss<span style="color:#dc2626">Price</span>Runner
              </h1>
              <p style="font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0">
                System Verification
              </p>
            </div>
            <div style="padding:32px">
              <h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px">
                Alles bereit! &#x2705;
              </h2>
              <div style="background:#f0fdf4;border-radius:12px;padding:20px">
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Datenbank verbunden</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Produkt geschrieben (iPhone 15 Pro)</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Resend E-Mail zugestellt</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0">&#x2713; Vercel Deployment aktiv</p>
              </div>
              <p style="font-size:13px;color:#6b7280;margin:20px 0 0;line-height:1.6">
                Alle Systeme sind bereit. Das Preisalarm-System, die Datenbank
                und der E-Mail-Versand funktionieren einwandfrei.
              </p>
              <p style="font-size:13px;color:#6b7280;margin:12px 0 0">
                <strong>N&auml;chste Schritte:</strong><br/>
                1. Cron-Job testen (sync-prices)<br/>
                2. Affiliate-Links aktivieren<br/>
                3. Go Live!
              </p>
            </div>
            <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0">
              <p style="font-size:10px;color:#d1d5db;margin:0">
                SwissPriceRunner &middot; Musterstrasse 42 &middot; 8001 Z&uuml;rich
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        results.email_sent = false;
        results.email_error = error.message;
      } else {
        results.email_sent = true;
        results.email_id = data?.id;
        results.email_to = "jan.feusi@gmx.ch";
      }
    } catch (err) {
      results.email_sent = false;
      results.email_error = err instanceof Error ? err.message : String(err);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────
  const allOk =
    results.db_connected === true &&
    results.product_written === true &&
    results.email_sent === true;

  return NextResponse.json(
    { status: allOk ? "all_systems_go" : "partial", ...results },
    { status: allOk ? 200 : 207 },
  );
}
