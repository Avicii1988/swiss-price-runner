import { Resend } from "resend";
import PriceAlertEmail from "@/emails/price-alert-email";

// Lazy init — Resend throws if API key is missing at construction time
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return _resend;
}

interface SendAlertParams {
  to: string;
  productTitle: string;
  productImage: string;
  productGtin: string;
  currentPriceChf: number;
  targetPriceChf: number;
  bestSource: string;
  shopUrl: string;
  alertId: string;
}

export async function sendPriceAlertEmail(params: SendAlertParams) {
  const from = process.env.RESEND_FROM_EMAIL ?? "alerts@swisspricerunner.ch";

  const { data, error } = await getResend().emails.send({
    from: `SwissPriceRunner <${from}>`,
    to: params.to,
    subject: `Preisalarm: ${params.productTitle} jetzt ab CHF ${params.currentPriceChf.toFixed(2)}`,
    react: PriceAlertEmail({
      productTitle: params.productTitle,
      productImage: params.productImage,
      productGtin: params.productGtin,
      currentPriceChf: formatChf(params.currentPriceChf),
      targetPriceChf: formatChf(params.targetPriceChf),
      bestSource: params.bestSource,
      shopUrl: params.shopUrl,
      unsubscribeUrl: `https://swisspricerunner.ch/api/alerts/unsubscribe?id=${params.alertId}`,
    }),
  });

  if (error) {
    console.error("[send-alert] Resend error:", error);
    throw error;
  }

  return data;
}

function formatChf(value: number): string {
  return value.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
