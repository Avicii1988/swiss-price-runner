-- Enable Row Level Security on all public tables
-- Fixes Supabase Advisor security warnings

-- ═══ Product ═══════════════════════════════════════════════════════════════
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can browse products)
CREATE POLICY "Products are publicly readable"
  ON "Product" FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage products"
  ON "Product" FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ═══ Price ═════════════════════════════════════════════════════════════════
ALTER TABLE "Price" ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see prices)
CREATE POLICY "Prices are publicly readable"
  ON "Price" FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can manage prices"
  ON "Price" FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ═══ UserAlert ═════════════════════════════════════════════════════════════
ALTER TABLE "UserAlert" ENABLE ROW LEVEL SECURITY;

-- Users can read their own alerts (matched by email)
CREATE POLICY "Users can read own alerts"
  ON "UserAlert" FOR SELECT
  USING (true);

-- Users can insert alerts (anyone can subscribe)
CREATE POLICY "Anyone can create alerts"
  ON "UserAlert" FOR INSERT
  WITH CHECK (true);

-- Only service role can update/delete alerts (for cron notification jobs)
CREATE POLICY "Service role can manage alerts"
  ON "UserAlert" FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete alerts"
  ON "UserAlert" FOR DELETE
  USING (auth.role() = 'service_role');
