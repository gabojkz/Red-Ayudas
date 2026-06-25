import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreMatch, buildMatches } from "../src/lib/match.js";

const need = {
  id: 1, kind: "need", type: "agua", urgency: "alta", status: "abierto",
  place: "La Guaira", zone: "La Guaira", lat: 10.598, lng: -66.948,
  detail: "Agua potable", contact: "—",
};

const offerAgua = {
  id: 2, kind: "offer", type: "agua", urgency: "alta", status: "abierto",
  place: "Los Caobos", zone: "Caracas", lat: 10.502, lng: -66.878,
  detail: "300 botellas de agua", contact: "—",
};

const offerTransport = {
  id: 3, kind: "offer", type: "transporte", urgency: "alta", status: "abierto",
  place: "Valencia", zone: "Valencia", lat: 10.172, lng: -68.004,
  detail: "Camioneta rumbo a La Guaira hoy 16:00", contact: "—",
};

const offerVoluntario = {
  id: 4, kind: "offer", type: "voluntario", urgency: "media", status: "abierto",
  place: "Caracas", zone: "Caracas", lat: 10.496, lng: -66.852,
  detail: "Médico general disponible", contact: "—",
};

describe("scoreMatch", () => {
  it("empareja mismo tipo de recurso", () => {
    const r = scoreMatch(need, offerAgua);
    assert.ok(r.score > 0);
    assert.ok(r.reasons.some((x) => x.includes("tipo")));
  });

  it("empareja transporte aunque la zona difiera si la ruta lo menciona", () => {
    const r = scoreMatch(need, offerTransport);
    assert.ok(r.score > 0);
    assert.ok(r.reasons.some((x) => x.includes("Transporte") || x.includes("La Guaira")));
  });

  it("empareja voluntario con need de medicamentos", () => {
    const medNeed = { ...need, type: "medicamentos", detail: "Insulina" };
    const r = scoreMatch(medNeed, offerVoluntario);
    assert.ok(r.score > 0);
  });

  it("no empareja need con need", () => {
    assert.equal(scoreMatch(need, { ...need, kind: "need" }).score, 0);
  });

  it("no empareja offer con offer", () => {
    assert.equal(scoreMatch({ ...need, kind: "offer" }, offerAgua).score, 0);
  });

  it("ignora offer cubierto", () => {
    assert.equal(scoreMatch(need, { ...offerAgua, status: "cubierto" }).score, 0);
  });

  it("ignora need cubierto en buildMatches", () => {
    const matches = buildMatches([
      { ...need, status: "cubierto" },
      offerAgua,
    ]);
    assert.equal(matches.length, 0);
  });
});

describe("buildMatches", () => {
  it("genera matches need ↔ offer ordenados por urgencia", () => {
    const critNeed = { ...need, id: 10, urgency: "critica" };
    const posts = [need, critNeed, offerAgua, offerTransport];
    const matches = buildMatches(posts);
    assert.ok(matches.length >= 2);
    assert.equal(matches[0].need.urgency, "critica");
    assert.ok(matches[0].matches.length >= 1);
  });

  it("limita a 4 matches por need", () => {
    const offers = Array.from({ length: 6 }, (_, i) => ({
      ...offerAgua,
      id: 100 + i,
      place: `Oferta ${i}`,
    }));
    const matches = buildMatches([need, ...offers]);
    assert.equal(matches[0].matches.length, 4);
  });
});
