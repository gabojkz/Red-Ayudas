import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ESCOMBROS_EQUIPO,
  normalizeEscombrosMeta,
  validateEscombrosMeta,
  escombrosMetaChips,
  toggleEquipo,
  parseEquipos,
} from "../src/lib/escombros.js";

describe("parseEquipos", () => {
  it("lee array equipos", () => {
    assert.deepEqual(parseEquipos({ equipos: ["Grúa", "Retroexcavadora"] }), ["Grúa", "Retroexcavadora"]);
  });

  it("compatibilidad con meta.equipo legacy", () => {
    assert.deepEqual(parseEquipos({ equipo: "Grúa" }), ["Grúa"]);
  });

  it("deduplica y filtra inválidos", () => {
    assert.deepEqual(
      parseEquipos({ equipos: ["Grúa", "Grúa", "xxx", "Retroexcavadora"] }),
      ["Grúa", "Retroexcavadora"]
    );
  });
});

describe("toggleEquipo", () => {
  it("alterna selección múltiple", () => {
    assert.deepEqual(toggleEquipo([], "Grúa"), ["Grúa"]);
    assert.deepEqual(toggleEquipo(["Grúa"], "Retroexcavadora"), ["Grúa", "Retroexcavadora"]);
    assert.deepEqual(toggleEquipo(["Grúa", "Retroexcavadora"], "Grúa"), ["Retroexcavadora"]);
  });
});

describe("normalizeEscombrosMeta", () => {
  it("normaliza equipos múltiples", () => {
    const meta = normalizeEscombrosMeta({
      equipos: ["Retroexcavadora", "Pico, pala y carretilla"],
      operador_incluido: true,
      necesita_transporte: false,
      personas: 8,
    }, "offer");
    assert.deepEqual(meta.equipos, ["Retroexcavadora", "Pico, pala y carretilla"]);
    assert.equal(meta.personas, 8);
  });

  it("acepta personas_solicitadas legacy", () => {
    const meta = normalizeEscombrosMeta({ equipos: ["Grúa"], personas_solicitadas: 4 }, "need");
    assert.equal(meta.personas, 4);
  });
});

describe("validateEscombrosMeta", () => {
  it("requiere al menos un equipo", () => {
    assert.equal(validateEscombrosMeta({}).ok, false);
    assert.equal(validateEscombrosMeta({ equipos: ["Grúa"] }).ok, true);
    assert.equal(validateEscombrosMeta({ equipos: ["Grúa", "Retroexcavadora"] }).ok, true);
  });
});

describe("escombrosMetaChips", () => {
  it("genera un chip por equipo", () => {
    const chips = escombrosMetaChips({
      equipos: ["Pico, pala y carretilla", "Retroexcavadora"],
      necesita_transporte: true,
      personas: 6,
    });
    assert.equal(chips.filter((c) => c.id.startsWith("equipo-")).length, 2);
    assert.ok(chips.some((c) => c.label.includes("transporte")));
  });
});

describe("ESCOMBROS_EQUIPO", () => {
  it("incluye 11 opciones", () => {
    assert.equal(ESCOMBROS_EQUIPO.length, 11);
  });
});
