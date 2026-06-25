import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createPgPool, getDatabaseUrl, loadEnv } from "./env.mjs";

loadEnv();

const seedFile = join(dirname(fileURLToPath(import.meta.url)), "../supabase/seeds/dev.sql");

async function seed() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("Define DATABASE_URL en .env.local.");
    process.exit(1);
  }

  const pool = createPgPool(pg.Pool, url);
  const sql = readFileSync(seedFile, "utf8");

  try {
    await pool.query(sql);
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM needs");
    console.log(`✓ Seed aplicado — ${rows[0].n} reportes de prueba.`);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
