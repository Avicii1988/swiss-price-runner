-- Enable Row Level Security on all public tables.
--
-- WHY: The Supabase anon key is shipped to the browser (Supabase Auth
-- integration in lib/supabase/client.ts). Without RLS, anyone with that
-- key can hit PostgREST directly and read/edit/delete any row.
--
-- WHY IT'S SAFE: Prisma connects with the postgres owner role, which
-- BYPASSES RLS. The app keeps working end-to-end via Next.js API routes.
-- Only the direct PostgREST/Supabase-JS path becomes locked down.
--
-- No policies are defined intentionally: default-deny for the anon and
-- authenticated roles means the tables become invisible to any client
-- that isn't the Prisma-backed server.

ALTER TABLE "Product"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Price"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageView"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImportLog" ENABLE ROW LEVEL SECURITY;
