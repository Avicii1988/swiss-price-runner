import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants – Swiss customs & tax parameters
// ---------------------------------------------------------------------------

/** German VAT rate (Mehrwertsteuer) */
const DE_VAT_RATE = 0.19;

/** Swiss VAT rate (standard, as of 2024) */
const CH_VAT_RATE = 0.081;

/** Reduced Swiss VAT rate (food, medicine, books) */
const CH_VAT_RATE_REDUCED = 0.026;

/**
 * Customs clearance fee ranges (CHF).
 * "Vollverzollung" = full customs declaration, "vereinfacht" = simplified.
 */
const CUSTOMS_FEES = {
  vollverzollung: { base: 18, perKg: 0.5 },
  vereinfacht: { flat: 11.5 },
} as const;

/** Threshold below which no customs duty is charged (CHF) */
const DUTY_FREE_THRESHOLD_CHF = 65;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const PriceInputSchema = z.object({
  amountEur: z.number().min(0),
  exchangeRate: z.number().positive(),
  weightKg: z.number().nonnegative().optional().default(0),
  category: z.enum(["standard", "reduced"]).optional().default("standard"),
  clearanceType: z
    .enum(["vollverzollung", "vereinfacht"])
    .optional()
    .default("vereinfacht"),
});

export type PriceInput = z.input<typeof PriceInputSchema>;

export interface PriceBreakdown {
  originalEur: number;
  netEur: number;
  netChf: number;
  chVat: number;
  customsFee: number;
  totalChf: number;
  exchangeRate: number;
  savings: number;
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the landed cost in CHF for a product purchased in the EU.
 *
 * Steps:
 *  1. Remove German VAT from the gross EUR price.
 *  2. Convert net EUR → CHF using the provided exchange rate.
 *  3. Add Swiss VAT (standard or reduced).
 *  4. Add customs clearance fee (Vollverzollung or vereinfacht).
 *  5. Compute total landed cost.
 */
export function calculateSwissPrice(input: PriceInput): PriceBreakdown {
  const parsed = PriceInputSchema.parse(input);

  // Short-circuit: amountEur=0 means no price available
  if (parsed.amountEur === 0) {
    return {
      originalEur: 0, netEur: 0, netChf: 0, chVat: 0,
      customsFee: 0, totalChf: 0, exchangeRate: parsed.exchangeRate, savings: 0,
    };
  }

  // 1. Strip German VAT
  const netEur = parsed.amountEur / (1 + DE_VAT_RATE);

  // 2. Convert to CHF
  const netChf = netEur * parsed.exchangeRate;

  // 3. Swiss VAT
  const vatRate =
    parsed.category === "reduced" ? CH_VAT_RATE_REDUCED : CH_VAT_RATE;
  const chVat = netChf * vatRate;

  // 4. Customs fee
  let customsFee = 0;
  if (netChf > DUTY_FREE_THRESHOLD_CHF) {
    if (parsed.clearanceType === "vollverzollung") {
      customsFee =
        CUSTOMS_FEES.vollverzollung.base +
        CUSTOMS_FEES.vollverzollung.perKg * parsed.weightKg;
    } else {
      customsFee = CUSTOMS_FEES.vereinfacht.flat;
    }
  }

  // 5. Total
  const totalChf = netChf + chVat + customsFee;

  // Savings vs. simply converting gross EUR → CHF (naïve comparison)
  const naiveChf = parsed.amountEur * parsed.exchangeRate;
  const savings = naiveChf - totalChf;

  return {
    originalEur: parsed.amountEur,
    netEur: round(netEur),
    netChf: round(netChf),
    chVat: round(chVat),
    customsFee: round(customsFee),
    totalChf: round(totalChf),
    exchangeRate: parsed.exchangeRate,
    savings: round(savings),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Bulk-calculate Swiss prices for multiple products.
 */
export function calculateBatch(
  items: PriceInput[],
): PriceBreakdown[] {
  return items.map(calculateSwissPrice);
}

// ---------------------------------------------------------------------------
// Swiss-shop pricing (XXL Parfum, Ackermann, Parfumsale, etc.)
//
// These feeds already deliver the final gross CHF price — no DE-VAT removal,
// no EUR round-trip, no customs. The old `calculateSwissPrice` pipeline
// double-taxed them. Use `buildSwissShopBreakdown` instead.
// ---------------------------------------------------------------------------

export interface SwissShopPriceInput {
  /** Price as declared by the feed, in CHF. */
  grossChf: number;
  /** If true, `grossChf` is actually a NET price — we add 8.1% VAT. */
  priceIsNet?: boolean;
  /** Shipping cost to CH, in CHF. NULL = unknown; 0 = free; >0 = paid. */
  shippingChf?: number | null;
  /** Reduced VAT (food/medicine/books) if the product qualifies. */
  vatRate?: "standard" | "reduced";
}

/**
 * Build a PriceBreakdown for a Swiss-shop product.
 *
 * - Display price = gross CHF (+ shipping if the feed lists a non-zero value).
 * - If `priceIsNet=true` we add CH-VAT to honour the NET → GROSS contract.
 * - No customs fee (intra-CH), no EUR round-trip.
 *
 * The resulting `PriceBreakdown` keeps the same shape as the DE-import path
 * so the UI doesn't need two code paths.
 */
export function buildSwissShopBreakdown(input: SwissShopPriceInput): PriceBreakdown {
  const grossInput = input.grossChf;
  if (grossInput <= 0) {
    return {
      originalEur: 0, netEur: 0, netChf: 0, chVat: 0,
      customsFee: 0, totalChf: 0, exchangeRate: 1, savings: 0,
    };
  }

  const vatRate = input.vatRate === "reduced" ? CH_VAT_RATE_REDUCED : CH_VAT_RATE;
  let netChf: number;
  let chVat: number;
  let grossChf: number;

  if (input.priceIsNet) {
    // Feed declared NET → add VAT to get the GROSS the user actually pays.
    netChf = grossInput;
    chVat = netChf * vatRate;
    grossChf = netChf + chVat;
  } else {
    // Feed is already GROSS → derive the embedded VAT for the breakdown.
    grossChf = grossInput;
    netChf = grossChf / (1 + vatRate);
    chVat = grossChf - netChf;
  }

  const shipping = Math.max(0, input.shippingChf ?? 0);
  const totalChf = grossChf + shipping;

  return {
    originalEur: 0,
    netEur: 0,
    netChf: round(netChf),
    chVat: round(chVat),
    customsFee: 0,
    totalChf: round(totalChf),
    exchangeRate: 1,
    savings: 0,
  };
}

/**
 * Shipping-state helper — maps the nullable `shippingCostChf` field to a
 * UI-ready discriminated union. Keep this in the calculator so the rule
 * lives in one place (import, PDP card, shelf card all agree).
 */
export type ShippingState =
  | { kind: "included"; chf: 0 }
  | { kind: "paid"; chf: number }
  | { kind: "unknown" };

export function classifyShipping(chf: number | null | undefined): ShippingState {
  if (chf === null || chf === undefined) return { kind: "unknown" };
  if (chf <= 0) return { kind: "included", chf: 0 };
  return { kind: "paid", chf: round(chf) };
}
