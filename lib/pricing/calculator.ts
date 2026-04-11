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
