-- Import state and logging table
CREATE TABLE IF NOT EXISTS "ImportLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "feedId" TEXT NOT NULL DEFAULT 'xxl_parfum',
  "currentSkip" INTEGER NOT NULL DEFAULT 0,
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "imported" INTEGER NOT NULL DEFAULT 0,
  "errors" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'running',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ImportLog_feedId_idx" ON "ImportLog"("feedId");
CREATE INDEX IF NOT EXISTS "ImportLog_createdAt_idx" ON "ImportLog"("createdAt");
