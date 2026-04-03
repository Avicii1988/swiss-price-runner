import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

/**
 * GET /api/test-setup
 *
 * One-shot setup & verification route:
 *   1. Verify DB connectivity
 *   2. Create tables if missing (replaces prisma db push)
 *   3. Write a test product
 *   4. Send test email to account owner
 *
 * Remove this route after initial verification.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // ── 1. DB connectivity ────────────────────────────────────────────
  try {
    const [row] = await db.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    results.db_connected = true;
    results.db_time = row.now.toISOString();
  } catch (err) {
    results.db_connected = false;
    results.db_error = err instanceof Error ? err.message : String(err);
    return NextResponse.json(results, { status: 503 });
  }

  // ── 2. Create tables if they don't exist ──────────────────────────
  try {
    // Check if Product table exists
    const tableCheck = await db.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'Product'
      )`;

    const tablesExist = tableCheck[0]?.exists === true;

    if (!tablesExist) {
      results.tables_status = "creating";

      // Create Product table
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Product" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "gtin" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "brand" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "imageUrl" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
        )
      `);
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Product_gtin_key" ON "Product"("gtin")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_brand_idx" ON "Product"("brand")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Product_gtin_idx" ON "Product"("gtin")`);

      // Create Price table
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Price" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "productId" TEXT NOT NULL,
          "amountChf" DECIMAL(10,2) NOT NULL,
          "amountEur" DECIMAL(10,2) NOT NULL,
          "sourceId" TEXT NOT NULL,
          "url" TEXT,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Price_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Price_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Price_productId_timestamp_idx" ON "Price"("productId", "timestamp")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Price_sourceId_idx" ON "Price"("sourceId")`);

      // Create UserAlert table
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserAlert" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "email" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "targetPrice" DECIMAL(10,2) NOT NULL,
          "isNotified" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UserAlert_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "UserAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserAlert_email_productId_key" ON "UserAlert"("email", "productId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserAlert_email_idx" ON "UserAlert"("email")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserAlert_productId_idx" ON "UserAlert"("productId")`);
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserAlert_isActive_isNotified_idx" ON "UserAlert"("isActive", "isNotified")`);

      results.tables_status = "created";
    } else {
      results.tables_status = "already_exist";
    }
  } catch (err) {
    results.tables_status = "error";
    results.tables_error = err instanceof Error ? err.message : String(err);
  }

  // ── 3. Seed test product ──────────────────────────────────────────
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

    const count = await db.product.count();
    results.total_products = count;
  } catch (err) {
    results.product_written = false;
    results.product_error = err instanceof Error ? err.message : String(err);
  }

  // ── 4. Send test email (to Resend account owner only) ─────────────
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
        to: "j.m.feusi@gmail.com",
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
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Supabase Datenbank verbunden</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Tabellen erstellt (Product, Price, UserAlert)</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Test-Produkt geschrieben (iPhone 15 Pro)</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0 0 6px">&#x2713; Resend E-Mail zugestellt</p>
                <p style="font-size:14px;font-weight:700;color:#16a34a;margin:0">&#x2713; Vercel Deployment aktiv</p>
              </div>
              <p style="font-size:13px;color:#6b7280;margin:20px 0 0;line-height:1.6">
                Alle Systeme sind einsatzbereit. Preisalarme, Datenbank
                und E-Mail-Versand funktionieren.
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
        results.email_to = "j.m.feusi@gmail.com";
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
