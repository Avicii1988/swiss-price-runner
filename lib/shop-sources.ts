/**
 * Shop source mapping — logos, colors, names, domains.
 * Keyed by sourceId (used in Price.sourceId column).
 *
 * Each shop now carries a canonical `domain` so the UI can fetch an
 * official logo via `https://logo.clearbit.com/<domain>`. The wordmark
 * stays as a deterministic text fallback for when Clearbit 404s or is
 * blocked by the client (ad-blockers, offline mode, CI snapshots).
 */

export interface ShopSource {
  id: string;
  name: string;
  color: string;
  /** Shop homepage domain — powers the Clearbit logo lookup. */
  domain: string;
  /** Text wordmark used when the remote logo isn't available. */
  wordmark: { text: string; color: string; weight: number };
}

export const SHOP_SOURCES: Record<string, ShopSource> = {
  xxl_parfum: {
    id: "xxl_parfum",
    name: "XXL Parfum",
    color: "#E30613",
    domain: "xxl-parfum.ch",
    wordmark: { text: "XXL PARFUM", color: "#E30613", weight: 900 },
  },
  parfumsale: {
    id: "parfumsale",
    name: "Parfumsale",
    color: "#0076bd",
    domain: "parfumsale.ch",
    wordmark: { text: "parfumsale", color: "#0076bd", weight: 700 },
  },
  import_parfumerie: {
    id: "import_parfumerie",
    name: "Import Parfumerie",
    color: "#1a1a1a",
    domain: "importparfumerie.ch",
    wordmark: { text: "Import Parfumerie", color: "#1a1a1a", weight: 700 },
  },
  coop_vitality: {
    id: "coop_vitality",
    name: "Coop Vitality",
    color: "#f39200",
    domain: "coop-vitality.ch",
    wordmark: { text: "Coop Vitality", color: "#f39200", weight: 800 },
  },
  new_balance: {
    id: "new_balance",
    name: "New Balance",
    color: "#d2002e",
    domain: "newbalance.ch",
    wordmark: { text: "new balance", color: "#d2002e", weight: 800 },
  },
  parfum_ch: {
    id: "parfum_ch",
    name: "Parfum.ch",
    color: "#111111",
    domain: "parfum.ch",
    wordmark: { text: "parfum.ch", color: "#111111", weight: 800 },
  },
  ackermann_ch: {
    id: "ackermann_ch",
    name: "Ackermann Technik",
    color: "#005ca9",
    domain: "ackermann.ch",
    wordmark: { text: "ackermann", color: "#005ca9", weight: 800 },
  },
  "ackermann-mode": {
    id: "ackermann-mode",
    name: "Ackermann Mode",
    color: "#005ca9",
    domain: "ackermann.ch",
    wordmark: { text: "ackermann · mode", color: "#005ca9", weight: 800 },
  },
  jelmoli: {
    id: "jelmoli",
    name: "Jelmoli",
    color: "#111111",
    domain: "jelmoli.ch",
    wordmark: { text: "JELMOLI", color: "#111111", weight: 900 },
  },
  "jelmoli-mode": {
    id: "jelmoli-mode",
    name: "Jelmoli Mode",
    color: "#111111",
    domain: "jelmoli.ch",
    wordmark: { text: "JELMOLI · MODE", color: "#111111", weight: 900 },
  },
  bijouteria: {
    id: "bijouteria",
    name: "Bijouteria",
    color: "#8e44ad",
    domain: "bijouteria.ch",
    wordmark: { text: "BIJOUTERIA", color: "#8e44ad", weight: 800 },
  },
  bergfreunde: {
    id: "bergfreunde",
    name: "Bergfreunde",
    color: "#4e7a27",
    domain: "bergfreunde.eu",
    wordmark: { text: "BERGFREUNDE", color: "#4e7a27", weight: 800 },
  },
  adtraction_xxl_parfum: {
    id: "adtraction_xxl_parfum",
    name: "XXL Parfum",
    color: "#E30613",
    domain: "xxl-parfum.ch",
    wordmark: { text: "XXL PARFUM", color: "#E30613", weight: 900 },
  },
};

export function getShopSource(sourceId: string): ShopSource {
  return SHOP_SOURCES[sourceId] ?? {
    id: sourceId,
    name: sourceId,
    color: "#888",
    domain: "",
    wordmark: { text: sourceId, color: "#666", weight: 600 },
  };
}

/** Clearbit logo URL for a shop — empty string when the shop has no domain. */
export function getShopLogoUrl(sourceId: string): string {
  const shop = getShopSource(sourceId);
  return shop.domain ? `https://logo.clearbit.com/${shop.domain}` : "";
}

/** Get all active shop sources for UI dropdowns */
export const SHOP_SOURCE_LIST: ShopSource[] = [
  SHOP_SOURCES.xxl_parfum,
  SHOP_SOURCES.parfumsale,
  SHOP_SOURCES.import_parfumerie,
  SHOP_SOURCES.coop_vitality,
  SHOP_SOURCES.new_balance,
  SHOP_SOURCES.parfum_ch,
  SHOP_SOURCES.ackermann_ch,
  SHOP_SOURCES["ackermann-mode"],
  SHOP_SOURCES.bergfreunde,
  SHOP_SOURCES.jelmoli,
  SHOP_SOURCES["jelmoli-mode"],
  SHOP_SOURCES.bijouteria,
];
