/**
 * Smart attribute extraction — scans title, description and raw feed
 * attributes to produce normalised key/value pairs that power the
 * two-level variant selector on the PDP.
 *
 * Category-aware: the "lead attribute" differs by vertical:
 *   Electronics → storage (GB/TB), then color
 *   Fashion/Shoes → size, then color
 *   Beauty/Consumables → volume (ml/l) or weight (g/kg), then count
 *
 * All values are normalised so "256GB", "256 GB" and "256gb" all
 * collapse to the canonical "256 GB".
 */

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface ExtractedAttributes {
  /** The most important spec axis (storage / size / volume). */
  primary: { key: string; value: string } | null;
  /** Usually color or style. */
  secondary: { key: string; value: string } | null;
  /** All extracted key/value pairs (superset of primary + secondary). */
  all: Record<string, string>;
}

/** Which attribute is the "lead" for a given product vertical. */
export type LeadAttribute = "storage" | "ram" | "size" | "volume" | "weight" | "count";

// ═══════════════════════════════════════════════════════════════════
// GTIN guard — central check used everywhere to prevent 13-digit
// barcodes from leaking into UI labels.
// ═══════════════════════════════════════════════════════════════════

const GTIN_RE = /^\d{8,14}$/;

/** Returns true if the string looks like a GTIN/EAN/UPC barcode. */
export function isGtin(s: string): boolean {
  return GTIN_RE.test(s.trim());
}

/** Strip GTINs from a string — replaces any standalone 8-14 digit
 *  sequence with empty string, then trims whitespace. */
export function stripGtins(s: string): string {
  return s.replace(/\b\d{8,14}\b/g, "").replace(/\s+/g, " ").trim();
}

// ═══════════════════════════════════════════════════════════════════
// Regex extractors
// ═══════════════════════════════════════════════════════════════════

function normalise(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Electronics: storage capacity — aggressive multi-pattern scan.
 *  Catches "256GB", "256 GB", "1TB", "1 TB", "0.5TB".
 *
 *  Critical: "5G", "4G" (cellular generations) must NEVER match.
 *  The regex requires exactly `GB` or `TB` — a lone `G` after a digit
 *  is a network generation, not a size. */
function extractStorage(text: string): string | null {
  // Strip cellular-generation markers before scanning so "5G 256GB"
  // doesn't confuse subsequent patterns.
  const cleaned = text.replace(/\b\d+G\b/g, " ").replace(/\s+/g, " ");
  // Prefer the largest GB/TB value found (pick max to avoid matching
  // RAM when both RAM and storage are in the haystack, e.g. "8GB RAM 256GB").
  const all = [...cleaned.matchAll(/\b(\d+(?:\.\d+)?)\s*(gb|tb)\b/gi)];
  if (all.length > 0) {
    // Prefer TB, then largest GB
    const tb = all.find((m) => m[2].toUpperCase() === "TB");
    if (tb) return `${tb[1]} TB`;
    const best = all.reduce((a, b) => Number(a[1]) >= Number(b[1]) ? a : b);
    return `${best[1]} GB`;
  }
  // Fallback: compact form "256gb" without word boundary
  const compact = cleaned.match(/(\d{2,})(gb|tb)/i);
  if (compact) return `${compact[1]} ${compact[2].toUpperCase()}`;
  return null;
}

/** Electronics: RAM — "8 GB RAM", "16GB RAM", "8GB Arbeitsspeicher" */
function extractRam(text: string): string | null {
  const m = text.match(/\b(\d+)\s*gb\s*(?:ram|arbeitsspeicher)\b/i);
  if (m) return `${m[1]} GB`;
  // Try "RAM: 8 GB" or "RAM 8GB" pattern
  const rev = text.match(/\bram[\s:]*(\d+)\s*gb\b/i);
  if (rev) return `${rev[1]} GB`;
  return null;
}

/** Fashion/Shoes: size — alpha (S/M/L/XL/XXL) or numeric (38-50, 36.5) */
function extractSize(text: string): string | null {
  // Named sizes: XS, S, M, L, XL, XXL, XXXL (standalone word)
  const alpha = text.match(/\b(xxxl|xxl|xl|xs|[sml])\b/i);
  if (alpha) return alpha[1].toUpperCase();
  // Numeric shoe/clothing sizes: 35-52, optionally with .5 or ½
  const numeric = text.match(/\b(Gr\.?\s*)?(\d{2}(?:[.,]5)?)\b/);
  if (numeric && Number(numeric[2]) >= 28 && Number(numeric[2]) <= 54) {
    return numeric[2].replace(",", ".");
  }
  return null;
}

/** Beauty: volume (30 ml, 100ml, 1.5 l, 0.75l → "100 ml" / "1.5 l") */
function extractVolume(text: string): string | null {
  const m = text.match(/\b(\d+(?:[.,]\d+)?)\s*(ml|l|cl|dl)\b/i);
  if (!m) return null;
  const val = m[1].replace(",", ".");
  return `${val} ${m[2].toLowerCase()}`;
}

/** Beauty/consumables: weight (100 g, 1.5 kg, 500g → "500 g") */
function extractWeight(text: string): string | null {
  const m = text.match(/\b(\d+(?:[.,]\d+)?)\s*(g|kg)\b/i);
  if (!m) return null;
  const val = m[1].replace(",", ".");
  return `${val} ${m[2].toLowerCase()}`;
}

/** Count / pack size (3er Pack, 10 Stück, x6 → "3 Stück") */
function extractCount(text: string): string | null {
  const m = text.match(/\b(\d+)\s*(?:er[- ]?pack|stück|stk|x)\b/i)
          || text.match(/\bx\s*(\d+)\b/i);
  if (!m) return null;
  return `${m[1]} Stück`;
}

// ═══════════════════════════════════════════════════════════════════
// Colour extraction — the most common secondary attribute
// ═══════════════════════════════════════════════════════════════════

const COLOR_PATTERNS = [
  // German
  "schwarz", "weiss", "weiß", "rot", "blau", "grün", "gruen", "gelb",
  "grau", "braun", "rosa", "pink", "orange", "lila", "violett", "türkis",
  "beige", "creme", "silber", "gold", "bronze", "kupfer", "navy",
  "anthrazit", "bordeaux", "ivory", "champagne", "taupe", "mint",
  "khaki", "natur", "sand", "coral", "petrol",
  // English (common in Swiss feeds)
  "black", "white", "red", "blue", "green", "yellow", "grey", "gray",
  "brown", "pink", "purple", "silver", "gold", "titanium", "midnight",
  "starlight", "space gray", "space grey", "desert titanium",
  "natural titanium", "blue titanium", "deep purple",
  "alpine green", "sierra blue", "graphite", "pacific blue",
  "phantom black", "cream", "lavender", "coral", "mint",
];

function extractColor(text: string): string | null {
  const lower = text.toLowerCase();
  for (const c of COLOR_PATTERNS) {
    if (lower.includes(c)) {
      // Capitalise first letter
      return c.charAt(0).toUpperCase() + c.slice(1);
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Category detection — determines which lead attribute to use
// ═══════════════════════════════════════════════════════════════════

function detectVertical(category: string, title: string): LeadAttribute {
  const cat = category.toLowerCase();
  const ttl = title.toLowerCase();

  // Electronics
  if (
    cat.includes("smartphone") || cat.includes("iphone") || cat.includes("ipad") ||
    cat.includes("laptop") || cat.includes("tablet") || cat.includes("galaxy") ||
    cat.includes("computer") || cat.includes("gaming") ||
    ttl.includes("iphone") || ttl.includes("galaxy") || ttl.includes("macbook")
  ) return "storage";

  // Fashion / Shoes
  if (
    cat.includes("mode") || cat.includes("schuh") || cat.includes("sneaker") ||
    cat.includes("damen") || cat.includes("herren") || cat.includes("kleid") ||
    cat.includes("hose") || cat.includes("stiefel")
  ) return "size";

  // Beauty / Perfume
  if (
    cat.includes("parfum") || cat.includes("beauty") || cat.includes("pflege") ||
    cat.includes("duft") || cat.includes("make-up") || cat.includes("haar") ||
    cat.includes("sonnen") || cat.includes("koerper") ||
    ttl.includes("eau de") || ttl.includes("edp") || ttl.includes("edt")
  ) return "volume";

  // Consumables
  if (cat.includes("supermarkt") || cat.includes("lebensmittel")) return "weight";

  // Default — try volume (perfume is the biggest catalogue)
  return "volume";
}

// ═══════════════════════════════════════════════════════════════════
// Main extraction function
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract normalised attributes from a product's title, description
 * and category slug. The result drives the two-level variant selector:
 *   - primary = the "spec" axis (storage, size, volume)
 *   - secondary = usually color
 *
 * If the feed already provides `feedSize` / `feedColor`, those take
 * priority over regex extraction (less error-prone).
 */
export function extractAttributes(
  title: string,
  description: string,
  category: string,
  feedSize?: string,
  feedColor?: string,
): ExtractedAttributes {
  const haystack = normalise(`${title} ${description}`);
  const all: Record<string, string> = {};

  // ── Feed-supplied values take priority ──
  if (feedSize) all["size"] = feedSize;
  if (feedColor) all["color"] = feedColor;

  // ── Regex extraction (fills gaps the feed didn't cover) ──
  // Storage runs first and unconditionally — GB/TB beats every other
  // dimension regardless of category. "5G", "4G" are pre-stripped
  // inside extractStorage so they can never win.
  if (!all["storage"]) { const v = extractStorage(haystack); if (v) all["storage"] = v; }
  if (!all["ram"])     { const v = extractRam(haystack);     if (v) all["ram"] = v; }
  if (!all["size"])    { const v = extractSize(haystack);    if (v) all["size"] = v; }
  if (!all["volume"])  { const v = extractVolume(haystack);  if (v) all["volume"] = v; }
  if (!all["weight"])  { const v = extractWeight(haystack);  if (v) all["weight"] = v; }
  if (!all["count"])   { const v = extractCount(haystack);   if (v) all["count"] = v; }
  if (!all["color"])   { const v = extractColor(haystack);   if (v) all["color"] = v; }

  // ── Primary determination ──
  // Storage always wins over the category-specific vertical lead.
  // This prevents volume/weight from stealing the headline slot on a
  // phone title like "Google Pixel 9 Pro 5G 256 GB" where detectVertical
  // might return "volume" for an uncategorised product.
  const storagePrimary = all["storage"] ?? null;
  const lead = detectVertical(category, title);
  const primaryValue = storagePrimary ?? (all[lead] ?? null);
  const primaryKey = storagePrimary ? "storage" : lead;
  const colorValue = all["color"] ?? null;

  return {
    primary: primaryValue ? { key: primaryKey, value: primaryValue } : null,
    secondary: colorValue ? { key: "color", value: colorValue } : null,
    all,
  };
}

/**
 * Derive a human-readable variant label from a sibling's available data.
 * Used by the variant selector so buttons NEVER show raw GTINs or the
 * word "Standard". Preference order:
 *   1. Extracted primary attribute value ("256 GB", "50 ml", "42")
 *   2. Feed-supplied sizeLabel ("50 ml", "Gr. 42")
 *   3. Title fragment — brand stripped, first 30 chars
 *   4. Last resort: "Variante"
 */
export function variantLabel(
  sizeLabel: string | null,
  title: string,
  brand: string,
  category: string,
): string {
  // HARD RULE: if the input itself is a GTIN, skip it entirely.
  if (isGtin(title)) {
    // Can't extract anything meaningful from a barcode number
  } else {
    // Try attribute extraction from the title
    const attrs = extractAttributes(title, "", category);
    if (attrs.primary?.value && !isGtin(attrs.primary.value)) return attrs.primary.value;
  }

  // Feed size label — reject if it looks like a GTIN or "Standard"
  if (sizeLabel && !isGtin(sizeLabel) && sizeLabel !== "Standard") return sizeLabel;

  // Title fragment (strip brand + any GTIN-looking sequences)
  const cleaned = stripGtins(title.replace(new RegExp(brand, "i"), ""));
  if (cleaned.length >= 3) return cleaned.slice(0, 35);

  return "Variante";
}

/**
 * Human-readable label for an attribute key. Used by the variant
 * selector so buttons never show raw identifiers like "storage" —
 * they show "Speicher" instead.
 */
export function attributeLabel(key: string): string {
  const labels: Record<string, string> = {
    storage: "Speicher",
    ram: "RAM",
    size: "Grösse",
    volume: "Inhalt",
    weight: "Gewicht",
    count: "Menge",
    color: "Farbe",
  };
  return labels[key] ?? key;
}
