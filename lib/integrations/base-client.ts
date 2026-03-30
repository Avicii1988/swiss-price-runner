import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared schemas for normalised product/price data coming from any source
// ---------------------------------------------------------------------------

export const ExternalProductSchema = z.object({
  gtin: z.string().min(8).max(14),
  title: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export const ExternalPriceSchema = z.object({
  gtin: z.string().min(8).max(14),
  amountEur: z.number().positive(),
  url: z.string().url().optional(),
  availableInCh: z.boolean().optional().default(false),
});

export type ExternalProduct = z.infer<typeof ExternalProductSchema>;
export type ExternalPrice = z.infer<typeof ExternalPriceSchema>;

// ---------------------------------------------------------------------------
// Abstract base client – every integration must implement this interface
// ---------------------------------------------------------------------------

export interface IntegrationConfig {
  apiKey: string;
  baseUrl: string;
  rateLimitPerMinute: number;
}

export abstract class BaseIntegrationClient {
  protected config: IntegrationConfig;
  protected sourceId: string;

  constructor(sourceId: string, config: IntegrationConfig) {
    this.sourceId = sourceId;
    this.config = config;
  }

  /** Fetch current prices for a list of GTINs. */
  abstract fetchPrices(gtins: string[]): Promise<ExternalPrice[]>;

  /** Search products by keyword (used for catalogue expansion). */
  abstract searchProducts(query: string): Promise<ExternalProduct[]>;

  /** Health check – verifies the API key and connectivity. */
  abstract healthCheck(): Promise<boolean>;

  // -- Shared helpers -------------------------------------------------------

  /**
   * Validate and parse a raw price payload using Zod.
   * Throws on invalid data so callers can handle upstream errors cleanly.
   */
  protected validatePrice(raw: unknown): ExternalPrice {
    return ExternalPriceSchema.parse(raw);
  }

  protected validateProduct(raw: unknown): ExternalProduct {
    return ExternalProductSchema.parse(raw);
  }

  /**
   * Simple rate-limit-aware fetch wrapper.
   * Production implementations should use a proper queue / token bucket.
   */
  protected async rateLimitedFetch(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.rateLimitedFetch(url, init);
    }

    return response;
  }
}
