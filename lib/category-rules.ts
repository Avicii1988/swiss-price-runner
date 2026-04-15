/**
 * Shared category resolution rules — used by both the feed importer
 * (scripts/import-runner.ts, app/api/cron/import-feed/route.ts) AND
 * the recategorize runner (scripts/recategorize-runner.ts).
 *
 * Keep this file framework-agnostic (no Prisma, no Next) so it can be
 * imported from standalone tsx scripts as well as server code.
 */

// ═══════════════════════════════════════════════════════════════════
// CATEGORY_MAP — keyword → full category path (root → … → leaf).
// Order matters: more specific rules must come FIRST.
// ═══════════════════════════════════════════════════════════════════

export interface CategoryRule {
  pattern: string;
  path: string[];
  name: string;
}

export const CATEGORY_MAP: CategoryRule[] = [
  // ── Nischen- & Luxusparfums (matched BEFORE generic parfum block) ─
  // Brand-specific patterns have to win over the generic "fragrance"
  // / "eau de parfum" rules below, otherwise Tom Ford, Creed, Byredo &
  // co. would all fall into the flat `parfum` root. Recategorize relies
  // on this order: resolveCategoryForExisting returns on first hit.
  { pattern: "tom ford",                 path: ["parfum", "parfum-nische"], name: "Tom Ford" },
  { pattern: "creed ",                   path: ["parfum", "parfum-nische"], name: "Creed" },
  { pattern: "byredo",                   path: ["parfum", "parfum-nische"], name: "Byredo" },
  { pattern: "le labo",                  path: ["parfum", "parfum-nische"], name: "Le Labo" },
  { pattern: "diptyque",                 path: ["parfum", "parfum-nische"], name: "Diptyque" },
  { pattern: "maison francis kurkdjian", path: ["parfum", "parfum-nische"], name: "Maison Francis Kurkdjian" },
  { pattern: "memo paris",               path: ["parfum", "parfum-nische"], name: "Memo Paris" },
  { pattern: "penhaligon",               path: ["parfum", "parfum-nische"], name: "Penhaligon's" },
  { pattern: "serge lutens",             path: ["parfum", "parfum-nische"], name: "Serge Lutens" },
  { pattern: "frederic malle",           path: ["parfum", "parfum-nische"], name: "Frederic Malle" },
  { pattern: "roja parfums",             path: ["parfum", "parfum-nische"], name: "Roja" },
  { pattern: "amouage",                  path: ["parfum", "parfum-nische"], name: "Amouage" },
  { pattern: "parfums de marly",         path: ["parfum", "parfum-nische"], name: "Parfums de Marly" },
  { pattern: "clive christian",          path: ["parfum", "parfum-nische"], name: "Clive Christian" },
  { pattern: "xerjoff",                  path: ["parfum", "parfum-nische"], name: "Xerjoff" },
  { pattern: "nasomatto",                path: ["parfum", "parfum-nische"], name: "Nasomatto" },
  { pattern: "orto parisi",              path: ["parfum", "parfum-nische"], name: "Orto Parisi" },
  { pattern: "initio parfums",           path: ["parfum", "parfum-nische"], name: "Initio" },
  { pattern: "nishane",                  path: ["parfum", "parfum-nische"], name: "Nishane" },
  { pattern: "montale",                  path: ["parfum", "parfum-nische"], name: "Montale" },
  { pattern: "mancera",                  path: ["parfum", "parfum-nische"], name: "Mancera" },

  // ── Parfum (generic) ─────────────────────────────────────────
  { pattern: "men's fragrance",   path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "men's eau de",      path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "aftershave",        path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "cologne",           path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { pattern: "women's fragrance", path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { pattern: "women's eau de",    path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { pattern: "unisex fragrance",  path: ["parfum", "unisex-dufte"],  name: "Unisex" },
  { pattern: "unisex eau de",     path: ["parfum", "unisex-dufte"],  name: "Unisex" },
  { pattern: "fragrance",         path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "perfume",           path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "eau de parfum",     path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "eau de toilette",   path: ["parfum"],                  name: "Parfum & Düfte" },
  { pattern: "skin care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "skincare",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "face care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "body care",         path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "moisturi",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "serum",             path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "cleanser",          path: ["parfum", "pflege"],        name: "Pflege" },
  { pattern: "make up",           path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "makeup",            path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "cosmetic",          path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "lipstick",          path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "mascara",           path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "foundation",        path: ["parfum", "make-up"],       name: "Make-Up" },
  { pattern: "hair care",         path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "hair",              path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "shampoo",           path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "conditioner",       path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { pattern: "bath",              path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "shower",            path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "body",              path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "deodorant",         path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { pattern: "gift set",          path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { pattern: "gift",              path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { pattern: "sun",               path: ["parfum", "sonnenpflege"],  name: "Sonnenpflege" },
  { pattern: "spf",               path: ["parfum", "sonnenpflege"],  name: "Sonnenpflege" },

  // ── Schuhe (with brand L3) ───────────────────────────────────
  { pattern: "nike air",      path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Sneakers" },
  { pattern: "jordan",        path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Jordan" },
  { pattern: "nike dunk",     path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Sneakers" },
  { pattern: "nike pegasus",  path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike Pegasus" },
  { pattern: "nike ",         path: ["schuhe", "schuhe-sneakers", "sneakers-nike"],       name: "Nike" },
  { pattern: "adidas",        path: ["schuhe", "schuhe-sneakers", "sneakers-adidas"],     name: "Adidas" },
  { pattern: "new balance",   path: ["schuhe", "schuhe-sneakers", "sneakers-newbalance"], name: "New Balance" },
  { pattern: "on cloud",      path: ["schuhe", "schuhe-sneakers", "sneakers-onrunning"],  name: "On Running" },
  { pattern: "on running",    path: ["schuhe", "schuhe-sneakers", "sneakers-onrunning"],  name: "On Running" },
  { pattern: "puma ",         path: ["schuhe", "schuhe-sneakers", "sneakers-puma"],       name: "Puma" },
  { pattern: "asics",         path: ["schuhe", "schuhe-sneakers", "sneakers-asics"],      name: "Asics" },
  { pattern: "hoka ",         path: ["schuhe", "schuhe-sneakers", "sneakers-hoka"],       name: "Hoka" },
  { pattern: "salomon",       path: ["schuhe", "schuhe-sneakers", "sneakers-salomon"],    name: "Salomon" },
  { pattern: "reebok",        path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "converse",      path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "vans ",         path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "saucony",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "mizuno",        path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "brooks ",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "sneaker",       path: ["schuhe", "schuhe-sneakers"],                        name: "Sneakers" },
  { pattern: "running shoe",  path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "laufschuh",     path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "hiking shoe",   path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "trail shoe",    path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "training shoe", path: ["schuhe", "schuhe-laufschuhe"],                      name: "Laufschuhe" },
  { pattern: "wanderschuh",   path: ["schuhe", "schuhe-wandern"],                         name: "Wanderschuhe" },
  { pattern: "footwear",      path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "shoes",         path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "schuhe",        path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "stiefel",       path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "sandalen",      path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "sandals",       path: ["schuhe"],                                           name: "Schuhe" },
  { pattern: "boots",         path: ["schuhe"],                                           name: "Schuhe" },

  // ── Mode ────────────────────────────────────────────────────
  { pattern: "damenmode",     path: ["mode", "mode-damen"],   name: "Damenmode" },
  { pattern: "herrenmode",    path: ["mode", "mode-herren"],  name: "Herrenmode" },
  { pattern: "kindermode",    path: ["mode", "mode-kinder"],  name: "Kindermode" },
  { pattern: "apparel",       path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "clothing",      path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "bekleidung",    path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "jacke",         path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "jacket",        path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "t-shirt",       path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "hose",          path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "pants",         path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "pullover",      path: ["mode"],                 name: "Mode & Bekleidung" },
  { pattern: "hoodie",        path: ["mode"],                 name: "Mode & Bekleidung" },

  // ── Smartphones ─────────────────────────────────────────────
  { pattern: "iphone",    path: ["smartphones", "smartphones-apple", "iphone"],          name: "iPhone" },
  { pattern: "ipad",      path: ["smartphones", "smartphones-apple", "ipad"],            name: "iPad" },
  { pattern: "galaxy",    path: ["smartphones", "smartphones-samsung", "samsung-galaxy"],name: "Galaxy" },
  { pattern: "samsung",   path: ["smartphones", "smartphones-samsung"],                  name: "Samsung" },
  { pattern: "pixel",     path: ["smartphones", "smartphones-google"],                   name: "Google Pixel" },
  { pattern: "xiaomi",    path: ["smartphones", "smartphones-xiaomi"],                   name: "Xiaomi" },
  { pattern: "smartphone",path: ["smartphones"],                                         name: "Smartphones" },
  { pattern: "handy",     path: ["smartphones"],                                         name: "Smartphones" },
  { pattern: "tablet",    path: ["smartphones"],                                         name: "Smartphones" },

  // ── Laptops ────────────────────────────────────────────────
  { pattern: "macbook",       path: ["laptops", "laptops-macbook"],                       name: "MacBook" },
  { pattern: "mac mini",      path: ["laptops", "laptops-macbook"],                       name: "Mac Mini" },
  { pattern: "mac studio",    path: ["laptops", "laptops-macbook"],                       name: "Mac Studio" },
  { pattern: "imac",          path: ["laptops", "laptops-macbook"],                       name: "iMac" },
  { pattern: "gaming laptop", path: ["laptops", "laptops-windows", "laptops-gaming"],     name: "Gaming Laptops" },
  { pattern: "chromebook",    path: ["laptops", "laptops-chromebook"],                    name: "Chromebook" },
  { pattern: "notebook",      path: ["laptops", "laptops-windows"],                       name: "Windows Laptops" },
  { pattern: "laptop",        path: ["laptops"],                                          name: "Laptops & Computer" },
  { pattern: "monitor",       path: ["laptops", "laptops-monitors"],                      name: "Monitore" },

  // ── Kopfhörer / Audio (Apple accessories matched before generic over-ear) ─
  { pattern: "airpod",       path: ["kopfhoerer", "airpods"],                  name: "AirPods" },
  { pattern: "homepod",      path: ["kopfhoerer", "homepod"],                  name: "HomePod" },
  { pattern: "over-ear",     path: ["kopfhoerer", "kopfhoerer-over-ear"],      name: "Over-Ear" },
  { pattern: "in-ear",       path: ["kopfhoerer", "kopfhoerer-in-ear"],        name: "In-Ear" },
  { pattern: "earbud",       path: ["kopfhoerer", "kopfhoerer-in-ear"],        name: "In-Ear" },
  { pattern: "noise cancel", path: ["kopfhoerer", "kopfhoerer-nc"],            name: "Noise Cancelling" },
  { pattern: "kopfhörer",    path: ["kopfhoerer"],                             name: "Kopfhörer & Audio" },
  { pattern: "kopfhoerer",   path: ["kopfhoerer"],                             name: "Kopfhörer & Audio" },
  { pattern: "headphone",    path: ["kopfhoerer"],                             name: "Kopfhörer & Audio" },
  { pattern: "lautsprecher", path: ["kopfhoerer", "kopfhoerer-lautsprecher"],  name: "Lautsprecher" },
  { pattern: "speaker",      path: ["kopfhoerer", "kopfhoerer-lautsprecher"],  name: "Lautsprecher" },

  // ── TV / Audio ─────────────────────────────────────────────
  { pattern: "oled tv",   path: ["tv-audio", "tv-oled"],     name: "OLED TVs" },
  { pattern: "qled tv",   path: ["tv-audio", "tv-qled"],     name: "QLED TVs" },
  { pattern: "soundbar",  path: ["tv-audio", "tv-soundbar"], name: "Soundbars" },
  { pattern: "beamer",    path: ["tv-audio", "tv-beamer"],   name: "Beamer" },
  { pattern: "projector", path: ["tv-audio", "tv-beamer"],   name: "Beamer" },
  { pattern: "fernseher", path: ["tv-audio"],                name: "TV & Audio" },
  { pattern: "fernsehgerät",path: ["tv-audio"],              name: "TV & Audio" },
  { pattern: "television",path: ["tv-audio"],                name: "TV & Audio" },

  // ── Foto ───────────────────────────────────────────────────
  { pattern: "dslr",       path: ["foto", "foto-dslr"],       name: "Spiegelreflex" },
  { pattern: "mirrorless", path: ["foto", "foto-mirrorless"], name: "Systemkameras" },
  { pattern: "action cam", path: ["foto", "foto-action"],     name: "Action Cams" },
  { pattern: "drohne",     path: ["foto", "foto-drohnen"],    name: "Drohnen" },
  { pattern: "drone",      path: ["foto", "foto-drohnen"],    name: "Drohnen" },
  { pattern: "objektiv",   path: ["foto", "foto-objektive"],  name: "Objektive" },
  { pattern: "kamera",     path: ["foto"],                    name: "Foto & Video" },
  { pattern: "camera",     path: ["foto"],                    name: "Foto & Video" },

  // ── Gaming ─────────────────────────────────────────────────
  { pattern: "playstation", path: ["gaming", "gaming-ps5"],      name: "PlayStation" },
  { pattern: "xbox",        path: ["gaming", "gaming-xbox"],     name: "Xbox" },
  { pattern: "nintendo",    path: ["gaming", "gaming-nintendo"], name: "Nintendo" },
  { pattern: "konsole",     path: ["gaming", "gaming-konsolen"], name: "Konsolen" },
  { pattern: "vr headset",  path: ["gaming", "gaming-vr"],       name: "VR Headsets" },

  // ── Uhren ──────────────────────────────────────────────────
  { pattern: "smartwatch",      path: ["uhren", "uhren-smartwatch"], name: "Smartwatches" },
  { pattern: "fitness tracker", path: ["uhren", "uhren-smartwatch"], name: "Fitness Tracker" },
  { pattern: "apple watch",     path: ["uhren", "uhren-smartwatch"], name: "Apple Watch" },

  // ── Luxusuhren ─────────────────────────────────────────────
  { pattern: "rolex",               path: ["uhren", "uhren-luxus"], name: "Rolex" },
  { pattern: "omega ",              path: ["uhren", "uhren-luxus"], name: "Omega" },
  { pattern: "patek philippe",      path: ["uhren", "uhren-luxus"], name: "Patek Philippe" },
  { pattern: "audemars piguet",     path: ["uhren", "uhren-luxus"], name: "Audemars Piguet" },
  { pattern: "breitling",           path: ["uhren", "uhren-luxus"], name: "Breitling" },
  { pattern: "iwc schaffhausen",    path: ["uhren", "uhren-luxus"], name: "IWC" },
  { pattern: "tag heuer",           path: ["uhren", "uhren-luxus"], name: "TAG Heuer" },
  { pattern: "cartier",             path: ["uhren", "uhren-luxus"], name: "Cartier" },
  { pattern: "hublot",              path: ["uhren", "uhren-luxus"], name: "Hublot" },
  { pattern: "panerai",             path: ["uhren", "uhren-luxus"], name: "Panerai" },
  { pattern: "tudor ",              path: ["uhren", "uhren-luxus"], name: "Tudor" },
  { pattern: "grand seiko",         path: ["uhren", "uhren-luxus"], name: "Grand Seiko" },
  { pattern: "vacheron constantin", path: ["uhren", "uhren-luxus"], name: "Vacheron Constantin" },
  { pattern: "jaeger-lecoultre",    path: ["uhren", "uhren-luxus"], name: "Jaeger-LeCoultre" },
  { pattern: "luxusuhr",            path: ["uhren", "uhren-luxus"], name: "Luxusuhren" },
  { pattern: "luxury watch",        path: ["uhren", "uhren-luxus"], name: "Luxusuhren" },

  // ── Haushalt ───────────────────────────────────────────────
  { pattern: "staubsauger",    path: ["haushalt", "haushalt-staubsauger"],    name: "Staubsauger" },
  { pattern: "vacuum",         path: ["haushalt", "haushalt-staubsauger"],    name: "Staubsauger" },
  { pattern: "kaffeemaschine", path: ["haushalt", "haushalt-kaffee"],         name: "Kaffeemaschinen" },
  { pattern: "küche",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "kuechengerät",   path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "luftreiniger",   path: ["haushalt", "haushalt-luftreiniger"],   name: "Luftreiniger" },
  { pattern: "mixer",          path: ["haushalt", "haushalt-kuechengeraete"], name: "Küchengeräte" },
  { pattern: "haushalt",       path: ["haushalt"],                            name: "Haushalt & Küche" },
];

// ═══════════════════════════════════════════════════════════════════
// Feed-specific defaults — used when productType/keywords don't match.
// ═══════════════════════════════════════════════════════════════════

export const FEED_CATEGORY_DEFAULTS: Record<string, { path: string[]; name: string }> = {
  xxl_parfum:        { path: ["parfum"],   name: "Parfum & Düfte" },
  parfumsale:        { path: ["parfum"],   name: "Parfum & Düfte" },
  import_parfumerie: { path: ["parfum"],   name: "Parfum & Düfte" },
  coop_vitality:     { path: ["parfum"],   name: "Parfum & Düfte" },
  new_balance:       { path: ["schuhe", "schuhe-sneakers", "sneakers-newbalance"], name: "New Balance" },
  parfum_ch:         { path: ["parfum"],   name: "Parfum & Düfte" },
  ackermann_ch:      { path: ["haushalt"], name: "Haushalt & Küche" },
};

// ═══════════════════════════════════════════════════════════════════
// Beauty keyword rules — title + description scan fallback.
// ═══════════════════════════════════════════════════════════════════

export interface KeywordRule {
  keywords: string[];
  path: string[];
  name: string;
}

export const BEAUTY_KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["eau de parfum", "edp"],                                      path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { keywords: ["eau de toilette", "edt"],                                    path: ["parfum", "damendufte"],    name: "Damendüfte" },
  { keywords: ["duftset", "geschenkset", "gift set"],                        path: ["parfum", "geschenksets"],  name: "Geschenksets" },
  { keywords: ["after shave", "aftershave"],                                 path: ["parfum", "herrendufte"],   name: "Herrendüfte" },
  { keywords: ["mascara", "lippenstift", "lipstick", "make-up", "makeup"],   path: ["parfum", "make-up"],       name: "Make-Up" },
  { keywords: ["gesichtspflege", "gesichtscreme", "serum"],                  path: ["parfum", "pflege"],        name: "Pflege" },
  { keywords: ["body lotion", "körperlotion", "koerperlotion", "body milk"], path: ["parfum", "koerperpflege"], name: "Körperpflege" },
  { keywords: ["shampoo", "conditioner", "haarpflege"],                      path: ["parfum", "haarpflege"],    name: "Haarpflege" },
  { keywords: ["parfum", "perfume", "duft", "fragrance"],                    path: ["parfum"],                  name: "Parfum & Düfte" },
];

export interface ResolvedCategory {
  path: string[];
  name: string;
}

export function matchBeautyKeywords(title: string, description: string): ResolvedCategory | null {
  const haystack = (title + " " + description).toLowerCase();
  for (const rule of BEAUTY_KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) return { path: rule.path, name: rule.name };
    }
  }
  return null;
}

function matchProductType(productType: string): ResolvedCategory | null {
  const lower = productType.toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (lower.includes(entry.pattern)) return { path: entry.path, name: entry.name };
  }
  return null;
}

/**
 * Resolve a category path for a feed import.
 *   1. productType → CATEGORY_MAP
 *   2. title + description → BEAUTY_KEYWORD_RULES
 *   3. feed-specific default
 */
export function resolveCategory(
  productType: string | undefined,
  title: string,
  description: string,
  feedId: string,
): ResolvedCategory {
  if (productType) {
    const m = matchProductType(productType);
    if (m) return m;
  }
  const kw = matchBeautyKeywords(title, description);
  if (kw) return kw;
  return FEED_CATEGORY_DEFAULTS[feedId] || { path: ["parfum"], name: "Parfum & Düfte" };
}

/**
 * Resolve a category path for an EXISTING product (no feedId available).
 *   1. title + brand + description + categoryName → CATEGORY_MAP scan
 *   2. title + description → BEAUTY_KEYWORD_RULES
 *   3. fall back to the current leaf slug (no change recommended)
 *
 * Used by the recategorize runner. Now includes `description` and the
 * legacy `categoryName` in the haystack so brand signals that live in
 * marketing copy (e.g. "Tom Ford — Noir Extreme for Men, Woody …")
 * finally reach the pattern scan even when the product title is
 * truncated.
 */
export function resolveCategoryForExisting(
  title: string,
  brand: string,
  description: string,
  currentSlug: string,
  currentName: string | null,
): ResolvedCategory {
  const haystack = `${title} ${brand} ${description} ${currentName ?? ""}`.toLowerCase();
  // Try CATEGORY_MAP patterns against the combined haystack
  for (const entry of CATEGORY_MAP) {
    if (haystack.includes(entry.pattern)) return { path: entry.path, name: entry.name };
  }
  // Fall back to beauty keywords
  const kw = matchBeautyKeywords(title, description);
  if (kw) return kw;
  // No match → keep current category (single-segment path)
  return { path: [currentSlug], name: currentName ?? currentSlug };
}
