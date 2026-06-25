import pg from "pg";
import { createPgPool, getDatabaseUrl, loadEnv } from "./env.mjs";

loadEnv();

const maxAttempts = 30;
const delayMs = 1000;

async function waitForDb() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("Define DATABASE_URL en .env.local.");
    process.exit(1);
  }

  for (let i = 1; i <= maxAttempts; i++) {
    const pool = createPgPool(pg.Pool, url);
    try {
      await pool.query("SELECT 1");
      console.log("✓ Postgres listo.");
      return;
    } catch {
      process.stdout.write(`  esperando postgres (${i}/${maxAttempts})…\r`);
      await new Promise((r) => setTimeout(r, delayMs));
    } finally {
      await pool.end();
    }
  }

  console.error("\nPostgres no respondió a tiempo. ¿Corriste npm run db:up?");
  process.exit(1);
}

waitForDb();
