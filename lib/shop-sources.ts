/**
 * Shop source mapping — logos, colors, names.
 * Keyed by sourceId (used in Price.sourceId column).
 */

export interface ShopSource {
  id: string;
  name: string;
  color: string;
  /** Text-based wordmark style for inline shop branding */
  wordmark: { text: string; color: string; weight: number };
}

export const SHOP_SOURCES: Record<string, ShopSource> = {
  xxl_parfum: {
    id: "xxl_parfum",
    name: "XXL Parfum",
    color: "#E30613",
    wordmark: { text: "XXL PARFUM", color: "#E30613", weight: 900 },
  },
  parfumsale: {
    id: "parfumsale",
    name: "Parfumsale",
    color: "#0076bd",
    wordmark: { text: "parfumsale", color: "#0076bd", weight: 700 },
  },
  import_parfumerie: {
    id: "import_parfumerie",
    name: "Import Parfumerie",
    color: "#1a1a1a",
    wordmark: { text: "Import Parfumerie", color: "#1a1a1a", weight: 700 },
  },
  coop_vitality: {
    id: "coop_vitality",
    name: "Coop Vitality",
    color: "#f39200",
    wordmark: { text: "Coop Vitality", color: "#f39200", weight: 800 },
  },
  adtraction_xxl_parfum: {
    id: "adtraction_xxl_parfum",
    name: "XXL Parfum",
    color: "#E30613",
    wordmark: { text: "XXL PARFUM", color: "#E30613", weight: 900 },
  },
};

export function getShopSource(sourceId: string): ShopSource {
  return SHOP_SOURCES[sourceId] ?? {
    id: sourceId,
    name: sourceId,
    color: "#888",
    wordmark: { text: sourceId, color: "#666", weight: 600 },
  };
}

/** Get all active shop sources for UI dropdowns */
export const SHOP_SOURCE_LIST: ShopSource[] = [
  SHOP_SOURCES.xxl_parfum,
  SHOP_SOURCES.parfumsale,
  SHOP_SOURCES.import_parfumerie,
  SHOP_SOURCES.coop_vitality,
];
