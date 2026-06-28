#!/usr/bin/env node
/**
 * Generates bilingual public API markdown from JSDoc on /api/feed.
 * Ejecutar: npm run docs:api
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { KIND, TYPES, URGENCY, STATUS } from "../src/lib/constants.js";
import { STOCK_CATS } from "../src/lib/stockConstants.js";
import { siteConfig } from "../src/lib/seo.js";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const FEED_ROUTE = join(ROOT, "src", "app", "api", "feed", "route.js");
const OUT_DIR = join(ROOT, "docs");
const OUT_EN = join(OUT_DIR, "api.en.md");
const OUT_ES = join(OUT_DIR, "api.es.md");

function parseBilingual(text) {
  const enMatch = text.match(/@en\s+([^\n@]+)/);
  const esMatch = text.match(/@es\s+([^\n@]+)/);
  return {
    en: enMatch?.[1]?.trim() ?? text.trim(),
    es: esMatch?.[1]?.trim() ?? text.trim(),
  };
}

function parseJsdocBlock(block) {
  const text = block.split("\n").map((l) => l.replace(/^\s*\*\s?/, "").trim()).join("\n");
  const routeMatch = text.match(/@route\s+(\w+)\s+(\S+)/);
  if (!routeMatch) return null;

  const params = [];
  for (const match of text.matchAll(/@(?:query|param|body)\s+\{([^}]*)\}\s+(\S+)\s+-\s+([^\n]+)/g)) {
    params.push({
      kind: match[0].startsWith("@query") ? "query" : "param",
      type: match[1],
      name: match[2],
      ...parseBilingual(match[3]),
    });
  }

  const responses = [];
  for (const match of text.matchAll(/@response\s+(\d+)\s+-\s+([^\n]+)/g)) {
    responses.push({ status: match[1], ...parseBilingual(match[2]) });
  }

  const exampleMatch = text.match(/@example\s+([\s\S]*?)(?=\n\s*\*?\s*@|\n\s*\*\/|$)/);
  const example = exampleMatch
    ? exampleMatch[1].split("\n").map((l) => l.replace(/^\s*\*\s?/, "")).join("\n").trim()
    : null;

  return {
    method: routeMatch[1],
    path: routeMatch[2],
    summary: {
      en: text.match(/@en\s+([^\n@]+)/)?.[1]?.trim() ?? "",
      es: text.match(/@es\s+([^\n@]+)/)?.[1]?.trim() ?? "",
    },
    params,
    responses,
    example,
  };
}

function extractEndpoints(filePath) {
  const source = readFileSync(filePath, "utf8");
  const endpoints = [];
  const re = /\/\*\*([\s\S]*?)\*\/\s*export\s+async\s+function\s+(GET|POST|PATCH|PUT|DELETE)\s*\(/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const parsed = parseJsdocBlock(match[1]);
    if (!parsed) throw new Error(`${filePath}: ${match[2]} missing @route`);
    endpoints.push(parsed);
  }
  return endpoints;
}

function renderEnums(lang) {
  const list = (obj) => Object.keys(obj).map((k) => `\`${k}\``).join(", ");
  const stockCats = Object.keys(STOCK_CATS).map((k) => `\`${k}\``).join(", ");
  const title = lang === "es" ? "Campos del feed" : "Feed fields";
  return [
    `## ${title}`,
    "",
    lang === "es"
      ? "Cada ítem en `items` incluye:"
      : "Each entry in `items` includes:",
    "",
    `- \`id\`, \`kind\`, \`type\`, \`urgency\`, \`status\`, \`place\`, \`zone\`, \`detail\`, \`lat\`, \`lng\`, \`publishedAt\``,
    "",
    lang === "es" ? "**Enums (publicaciones)**" : "**Enums (posts)**",
    "",
    `- **kind:** ${list(KIND)}`,
    `- **type:** ${list(TYPES)}`,
    `- **urgency:** ${list(URGENCY)}`,
    `- **status:** ${list(STATUS)}`,
    "",
    lang === "es"
      ? "Solo publicaciones activas (`status` ≠ `cubierto`). Sin datos de contacto en `items`."
      : "Active posts only (`status` ≠ `cubierto`). No contact info in `items`.",
    "",
    lang === "es" ? "**Centros e inventario (`centros.items`)**" : "**Centers and inventory (`centros.items`)**",
    "",
    lang === "es"
      ? "Cada centro registrado incluye datos públicos y su stock actual:"
      : "Each registered center includes public data and current stock:",
    "",
    `- \`slug\`, \`nombre\`, \`zona\`, \`lat\`, \`lng\`, \`contacto\`, \`camasTotal\`, \`camasLibres\`, \`bedsStatus\`, \`operationalStatus\`, \`stock\``,
    "",
    lang === "es" ? "**Enums (centros)**" : "**Enums (centers)**",
    "",
    `- **bedsStatus:** \`sin_camas\`, \`lleno\`, \`casi_lleno\`, \`disponible\``,
    `- **operationalStatus:** \`operativo\`, \`atencion\`, \`critico\``,
    "",
    lang === "es" ? "**Enums (stock por ítem)**" : "**Enums (stock per item)**",
    "",
    `- **cat:** ${stockCats}`,
    `- **status:** \`agotado\`, \`bajo\`, \`disponible\``,
    "",
    lang === "es"
      ? "Cada línea de `stock` incluye: \`cat\`, \`nombre\`, \`cantidad\`, \`unidad\`, \`status\`, \`updatedAt\`."
      : "Each `stock` line includes: \`cat\`, \`nombre\`, \`cantidad\`, \`unidad\`, \`status\`, \`updatedAt\`.",
    "",
  ].join("\n");
}

function renderEndpoint(ep, lang) {
  const lines = [`## \`${ep.method} ${ep.path}\``, "", ep.summary[lang], ""];

  if (ep.params.length) {
    lines.push(lang === "es" ? "**Parámetros opcionales**" : "**Optional parameters**", "");
    lines.push("| Name | Type | Description |");
    lines.push("|------|------|-------------|");
    for (const p of ep.params) {
      lines.push(`| \`${p.name}\` | \`${p.type}\` | ${p[lang]} |`);
    }
    lines.push("");
  }

  lines.push(lang === "es" ? "**Respuesta**" : "**Response**", "");
  lines.push("| Status | Description |");
  lines.push("|--------|-------------|");
  for (const r of ep.responses) {
    lines.push(`| \`${r.status}\` | ${r[lang]} |`);
  }
  lines.push("");

  lines.push(lang === "es" ? "**Ejemplo de respuesta**" : "**Sample response**", "", "```json", `{
  "updatedAt": "2026-06-25T12:00:00.000Z",
  "count": 1,
  "items": [{
    "id": 1,
    "kind": "need",
    "type": "medicamentos",
    "urgency": "alta",
    "status": "abierto",
    "place": "Hospital Vargas",
    "zone": "Caracas",
    "detail": "Insulina",
    "lat": 10.498,
    "lng": -66.905,
    "publishedAt": "2026-06-25T10:00:00.000Z"
  }],
  "centros": {
    "count": 1,
    "items": [{
      "slug": "chacao",
      "nombre": "Centro Chacao",
      "zona": "Plaza Bolívar de Chacao",
      "lat": 10.495,
      "lng": -66.854,
      "contacto": "0414-2233445",
      "camasTotal": 120,
      "camasLibres": 33,
      "bedsStatus": "disponible",
      "operationalStatus": "operativo",
      "stock": [{
        "cat": "medicina",
        "nombre": "Insulina",
        "cantidad": 24,
        "unidad": "u",
        "status": "disponible",
        "updatedAt": "2026-06-25T11:00:00.000Z"
      }]
    }]
  }
}`, "```", "");

  if (ep.example) {
    lines.push(lang === "es" ? "**Ejemplo de solicitud**" : "**Sample request**", "", "```", ep.example, "```", "");
  }

  return lines.join("\n");
}

function renderDoc(endpoint, lang) {
  const title = lang === "es"
    ? `Feed público — ${siteConfig.name}`
    : `Public feed — ${siteConfig.name}`;
  const intro =
    lang === "es"
      ? "Un endpoint GET de solo lectura con publicaciones activas e inventario por centro. Para publicar o coordinar ayuda, usa la app web."
      : "One read-only GET endpoint with active posts and per-center inventory. To publish or coordinate aid, use the web app.";

  const base =
    lang === "es"
      ? `## URL\n\n\`${siteConfig.url}/api/feed\` — cache 30 s.`
      : `## URL\n\n\`${siteConfig.url}/api/feed\` — cached 30 s.`;

  return [
    `# ${title}`,
    "",
    intro,
    "",
    base,
    "",
    renderEnums(lang),
    renderEndpoint(endpoint, lang),
  ].join("\n");
}

const [endpoint] = extractEndpoints(FEED_ROUTE);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_EN, `${renderDoc(endpoint, "en")}\n`);
writeFileSync(OUT_ES, `${renderDoc(endpoint, "es")}\n`);

console.log(`Wrote ${relative(ROOT, OUT_EN)}`);
console.log(`Wrote ${relative(ROOT, OUT_ES)}`);
