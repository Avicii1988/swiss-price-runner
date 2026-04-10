import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest) { return handle(req); }

async function handle(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const step = parseInt(req.nextUrl.searchParams.get("step") || "1");
  try {
    switch (step) {
      case 1: return NextResponse.json(await fixCategories());
      case 2: return NextResponse.json(await fixUrls());
      case 3: return NextResponse.json(await deactivateZeroPrice());
      case 4: return NextResponse.json(await moveUnmapped());
      default: return NextResponse.json({ error: "step 1-4" });
    }
  } catch (e) {
    return NextResponse.json({ step, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

async function fixCategories() {
  const bad = await db.product.findMany({
    where: { OR: [{ category: { contains: ">" } }, { category: { contains: "-gt-" } }, { category: { contains: "fragrances" } }], isActive: true },
    select: { id: true, category: true, categoryName: true }, take: 300,
  });
  let fixed = 0;
  for (const p of bad) {
    const m = mapCat(p.categoryName || p.category);
    await db.product.update({ where: { id: p.id }, data: { category: m.slug, categoryName: m.name } });
    fixed++;
  }
  return { step: 1, fixed, more: bad.length >= 300 };
}

async function fixUrls() {
  const bad = await db.$queryRaw<{ id: string; affiliateUrl: string | null; imageUrl: string | null }[]>`
    SELECT id, "affiliateUrl", "imageUrl" FROM "Product" WHERE ("affiliateUrl" LIKE '%&amp;%' OR "imageUrl" LIKE '%&amp;%') AND "isActive" = true LIMIT 500`;
  let fixed = 0;
  for (const p of bad) {
    const d: Record<string, string> = {};
    if (p.affiliateUrl?.includes("&amp;")) { let u = p.affiliateUrl; for (let i = 0; i < 3; i++) { const prev = u; u = u.replace(/&amp;/g, "&"); if (u === prev) break; } d.affiliateUrl = u; }
    if (p.imageUrl?.includes("&amp;")) { let u = p.imageUrl; for (let i = 0; i < 3; i++) { const prev = u; u = u.replace(/&amp;/g, "&"); if (u === prev) break; } d.imageUrl = u; }
    if (Object.keys(d).length > 0) { await db.product.update({ where: { id: p.id }, data: d }); fixed++; }
  }
  return { step: 2, fixed, more: bad.length >= 500 };
}

async function deactivateZeroPrice() {
  const prods = await db.product.findMany({ where: { isActive: true, sourceType: "adtraction_feed" }, select: { id: true }, take: 200 });
  let deactivated = 0;
  for (const p of prods) {
    const pr = await db.price.findFirst({ where: { productId: p.id }, orderBy: { timestamp: "desc" }, select: { amountChf: true } });
    if (!pr || Number(pr.amountChf) <= 0) { await db.product.update({ where: { id: p.id }, data: { isActive: false } }); deactivated++; }
  }
  return { step: 3, checked: prods.length, deactivated };
}

async function moveUnmapped() {
  const V = new Set(["smartphones","laptops","kopfhoerer","schuhe","gaming","haushalt","mode","parfum","uhren","tv-audio","foto","sport","baby","buecher","beauty","herrendufte","damendufte","unisex-dufte","pflege","make-up","haarpflege","koerperpflege","geschenksets","sonnenpflege","sonstiges","seed"]);
  const all = await db.product.findMany({ where: { isActive: true }, select: { id: true, category: true }, take: 500 });
  let moved = 0;
  for (const p of all) { if (!V.has(p.category)) { const m = mapCat(p.category); await db.product.update({ where: { id: p.id }, data: { category: m.slug, categoryName: m.name } }); moved++; } }
  return { step: 4, moved };
}

const CM: { p: string; s: string; n: string }[] = [
  { p: "men's fragrance", s: "herrendufte", n: "Herrendüfte" }, { p: "aftershave", s: "herrendufte", n: "Herrendüfte" },
  { p: "women's fragrance", s: "damendufte", n: "Damendüfte" }, { p: "unisex fragrance", s: "unisex-dufte", n: "Unisex-Düfte" },
  { p: "fragrance", s: "parfum", n: "Parfum & Düfte" }, { p: "perfume", s: "parfum", n: "Parfum & Düfte" },
  { p: "skin care", s: "pflege", n: "Pflege" }, { p: "skincare", s: "pflege", n: "Pflege" },
  { p: "make up", s: "make-up", n: "Make-Up" }, { p: "makeup", s: "make-up", n: "Make-Up" },
  { p: "hair", s: "haarpflege", n: "Haarpflege" }, { p: "bath", s: "koerperpflege", n: "Körperpflege" },
  { p: "body", s: "koerperpflege", n: "Körperpflege" }, { p: "gift", s: "geschenksets", n: "Geschenksets" },
  { p: "sun", s: "sonnenpflege", n: "Sonnenpflege" },
];
function mapCat(r: string) { const l = r.toLowerCase(); for (const e of CM) { if (l.includes(e.p)) return { slug: e.s, name: e.n }; } return { slug: "sonstiges", name: "Sonstiges" }; }
