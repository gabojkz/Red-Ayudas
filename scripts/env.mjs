import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPgPoolConfig } from "../src/lib/databaseUrl.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

export function isLocalDatabase(url) {
  return /localhost|127\.0\.0\.1|@postgres[:/]/i.test(url || "");
}

export function getDatabaseUrl() {
  loadEnv();
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL.replace(/\/$/, "");
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl.replace(/\/$/, "");
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL.replace(/\/$/, "");
  return null;
}

export function createPgPool(Pool, url = getDatabaseUrl()) {
  if (!url) throw new Error("DATABASE_URL no configurada");
  return new Pool(getPgPoolConfig(url));
}

export function migrationsDir() {
  return join(root, "supabase/migrations");
}

export function listMigrationFiles() {
  return readdirSync(migrationsDir())
    .filter((f) => f.endsWith(".sql"))
    .sort();
}
