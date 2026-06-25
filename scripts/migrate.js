import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  createPgPool,
  getDatabaseUrl,
  listMigrationFiles,
  migrationsDir,
  loadEnv,
} from "./env.mjs";

loadEnv();

async function migrate() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("Define DATABASE_URL en .env.local (copia desde .env.example).");
    process.exit(1);
  }

  const pool = createPgPool(pg.Pool, url);
  const files = listMigrationFiles();

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir(), file), "utf8");
      await pool.query(sql);
      console.log(`✓ ${file}`);
    }
    console.log("Migraciones aplicadas.");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
