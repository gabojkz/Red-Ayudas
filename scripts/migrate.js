import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import {
  createPgPool,
  getDatabaseUrl,
  listMigrationFiles,
  migrationsDir,
  loadEnv,
} from "./env.mjs";

loadEnv();

/** Detecta migraciones ya aplicadas en bases creadas antes del tracking. */
const LEGACY_CHECKS = [
  {
    file: "20250625000001_needs.sql",
    sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'needs'`,
  },
  {
    file: "20250625000002_kind_offers.sql",
    sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'needs' AND column_name = 'kind'`,
  },
  {
    file: "20250625000003_connections.sql",
    sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connections'`,
  },
  {
    file: "20250625000004_escombros_meta.sql",
    sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'needs' AND column_name = 'meta'`,
  },
  {
    file: "20250626000001_sedes_stock.sql",
    sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sedes'`,
  },
  {
    file: "20250627000001_sede_photo.sql",
    sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sedes' AND column_name = 'photo_data'`,
  },
  {
    file: "20250628000001_sede_labor_needs.sql",
    sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sede_labor_needs'`,
  },
  {
    file: "20250629000001_sede_contacto_roles.sql",
    sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sedes' AND column_name = 'contacto'`,
  },
];

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function bootstrapLegacyMigrations(pool, files) {
  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  if (rows.length > 0) return;

  for (const { file, sql } of LEGACY_CHECKS) {
    if (!files.includes(file)) continue;
    const { rowCount } = await pool.query(sql);
    if (rowCount > 0) {
      await pool.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file],
      );
    }
  }
}

async function appliedMigrations(pool) {
  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  return new Set(rows.map((r) => r.filename));
}

async function migrate() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("Define DATABASE_URL en .env.local (copia desde .env.example).");
    process.exit(1);
  }

  const pool = createPgPool(pg.Pool, url);
  const files = listMigrationFiles();

  try {
    await ensureMigrationsTable(pool);
    await bootstrapLegacyMigrations(pool, files);
    const done = await appliedMigrations(pool);

    let ran = 0;
    for (const file of files) {
      if (done.has(file)) {
        console.log(`· ${file} (ya aplicada)`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir(), file), "utf8");
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      console.log(`✓ ${file}`);
      ran++;
    }

    if (ran === 0) {
      console.log("Nada pendiente — esquema al día.");
    } else {
      console.log(`Migraciones aplicadas (${ran} nueva${ran === 1 ? "" : "s"}).`);
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
