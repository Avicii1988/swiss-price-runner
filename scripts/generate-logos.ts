#!/usr/bin/env tsx
/**
 * Generate clean SVG brand logos with the brand initial + a curated
 * brand colour. These are lightweight (~300 bytes each), load instantly,
 * and serve as a reliable fallback when external APIs (Google, Clearbit)
 * are unreachable.
 *
 * Output: public/logos/brands/<slug>.svg
 *
 * Usage:
 *   npx tsx scripts/generate-logos.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const OUT_DIR = join(process.cwd(), "public", "logos", "brands");

interface BrandDef {
  slug: string;
  initial: string;
  color: string;
}

const BRANDS: BrandDef[] = [
  // Tech
  { slug: "apple", initial: "A", color: "#555555" },
  { slug: "samsung", initial: "S", color: "#1428A0" },
  { slug: "sony", initial: "S", color: "#000000" },
  { slug: "lg", initial: "LG", color: "#A50034" },
  { slug: "google", initial: "G", color: "#4285F4" },
  { slug: "microsoft", initial: "M", color: "#00A4EF" },
  { slug: "huawei", initial: "H", color: "#CF0A2C" },
  { slug: "xiaomi", initial: "X", color: "#FF6900" },
  { slug: "lenovo", initial: "L", color: "#E2231A" },
  { slug: "asus", initial: "A", color: "#00539B" },
  { slug: "dell", initial: "D", color: "#007DB8" },
  { slug: "hp", initial: "HP", color: "#0096D6" },
  { slug: "bose", initial: "B", color: "#000000" },
  { slug: "sennheiser", initial: "S", color: "#000000" },
  { slug: "jbl", initial: "J", color: "#FF6300" },
  { slug: "dyson", initial: "D", color: "#6B3FA0" },
  // Fashion
  { slug: "nike", initial: "N", color: "#111111" },
  { slug: "adidas", initial: "A", color: "#000000" },
  { slug: "new-balance", initial: "NB", color: "#CF0A2C" },
  { slug: "on-running", initial: "On", color: "#000000" },
  { slug: "puma", initial: "P", color: "#000000" },
  { slug: "asics", initial: "A", color: "#003087" },
  { slug: "hoka", initial: "H", color: "#005DA2" },
  { slug: "salomon", initial: "S", color: "#0062A6" },
  { slug: "hugo-boss", initial: "HB", color: "#000000" },
  { slug: "ralph-lauren", initial: "RL", color: "#041E42" },
  { slug: "tommy-hilfiger", initial: "TH", color: "#C8102E" },
  { slug: "lacoste", initial: "L", color: "#004526" },
  { slug: "calvin-klein", initial: "CK", color: "#000000" },
  { slug: "michael-kors", initial: "MK", color: "#000000" },
  // Beauty
  { slug: "dior", initial: "D", color: "#000000" },
  { slug: "chanel", initial: "C", color: "#000000" },
  { slug: "guerlain", initial: "G", color: "#1C2951" },
  { slug: "tom-ford", initial: "TF", color: "#000000" },
  { slug: "ysl", initial: "YSL", color: "#000000" },
  { slug: "lancome", initial: "L", color: "#000000" },
  { slug: "estee-lauder", initial: "EL", color: "#002F6C" },
  { slug: "paco-rabanne", initial: "PR", color: "#C5A258" },
  { slug: "versace", initial: "V", color: "#000000" },
  { slug: "dolce-gabbana", initial: "DG", color: "#000000" },
  { slug: "creed", initial: "C", color: "#0A3161" },
  { slug: "byredo", initial: "B", color: "#000000" },
  { slug: "le-labo", initial: "LL", color: "#000000" },
  { slug: "diptyque", initial: "D", color: "#000000" },
  // Outdoor
  { slug: "mammut", initial: "M", color: "#D62E25" },
  { slug: "patagonia", initial: "P", color: "#1C3E72" },
  { slug: "the-north-face", initial: "TNF", color: "#000000" },
  { slug: "arc-teryx", initial: "A", color: "#000000" },
  { slug: "fjallraven", initial: "F", color: "#D75920" },
  { slug: "deuter", initial: "D", color: "#004B8D" },
  { slug: "osprey", initial: "O", color: "#003C71" },
  { slug: "jack-wolfskin", initial: "JW", color: "#FFD100" },
  // Haushalt
  { slug: "nespresso", initial: "N", color: "#000000" },
  { slug: "jura", initial: "J", color: "#000000" },
  { slug: "delonghi", initial: "DL", color: "#1D428A" },
  { slug: "kitchenaid", initial: "KA", color: "#B31B1B" },
  { slug: "miele", initial: "M", color: "#8B0000" },
  { slug: "bosch", initial: "B", color: "#E30613" },
  { slug: "siemens", initial: "S", color: "#009999" },
  { slug: "smeg", initial: "S", color: "#E30613" },
  // Watches
  { slug: "rolex", initial: "R", color: "#006039" },
  { slug: "omega", initial: "Ω", color: "#000000" },
  { slug: "tag-heuer", initial: "TH", color: "#000000" },
  { slug: "garmin", initial: "G", color: "#000000" },
];

function generateSvg(b: BrandDef): string {
  const fontSize = b.initial.length <= 1 ? 48 : b.initial.length <= 2 ? 36 : 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="${b.color}"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="central"
        font-family="-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif"
        font-size="${fontSize}" font-weight="800" fill="white"
        letter-spacing="-1">${b.initial}</text>
</svg>`;
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let count = 0;
  for (const b of BRANDS) {
    const path = join(OUT_DIR, `${b.slug}.svg`);
    writeFileSync(path, generateSvg(b));
    count++;
  }
  console.log(`✓ Generated ${count} SVG logos in ${OUT_DIR}`);
}

main();
