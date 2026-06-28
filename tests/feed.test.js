import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateFeedQuery, buildFeed, toFeedItem, toFeedCentro, toFeedStockItem } from "../src/lib/feed.js";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const FEED_ROUTE = join(ROOT, "src", "app", "api", "feed", "route.js");

test("feed route has bilingual @route JSDoc", () => {
  const source = readFileSync(FEED_ROUTE, "utf8");
  const re = /\/\*\*([\s\S]*?)\*\/\s*export\s+async\s+function\s+GET\s*\(/;
  const match = source.match(re);
  assert.ok(match, "GET handler with JSDoc required");
  const block = match[1];
  assert.match(block, /@route\s+GET\s+\/api\/feed/);
  assert.match(block, /@en\s+/);
  assert.match(block, /@es\s+/);
});

test("docs:api generates feed-only markdown", () => {
  execSync("node scripts/generate-api-docs.mjs", { cwd: ROOT, stdio: "pipe" });
  const en = readFileSync(join(ROOT, "docs", "api.en.md"), "utf8");
  const es = readFileSync(join(ROOT, "docs", "api.es.md"), "utf8");
  assert.match(en, /GET \/api\/feed/);
  assert.match(es, /Feed público/);
  assert.match(en, /"centros"/);
  assert.doesNotMatch(en, /POST \/api\/needs/);
  assert.doesNotMatch(es, /\/api\/connections/);
});

test("validateFeedQuery limits and filters", () => {
  assert.equal(validateFeedQuery({ limit: "50" }).ok, true);
  assert.equal(validateFeedQuery({ limit: "999" }).ok, false);
  assert.equal(validateFeedQuery({ kind: "need" }).ok, true);
  assert.equal(validateFeedQuery({ kind: "bad" }).ok, false);
});

test("toFeedItem omits contact", () => {
  const item = toFeedItem({
    id: 1,
    kind: "need",
    type: "agua",
    urgency: "alta",
    status: "abierto",
    place: "Centro",
    zone: "Caracas",
    detail: "Botellas",
    contact: "secret-phone",
    lat: 10.5,
    lng: -66.9,
    createdAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(item.contact, undefined);
  assert.equal(item.publishedAt, "2026-01-01T00:00:00Z");
});

test("buildFeed wraps items", () => {
  const feed = buildFeed([{ id: 1, kind: "need", type: "agua", urgency: "alta", status: "abierto", place: "X", zone: "Y", detail: "Z", lat: 1, lng: 2, createdAt: "2026-01-01T00:00:00Z" }]);
  assert.equal(feed.count, 1);
  assert.equal(feed.items.length, 1);
  assert.equal(feed.centros.count, 0);
  assert.equal(feed.centros.items.length, 0);
  assert.ok(feed.updatedAt);
});

test("feed route uses listNeeds.needs array shape", () => {
  const source = readFileSync(FEED_ROUTE, "utf8");
  assert.match(source, /needsResult\.needs\s*\|\|\s*\[\]/);
});

test("toFeedStockItem maps public stock shape", () => {
  const item = toFeedStockItem({
    cat: "agua",
    nombre: "Botellas",
    cantidad: 5,
    unidad: "u",
    umbral: 10,
    updatedAt: "2026-01-01T00:00:00Z",
  });
  assert.equal(item.status, "bajo");
  assert.equal(item.cat, "agua");
  assert.equal(item.updatedAt, "2026-01-01T00:00:00Z");
});

test("toFeedCentro includes stock list", () => {
  const centro = toFeedCentro(
    {
      slug: "chacao",
      nombre: "Centro Chacao",
      zona: "Chacao",
      lat: 10.5,
      lng: -66.9,
      contacto: "0414-1111111",
      camasTotal: 10,
      camasOcupadas: 3,
      camasDisponibles: 7,
      inventoryConfirmedAt: new Date().toISOString(),
    },
    [{
      cat: "medicina",
      nombre: "Insulina",
      cantidad: 20,
      unidad: "u",
      umbral: 5,
      updatedAt: "2026-01-01T00:00:00Z",
    }],
  );
  assert.equal(centro.slug, "chacao");
  assert.equal(centro.camasLibres, 7);
  assert.equal(centro.operationalStatus, "operativo");
  assert.equal(centro.stock.length, 1);
  assert.equal(centro.stock[0].status, "disponible");
});

test("docs:api documents centros stock", () => {
  execSync("node scripts/generate-api-docs.mjs", { cwd: ROOT, stdio: "pipe" });
  const en = readFileSync(join(ROOT, "docs", "api.en.md"), "utf8");
  const es = readFileSync(join(ROOT, "docs", "api.es.md"), "utf8");
  assert.match(en, /centros\.items/);
  assert.match(es, /Centros e inventario/);
  assert.match(en, /operationalStatus/);
});
