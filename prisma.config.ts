import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 moved datasource URLs out of schema.prisma and into prisma.config.ts.
// The adapter is what the Prisma engine uses to talk to SQLite during migrations;
// the same adapter is wired into PrismaClient in src/lib/prisma.ts so the app
// uses one connection path.

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  adapter: () => Promise.resolve(new PrismaBetterSqlite3({ url: databaseUrl })),
});
