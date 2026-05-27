import pkg from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7's generated client is CommonJS; Node's ESM loader can't statically
// pick named exports from it, so we destructure from the default import.
const { PrismaClient } = pkg;
type PrismaClient = InstanceType<typeof pkg.PrismaClient>;

// Singleton PrismaClient. In dev, tsx watch reloads the module on every save -
// without this guard we'd leak connections and eventually hit SQLite's
// "database is locked" errors. Vitest reuses the same trick across test files.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function build(): PrismaClient {
  // Prisma 7 requires a driver adapter for SQLite; the engine itself no longer
  // ships a bundled SQLite driver. The adapter mirrors what prisma.config.ts
  // wires in for migrations.
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    log: process.env.NODE_ENV === "test" ? [] : ["warn", "error"],
  });
}

export const prisma = global.__prisma ?? build();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
