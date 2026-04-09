import {
  Smartphone, Laptop, Headphones, ShoppingBag, Gamepad2, Home, Shirt,
  Droplets, Watch, Tv, Camera, Dumbbell, Baby, BookOpen, Sparkles,
  Scissors, Flower2, Heart, Package,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon mapping for category slugs.
 * Covers both the 14 master categories and common feed categories.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Master categories
  smartphones: Smartphone,
  laptops: Laptop,
  kopfhoerer: Headphones,
  schuhe: ShoppingBag,
  gaming: Gamepad2,
  haushalt: Home,
  mode: Shirt,
  parfum: Droplets,
  uhren: Watch,
  "tv-audio": Tv,
  foto: Camera,
  sport: Dumbbell,
  baby: Baby,
  buecher: BookOpen,

  // Common feed categories (Adtraction / perfume)
  beauty: Sparkles,
  skincare: Heart,
  makeup: Sparkles,
  "make-up": Sparkles,
  haarpflege: Scissors,
  "hair-care": Scissors,
  herrendufte: Droplets,
  "men-s-fragrances": Droplets,
  damendufte: Flower2,
  "women-s-fragrances": Flower2,
  "unisex-dufte": Droplets,
  pflege: Heart,
  wellness: Sparkles,
  accessoires: ShoppingBag,
  taschen: ShoppingBag,
};

/** Get icon for a category slug, with fallback */
export function getCategoryIcon(slug: string): LucideIcon {
  return ICON_MAP[slug] ?? Package;
}

/** Prettify a slug into a display name */
export function prettifySlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Decode common HTML entities in product titles from XML feeds */
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
