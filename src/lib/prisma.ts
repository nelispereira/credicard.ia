import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../prisma/generated/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  // Use connection URL or a dummy connection if missing, to prevent immediate crash on startup
  const isPlaceholder = !connectionString || connectionString.includes("[seu-projeto]") || connectionString.includes("johndoe");
  const cleanUrl = isPlaceholder
    ? "postgresql://postgres:postgres@localhost:5432/postgres"
    : connectionString;

  const pool = new pg.Pool({
    connectionString: cleanUrl,
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;