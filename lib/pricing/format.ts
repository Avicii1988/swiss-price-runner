/**
 * Single source of truth for CHF price formatting across the UI.
 *
 * Every price surface (ProductCard, ProductShelf, PDP, category counts)
 * must render to the rappen — no `Math.floor()`, no "19.–" rounding. The
 * old pattern dropped the cents when they were zero, which made prices
 * look artificially rounded and, worse, changed its mind when cents were
 * non-zero (`19.–` vs `19.95`). That inconsistency is now gone: every
 * caller goes through `formatChf()` and gets exactly two decimals.
 */

const CHF_FORMATTER = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a numeric CHF value as `19.95` (no currency prefix). */
export function formatChf(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "–";
  return CHF_FORMATTER.format(value);
}

/** Format a numeric CHF value prefixed with `CHF `. */
export function formatChfLabel(value: number | null | undefined): string {
  const formatted = formatChf(value);
  return formatted === "–" ? "Preis auf Anfrage" : `CHF ${formatted}`;
}
