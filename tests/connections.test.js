import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countOrphanNeeds,
  connectionStats,
  needHasCoverage,
  nextConnectionStatus,
  getMatchCandidates,
  buildConnectionsGeoJSON,
  isActiveConnection,
  filterConnectionsBySearch,
} from "../src/lib/connections.js";

const needs = [
  { id: 1, kind: "need", type: "agua", status: "abierto", urgency: "critica", zone: "Caracas", lat: 10.5, lng: -66.9, detail: "Agua", place: "A" },
  { id: 2, kind: "need", type: "medicamentos", status: "abierto", urgency: "alta", zone: "La Guaira", lat: 10.6, lng: -66.93, detail: "Meds", place: "B" },
  { id: 10, kind: "offer", type: "agua", status: "abierto", urgency: "alta", zone: "Caracas", lat: 10.51, lng: -66.88, detail: "300 botellas", place: "C" },
  { id: 11, kind: "offer", type: "transporte", status: "abierto", urgency: "alta", zone: "Valencia", lat: 10.17, lng: -68, detail: "Ruta a La Guaira", place: "D" },
];

const connections = [
  { id: 1, needId: 1, offerId: 10, status: "coordinando", coordinatorRemote: false, notes: "Iniciada", mins: 5 },
  { id: 2, needId: 2, offerId: 11, status: "entregado", coordinatorRemote: true, notes: "Hecho", mins: 60 },
];

describe("needHasCoverage", () => {
  it("detecta necesidad con conexión activa", () => {
    assert.equal(needHasCoverage(1, connections), true);
    assert.equal(needHasCoverage(2, connections), false);
  });
});

describe("countOrphanNeeds", () => {
  it("cuenta necesidades abiertas sin cobertura", () => {
    assert.equal(countOrphanNeeds(needs, connections), 1);
  });
});

describe("connectionStats", () => {
  it("resume métricas del tablero", () => {
    const s = connectionStats(needs, connections);
    assert.equal(s.openNeeds, 2);
    assert.equal(s.openOffers, 2);
    assert.equal(s.activeConns, 1);
    assert.equal(s.delivered, 1);
    assert.equal(s.orphans, 1);
  });
});

describe("nextConnectionStatus", () => {
  it("avanza coordinando → en_transito → entregado", () => {
    assert.equal(nextConnectionStatus("coordinando"), "en_transito");
    assert.equal(nextConnectionStatus("en_transito"), "entregado");
    assert.equal(nextConnectionStatus("entregado"), null);
  });
});

describe("getMatchCandidates", () => {
  it("sugiere ofertas compatibles para una necesidad", () => {
    const need = needs[1];
    const candidates = getMatchCandidates(need, needs.filter((n) => n.kind === "need"), needs.filter((n) => n.kind === "offer"), []);
    assert.ok(candidates.some((c) => c.id === 11));
  });

  it("no sugiere necesidades ya conectadas", () => {
    const need = needs[0];
    const candidates = getMatchCandidates(need, needs.filter((n) => n.kind === "need"), needs.filter((n) => n.kind === "offer"), connections);
    assert.ok(!candidates.some((c) => c.id === 10));
  });
});

describe("buildConnectionsGeoJSON", () => {
  it("genera líneas entre need y offer", () => {
    const byId = new Map(needs.map((n) => [n.id, n]));
    const geo = buildConnectionsGeoJSON(connections, byId);
    assert.equal(geo.type, "FeatureCollection");
    assert.equal(geo.features.length, 2);
    assert.equal(geo.features[0].geometry.type, "LineString");
    assert.equal(geo.features[0].geometry.coordinates.length, 2);
  });
});

describe("isActiveConnection", () => {
  it("excluye entregado y cancelado", () => {
    assert.equal(isActiveConnection(connections[0]), true);
    assert.equal(isActiveConnection(connections[1]), false);
  });
});

describe("filterConnectionsBySearch", () => {
  const byId = new Map(needs.map((n) => [n.id, n]));

  it("filtra por lugar, contacto o notas", () => {
    assert.equal(filterConnectionsBySearch(connections, byId, "").length, 2);
    assert.equal(filterConnectionsBySearch(connections, byId, "la guaira").length, 1);
    assert.equal(filterConnectionsBySearch(connections, byId, "botellas").length, 1);
    assert.equal(filterConnectionsBySearch(connections, byId, "iniciada").length, 1);
    assert.equal(filterConnectionsBySearch(connections, byId, "zzz").length, 0);
  });

  it("ignora acentos y mayúsculas", () => {
    assert.equal(filterConnectionsBySearch(connections, byId, "GUaira").length, 1);
  });
});
