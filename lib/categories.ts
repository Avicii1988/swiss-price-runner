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
  BookOpen,
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
  // 1. Smartphones
  {
    slug: "smartphones",
    name: "Smartphones",
    icon: Smartphone,
    description: "Handys & Zubehör – iPhone, Samsung, Pixel und mehr",
    productCount: 847,
    children: [
      {
        slug: "smartphones-apple",
        name: "Apple iPhone",
        productCount: 124,
        children: [
          { slug: "iphone", name: "iPhone Modelle" },
          { slug: "ipad", name: "iPad" },
        ],
      },
      {
        slug: "smartphones-samsung",
        name: "Samsung Galaxy",
        productCount: 198,
        children: [{ slug: "samsung-galaxy", name: "Galaxy Serie" }],
      },
      { slug: "smartphones-google", name: "Google Pixel", productCount: 45 },
      { slug: "smartphones-xiaomi", name: "Xiaomi", productCount: 156 },
      { slug: "smartphones-cases", name: "Hüllen & Schutzfolien", productCount: 324 },
    ],
  },
  // 2. Laptops & Computer
  {
    slug: "laptops",
    name: "Laptops & Computer",
    icon: Laptop,
    description: "Notebooks, Desktops, Monitore und Peripherie",
    productCount: 1243,
    children: [
      { slug: "laptops-macbook", name: "Apple MacBook", productCount: 34 },
      {
        slug: "laptops-windows",
        name: "Windows Laptops",
        productCount: 456,
        children: [{ slug: "laptops-gaming", name: "Gaming Laptops", productCount: 123 }],
      },
      { slug: "laptops-chromebook", name: "Chromebooks", productCount: 67 },
      { slug: "laptops-monitors", name: "Monitore", productCount: 234 },
      { slug: "laptops-accessories", name: "Zubehör", productCount: 329 },
    ],
  },
  // 3. Kopfhörer & Audio
  {
    slug: "kopfhoerer",
    name: "Kopfhörer & Audio",
    icon: Headphones,
    description: "Bluetooth, Noise Cancelling, In-Ear und Over-Ear",
    productCount: 632,
    children: [
      { slug: "kopfhoerer-over-ear", name: "Over-Ear", productCount: 145 },
      { slug: "kopfhoerer-in-ear", name: "In-Ear / Earbuds", productCount: 234 },
      { slug: "kopfhoerer-nc", name: "Noise Cancelling", productCount: 89 },
      { slug: "kopfhoerer-sport", name: "Sport & Fitness", productCount: 67 },
      { slug: "kopfhoerer-lautsprecher", name: "Lautsprecher", productCount: 97 },
      { slug: "airpods", name: "Apple AirPods", productCount: 0 },
      { slug: "homepod", name: "Apple HomePod", productCount: 0 },
    ],
  },
  // 4. Schuhe
  {
    slug: "schuhe",
    name: "Schuhe",
    icon: ShoppingBag,
    description: "Sneakers, Laufschuhe, Wanderschuhe und mehr",
    productCount: 1567,
    children: [
      {
        slug: "schuhe-sneakers",
        name: "Sneakers",
        productCount: 456,
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
        productCount: 234,
        children: [
          { slug: "laufschuhe-nike", name: "Nike" },
          { slug: "laufschuhe-onrunning", name: "On Running" },
          { slug: "laufschuhe-asics", name: "Asics" },
        ],
      },
      { slug: "schuhe-wandern", name: "Wanderschuhe", productCount: 178 },
      { slug: "schuhe-damen", name: "Damenschuhe", productCount: 0 },
      { slug: "schuhe-herren", name: "Herrenschuhe", productCount: 0 },
    ],
  },
  // 5. Gaming & Entertainment
  {
    slug: "gaming",
    name: "Gaming & Entertainment",
    icon: Gamepad2,
    description: "Konsolen, Spiele, VR-Headsets und Zubehör",
    productCount: 934,
    children: [
      { slug: "gaming-konsolen", name: "Konsolen", productCount: 23 },
      { slug: "gaming-ps5", name: "PlayStation 5", productCount: 145 },
      { slug: "gaming-xbox", name: "Xbox Series", productCount: 134 },
      { slug: "gaming-nintendo", name: "Nintendo Switch", productCount: 189 },
      { slug: "gaming-pc", name: "PC Gaming", productCount: 267 },
      { slug: "gaming-vr", name: "VR Headsets", productCount: 34 },
      { slug: "gaming-zubehoer", name: "Controller & Zubehör", productCount: 142 },
    ],
  },
  // 6. Haushalt & Küche
  {
    slug: "haushalt",
    name: "Haushalt & Küche",
    icon: Home,
    description: "Staubsauger, Küchengeräte, Kaffeemaschinen",
    productCount: 1876,
    children: [
      { slug: "haushalt-staubsauger", name: "Staubsauger", productCount: 234 },
      { slug: "haushalt-kaffee", name: "Kaffeemaschinen", productCount: 189 },
      { slug: "haushalt-kuechengeraete", name: "Küchengeräte", productCount: 345 },
      { slug: "haushalt-luftreiniger", name: "Luftreiniger", productCount: 67 },
      { slug: "haushalt-smart-home", name: "Smart Home", productCount: 234 },
      { slug: "haushalt-waschen", name: "Waschen & Trocknen", productCount: 145 },
    ],
  },
  // 7. Mode & Bekleidung
  {
    slug: "mode",
    name: "Mode & Bekleidung",
    icon: Shirt,
    description: "Damen, Herren, Kinder – Markenmode zum besten Preis",
    productCount: 4523,
    children: [
      { slug: "mode-damen", name: "Damenmode", productCount: 1567 },
      { slug: "mode-herren", name: "Herrenmode", productCount: 1234 },
      { slug: "mode-kinder", name: "Kindermode", productCount: 567 },
      { slug: "mode-sport", name: "Sportbekleidung", productCount: 789 },
      { slug: "mode-taschen", name: "Taschen & Accessoires", productCount: 366 },
    ],
  },
  // 8. Parfum & Düfte
  {
    slug: "parfum",
    name: "Parfum & Düfte",
    icon: Droplets,
    description: "Herren- und Damendüfte, Beauty und Pflege",
    productCount: 16000,
    children: [
      {
        slug: "damendufte",
        name: "Damendüfte",
        productCount: 0,
        children: [
          { slug: "damendufte-floral", name: "Floral" },
          { slug: "damendufte-oriental", name: "Oriental" },
          { slug: "damendufte-zitrus", name: "Zitrus & Frisch" },
        ],
      },
      {
        slug: "herrendufte",
        name: "Herrendüfte",
        productCount: 0,
        children: [
          { slug: "herrendufte-woody", name: "Woody" },
          { slug: "herrendufte-fresh", name: "Frisch" },
          { slug: "herrendufte-oriental", name: "Oriental" },
        ],
      },
      { slug: "unisex-dufte", name: "Unisex", productCount: 0 },
      { slug: "parfum-nische", name: "Nischen- & Luxusparfum", productCount: 0 },
      { slug: "geschenksets", name: "Geschenksets", productCount: 0 },
      { slug: "pflege", name: "Gesichts- & Körperpflege", productCount: 0 },
      { slug: "make-up", name: "Make-up", productCount: 0 },
      { slug: "haarpflege", name: "Haarpflege", productCount: 0 },
      { slug: "koerperpflege", name: "Körperpflege", productCount: 0 },
      { slug: "sonnenpflege", name: "Sonnenpflege", productCount: 0 },
    ],
  },
  // 9. Uhren & Schmuck
  {
    slug: "uhren",
    name: "Uhren & Schmuck",
    icon: Watch,
    description: "Smartwatches, Luxusuhren und Schmuck",
    productCount: 876,
    children: [
      { slug: "uhren-smartwatch", name: "Smartwatches", productCount: 234 },
      { slug: "uhren-luxus", name: "Luxusuhren", productCount: 145 },
      { slug: "uhren-sport", name: "Sportuhren", productCount: 167 },
      { slug: "uhren-schmuck", name: "Schmuck", productCount: 330 },
    ],
  },
  // 10. TV & Audio
  {
    slug: "tv-audio",
    name: "TV & Audio",
    icon: Tv,
    description: "Fernseher, Soundbars, Streaming und Hi-Fi",
    productCount: 543,
    children: [
      { slug: "tv-oled", name: "OLED TVs", productCount: 89 },
      { slug: "tv-qled", name: "QLED TVs", productCount: 78 },
      { slug: "tv-soundbar", name: "Soundbars", productCount: 134 },
      { slug: "tv-streaming", name: "Streaming Geräte", productCount: 45 },
      { slug: "tv-hifi", name: "Hi-Fi Systeme", productCount: 97 },
      { slug: "tv-beamer", name: "Beamer", productCount: 100 },
    ],
  },
  // 11. Foto & Video
  {
    slug: "foto",
    name: "Foto & Video",
    icon: Camera,
    description: "Kameras, Objektive, Drohnen und Zubehör",
    productCount: 678,
    children: [
      { slug: "foto-dslr", name: "Spiegelreflex", productCount: 123 },
      { slug: "foto-mirrorless", name: "Systemkameras", productCount: 156 },
      { slug: "foto-drohnen", name: "Drohnen", productCount: 67 },
      { slug: "foto-action", name: "Action Cams", productCount: 89 },
      { slug: "foto-objektive", name: "Objektive", productCount: 243 },
    ],
  },
  // 12. Sport & Outdoor
  {
    slug: "sport",
    name: "Sport & Outdoor",
    icon: Dumbbell,
    description: "Fitness, Velo, Wandern, Ski und Outdoor",
    productCount: 2134,
    children: [
      { slug: "sport-fitness", name: "Fitnessgeräte", productCount: 345 },
      { slug: "sport-velo", name: "Velos & E-Bikes", productCount: 234 },
      { slug: "sport-wandern", name: "Wandern & Trekking", productCount: 345 },
      { slug: "sport-ski", name: "Ski & Snowboard", productCount: 234 },
      { slug: "sport-camping", name: "Camping", productCount: 345 },
      { slug: "sport-wearables", name: "Fitness Tracker", productCount: 167 },
    ],
  },
  // 13. Baby & Kind
  {
    slug: "baby",
    name: "Baby & Kind",
    icon: Baby,
    description: "Kinderwagen, Spielzeug, Babyausstattung",
    productCount: 1234,
    children: [
      { slug: "baby-kinderwagen", name: "Kinderwagen", productCount: 189 },
      { slug: "baby-spielzeug", name: "Spielzeug", productCount: 456 },
      { slug: "baby-moebel", name: "Kindermöbel", productCount: 234 },
      { slug: "baby-sicherheit", name: "Autositze", productCount: 145 },
      { slug: "baby-pflege", name: "Babypflege", productCount: 210 },
    ],
  },
  // 14. Bücher & Medien
  {
    slug: "buecher",
    name: "Bücher & Medien",
    icon: BookOpen,
    description: "Bücher, eBooks, Hörbücher und Filme",
    productCount: 5678,
    children: [
      { slug: "buecher-belletristik", name: "Belletristik", productCount: 1234 },
      { slug: "buecher-sachbuch", name: "Sachbücher", productCount: 987 },
      { slug: "buecher-kinderbuch", name: "Kinderbücher", productCount: 567 },
      { slug: "buecher-ebook", name: "eBook Reader", productCount: 34 },
      { slug: "buecher-filme", name: "Filme & Serien", productCount: 1456 },
      { slug: "buecher-musik", name: "Musik", productCount: 1400 },
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

/** Sidebar display order — main content first, tech later, niche last. */
const SIDEBAR_ORDER = [
  "parfum", "mode", "schuhe", "uhren", "sport", "haushalt", "baby",
  "smartphones", "laptops", "kopfhoerer", "tv-audio", "foto", "gaming", "buecher",
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
