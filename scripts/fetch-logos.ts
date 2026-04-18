#!/usr/bin/env tsx
/**
 * One-shot utility: download brand logos from Google's High-Res Favicon
 * API into public/logos/brands/ so they can be served as static assets.
 *
 * Usage:
 *   npx tsx scripts/fetch-logos.ts
 *   npx tsx scripts/fetch-logos.ts --dry   # preview only
 *
 * Each logo is fetched as a 128×128 PNG from:
 *   https://www.google.com/s2/favicons?domain=<domain>&sz=128
 *
 * The output filename uses the brand slug (lowercase, hyphenated):
 *   public/logos/brands/apple.png, public/logos/brands/samsung.png, etc.
 *
 * If a logo already exists on disk it's skipped (idempotent).
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const DRY = process.argv.includes("--dry");
const OUT_DIR = join(process.cwd(), "public", "logos", "brands");

// ═══════════════════════════════════════════════════════════════════
// Brand → domain mapping (top brands across all verticals)
// ═══════════════════════════════════════════════════════════════════

const BRANDS: Record<string, string> = {
  // Tech
  apple: "apple.com",
  samsung: "samsung.com",
  sony: "sony.com",
  lg: "lg.com",
  google: "google.com",
  microsoft: "microsoft.com",
  huawei: "huawei.com",
  xiaomi: "xiaomi.com",
  lenovo: "lenovo.com",
  asus: "asus.com",
  dell: "dell.com",
  hp: "hp.com",
  bose: "bose.com",
  sennheiser: "sennheiser.com",
  jbl: "jbl.com",
  dyson: "dyson.ch",
  // Fashion
  nike: "nike.com",
  adidas: "adidas.ch",
  "new-balance": "newbalance.com",
  "on-running": "on.com",
  puma: "puma.com",
  asics: "asics.com",
  hoka: "hoka.com",
  salomon: "salomon.com",
  "hugo-boss": "hugoboss.com",
  "ralph-lauren": "ralphlauren.com",
  "tommy-hilfiger": "tommy.com",
  lacoste: "lacoste.com",
  "calvin-klein": "calvinklein.com",
  "michael-kors": "michaelkors.com",
  // Beauty / Perfume
  dior: "dior.com",
  chanel: "chanel.com",
  guerlain: "guerlain.com",
  "tom-ford": "tomford.com",
  "yves-saint-laurent": "ysl.com",
  lancome: "lancome.com",
  "estee-lauder": "esteelauder.com",
  "paco-rabanne": "pacorabanne.com",
  versace: "versace.com",
  "dolce-gabbana": "dolcegabbana.com",
  creed: "creedboutique.com",
  byredo: "byredo.com",
  "le-labo": "lelabofragrances.com",
  diptyque: "diptyqueparis.com",
  // Outdoor
  mammut: "mammut.com",
  patagonia: "patagonia.com",
  "the-north-face": "thenorthface.com",
  "arc-teryx": "arcteryx.com",
  fjallraven: "fjallraven.com",
  deuter: "deuter.com",
  osprey: "osprey.com",
  "jack-wolfskin": "jack-wolfskin.com",
  // Haushalt
  nespresso: "nespresso.com",
  jura: "jura.com",
  delonghi: "delonghi.com",
  kitchenaid: "kitchenaid.com",
  miele: "miele.ch",
  bosch: "bosch-home.ch",
  siemens: "siemens-home.bsh-group.com",
  smeg: "smeg.com",
  // Watches
  rolex: "rolex.com",
  omega: "omegawatches.com",
  "tag-heuer": "tagheuer.com",
  garmin: "garmin.com",
};

// ═══════════════════════════════════════════════════════════════════
// Download logic
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log(`📦 Logo Fetcher — ${Object.keys(BRANDS).length} brands`);
  console.log(`   Output: ${OUT_DIR}`);
  console.log(`   Mode: ${DRY ? "DRY RUN" : "LIVE"}\n`);

  if (!DRY && !existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
    console.log(`   Created ${OUT_DIR}\n`);
  }

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const [slug, domain] of Object.entries(BRANDS)) {
    const outPath = join(OUT_DIR, `${slug}.png`);
    if (existsSync(outPath)) {
      skipped++;
      continue;
    }

    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    if (DRY) {
      console.log(`  [dry] ${slug} ← ${url}`);
      fetched++;
      continue;
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(outPath, buf);
      console.log(`  ✓ ${slug}.png (${(buf.length / 1024).toFixed(1)} KB)`);
      fetched++;
    } catch (err) {
      console.warn(`  ✗ ${slug}: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n✓ Done — fetched ${fetched}, skipped ${skipped}, failed ${failed}`);
}

main().catch((err) => {
  console.error("💥 fetch-logos failed:", err);
  process.exit(1);
});
