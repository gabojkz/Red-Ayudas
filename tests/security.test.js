import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeText } from "../src/lib/sanitize.js";
import { parseJsonBody, MAX_JSON_BYTES } from "../src/lib/apiSecurity.js";
import {
  validateListNeedsQuery,
  validateListConnectionsQuery,
  validateCreateNeed,
} from "../src/lib/validation.js";

test("sanitizeText strips control chars and HTML", () => {
  assert.equal(sanitizeText("  hola\x00<script>x</script>  ", 50), "holax");
  assert.equal(sanitizeText("a".repeat(300), 200).length, 200);
});

test("parseJsonBody rejects oversized payloads", async () => {
  const big = "{" + `"x":"${"a".repeat(MAX_JSON_BYTES)}"` + "}";
  const request = new Request("http://localhost/api/needs", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": String(big.length) },
    body: big,
  });
  const result = await parseJsonBody(request);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test("parseJsonBody rejects non-object JSON", async () => {
  const request = new Request("http://localhost/api/needs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "[1,2,3]",
  });
  const result = await parseJsonBody(request);
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("parseJsonBody accepts valid object", async () => {
  const request = new Request("http://localhost/api/needs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "agua" }),
  });
  const result = await parseJsonBody(request);
  assert.equal(result.ok, true);
  assert.equal(result.data.type, "agua");
});

test("maxBodyBytesForPath allows larger sede registration payloads", async () => {
  const {
    maxBodyBytesForPath, MAX_PHOTO_JSON_BYTES, MAX_JSON_BYTES,
  } = await import("../src/lib/apiSecurity.js");
  assert.equal(maxBodyBytesForPath("/api/sedes/register"), MAX_JSON_BYTES);
  assert.equal(maxBodyBytesForPath("/api/sedes/1/photo"), MAX_PHOTO_JSON_BYTES);
  assert.equal(maxBodyBytesForPath("/api/sedes/1/helpers/2"), MAX_PHOTO_JSON_BYTES);
  assert.equal(maxBodyBytesForPath("/api/needs"), MAX_JSON_BYTES);
});

test("validateListNeedsQuery whitelists filters", () => {
  assert.equal(validateListNeedsQuery({ status: "activas", kind: "need" }).ok, true);
  assert.equal(validateListNeedsQuery({ status: "hack" }).ok, false);
  assert.equal(validateListNeedsQuery({ type: "medicamentos" }).ok, true);
  assert.equal(validateListNeedsQuery({ type: "'; DROP TABLE--" }).ok, false);
  assert.equal(validateListNeedsQuery({ page: "2", limit: "25", types: "agua,medicamentos" }).ok, true);
  assert.equal(validateListNeedsQuery({ page: "0", limit: "25" }).ok, false);
  assert.equal(validateListNeedsQuery({ limit: "500" }).ok, false);
});

test("validateListConnectionsQuery whitelists filters", () => {
  assert.equal(validateListConnectionsQuery({ status: "activas" }).ok, true);
  assert.equal(validateListConnectionsQuery({ status: "coordinando" }).ok, true);
  assert.equal(validateListConnectionsQuery({ status: "evil" }).ok, false);
});

test("validateCreateNeed truncates contact", () => {
  const result = validateCreateNeed({
    kind: "need",
    type: "agua",
    urgency: "alta",
    place: "Centro",
    detail: "Botellas",
    contact: `04145550101 ${"x".repeat(220)}`,
    lat: 10.49,
    lng: -66.9,
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.contact.length, 200);
});
