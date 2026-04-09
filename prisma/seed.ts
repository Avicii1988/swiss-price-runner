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
  categoryName?: string;
  imageUrl: string;
  featured: boolean;
  shopName?: string;
  sourceType?: string;
  affiliateUrl?: string;
  sources: MockSource[];
}

type SeedProduct = MockProduct;

// Product images — verified working URLs from brand CDNs and Unsplash
const IMAGES: Record<string, string> = {
  // ── Smartphones ────────────────────────────────────────────────────────
  "00194253715085": "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&h=400&fit=crop",
  "00889842640885": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
  "00840080520049": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
  "00690000000001": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
  "00194253000100": "https://images.unsplash.com/photo-1699839482388-a941d4681b59?w=400&h=400&fit=crop",
  "00889842000200": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
  // ── Laptops & Computer ─────────────────────────────────────────────────
  "00194253392828": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop",
  "00196188000301": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop",
  "00889842000400": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
  "00195553000501": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=400&fit=crop",
  "00194253000600": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
  // ── Kopfhörer & Audio ──────────────────────────────────────────────────
  "00027242923379": "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
  "00885909961009": "https://images.unsplash.com/photo-1588423771073-b8903fde1c94?w=400&h=400&fit=crop",
  "00810028588103": "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop",
  "00054651000701": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  "00054651000702": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
  // ── Schuhe ─────────────────────────────────────────────────────────────
  "00764011644505": "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
  "00764011644260": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
  "00194500000801": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=400&h=400&fit=crop",
  "00401938000901": "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop",
  "00190000001001": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=400&fit=crop",
  "00764011001101": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
  // ── Gaming & Entertainment ─────────────────────────────────────────────
  "00045496883386": "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop",
  "00711719565185": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
  "00889842001201": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=400&fit=crop",
  "00301000001301": "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=400&fit=crop",
  "00045496001401": "https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=400&h=400&fit=crop",
  // ── Haushalt & Küche ───────────────────────────────────────────────────
  "00050946000282": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop",
  "00196337069534": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
  "00885609001501": "https://images.unsplash.com/photo-1594385208149-74e361fe4015?w=400&h=400&fit=crop",
  "00408800001601": "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
  "00500000001701": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
  "00196337001801": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop",
  // ── Mode & Bekleidung ──────────────────────────────────────────────────
  "00400000001901": "https://images.unsplash.com/photo-1544923246-77307dd270c6?w=400&h=400&fit=crop",
  "00889842002001": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop",
  "00889842002101": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
  "00764011002201": "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=400&h=400&fit=crop",
  "00193145100100": "https://images.unsplash.com/photo-1600269112346-948e46d4f7b8?w=400&h=400&fit=crop",
  "00401938500200": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400&h=400&fit=crop",
  "00501003600300": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
  "00886668800400": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop",
  "00194500700500": "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=400&h=400&fit=crop",
  "00401938700600": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
  "00194500700700": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
  "00501003700800": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
  "00886668800900": "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop&q=90",
  "00400000801000": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
  "00889842801100": "https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=400&h=400&fit=crop",
  "00764011801200": "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop",
  // ── Parfum & Düfte ─────────────────────────────────────────────────────
  "00737052766270": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
  "00361422671355": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=400&fit=crop",
  "00320000002301": "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400&h=400&fit=crop",
  "00360000005001": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop",
  "00360000005002": "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop",
  "00360000005003": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
  "00360000005004": "https://images.unsplash.com/photo-1594035910387-fea081ae7295?w=400&h=400&fit=crop",
  "00360000005005": "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop",
  "00360000005006": "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=400&h=400&fit=crop",
  "00360000005007": "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=400&h=400&fit=crop",
  "00360000005008": "https://images.unsplash.com/photo-1595425964272-fc617fa11ed3?w=400&h=400&fit=crop",
  "00360000005009": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=400&fit=crop",
  // ── Beauty & Pflege ────────────────────────────────────────────────────
  "00380000002401": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  "00500000002501": "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
  // ── Uhren & Schmuck ────────────────────────────────────────────────────
  "00190000002601": "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
  "00889842002701": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
  "00753759002801": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=400&fit=crop",
  // ── TV & Audio ─────────────────────────────────────────────────────────
  "00887276735399": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
  "00027242002901": "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&fit=crop",
  "00500000003001": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop",
  // ── Foto & Video ───────────────────────────────────────────────────────
  "00013803003101": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
  "00027242003201": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=400&fit=crop",
  "00190000003301": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=400&fit=crop",
  // ── Sport & Outdoor ────────────────────────────────────────────────────
  "00194501123456": "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=400&h=400&fit=crop",
  "00190000003401": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop",
  "00190000003501": "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop",
  "00190000003601": "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
};

function p(
  gtin: string,
  title: string,
  brand: string,
  category: string,
  featured: boolean,
  sources: [eur: number, eur?: number, eur?: number],
): SeedProduct {
  // Use mapped image; fallback to category-specific Unsplash photo
  const FALLBACKS: Record<string, string> = {
    smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    kopfhoerer: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    schuhe: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    gaming: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
    haushalt: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    mode: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
    parfum: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
    beauty: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop",
    uhren: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop",
    "tv-audio": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    foto: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop",
    sport: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop",
    baby: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
    buecher: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
  };
  const img = IMAGES[gtin] ?? FALLBACKS[category] ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop";
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

  // ── Parfum (12) ─────────────────────────────────────────────────────────
  p("00737052766270", "Dior Sauvage Eau de Parfum 100ml",            "Dior",        "parfum", true,  [89.95, 109.9, 94.5]),
  p("00361422671355", "Chanel N°5 Eau de Parfum 50ml",               "Chanel",      "parfum", true,  [109, 129.9, 115]),
  p("00320000002301", "Tom Ford Oud Wood EDP 50ml",                  "Tom Ford",    "parfum", false, [179, 209.9, 189]),
  p("00360000005001", "Lancôme La Vie Est Belle EDP 75ml",           "Lancôme",     "parfum", true,  [79.95, 99.9, 84.5]),
  p("00360000005002", "Yves Saint Laurent Libre EDP 90ml",           "YSL",         "parfum", false, [89.95, 109.9, 94.5]),
  p("00360000005003", "Chanel Chance Eau Tendre EDT 100ml",          "Chanel",      "parfum", false, [99.95, 119.9, 105]),
  p("00360000005004", "Giorgio Armani Acqua di Giò Profondo 75ml",   "Armani",      "parfum", false, [69.95, 89.9, 74.5]),
  p("00360000005005", "Hugo Boss Bottled EDP 100ml",                 "Hugo Boss",   "parfum", false, [59.95, 79.9, 64.5]),
  p("00360000005006", "Versace Eros EDT 100ml",                      "Versace",     "parfum", false, [54.95, 69.9, 59.5]),
  p("00360000005007", "Prada Luna Rossa Carbon EDT 100ml",           "Prada",       "parfum", false, [74.95, 89.9, 79.5]),
  p("00360000005008", "Dolce & Gabbana Light Blue EDT 100ml",        "D&G",         "parfum", false, [49.95, 64.9, 54.5]),
  p("00360000005009", "Jean Paul Gaultier Le Male Elixir 125ml",     "JPG",         "parfum", false, [84.95, 99.9, 89.5]),

  // ── Beauty & Pflege (2) ────────────────────────────────────────────────
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
