/**
 * Seed data for SwissPriceRunner.
 *
 * 55 products across all categories. Use this file to:
 *   1. Power the mock frontend (imported by mock-service.ts)
 *   2. Reset Supabase: `npx tsx prisma/seed.ts`
 *
 * Sources follow real pricing tiers:
 *   - amazon_de: Cheapest EU price (German Amazon)
 *   - galaxus_ch: Swiss domestic (Digitec/Galaxus) – usually 5-15% more
 *   - zalando_de: Fashion/lifestyle focus
 */

export interface MockSource {
  sourceId: string;
  sourceName: string;
  url: string;
  currentPriceEur: number;
}

export interface MockProduct {
  gtin: string;
  title: string;
  brand: string;
  category: string;
  imageUrl: string;
  featured: boolean;
  sources: MockSource[];
}

type SeedProduct = MockProduct;

// Deterministic seed from GTIN for unique picsum image per product
function gtinToSeed(gtin: string): number {
  return parseInt(gtin.slice(-4), 10) % 1000;
}

function p(
  gtin: string,
  title: string,
  brand: string,
  category: string,
  featured: boolean,
  sources: [eur: number, eur?: number, eur?: number],
): SeedProduct {
  const seed = gtinToSeed(gtin);
  const img = `https://picsum.photos/seed/${seed}/400/400`;
  const s: SeedProduct["sources"] = [
    { sourceId: "amazon_de", sourceName: "Amazon.de", url: "#", currentPriceEur: sources[0] },
  ];
  if (sources[1] !== undefined) {
    s.push({ sourceId: "galaxus_ch", sourceName: "Galaxus", url: "#", currentPriceEur: sources[1] });
  }
  if (sources[2] !== undefined) {
    s.push({ sourceId: "zalando_de", sourceName: "Zalando", url: "#", currentPriceEur: sources[2] });
  }
  return {
    gtin, title, brand, category, featured,
    imageUrl: img,
    sources: s,
  };
}

// ---------------------------------------------------------------------------
// SEED DATA — 55 products
// ---------------------------------------------------------------------------

export const SEED_PRODUCTS: SeedProduct[] = [
  // ── Smartphones (6) ─────────────────────────────────────────────────────
  p("00194253715085", "iPhone 15 Pro 256GB Titan Natur",       "Apple",    "smartphones", true,  [1179, 1249, 1199]),
  p("00889842640885", "Samsung Galaxy S24 Ultra 256GB",        "Samsung",  "smartphones", false, [1199, 1279, 1219]),
  p("00840080520049", "Google Pixel 8 Pro 128GB Obsidian",     "Google",   "smartphones", false, [849, 899]),
  p("00690000000001", "Xiaomi 14 Ultra 512GB",                 "Xiaomi",   "smartphones", false, [1099, 1199]),
  p("00194253000100", "iPhone 15 128GB Schwarz",               "Apple",    "smartphones", false, [799, 849, 829]),
  p("00889842000200", "Samsung Galaxy Z Flip5 256GB",          "Samsung",  "smartphones", false, [899, 969]),

  // ── Laptops & Computer (5) ─────────────────────────────────────────────
  p("00194253392828", 'MacBook Air M3 13" 256GB Midnight',     "Apple",    "laptops", true,  [1099, 1149]),
  p("00196188000301", 'Lenovo ThinkPad X1 Carbon Gen 11 14"',  "Lenovo",   "laptops", false, [1449, 1549]),
  p("00889842000400", 'Samsung Galaxy Book4 Pro 14"',          "Samsung",  "laptops", false, [1299, 1399]),
  p("00195553000501", 'ASUS ROG Zephyrus G14 RTX 4070',       "ASUS",     "laptops", false, [1699, 1799]),
  p("00194253000600", 'MacBook Pro M3 Pro 14" 512GB',          "Apple",    "laptops", false, [1999, 2099]),

  // ── Kopfhörer & Audio (5) ──────────────────────────────────────────────
  p("00027242923379", "Sony WH-1000XM5 Noise Cancelling",     "Sony",     "kopfhoerer", true,  [279, 299]),
  p("00885909961009", "Apple AirPods Pro 2. Gen USB-C",        "Apple",    "kopfhoerer", true,  [229, 245, 239]),
  p("00810028588103", "Bose QuietComfort Ultra Earbuds",       "Bose",     "kopfhoerer", false, [249, 269, 259]),
  p("00054651000701", "Sennheiser Momentum 4 Wireless",       "Sennheiser","kopfhoerer",false, [299, 329]),
  p("00054651000702", "Sennheiser IE 600 In-Ear",             "Sennheiser","kopfhoerer",false, [599, 649]),

  // ── Schuhe (6) ─────────────────────────────────────────────────────────
  p("00764011644505", "On Cloud 5 Laufschuhe – All Black",    "On Running","schuhe", true,  [149.95, 169.9, 149.95]),
  p("00764011644260", "On Cloudmonster 2 – Undyed/Frost",     "On Running","schuhe", false, [169.95, 179.9, 169.95]),
  p("00194500000801", "Nike Air Max 90 – White/Black",        "Nike",     "schuhe", false, [129.99, 149.9, 129.99]),
  p("00401938000901", "Adidas Ultraboost Light – Core Black",  "Adidas",   "schuhe", false, [159.95, 179.9, 159.95]),
  p("00190000001001", "New Balance 990v6 Made in USA",         "New Balance","schuhe",false, [229.95, 259.9]),
  p("00764011001101", "On Cloudstratus 3 – Black/Frost",      "On Running","schuhe", false, [179.95, 199.9, 179.95]),

  // ── Gaming & Entertainment (5) ─────────────────────────────────────────
  p("00045496883386", "Nintendo Switch OLED Weiss",            "Nintendo", "gaming", false, [299, 319]),
  p("00711719565185", "Sony PlayStation 5 Slim Digital",       "Sony",     "gaming", true,  [449, 479]),
  p("00889842001201", "Xbox Series X 1TB",                     "Microsoft","gaming", false, [499, 529]),
  p("00301000001301", "Meta Quest 3 128GB VR Headset",         "Meta",     "gaming", false, [549, 599]),
  p("00045496001401", "Nintendo Switch Pro Controller",        "Nintendo", "gaming", false, [59.99, 69.9]),

  // ── Haushalt & Küche (6) ───────────────────────────────────────────────
  p("00050946000282", "Nespresso Vertuo Next Kapselmaschine",  "Nespresso","haushalt", true,  [129, 149]),
  p("00196337069534", "Dyson V15 Detect Absolute",             "Dyson",    "haushalt", true,  [599, 649]),
  p("00885609001501", "KitchenAid Artisan 4.8L Küchenmaschine","KitchenAid","haushalt",false, [449, 499]),
  p("00408800001601", "Philips Airfryer XXL HD9285",           "Philips",  "haushalt", false, [189, 219]),
  p("00500000001701", "Jura E8 Kaffeevollautomat",             "Jura",     "haushalt", false, [1299, 1399]),
  p("00196337001801", "Dyson Pure Cool Luftreiniger TP07",     "Dyson",    "haushalt", false, [549, 599]),

  // ── Mode & Bekleidung (16) ──────────────────────────────────────────
  p("00400000001901", "The North Face Nuptse 1996 Daunenjacke","The North Face","mode",false,[249, undefined, 249]),
  p("00889842002001", "Patagonia Nano Puff Jacket",            "Patagonia","mode",   false, [219, undefined, 219]),
  p("00889842002101", "Arc'teryx Atom LT Hoody",               "Arc'teryx","mode",   false, [259, 279]),
  p("00764011002201", "On Weather Jacket – Black",             "On Running","mode",  false, [249, 279, 249]),
  p("00193145100100", "Nike Air Force 1 '07 White",            "Nike",     "mode",   true,  [109.99, 129.9, 109.99]),
  p("00401938500200", "Adidas Samba OG – White/Black",         "Adidas",   "mode",   true,  [99.95, 119.9, 99.95]),
  p("00501003600300", "Levi's 501 Original Jeans – Dark Wash", "Levi's",   "mode",   false, [89.95, undefined, 89.95]),
  p("00886668800400", "Birkenstock Arizona Sandalen – Taupe",  "Birkenstock","mode", false, [79.95, 89.9, 79.95]),
  p("00194500700500", "Nike Dunk Low Retro – Panda",           "Nike",     "mode",   true,  [109.99, 129.9, 109.99]),
  p("00401938700600", "Adidas Gazelle Indoor – Gum",           "Adidas",   "mode",   false, [109.95, 129.9, 109.95]),
  p("00194500700700", "Nike Tech Fleece Jogginghose – Black",  "Nike",     "mode",   false, [89.99, undefined, 89.99]),
  p("00501003700800", "Levi's Trucker Jacket – Medium Wash",   "Levi's",   "mode",   false, [99.95, undefined, 99.95]),
  p("00886668800900", "Birkenstock Boston Clog – Mocca",       "Birkenstock","mode", false, [119.95, 139.9, 119.95]),
  p("00400000801000", "The North Face Borealis Rucksack 28L",  "The North Face","mode",false,[99.95, 109.9, 99.95]),
  p("00889842801100", "Patagonia Better Sweater Fleece",       "Patagonia","mode",   false, [129, undefined, 129]),
  p("00764011801200", "On Cloudnova – All White",              "On Running","mode",  false, [159.95, 179.9, 159.95]),

  // ── Beauty & Parfum (5) ────────────────────────────────────────────────
  p("00737052766270", "Dior Sauvage Eau de Parfum 100ml",      "Dior",     "beauty", false, [89.95, 99.9, 94.5]),
  p("00361422671355", "Chanel N°5 Eau de Parfum 50ml",         "Chanel",   "beauty", false, [109, undefined, 115]),
  p("00320000002301", "Tom Ford Oud Wood EDP 50ml",            "Tom Ford", "beauty", false, [179, undefined, 189]),
  p("00380000002401", "La Mer Crème de la Mer 60ml",           "La Mer",   "beauty", false, [335, 359]),
  p("00500000002501", "Dyson Airwrap Multi-Styler",            "Dyson",    "beauty", true,  [499, 549]),

  // ── Uhren & Schmuck (3) ────────────────────────────────────────────────
  p("00190000002601", "Apple Watch Ultra 2 49mm Titan",        "Apple",    "uhren",  false, [799, 849]),
  p("00889842002701", "Samsung Galaxy Watch 6 Classic 47mm",   "Samsung",  "uhren",  false, [319, 349, 329]),
  p("00753759002801", "Garmin Venu 3 GPS Smartwatch",          "Garmin",   "uhren",  false, [449, 499]),

  // ── TV & Audio (3) ─────────────────────────────────────────────────────
  p("00887276735399", 'Samsung OLED 4K Smart TV 55" S95D',     "Samsung",  "tv-audio",false,[1399, 1499]),
  p("00027242002901", 'Sony Bravia XR A95L OLED 65"',          "Sony",     "tv-audio",false,[2499, 2699]),
  p("00500000003001", "Sonos Arc Soundbar Dolby Atmos",        "Sonos",    "tv-audio",false,[899, 949]),

  // ── Foto & Video (3) ──────────────────────────────────────────────────
  p("00013803003101", "Canon EOS R6 Mark II Body",             "Canon",    "foto",   false, [2299, 2449]),
  p("00027242003201", "Sony Alpha A7 IV Body",                 "Sony",     "foto",   false, [2199, 2349]),
  p("00190000003301", "DJI Mini 4 Pro Drohne",                 "DJI",      "foto",   false, [759, 829]),

  // ── Sport & Outdoor (4) ────────────────────────────────────────────────
  p("00194501123456", "Garmin Fenix 7X Solar",                 "Garmin",   "sport",  false, [649, 699]),
  p("00190000003401", "Wahoo KICKR Smart Trainer V6",          "Wahoo",    "sport",  false, [1099, 1199]),
  p("00190000003501", "Thule Chariot Cross 2 Kinderanhänger",  "Thule",    "sport",  false, [999, 1099]),
  p("00190000003601", "Mammut Nordwand Advanced HS Jacket",    "Mammut",   "sport",  false, [499, 549]),
];

/**
 * For Prisma seeding: run `npx tsx prisma/seed.ts`
 * This function returns the data in a format ready for Prisma `createMany`.
 */
export function getSeedDataForPrisma() {
  return SEED_PRODUCTS.map((product) => ({
    gtin: product.gtin,
    title: product.title,
    brand: product.brand,
    category: product.category,
    imageUrl: product.imageUrl,
  }));
}
