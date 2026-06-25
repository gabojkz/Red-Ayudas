import { test } from "node:test";
import assert from "node:assert/strict";
import { getDatabaseUrl, hasDatabase } from "../src/lib/databaseUrl.js";

test("getDatabaseUrl prefers DATABASE_URL", () => {
  const prev = { ...process.env };
  process.env.DATABASE_URL = "postgresql://local/test";
  delete process.env.POSTGRES_URL;
  assert.equal(getDatabaseUrl(), "postgresql://local/test");
  Object.assign(process.env, prev);
});

test("getDatabaseUrl falls back to POSTGRES_URL from Supabase integration", () => {
  const prev = { ...process.env };
  delete process.env.DATABASE_URL;
  process.env.POSTGRES_URL = "postgresql://pooler/supabase";
  assert.equal(getDatabaseUrl(), "postgresql://pooler/supabase");
  assert.equal(hasDatabase(), true);
  Object.assign(process.env, prev);
});

test("getDatabaseUrl builds from POSTGRES_* parts", () => {
  const prev = { ...process.env };
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  process.env.POSTGRES_USER = "postgres";
  process.env.POSTGRES_PASSWORD = "secret";
  process.env.POSTGRES_HOST = "db.example.com:6543";
  process.env.POSTGRES_DATABASE = "postgres";
  assert.match(getDatabaseUrl(), /postgresql:\/\/postgres:secret@db\.example\.com:6543\/postgres\?sslmode=require/);
  Object.assign(process.env, prev);
});

test("hasDatabase is false without any URL", () => {
  const prev = { ...process.env };
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  delete process.env.POSTGRES_USER;
  delete process.env.POSTGRES_PASSWORD;
  delete process.env.POSTGRES_HOST;
  delete process.env.POSTGRES_DATABASE;
  assert.equal(hasDatabase(), false);
  Object.assign(process.env, prev);
});
