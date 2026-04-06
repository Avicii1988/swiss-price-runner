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
  Sparkles,
  Tv,
  Baby,
  Dumbbell,
  BookOpen,
  Monitor,
  Pipette,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Category hierarchy – Galaxus-style with drill-down subcategories
// ---------------------------------------------------------------------------

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
  subcategories: SubCategory[];
  productCount: number;
}

/** Top-level sidebar groups – used for the Gesamtsortiment view */
export interface SidebarGroup {
  label: string;
  icon: LucideIcon;
  categorySlugs: string[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  { label: "IT & Multimedia", icon: Monitor, categorySlugs: ["smartphones", "laptops", "kopfhoerer", "tv-audio", "foto"] },
  { label: "Haushalt", icon: Home, categorySlugs: ["haushalt"] },
  { label: "Sport", icon: Dumbbell, categorySlugs: ["sport"] },
  { label: "Mode", icon: Shirt, categorySlugs: ["mode", "schuhe"] },
  { label: "Parfum", icon: Pipette, categorySlugs: ["parfum", "beauty"] },
  { label: "Gaming & Spielzeug", icon: Gamepad2, categorySlugs: ["gaming"] },
  { label: "Baby & Kind", icon: Baby, categorySlugs: ["baby"] },
  { label: "Uhren & Schmuck", icon: Watch, categorySlugs: ["uhren"] },
  { label: "Bücher & Medien", icon: BookOpen, categorySlugs: ["buecher"] },
];

export const CATEGORIES: Category[] = [
  {
    slug: "smartphones",
    name: "Smartphones",
    icon: Smartphone,
    description: "Handys & Zubehör – iPhone, Samsung, Pixel und mehr",
    productCount: 847,
    subcategories: [
      { slug: "smartphones-apple", name: "Apple iPhone", productCount: 124 },
      { slug: "smartphones-samsung", name: "Samsung Galaxy", productCount: 198 },
      { slug: "smartphones-google", name: "Google Pixel", productCount: 45 },
      { slug: "smartphones-xiaomi", name: "Xiaomi", productCount: 156 },
      { slug: "smartphones-cases", name: "Hüllen & Schutzfolien", productCount: 324 },
    ],
  },
  {
    slug: "laptops",
    name: "Laptops & Computer",
    icon: Laptop,
    description: "Notebooks, Desktops, Monitore und Peripherie",
    productCount: 1243,
    subcategories: [
      { slug: "laptops-macbook", name: "Apple MacBook", productCount: 34 },
      { slug: "laptops-windows", name: "Windows Laptops", productCount: 456 },
      { slug: "laptops-gaming", name: "Gaming Laptops", productCount: 123 },
      { slug: "laptops-chromebook", name: "Chromebooks", productCount: 67 },
      { slug: "laptops-monitors", name: "Monitore", productCount: 234 },
      { slug: "laptops-accessories", name: "Zubehör", productCount: 329 },
    ],
  },
  {
    slug: "kopfhoerer",
    name: "Kopfhörer & Audio",
    icon: Headphones,
    description: "Bluetooth, Noise Cancelling, In-Ear und Over-Ear",
    productCount: 632,
    subcategories: [
      { slug: "kopfhoerer-over-ear", name: "Over-Ear", productCount: 145 },
      { slug: "kopfhoerer-in-ear", name: "In-Ear / Earbuds", productCount: 234 },
      { slug: "kopfhoerer-nc", name: "Noise Cancelling", productCount: 89 },
      { slug: "kopfhoerer-sport", name: "Sport & Fitness", productCount: 67 },
      { slug: "kopfhoerer-lautsprecher", name: "Lautsprecher", productCount: 97 },
    ],
  },
  {
    slug: "schuhe",
    name: "Schuhe",
    icon: ShoppingBag,
    description: "Sneakers, Laufschuhe, Wanderschuhe und mehr",
    productCount: 1567,
    subcategories: [
      { slug: "schuhe-sneakers", name: "Sneakers", productCount: 456 },
      { slug: "schuhe-laufschuhe", name: "Laufschuhe", productCount: 234 },
      { slug: "schuhe-wandern", name: "Wanderschuhe", productCount: 178 },
      { slug: "schuhe-on-running", name: "On Running", productCount: 89 },
      { slug: "schuhe-nike", name: "Nike", productCount: 312 },
      { slug: "schuhe-adidas", name: "Adidas", productCount: 298 },
    ],
  },
  {
    slug: "gaming",
    name: "Gaming & Entertainment",
    icon: Gamepad2,
    description: "Konsolen, Spiele, VR-Headsets und Zubehör",
    productCount: 934,
    subcategories: [
      { slug: "gaming-konsolen", name: "Konsolen", productCount: 23 },
      { slug: "gaming-ps5", name: "PlayStation 5", productCount: 145 },
      { slug: "gaming-xbox", name: "Xbox Series", productCount: 134 },
      { slug: "gaming-nintendo", name: "Nintendo Switch", productCount: 189 },
      { slug: "gaming-pc", name: "PC Gaming", productCount: 267 },
      { slug: "gaming-vr", name: "VR Headsets", productCount: 34 },
      { slug: "gaming-zubehoer", name: "Controller & Zubehör", productCount: 142 },
    ],
  },
  {
    slug: "haushalt",
    name: "Haushalt & Küche",
    icon: Home,
    description: "Staubsauger, Küchengeräte, Kaffeemaschinen",
    productCount: 1876,
    subcategories: [
      { slug: "haushalt-staubsauger", name: "Staubsauger", productCount: 234 },
      { slug: "haushalt-kaffee", name: "Kaffeemaschinen", productCount: 189 },
      { slug: "haushalt-kuechengeraete", name: "Küchengeräte", productCount: 345 },
      { slug: "haushalt-luftreiniger", name: "Luftreiniger", productCount: 67 },
      { slug: "haushalt-smart-home", name: "Smart Home", productCount: 234 },
      { slug: "haushalt-waschen", name: "Waschen & Trocknen", productCount: 145 },
    ],
  },
  {
    slug: "mode",
    name: "Mode & Bekleidung",
    icon: Shirt,
    description: "Damen, Herren, Kinder – Markenmode zum besten Preis",
    productCount: 4523,
    subcategories: [
      { slug: "mode-damen", name: "Damenmode", productCount: 1567 },
      { slug: "mode-herren", name: "Herrenmode", productCount: 1234 },
      { slug: "mode-kinder", name: "Kindermode", productCount: 567 },
      { slug: "mode-sport", name: "Sportbekleidung", productCount: 789 },
      { slug: "mode-taschen", name: "Taschen & Accessoires", productCount: 366 },
    ],
  },
  {
    slug: "beauty",
    name: "Beauty & Pflege",
    icon: Sparkles,
    description: "Pflege, Make-up und Wellness",
    productCount: 1545,
    subcategories: [
      { slug: "beauty-pflege", name: "Hautpflege", productCount: 567 },
      { slug: "beauty-makeup", name: "Make-up", productCount: 432 },
      { slug: "beauty-haarpflege", name: "Haarpflege", productCount: 345 },
      { slug: "beauty-wellness", name: "Wellness & Spa", productCount: 200 },
    ],
  },
  {
    slug: "parfum",
    name: "Parfum & Düfte",
    icon: Sparkles,
    description: "Herren- und Damendüfte der Top-Marken zum besten Preis",
    productCount: 890,
    subcategories: [
      { slug: "parfum-herren", name: "Herrendüfte", productCount: 345 },
      { slug: "parfum-damen", name: "Damendüfte", productCount: 456 },
      { slug: "parfum-unisex", name: "Unisex-Düfte", productCount: 89 },
    ],
  },
  {
    slug: "uhren",
    name: "Uhren & Schmuck",
    icon: Watch,
    description: "Smartwatches, Luxusuhren und Schmuck",
    productCount: 876,
    subcategories: [
      { slug: "uhren-smartwatch", name: "Smartwatches", productCount: 234 },
      { slug: "uhren-luxus", name: "Luxusuhren", productCount: 145 },
      { slug: "uhren-sport", name: "Sportuhren", productCount: 167 },
      { slug: "uhren-schmuck", name: "Schmuck", productCount: 330 },
    ],
  },
  {
    slug: "tv-audio",
    name: "TV & Audio",
    icon: Tv,
    description: "Fernseher, Soundbars, Streaming und Hi-Fi",
    productCount: 543,
    subcategories: [
      { slug: "tv-oled", name: "OLED TVs", productCount: 89 },
      { slug: "tv-qled", name: "QLED TVs", productCount: 78 },
      { slug: "tv-soundbar", name: "Soundbars", productCount: 134 },
      { slug: "tv-streaming", name: "Streaming Geräte", productCount: 45 },
      { slug: "tv-hifi", name: "Hi-Fi Systeme", productCount: 97 },
      { slug: "tv-beamer", name: "Beamer", productCount: 100 },
    ],
  },
  {
    slug: "foto",
    name: "Foto & Video",
    icon: Camera,
    description: "Kameras, Objektive, Drohnen und Zubehör",
    productCount: 678,
    subcategories: [
      { slug: "foto-dslr", name: "Spiegelreflex", productCount: 123 },
      { slug: "foto-mirrorless", name: "Systemkameras", productCount: 156 },
      { slug: "foto-drohnen", name: "Drohnen", productCount: 67 },
      { slug: "foto-action", name: "Action Cams", productCount: 89 },
      { slug: "foto-objektive", name: "Objektive", productCount: 243 },
    ],
  },
  {
    slug: "sport",
    name: "Sport & Outdoor",
    icon: Dumbbell,
    description: "Fitness, Velo, Wandern, Ski und Outdoor",
    productCount: 2134,
    subcategories: [
      { slug: "sport-fitness", name: "Fitnessgeräte", productCount: 345 },
      { slug: "sport-velo", name: "Velos & E-Bikes", productCount: 234 },
      { slug: "sport-wandern", name: "Wandern & Trekking", productCount: 345 },
      { slug: "sport-ski", name: "Ski & Snowboard", productCount: 234 },
      { slug: "sport-camping", name: "Camping", productCount: 345 },
      { slug: "sport-wearables", name: "Fitness Tracker", productCount: 167 },
    ],
  },
  {
    slug: "baby",
    name: "Baby & Kind",
    icon: Baby,
    description: "Kinderwagen, Spielzeug, Babyausstattung",
    productCount: 1234,
    subcategories: [
      { slug: "baby-kinderwagen", name: "Kinderwagen", productCount: 189 },
      { slug: "baby-spielzeug", name: "Spielzeug", productCount: 456 },
      { slug: "baby-moebel", name: "Kindermöbel", productCount: 234 },
      { slug: "baby-sicherheit", name: "Autositze", productCount: 145 },
      { slug: "baby-pflege", name: "Babypflege", productCount: 210 },
    ],
  },
  {
    slug: "buecher",
    name: "Bücher & Medien",
    icon: BookOpen,
    description: "Bücher, eBooks, Hörbücher und Filme",
    productCount: 5678,
    subcategories: [
      { slug: "buecher-belletristik", name: "Belletristik", productCount: 1234 },
      { slug: "buecher-sachbuch", name: "Sachbücher", productCount: 987 },
      { slug: "buecher-kinderbuch", name: "Kinderbücher", productCount: 567 },
      { slug: "buecher-ebook", name: "eBook Reader", productCount: 34 },
      { slug: "buecher-filme", name: "Filme & Serien", productCount: 1456 },
      { slug: "buecher-musik", name: "Musik", productCount: 1400 },
    ],
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getAllCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}

/** Find a subcategory by its slug, returning both parent and sub */
export function getSubCategoryBySlug(
  subSlug: string,
): { parent: Category; sub: SubCategory } | undefined {
  for (const cat of CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.slug === subSlug);
    if (sub) return { parent: cat, sub };
  }
  return undefined;
}

/** Parse a [...slug] array into category context */
export function parseCategorySlugs(slugs: string[]): {
  parentCategory: Category | undefined;
  activeSubCategory: SubCategory | undefined;
  breadcrumbs: { label: string; href: string }[];
} {
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Gesamtsortiment", href: "/" },
  ];

  if (slugs.length === 0) {
    return { parentCategory: undefined, activeSubCategory: undefined, breadcrumbs };
  }

  const parentSlug = slugs[0];
  const parentCategory = getCategoryBySlug(parentSlug);
  if (!parentCategory) {
    return { parentCategory: undefined, activeSubCategory: undefined, breadcrumbs };
  }

  breadcrumbs.push({ label: parentCategory.name, href: `/category/${parentSlug}` });

  if (slugs.length < 2) {
    return { parentCategory, activeSubCategory: undefined, breadcrumbs };
  }

  const subSlug = slugs[1];
  const activeSubCategory = parentCategory.subcategories.find(
    (s) => s.slug === subSlug,
  );
  if (activeSubCategory) {
    breadcrumbs.push({
      label: activeSubCategory.name,
      href: `/category/${parentSlug}/${subSlug}`,
    });
  }

  return { parentCategory, activeSubCategory, breadcrumbs };
}

/** Find the SidebarGroup that contains a given category slug */
export function getSidebarGroupForCategory(slug: string): SidebarGroup | undefined {
  return SIDEBAR_GROUPS.find((g) => g.categorySlugs.includes(slug));
}
