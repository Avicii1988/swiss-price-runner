import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Supabase PgBouncer in transaction mode doesn't support prepared statements.
  // Append pgbouncer=true to the URL to disable them.
  const url = process.env.POSTGRES_URL ?? "";
  const needsPgBouncer = url.includes("pooler.supabase") || url.includes("pgbouncer");
  const separator = url.includes("?") ? "&" : "?";
  const datasourceUrl = needsPgBouncer && !url.includes("pgbouncer=true")
    ? `${url}${separator}pgbouncer=true&prepare_statements=false`
    : url;

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    datasourceUrl: datasourceUrl || undefined,
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
