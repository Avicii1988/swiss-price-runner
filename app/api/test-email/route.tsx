import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * GET /api/test-email
 *
 * Temporary test route to verify Resend + React Email integration.
 * Sends a styled welcome email to a hardcoded address.
 *
 * Usage: curl https://swiss-price-runner.vercel.app/api/test-email
 * Remove this route before going to production.
 */
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  try {
    const { data, error } = await resend.emails.send({
      from: `SwissPriceRunner <${from}>`,
      to: "jan.feusi@gmx.ch",
      subject: "SwissPriceRunner – E-Mail-System aktiv",
      react: WelcomeEmail(),
    });

    if (error) {
      console.error("[test-email] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "ok",
      message: "Test-E-Mail erfolgreich gesendet an jan.feusi@gmx.ch",
      emailId: data?.id,
    });
  } catch (err) {
    console.error("[test-email] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Inline welcome email template
// ---------------------------------------------------------------------------

function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Preview>SwissPriceRunner E-Mail-System ist aktiv</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "system-ui, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "480px", margin: "24px auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden" }}>
          <Section style={{ padding: "32px", textAlign: "center" as const }}>
            <Text style={{ fontSize: "20px", fontWeight: 800, color: "#111", margin: "0 0 4px" }}>
              Swiss<span style={{ color: "#dc2626" }}>Price</span>Runner
            </Text>
            <Text style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px" }}>
              E-Mail-System Test
            </Text>
          </Section>

          <Hr style={{ borderColor: "#f0f0f0", margin: 0 }} />

          <Section style={{ padding: "32px" }}>
            <Heading style={{ fontSize: "22px", fontWeight: 800, color: "#111", margin: "0 0 12px" }}>
              Verbindung erfolgreich!
            </Heading>
            <Text style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.6", margin: "0 0 20px" }}>
              Hallo Jan, diese E-Mail bestätigt, dass das Resend-E-Mail-System
              von SwissPriceRunner korrekt konfiguriert ist und Nachrichten
              erfolgreich zugestellt werden.
            </Text>

            <Section style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "20px", textAlign: "center" as const }}>
              <Text style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.5px", margin: "0 0 8px" }}>
                System-Status
              </Text>
              <Text style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", margin: 0 }}>
                ✓ Resend API verbunden
              </Text>
              <Text style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", margin: "4px 0 0" }}>
                ✓ React Email Template aktiv
              </Text>
              <Text style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", margin: "4px 0 0" }}>
                ✓ Zustellung funktioniert
              </Text>
            </Section>

            <Text style={{ fontSize: "13px", color: "#9ca3af", marginTop: "20px", textAlign: "center" as const }}>
              Nächster Schritt: Preisalarme werden automatisch über diesen
              Kanal versendet, sobald Nutzer sie einrichten.
            </Text>
          </Section>

          <Hr style={{ borderColor: "#f0f0f0", margin: 0 }} />

          <Section style={{ padding: "16px 32px", textAlign: "center" as const }}>
            <Text style={{ fontSize: "10px", color: "#d1d5db", margin: 0 }}>
              SwissPriceRunner · Musterstrasse 42 · 8001 Zürich · Schweiz
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
