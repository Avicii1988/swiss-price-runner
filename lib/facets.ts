/**
 * Dynamic facet aggregation — scans displayAttributes across a product
 * set and returns the available filter dimensions with value counts.
 *
 * The output drives the FilterSidebar: instead of hardcoded filter
 * keys, the sidebar renders whatever attributes the current category's
 * products actually carry.
 */

import { attributeLabel } from "@/lib/attributes";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facet {
  key: string;
  label: string;
  values: FacetValue[];
}

/** Active filter selections — key → Set of selected values */
export type ActiveFilters = Record<string, Set<string>>;

// ═══════════════════════════════════════════════════════════════════
// Aggregation
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse `displayAttributes` from a product. The field is a JSON string
 * stored as TEXT (not native JSONB) — if it's null or malformed we
 * return an empty object rather than crashing.
 */
function parseAttrs(product: MockProductWithHistory): Record<string, string> {
  const raw = (product as any).product?.displayAttributes
    ?? (product as any).displayAttributes;
  if (!raw || typeof raw !== "string") return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/**
 * Build facets from a list of products. Scans every product's
 * displayAttributes JSON + brand + price range. Returns the facets
 * sorted by value count descending (most common first).
 *
 * The `brand` facet is always included as a virtual attribute even
 * though it's not part of displayAttributes — brand filtering is
 * universally expected on every category page.
 */
export function aggregateFacets(products: MockProductWithHistory[]): Facet[] {
  // key → { value → count }
  const buckets = new Map<string, Map<string, number>>();

  // Always include brand as a facet
  const brandBucket = new Map<string, number>();
  buckets.set("brand", brandBucket);

  for (const p of products) {
    // Brand
    const brand = p.product.brand;
    if (brand) brandBucket.set(brand, (brandBucket.get(brand) ?? 0) + 1);

    // displayAttributes
    const attrs = parseAttrs(p);
    for (const [key, value] of Object.entries(attrs)) {
      if (!key || !value) continue;
      let bucket = buckets.get(key);
      if (!bucket) { bucket = new Map(); buckets.set(key, bucket); }
      bucket.set(value, (bucket.get(value) ?? 0) + 1);
    }
  }

  // Convert to sorted Facet[]
  const facets: Facet[] = [];
  for (const [key, bucket] of buckets) {
    // Skip facets with only 1 value (not useful for filtering)
    if (bucket.size <= 1) continue;
    const values = Array.from(bucket.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
    facets.push({
      key,
      label: key === "brand" ? "Marke" : attributeLabel(key),
      values,
    });
  }

  // Sort facets: brand first, then by number of distinct values desc
  facets.sort((a, b) => {
    if (a.key === "brand") return -1;
    if (b.key === "brand") return 1;
    return b.values.length - a.values.length;
  });

  return facets;
}

/**
 * Apply active filters to a product list. A product passes if for
 * every active facet key, the product's value for that key is in the
 * selected set. Price range is handled separately.
 */
export function applyFacetFilters(
  products: MockProductWithHistory[],
  filters: ActiveFilters,
): MockProductWithHistory[] {
  const activeKeys = Object.entries(filters).filter(([, set]) => set.size > 0);
  if (activeKeys.length === 0) return products;

  return products.filter((p) => {
    const attrs = parseAttrs(p);
    // Add brand as a virtual attribute for filtering
    attrs["brand"] = p.product.brand;

    for (const [key, selectedValues] of activeKeys) {
      const productValue = attrs[key];
      if (!productValue) return false;
      if (!selectedValues.has(productValue)) return false;
    }
    return true;
  });
}
