import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { z } from "zod";
import { db } from "@/lib/db";


// ---------------------------------------------------------------------------
// Zod schema — strict validation for email + price input
// ---------------------------------------------------------------------------

const SubscribeSchema = z.object({
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(255)
    .transform((e) => e.toLowerCase().trim()),
  productId: z.string().min(1, "Produkt-ID fehlt"),
  gtin: z.string().min(8).max(14),
  targetPrice: z
    .number()
    .positive("Zielpreis muss positiv sein")
    .max(100_000, "Zielpreis zu hoch"),
});

// ---------------------------------------------------------------------------
// POST /api/alerts/subscribe
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, productId, targetPrice } = parsed.data;

    // Upsert: if same email+product exists, update the target price
    const alert = await db.userAlert.upsert({
      where: { email_productId: { email, productId } },
      create: {
        email,
        productId,
        targetPrice,
        isNotified: false,
        isActive: true,
      },
      update: {
        targetPrice,
        isNotified: false, // reset notification flag on price change
        isActive: true,
      },
    });

    return NextResponse.json({
      status: "ok",
      alertId: alert.id,
      message: "Preisalarm aktiviert",
    });
  } catch (error) {
    console.error("[subscribe] Error:", error);
    return NextResponse.json(
      { error: "Interner Fehler" },
      { status: 500 },
    );
  }
}
