import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createPgPool, getDatabaseUrl, loadEnv } from "./env.mjs";

loadEnv();

const seedsDir = join(dirname(fileURLToPath(import.meta.url)), "../supabase/seeds");

async function seed() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("Define DATABASE_URL en .env.local.");
    process.exit(1);
  }

  const pool = createPgPool(pg.Pool, url);

  try {
    for (const file of ["dev.sql", "stock.sql"]) {
      const sql = readFileSync(join(seedsDir, file), "utf8");
      await pool.query(sql);
    }
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM needs");
    const { rows: sedes } = await pool.query("SELECT COUNT(*)::int AS n FROM sedes");
    console.log(`✓ Seed aplicado — ${rows[0].n} reportes, ${sedes[0].n} sedes.`);
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
