import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { isAuthorized, safeErrorMessage } from "@/lib/api-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest) { return handle(req); }

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const step = parseInt(req.nextUrl.searchParams.get("step") || "1");

  try {
    const results: Record<string, unknown> = { step };

    switch (step) {
      case 1: {
        const r1 = await db.$executeRaw`UPDATE "Product" SET category = 'herrendufte', "categoryName" = 'Herrendüfte' WHERE ("categoryName" ILIKE '%men''s fragrance%' OR "categoryName" ILIKE '%aftershave%' OR "categoryName" ILIKE '%cologne%') AND category != 'herrendufte'`;
        const r2 = await db.$executeRaw`UPDATE "Product" SET category = 'damendufte', "categoryName" = 'Damendüfte' WHERE ("categoryName" ILIKE '%women''s fragrance%') AND category != 'damendufte'`;
        const r3 = await db.$executeRaw`UPDATE "Product" SET category = 'unisex-dufte', "categoryName" = 'Unisex-Düfte' WHERE ("categoryName" ILIKE '%unisex fragrance%') AND category != 'unisex-dufte'`;
        const r4 = await db.$executeRaw`UPDATE "Product" SET category = 'pflege', "categoryName" = 'Pflege' WHERE ("categoryName" ILIKE '%skin care%' OR "categoryName" ILIKE '%skincare%') AND category NOT IN ('pflege','herrendufte','damendufte','unisex-dufte')`;
        const r5 = await db.$executeRaw`UPDATE "Product" SET category = 'make-up', "categoryName" = 'Make-Up' WHERE ("categoryName" ILIKE '%make up%' OR "categoryName" ILIKE '%makeup%' OR "categoryName" ILIKE '%cosmetic%') AND category NOT IN ('make-up','herrendufte','damendufte')`;
        const r6 = await db.$executeRaw`UPDATE "Product" SET category = 'haarpflege', "categoryName" = 'Haarpflege' WHERE ("categoryName" ILIKE '%hair%' OR "categoryName" ILIKE '%shampoo%') AND category NOT IN ('haarpflege','herrendufte','damendufte')`;
        const r7 = await db.$executeRaw`UPDATE "Product" SET category = 'koerperpflege', "categoryName" = 'Körperpflege' WHERE ("categoryName" ILIKE '%bath%' OR "categoryName" ILIKE '%body%' OR "categoryName" ILIKE '%shower%' OR "categoryName" ILIKE '%deodorant%') AND category NOT IN ('koerperpflege','herrendufte','damendufte','pflege')`;
        const r8 = await db.$executeRaw`UPDATE "Product" SET category = 'geschenksets', "categoryName" = 'Geschenksets' WHERE ("categoryName" ILIKE '%gift%' OR "categoryName" ILIKE '%set%') AND category NOT IN ('geschenksets','herrendufte','damendufte','pflege','make-up')`;
        const r9 = await db.$executeRaw`UPDATE "Product" SET category = 'sonnenpflege', "categoryName" = 'Sonnenpflege' WHERE ("categoryName" ILIKE '%sun%' OR "categoryName" ILIKE '%spf%') AND category NOT IN ('sonnenpflege','herrendufte','damendufte')`;
        const r10 = await db.$executeRaw`UPDATE "Product" SET category = 'parfum', "categoryName" = 'Parfum & Düfte' WHERE ("categoryName" ILIKE '%fragrance%' OR "categoryName" ILIKE '%perfume%' OR "categoryName" ILIKE '%eau de%') AND category NOT IN ('parfum','herrendufte','damendufte','unisex-dufte')`;
        results.fixedCategories = { herrendufte: r1, damendufte: r2, unisex: r3, pflege: r4, makeup: r5, haarpflege: r6, koerperpflege: r7, geschenksets: r8, sonnenpflege: r9, parfum: r10 };
        break;
      }

      case 2: {
        const links = await db.$executeRaw`UPDATE "Product" SET "affiliateUrl" = REPLACE(REPLACE(REPLACE("affiliateUrl", '&amp;amp;', '&'), '&amp;', '&'), '&amp;', '&') WHERE "affiliateUrl" LIKE '%&amp;%'`;
        const imgs = await db.$executeRaw`UPDATE "Product" SET "imageUrl" = REPLACE(REPLACE(REPLACE("imageUrl", '&amp;amp;', '&'), '&amp;', '&'), '&amp;', '&') WHERE "imageUrl" LIKE '%&amp;%'`;
        results.fixedLinks = links;
        results.fixedImages = imgs;
        break;
      }

      case 3: {
        // Fix: Use Prisma.join for safe parameterized IN clause (no string concatenation)
        const validCategories = ['smartphones','laptops','kopfhoerer','schuhe','gaming','haushalt','mode','parfum','uhren','tv-audio','foto','sport','baby','buecher','beauty','herrendufte','damendufte','unisex-dufte','pflege','make-up','haarpflege','koerperpflege','geschenksets','sonnenpflege','sonstiges','seed'];
        const moved = await db.$executeRaw`UPDATE "Product" SET category = 'sonstiges', "categoryName" = 'Sonstiges' WHERE category NOT IN (${Prisma.join(validCategories)}) AND "isActive" = true`;
        const moved2 = await db.$executeRaw`UPDATE "Product" SET category = 'sonstiges', "categoryName" = 'Sonstiges' WHERE category LIKE '%>%' AND "isActive" = true`;
        results.movedToSonstiges = Number(moved) + Number(moved2);
        break;
      }

      case 4: {
        const deactivated = await db.$executeRaw`
          UPDATE "Product" SET "isActive" = false
          WHERE "sourceType" = 'adtraction_feed'
          AND "isActive" = true
          AND id NOT IN (
            SELECT DISTINCT "productId" FROM "Price" WHERE "amountChf" > 0
          )`;
        results.deactivatedNoPrice = deactivated;
        break;
      }
    }

    return NextResponse.json({ status: "ok", ...results });
  } catch (error) {
    return NextResponse.json({ step, error: safeErrorMessage(error) }, { status: 500 });
  }
}
