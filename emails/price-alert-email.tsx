import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from "@react-email/components";

interface PriceAlertEmailProps {
  productTitle: string;
  productImage: string;
  productGtin: string;
  currentPriceChf: string;
  targetPriceChf: string;
  bestSource: string;
  shopUrl: string;
  unsubscribeUrl: string;
}

export default function PriceAlertEmail({
  productTitle = "iPhone 15 Pro 256GB",
  productImage = "https://picsum.photos/seed/85/200/200",
  productGtin = "00194253715085",
  currentPriceChf = "1'019.42",
  targetPriceChf = "1'050.00",
  bestSource = "Amazon.de",
  shopUrl = "#",
  unsubscribeUrl = "#",
}: PriceAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Preisalarm: {productTitle} jetzt ab CHF {currentPriceChf}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>
              Preis<span style={{ color: "#dc2626" }}>Alarm</span>
            </Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={alertBadge}>Preisalarm ausgelöst</Text>
            <Heading style={heading}>
              Dein Wunschpreis wurde erreicht!
            </Heading>
            <Text style={subheading}>
              {productTitle} ist jetzt unter deinem Zielpreis von CHF{" "}
              {targetPriceChf} verfügbar.
            </Text>
          </Section>

          {/* Product card */}
          <Section style={productCard}>
            <Row>
              <Column style={imageCol}>
                <Img
                  src={productImage}
                  alt={productTitle}
                  width={120}
                  height={120}
                  style={productImg}
                />
              </Column>
              <Column style={detailCol}>
                <Text style={productName}>{productTitle}</Text>
                <Text style={priceLabel}>Aktueller Bestpreis</Text>
                <Text style={priceValue}>CHF {currentPriceChf}</Text>
                <Text style={sourceText}>via {bestSource} · inkl. Zoll + MwSt.</Text>
              </Column>
            </Row>
          </Section>

          {/* Price comparison */}
          <Section style={priceBox}>
            <Row>
              <Column align="center">
                <Text style={priceBoxLabel}>Dein Zielpreis</Text>
                <Text style={priceBoxTarget}>CHF {targetPriceChf}</Text>
              </Column>
              <Column align="center">
                <Text style={priceBoxLabel}>Aktueller Preis</Text>
                <Text style={priceBoxCurrent}>CHF {currentPriceChf}</Text>
              </Column>
            </Row>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={shopUrl}>
              Jetzt kaufen bei {bestSource}
            </Button>
            <Text style={ctaSubtext}>
              Oder{" "}
              <Link
                href={`https://swisspricerunner.ch/product/${productGtin}`}
                style={linkStyle}
              >
                alle Preise vergleichen
              </Link>
            </Text>
          </Section>

          {/* Trust bar */}
          <Section style={trustBar}>
            <Text style={trustText}>
              ✓ Preis inkl. Zoll &amp; CH-MwSt. berechnet · ✓ Tagesaktuell ·
              ✓ 3 Quellen verglichen
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Du erhältst diese E-Mail, weil du einen Preisalarm auf
              PreisAlarm eingerichtet hast.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Alarm deaktivieren
              </Link>{" "}
              ·{" "}
              <Link
                href="https://swisspricerunner.ch/impressum"
                style={unsubscribeLink}
              >
                Impressum
              </Link>{" "}
              ·{" "}
              <Link
                href="https://swisspricerunner.ch/privacy"
                style={unsubscribeLink}
              >
                Datenschutz
              </Link>
            </Text>
            <Text style={footerBrand}>
              PreisAlarm · Falknisstrasse 47 · 7304 Maienfeld · Schweiz
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  overflow: "hidden",
  marginTop: "24px",
  marginBottom: "24px",
};

const header: React.CSSProperties = {
  padding: "24px 32px 16px",
  borderBottom: "1px solid #f0f0f0",
};

const logo: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const heroSection: React.CSSProperties = {
  padding: "28px 32px 20px",
  textAlign: "center" as const,
};

const alertBadge: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#dcfce7",
  color: "#15803d",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  padding: "4px 12px",
  borderRadius: "9999px",
  margin: "0 0 12px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 8px",
  lineHeight: "1.3",
};

const subheading: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: 0,
  lineHeight: "1.5",
};

const productCard: React.CSSProperties = {
  padding: "0 32px 20px",
};

const imageCol: React.CSSProperties = {
  width: "120px",
  verticalAlign: "top",
};

const productImg: React.CSSProperties = {
  borderRadius: "12px",
  backgroundColor: "#f9fafb",
  objectFit: "contain" as const,
};

const detailCol: React.CSSProperties = {
  verticalAlign: "top",
  paddingLeft: "16px",
};

const productName: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 8px",
  lineHeight: "1.3",
};

const priceLabel: React.CSSProperties = {
  fontSize: "10px",
  color: "#9ca3af",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 2px",
};

const priceValue: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 4px",
  lineHeight: 1.1,
};

const sourceText: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  margin: 0,
};

const priceBox: React.CSSProperties = {
  margin: "0 32px 20px",
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  padding: "16px",
};

const priceBoxLabel: React.CSSProperties = {
  fontSize: "10px",
  color: "#9ca3af",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const priceBoxTarget: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#6b7280",
  margin: 0,
  textDecoration: "line-through",
};

const priceBoxCurrent: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#16a34a",
  margin: 0,
};

const ctaSection: React.CSSProperties = {
  padding: "0 32px 24px",
  textAlign: "center" as const,
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#dc2626",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  padding: "14px 32px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "inline-block",
};

const ctaSubtext: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "12px",
};

const linkStyle: React.CSSProperties = {
  color: "#dc2626",
  textDecoration: "underline",
};

const trustBar: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "12px 32px",
};

const trustText: React.CSSProperties = {
  fontSize: "10px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: "#f0f0f0",
  margin: 0,
};

const footer: React.CSSProperties = {
  padding: "20px 32px",
};

const footerText: React.CSSProperties = {
  fontSize: "11px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "0 0 8px",
  lineHeight: "1.5",
};

const unsubscribeLink: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};

const footerBrand: React.CSSProperties = {
  fontSize: "10px",
  color: "#d1d5db",
  textAlign: "center" as const,
  margin: "8px 0 0",
};
