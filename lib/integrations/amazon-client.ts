import {
  BaseIntegrationClient,
  type ExternalPrice,
  type ExternalProduct,
  type IntegrationConfig,
} from "./base-client";

export class AmazonClient extends BaseIntegrationClient {
  constructor(config: IntegrationConfig) {
    super("amazon_de", config);
  }

  async fetchPrices(gtins: string[]): Promise<ExternalPrice[]> {
    // TODO: Implement Amazon Product Advertising API v5 integration
    // This is a scaffold – real implementation will use PA-API signed requests.
    const response = await this.rateLimitedFetch(
      `${this.config.baseUrl}/prices`,
      {
        method: "POST",
        body: JSON.stringify({ gtins }),
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      },
    );

    const data = await response.json();
    return (data.prices as unknown[]).map((p) => this.validatePrice(p));
  }

  async searchProducts(query: string): Promise<ExternalProduct[]> {
    const response = await this.rateLimitedFetch(
      `${this.config.baseUrl}/search?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${this.config.apiKey}` } },
    );

    const data = await response.json();
    return (data.products as unknown[]).map((p) => this.validateProduct(p));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.rateLimitedFetch(
        `${this.config.baseUrl}/health`,
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
