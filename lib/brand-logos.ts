/**
 * Brand logo resolution with 3-layer fallback:
 *   1. Explicit domain map (curated top brands)
 *   2. Clearbit Logo API (https://logo.clearbit.com/<domain>)
 *   3. Hash-based avatar (colored initial SVG)
 *
 * Clearbit offers free logo fetching for any domain.
 * If the brand has no known domain, a local placeholder is returned.
 */

/** Top brands → official domain (for Clearbit lookup) */
const BRAND_DOMAINS: Record<string, string> = {
  // Perfume & Beauty — Luxury
  "dior": "dior.com",
  "christian dior": "dior.com",
  "chanel": "chanel.com",
  "guerlain": "guerlain.com",
  "hermes": "hermes.com",
  "hermès": "hermes.com",
  "givenchy": "givenchy.com",
  "louis vuitton": "louisvuitton.com",
  "tom ford": "tomford.com",
  "tom ford beauty": "tomford.com",
  "gucci": "gucci.com",
  "prada": "prada.com",
  "armani": "armani.com",
  "giorgio armani": "armani.com",
  "burberry": "burberry.com",
  "valentino": "valentino.com",
  "versace": "versace.com",
  "bvlgari": "bulgari.com",
  "bulgari": "bulgari.com",

  // Perfume — Premium
  "yves saint laurent": "ysl.com",
  "ysl": "ysl.com",
  "lancome": "lancome.com",
  "lancôme": "lancome.com",
  "estee lauder": "esteelauder.com",
  "estée lauder": "esteelauder.com",
  "calvin klein": "calvinklein.com",
  "hugo boss": "hugoboss.com",
  "boss": "hugoboss.com",
  "paco rabanne": "pacorabanne.com",
  "rabanne": "pacorabanne.com",
  "jean paul gaultier": "jeanpaulgaultier.com",
  "dolce & gabbana": "dolcegabbana.com",
  "dolce gabbana": "dolcegabbana.com",
  "d&g": "dolcegabbana.com",
  "carolina herrera": "carolinaherrera.com",
  "narciso rodriguez": "narcisorodriguez.com",
  "jo malone": "jomalone.com",
  "jo malone london": "jomalone.com",
  "clinique": "clinique.com",
  "mac": "maccosmetics.com",
  "maccosmetics": "maccosmetics.com",
  "urban decay": "urbandecay.com",
  "nars": "narscosmetics.com",

  // Perfume — Affordable
  "montblanc": "montblanc.com",
  "mont blanc": "montblanc.com",
  "davidoff": "zinodavidoff.com",
  "lacoste": "lacoste.com",
  "ralph lauren": "ralphlauren.com",
  "tommy hilfiger": "tommy.com",
  "diesel": "diesel.com",
  "mexx": "mexx.com",
  "naomi campbell": "naomicampbell.com",
  "adidas": "adidas.com",
  "puma": "puma.com",
  "beckham": "davidbeckham.com",
  "bruno banani": "brunobanani.com",

  // Niche
  "creed": "creedboutique.com",
  "maison margiela": "maisonmargiela.com",
  "le labo": "lelabofragrances.com",
  "byredo": "byredo.com",
  "diptyque": "diptyqueparis.com",
  "acqua di parma": "acquadiparma.com",
  "clive christian": "clivechristian.com",
  "amouage": "amouage.com",
  "penhaligon's": "penhaligons.com",

  // Skincare & Pharmacy
  "la roche-posay": "laroche-posay.com",
  "la roche posay": "laroche-posay.com",
  "vichy": "vichy.com",
  "eucerin": "eucerin.com",
  "nivea": "nivea.com",
  "cerave": "cerave.com",
  "biotherm": "biotherm.com",
  "neutrogena": "neutrogena.com",
  "bioderma": "bioderma.com",
  "avène": "eau-thermale-avene.com",
  "avene": "eau-thermale-avene.com",
  "weleda": "weleda.com",
  "l'oreal": "loreal.com",
  "l'oréal": "loreal.com",
  "loreal": "loreal.com",
  "garnier": "garnier.com",
  "olay": "olay.com",
  "kerastase": "kerastase.com",
  "kérastase": "kerastase.com",

  // Shoes & Sport
  "new balance": "newbalance.com",
  "nike": "nike.com",
  "on": "on.com",
  "on running": "on.com",
  "asics": "asics.com",
  "reebok": "reebok.com",
  "under armour": "underarmour.com",
  "salomon": "salomon.com",
  "hoka": "hoka.com",
  "hoka one one": "hoka.com",
  "brooks": "brooksrunning.com",
  "saucony": "saucony.com",
  "mizuno": "mizuno.com",
  "converse": "converse.com",
  "vans": "vans.com",

  // Swiss / CH shops (partner shops)
  "xxl parfum": "xxl-parfum.ch",
  "parfumsale": "parfumsale.ch",
  "import parfumerie": "importparfumerie.ch",
  "coop vitality": "coop-vitality.ch",
};

/** Normalize brand name for map lookup */
function normalizeBrand(brand: string): string {
  return brand.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Returns the best logo URL for a brand:
 *   1. Google's High-Res Favicon API (if brand has a known domain)
 *   2. null (caller should fall back to hash-coloured initial avatar)
 *
 * Google covers every mapped brand we've ever checked, returns a
 * 128 × 128 PNG, and doesn't rate-limit like Clearbit did on new
 * domains. Response is cached at Google → Cloudflare → browser, so
 * hit latency is effectively zero after the first render.
 */
export function getBrandLogo(brand: string): string | null {
  if (!brand) return null;
  const key = normalizeBrand(brand);
  const domain = BRAND_DOMAINS[key];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/** Deterministic brand color from name (for hash avatar fallback) */
export function brandColor(name: string): string {
  const colors = ["#E30613", "#0076bd", "#f39200", "#1a1a1a", "#6a2382", "#009e60"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

/** Get the first letter of a brand name for avatar fallback */
export function brandInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/** Check if we have a domain mapping for this brand (for UI hints) */
export function hasBrandLogo(brand: string): boolean {
  return BRAND_DOMAINS[normalizeBrand(brand)] !== undefined;
}
