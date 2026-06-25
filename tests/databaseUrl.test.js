import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDatabaseUrl,
  hasDatabase,
  isDirectSupabaseUrl,
} from "../src/lib/databaseUrl.js";

test("getDatabaseUrl uses DATABASE_URL for local dev", () => {
  const prev = { ...process.env };
  delete process.env.VERCEL;
  process.env.DATABASE_URL = "postgresql://local/test";
  delete process.env.POSTGRES_URL;
  assert.equal(getDatabaseUrl(), "postgresql://local/test");
  Object.assign(process.env, prev);
});

test("getDatabaseUrl prefers POSTGRES_URL over direct Supabase DATABASE_URL", () => {
  const prev = { ...process.env };
  process.env.DATABASE_URL =
    "postgresql://postgres:secret@db.aunvptctqfecwnqfwoja.supabase.co:5432/postgres";
  process.env.POSTGRES_URL =
    "postgresql://postgres.aunvptctqfecwnqfwoja:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
  assert.equal(
    getDatabaseUrl(),
    "postgresql://postgres.aunvptctqfecwnqfwoja:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  );
  Object.assign(process.env, prev);
});

test("getDatabaseUrl skips direct Supabase DATABASE_URL on Vercel", () => {
  const prev = { ...process.env };
  process.env.VERCEL = "1";
  process.env.DATABASE_URL =
    "postgresql://postgres:secret@db.aunvptctqfecwnqfwoja.supabase.co:5432/postgres";
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  assert.equal(getDatabaseUrl(), null);
  assert.equal(hasDatabase(), false);
  Object.assign(process.env, prev);
});

test("isDirectSupabaseUrl detects db.project.supabase.co", () => {
  assert.equal(
    isDirectSupabaseUrl(
      "postgresql://postgres:secret@db.aunvptctqfecwnqfwoja.supabase.co:5432/postgres"
    ),
    true
  );
  assert.equal(
    isDirectSupabaseUrl(
      "postgresql://postgres.aunvptctqfecwnqfwoja:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    ),
    false
  );
});

test("getDatabaseUrl builds from POSTGRES_* parts", () => {
  const prev = { ...process.env };
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  delete process.env.VERCEL;
  process.env.POSTGRES_USER = "postgres";
  process.env.POSTGRES_PASSWORD = "secret";
  process.env.POSTGRES_HOST = "db.example.com:6543";
  process.env.POSTGRES_DATABASE = "postgres";
  assert.match(
    getDatabaseUrl(),
    /postgresql:\/\/postgres:secret@db\.example\.com:6543\/postgres\?sslmode=require/
  );
  Object.assign(process.env, prev);
});

test("hasDatabase is false without any URL", () => {
  const prev = { ...process.env };
  delete process.env.VERCEL;
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
