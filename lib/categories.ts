import {
  Smartphone,
  Headphones,
  Laptop,
  ShoppingBag,
  Home,
  Gamepad2,
  Shirt,
  Watch,
  Camera,
  Droplets,
  Tv,
  Baby,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// Category taxonomy — 3-level tree (single source of truth).
// Level 1 = root (14 categories, matches sidebar).
// Level 2 = existing subcategories (flat or prefixed slugs).
// Level 3 = brand/concept buckets (NEW — only where meaningful).
// ═══════════════════════════════════════════════════════════════════

export interface CategoryNode {
  /** Leaf slug — unique across the whole tree. Matches Product.category. */
  slug: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  /** Depth: 0 = root, 1 = L2, 2 = L3. */
  depth: number;
  /** Slug of the direct parent (null for roots). */
  parentSlug: string | null;
  children: CategoryNode[];
  productCount: number;
}

/** Input shape for declaring the tree. Depth + parentSlug are computed. */
interface NodeSpec {
  slug: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  productCount?: number;
  children?: NodeSpec[];
}

function buildTree(specs: NodeSpec[], parentSlug: string | null = null, depth = 0): CategoryNode[] {
  return specs.map((s) => ({
    slug: s.slug,
    name: s.name,
    description: s.description,
    icon: s.icon,
    depth,
    parentSlug,
    productCount: s.productCount ?? 0,
    children: buildTree(s.children ?? [], s.slug, depth + 1),
  }));
}

// ───────────────────────────────────────────────────────────────────
// Tree definition
// ───────────────────────────────────────────────────────────────────

const TREE_SPEC: NodeSpec[] = [
  // 1. Parfum & Beauty — flagship vertical (XXL / Parfumsale / Import
  //    Parfumerie / Coop Vitality / Parfum.ch). Every feed in this bucket
  //    is CHF-native, so the L3 brand leaves under Herren/Damen map
  //    directly onto existing CATEGORY_MAP patterns.
  {
    slug: "parfum",
    name: "Parfum & Beauty",
    icon: Droplets,
    description: "Herren- und Damendüfte, Pflege, Make-up und Geschenksets",
    productCount: 16000,
    children: [
      {
        slug: "damendufte",
        name: "Damendüfte",
        children: [
          { slug: "damendufte-floral", name: "Floral" },
          { slug: "damendufte-oriental", name: "Oriental" },
          { slug: "damendufte-zitrus", name: "Zitrus & Frisch" },
        ],
      },
      {
        slug: "herrendufte",
        name: "Herrendüfte",
        children: [
          { slug: "herrendufte-woody", name: "Woody" },
          { slug: "herrendufte-fresh", name: "Frisch" },
          { slug: "herrendufte-oriental", name: "Oriental" },
        ],
      },
      { slug: "unisex-dufte", name: "Unisex" },
      { slug: "parfum-nische", name: "Nischen- & Luxusparfum" },
      { slug: "geschenksets", name: "Geschenksets" },
      { slug: "pflege", name: "Gesichts- & Körperpflege" },
      { slug: "make-up", name: "Make-up" },
      { slug: "haarpflege", name: "Haarpflege" },
      { slug: "koerperpflege", name: "Körperpflege" },
      { slug: "sonnenpflege", name: "Sonnenpflege" },
    ],
  },

  // 2. Mode & Bekleidung — expanded to match Jelmoli Mode / Ackermann
  //    Mode feeds. L3 slugs cover the product types these feeds actually
  //    ship (Kleider, Hemden, Jacken …) so users can drill past the
  //    high-level damen/herren split.
  {
    slug: "mode",
    name: "Mode & Bekleidung",
    icon: Shirt,
    description: "Damen, Herren, Kinder – Markenmode zum besten Preis",
    children: [
      {
        slug: "mode-damen",
        name: "Damenmode",
        children: [
          { slug: "damen-kleider", name: "Kleider" },
          { slug: "damen-oberteile", name: "Oberteile & Blusen" },
          { slug: "damen-hosen", name: "Hosen & Jeans" },
          { slug: "damen-roecke", name: "Röcke" },
          { slug: "damen-jacken", name: "Jacken & Mäntel" },
          { slug: "damen-strick", name: "Strick & Pullover" },
          { slug: "damen-unterwaesche", name: "Unterwäsche & Bademode" },
        ],
      },
      {
        slug: "mode-herren",
        name: "Herrenmode",
        children: [
          { slug: "herren-hemden", name: "Hemden" },
          { slug: "herren-tshirts", name: "T-Shirts & Polos" },
          { slug: "herren-hosen", name: "Hosen & Jeans" },
          { slug: "herren-anzuege", name: "Anzüge & Sakkos" },
          { slug: "herren-jacken", name: "Jacken & Mäntel" },
          { slug: "herren-strick", name: "Strick & Pullover" },
          { slug: "herren-unterwaesche", name: "Unterwäsche & Socken" },
        ],
      },
      { slug: "mode-kinder", name: "Kindermode" },
      { slug: "mode-sport", name: "Sportbekleidung" },
      {
        slug: "mode-taschen",
        name: "Taschen & Accessoires",
        children: [
          { slug: "taschen-handtaschen", name: "Handtaschen" },
          { slug: "taschen-rucksaecke", name: "Rucksäcke" },
          { slug: "taschen-koffer", name: "Koffer & Reisegepäck" },
          { slug: "taschen-geldbeutel", name: "Portemonnaies" },
          { slug: "mode-guertel", name: "Gürtel" },
          { slug: "mode-schals", name: "Schals & Tücher" },
        ],
      },
    ],
  },

  // 3. Schuhe — unchanged structurally, already feed-aligned.
  {
    slug: "schuhe",
    name: "Schuhe",
    icon: ShoppingBag,
    description: "Sneakers, Laufschuhe, Wanderschuhe und mehr",
    children: [
      {
        slug: "schuhe-sneakers",
        name: "Sneakers",
        children: [
          { slug: "sneakers-nike", name: "Nike" },
          { slug: "sneakers-adidas", name: "Adidas" },
          { slug: "sneakers-newbalance", name: "New Balance" },
          { slug: "sneakers-onrunning", name: "On Running" },
          { slug: "sneakers-puma", name: "Puma" },
          { slug: "sneakers-asics", name: "Asics" },
          { slug: "sneakers-hoka", name: "Hoka" },
          { slug: "sneakers-salomon", name: "Salomon" },
        ],
      },
      {
        slug: "schuhe-laufschuhe",
        name: "Laufschuhe",
        children: [
          { slug: "laufschuhe-nike", name: "Nike" },
          { slug: "laufschuhe-onrunning", name: "On Running" },
          { slug: "laufschuhe-asics", name: "Asics" },
        ],
      },
      { slug: "schuhe-wandern", name: "Wanderschuhe" },
      { slug: "schuhe-business", name: "Business- & Lederschuhe" },
      { slug: "schuhe-stiefel", name: "Stiefel" },
      { slug: "schuhe-sandalen", name: "Sandalen" },
      { slug: "schuhe-damen", name: "Damenschuhe" },
      { slug: "schuhe-herren", name: "Herrenschuhe" },
      { slug: "schuhe-kinder", name: "Kinderschuhe" },
    ],
  },

  // 4. Uhren & Schmuck — keep the L1 combined, expand Schmuck L3 so
  //    Bijouteria-shaped queries (ohrringe / halsketten / ringe / etc.)
  //    land on a concrete leaf instead of the flat `uhren-schmuck` node.
  {
    slug: "uhren",
    name: "Uhren & Schmuck",
    icon: Watch,
    description: "Smartwatches, Luxusuhren, Silber- und Goldschmuck",
    children: [
      { slug: "uhren-smartwatch", name: "Smartwatches" },
      { slug: "uhren-luxus", name: "Luxusuhren" },
      { slug: "uhren-sport", name: "Sportuhren" },
      {
        slug: "uhren-schmuck",
        name: "Schmuck",
        children: [
          { slug: "schmuck-ohrringe", name: "Ohrringe" },
          { slug: "schmuck-halsketten", name: "Halsketten & Anhänger" },
          { slug: "schmuck-armbaender", name: "Armbänder & Armreifen" },
          { slug: "schmuck-ringe", name: "Ringe" },
          { slug: "schmuck-eheringe", name: "Ehe- & Verlobungsringe" },
          { slug: "schmuck-piercing", name: "Piercings" },
          { slug: "schmuck-silber", name: "Silberschmuck" },
          { slug: "schmuck-gold", name: "Goldschmuck" },
          { slug: "schmuck-titan", name: "Titanschmuck" },
        ],
      },
    ],
  },

  // 5. Sport & Outdoor — Bergfreunde-driven expansion. Outdoor is the
  //    active catalogue (climbing, hiking, running, skiing, camping)
  //    so we front-load it above fitness / velo.
  {
    slug: "sport",
    name: "Sport & Outdoor",
    icon: Dumbbell,
    description: "Outdoor, Klettern, Wandern, Ski, Fitness und Velo",
    children: [
      { slug: "sport-wandern", name: "Wandern & Trekking" },
      { slug: "sport-klettern", name: "Klettern & Bergsport" },
      { slug: "sport-running", name: "Running & Trailrunning" },
      { slug: "sport-ski", name: "Ski & Snowboard" },
      { slug: "sport-camping", name: "Camping & Zelte" },
      { slug: "sport-fitness", name: "Fitness & Yoga" },
      { slug: "sport-velo", name: "Velos & E-Bikes" },
      { slug: "sport-wassersport", name: "Wassersport & Schwimmen" },
      { slug: "sport-wearables", name: "Fitness Tracker" },
    ],
  },

  // 6. Haushalt & Küche — Ackermann Technik / Jelmoli Technik. Kaffee
  //    gets per-brand L3 because the Swiss catalogue is dense here.
  {
    slug: "haushalt",
    name: "Haushalt & Küche",
    icon: Home,
    description: "Kaffeemaschinen, Küchengeräte, Staubsauger und Waschen",
    children: [
      {
        slug: "haushalt-kaffee",
        name: "Kaffeemaschinen",
        children: [
          { slug: "kaffee-nespresso", name: "Nespresso" },
          { slug: "kaffee-jura", name: "Jura" },
          { slug: "kaffee-delonghi", name: "De'Longhi" },
          { slug: "kaffee-sage", name: "Sage" },
          { slug: "kaffee-melitta", name: "Melitta" },
        ],
      },
      { slug: "haushalt-kuechengeraete", name: "Küchengeräte" },
      { slug: "haushalt-staubsauger", name: "Staubsauger" },
      { slug: "haushalt-waschen", name: "Waschen & Trocknen" },
      { slug: "haushalt-luftreiniger", name: "Luftreiniger" },
      { slug: "haushalt-smart-home", name: "Smart Home" },
      { slug: "haushalt-wohnen", name: "Wohnen & Einrichten" },
      { slug: "haushalt-garten", name: "Garten & Balkon" },
    ],
  },

  // 7. TV & Audio — Jelmoli Technik + part of Ackermann.
  {
    slug: "tv-audio",
    name: "TV & Audio",
    icon: Tv,
    description: "Fernseher, Soundbars, Hi-Fi und Beamer",
    children: [
      { slug: "tv-oled", name: "OLED TVs" },
      { slug: "tv-qled", name: "QLED TVs" },
      { slug: "tv-soundbar", name: "Soundbars" },
      { slug: "tv-hifi", name: "Hi-Fi Systeme" },
      { slug: "tv-streaming", name: "Streaming Geräte" },
      { slug: "tv-beamer", name: "Beamer" },
      { slug: "apple-tv", name: "Apple TV" },
    ],
  },

  // 8. Smartphones
  {
    slug: "smartphones",
    name: "Smartphones & Tablets",
    icon: Smartphone,
    description: "Handys, Tablets und Zubehör",
    children: [
      {
        slug: "smartphones-apple",
        name: "Apple iPhone & iPad",
        children: [
          { slug: "iphone", name: "iPhone Modelle" },
          { slug: "ipad", name: "iPad" },
        ],
      },
      {
        slug: "smartphones-samsung",
        name: "Samsung Galaxy",
        children: [{ slug: "samsung-galaxy", name: "Galaxy Serie" }],
      },
      { slug: "smartphones-google", name: "Google Pixel" },
      { slug: "smartphones-xiaomi", name: "Xiaomi" },
      { slug: "smartphones-tablets", name: "Tablets (Android / Huawei / Lenovo)" },
      { slug: "smartphones-wearables", name: "Smart Wearables" },
      { slug: "smartphones-cases", name: "Hüllen & Schutzfolien" },
      { slug: "smartphones-zubehoer", name: "Ladekabel & Zubehör" },
    ],
  },

  // 9. Laptops & Computer
  {
    slug: "laptops",
    name: "Laptops & Computer",
    icon: Laptop,
    description: "Notebooks, Desktops, Monitore und Peripherie",
    children: [
      { slug: "laptops-macbook", name: "Apple MacBook" },
      {
        slug: "laptops-windows",
        name: "Windows Laptops",
        children: [{ slug: "laptops-gaming", name: "Gaming Laptops" }],
      },
      { slug: "laptops-chromebook", name: "Chromebooks" },
      { slug: "laptops-monitors", name: "Monitore" },
      { slug: "laptops-accessories", name: "Zubehör" },
    ],
  },

  // 10. Kopfhörer & Audio
  {
    slug: "kopfhoerer",
    name: "Kopfhörer & Audio",
    icon: Headphones,
    description: "Bluetooth, Noise Cancelling, In-Ear und Over-Ear",
    children: [
      { slug: "kopfhoerer-over-ear", name: "Over-Ear" },
      { slug: "kopfhoerer-in-ear", name: "In-Ear / Earbuds" },
      { slug: "kopfhoerer-nc", name: "Noise Cancelling" },
      { slug: "kopfhoerer-sport", name: "Sport & Fitness" },
      { slug: "kopfhoerer-lautsprecher", name: "Lautsprecher" },
      { slug: "airpods", name: "Apple AirPods" },
      { slug: "homepod", name: "Apple HomePod" },
    ],
  },

  // 11. Foto & Video
  {
    slug: "foto",
    name: "Foto & Video",
    icon: Camera,
    description: "Kameras, Objektive, Drohnen und Zubehör",
    children: [
      { slug: "foto-dslr", name: "Spiegelreflex" },
      { slug: "foto-mirrorless", name: "Systemkameras" },
      { slug: "foto-drohnen", name: "Drohnen" },
      { slug: "foto-action", name: "Action Cams" },
      { slug: "foto-objektive", name: "Objektive" },
    ],
  },

  // 12. Gaming & Entertainment
  {
    slug: "gaming",
    name: "Gaming & Entertainment",
    icon: Gamepad2,
    description: "Konsolen, Spiele, VR-Headsets und Zubehör",
    children: [
      { slug: "gaming-ps5", name: "PlayStation 5" },
      { slug: "gaming-xbox", name: "Xbox Series" },
      { slug: "gaming-nintendo", name: "Nintendo Switch" },
      { slug: "gaming-konsolen", name: "Konsolen" },
      { slug: "gaming-pc", name: "PC Gaming" },
      { slug: "gaming-vr", name: "VR Headsets" },
      { slug: "gaming-zubehoer", name: "Controller & Zubehör" },
    ],
  },

  // 13. Baby & Kind
  {
    slug: "baby",
    name: "Baby & Kind",
    icon: Baby,
    description: "Kinderwagen, Spielzeug, Babyausstattung",
    children: [
      { slug: "baby-kinderwagen", name: "Kinderwagen" },
      { slug: "baby-spielzeug", name: "Spielzeug" },
      { slug: "baby-moebel", name: "Kindermöbel" },
      { slug: "baby-sicherheit", name: "Autositze" },
      { slug: "baby-pflege", name: "Babypflege" },
    ],
  },
];

/** Built tree — primary export for navigation, breadcrumbs, importer. */
export const CATEGORY_TREE: CategoryNode[] = buildTree(TREE_SPEC);

// ───────────────────────────────────────────────────────────────────
// Tree walkers
// ───────────────────────────────────────────────────────────────────

/** Depth-first search. Returns the first node whose slug matches. */
export function findCategoryNode(slug: string): CategoryNode | undefined {
  const stack: CategoryNode[] = [...CATEGORY_TREE];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (n.slug === slug) return n;
    for (const c of n.children) stack.push(c);
  }
  return undefined;
}

/** Return the chain root → … → node (inclusive). Empty array if slug unknown. */
export function getAncestors(slug: string): CategoryNode[] {
  const node = findCategoryNode(slug);
  if (!node) return [];
  const chain: CategoryNode[] = [node];
  let current = node;
  while (current.parentSlug) {
    const parent = findCategoryNode(current.parentSlug);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** Full path as slug list, root-first. e.g. ["schuhe","schuhe-sneakers","sneakers-nike"]. */
export function getCategoryPath(slug: string): string[] {
  return getAncestors(slug).map((n) => n.slug);
}

/** Flat list of every node in the tree. */
export function getAllCategoryNodes(): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (nodes: CategoryNode[]) => {
    for (const n of nodes) { out.push(n); walk(n.children); }
  };
  walk(CATEGORY_TREE);
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// Legacy-compatible exports (2-level Category + SubCategory)
// Keeps the existing UI components working without change.
// ═══════════════════════════════════════════════════════════════════

export interface SubCategory {
  slug: string;
  name: string;
  productCount: number;
}

export interface Category {
  slug: string;
  name: string;
  icon: LucideIcon;
  description: string;
  /** Flattened L2 + L3 combined, ordered depth-first. */
  subcategories: SubCategory[];
  productCount: number;
}

/**
 * Legacy view — L2 subcategories ONLY. L3 is hidden from sidebars/menus to
 * keep the UI compact; L3 nodes are still reachable via direct URL
 * (parseCategorySlugs resolves them) and via findCategoryNode(l2).children.
 */
export const CATEGORIES: Category[] = CATEGORY_TREE.map((root) => ({
  slug: root.slug,
  name: root.name,
  icon: root.icon ?? ShoppingBag,
  description: root.description ?? "",
  productCount: root.productCount,
  subcategories: root.children.map((c) => ({
    slug: c.slug,
    name: c.name,
    productCount: c.productCount,
  })),
}));

export function getCategoryBySlug(slug: string): Category | undefined {
  // Legacy "beauty" alias
  if (slug === "beauty") return CATEGORIES.find((c) => c.slug === "parfum");
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Sidebar display order — ranked by real feed coverage. Lifestyle
 * verticals (parfum, mode, schuhe, uhren/schmuck, outdoor) sit at the
 * top because that's where the catalogue density is, tech + appliance
 * verticals follow, niche surfaces (baby) anchor the bottom. Any slug
 * not resolved in CATEGORIES is silently dropped by the filter below,
 * so trimming old L1s (buecher) does not break the sidebar.
 */
const SIDEBAR_ORDER = [
  "parfum", "mode", "schuhe", "uhren", "sport",
  "haushalt", "tv-audio",
  "smartphones", "laptops", "kopfhoerer", "foto", "gaming",
  "baby",
];

export const SIDEBAR_CATEGORIES: Category[] = SIDEBAR_ORDER
  .map((slug) => CATEGORIES.find((c) => c.slug === slug))
  .filter((c): c is Category => c !== undefined);

export function getAllCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}

/** Legacy lookup — finds parent+sub for a given (non-root) subcategory slug. */
export function getSubCategoryBySlug(
  subSlug: string,
): { parent: Category; sub: SubCategory } | undefined {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.slug === subSlug);
    if (sub) return { parent: cat, sub };
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════
// URL resolution — /category/[...slug] → breadcrumb + active nodes
// Supports 1, 2, and 3-level paths, plus "flat" legacy URLs where only
// a leaf slug is given (e.g. /category/damendufte).
// ═══════════════════════════════════════════════════════════════════

export interface CategoryResolution {
  /** Top-level (depth=0) category — always set if any match found. */
  parentCategory: Category | undefined;
  /** The currently-viewed sub or sub-sub (depth 1+), or undefined for root. */
  activeSubCategory: SubCategory | undefined;
  /** Active L3 node (depth=2) if URL is 3-level, else undefined. */
  activeLeafNode: CategoryNode | undefined;
  breadcrumbs: { label: string; href: string }[];
}

export function parseCategorySlugs(slugs: string[]): CategoryResolution {
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Gesamtsortiment", href: "/" },
  ];

  if (slugs.length === 0) {
    return {
      parentCategory: undefined,
      activeSubCategory: undefined,
      activeLeafNode: undefined,
      breadcrumbs,
    };
  }

  // Walk slugs greedily against the tree. Each slug can be:
  //   a) a direct child of the previous one (hierarchical URL)
  //   b) a leaf slug anywhere in the tree (legacy flat URL)
  const resolved: CategoryNode[] = [];
  let current: CategoryNode | undefined;
  for (const slug of slugs) {
    const next = current
      ? current.children.find((c) => c.slug === slug) ?? findCategoryNode(slug)
      : findCategoryNode(slug);
    if (!next) break;
    resolved.push(next);
    current = next;
  }

  if (resolved.length === 0) {
    return {
      parentCategory: undefined,
      activeSubCategory: undefined,
      activeLeafNode: undefined,
      breadcrumbs,
    };
  }

  // If the first resolved node is not a root, walk its ancestors for breadcrumbs.
  const rootChain = getAncestors(resolved[0].slug);
  const fullChain: CategoryNode[] = [];
  const seen = new Set<string>();
  for (const n of [...rootChain, ...resolved]) {
    if (!seen.has(n.slug)) { fullChain.push(n); seen.add(n.slug); }
  }

  // Build breadcrumbs — each segment links to its canonical hierarchical URL.
  let href = "";
  for (const n of fullChain) {
    href += `/${n.slug}`;
    breadcrumbs.push({ label: n.name, href: `/category${href}` });
  }

  const parentNode = fullChain[0];
  const parentCategory = getCategoryBySlug(parentNode.slug);
  const last = fullChain[fullChain.length - 1];

  const activeSubCategory =
    last.depth >= 1
      ? { slug: last.slug, name: last.name, productCount: last.productCount }
      : undefined;

  const activeLeafNode = last.depth === 2 ? last : undefined;

  return { parentCategory, activeSubCategory, activeLeafNode, breadcrumbs };
}
