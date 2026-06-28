import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCedula, isValidCedula, validateCreateStockItem,
  validateCreateHelper, validateBedsUpdate, validateRegisterSede,
  validateCreateLaborNeed, validateStockOverviewQuery, validateSedeContactUpdate,
  normalizeSlug, slugFromNombre,
} from "../src/lib/stockValidation.js";
import {
  stockStatus, bedsStatus, timeAgoStock, LABOR_SKILL_KEYS, sedeOperationalStatus,
} from "../src/lib/stockConstants.js";

describe("stockValidation", () => {
  it("normaliza cédula venezolana", () => {
    assert.equal(normalizeCedula("12345678"), "V-12345678");
    assert.equal(normalizeCedula("v-87654321"), "V-87654321");
    assert.equal(normalizeCedula("6176211"), "V-6176211");
    assert.equal(normalizeCedula("6.176.211"), "V-6176211");
    assert.equal(normalizeCedula("6-176-211"), "V-6176211");
  });

  it("valida cédula", () => {
    assert.equal(isValidCedula("V-12345678"), true);
    assert.equal(isValidCedula("6176211"), true);
    assert.equal(isValidCedula("6.176.211"), true);
    assert.equal(isValidCedula("123"), false);
  });

  it("acepta material válido", () => {
    const r = validateCreateStockItem({
      cat: "medicina",
      nombre: "Insulina",
      cantidad: 5,
      unidad: "viales",
      umbral: 2,
    });
    assert.equal(r.ok, true);
  });

  it("rechaza ayudante sin nombre", () => {
    const r = validateCreateHelper({ nombre: "", cedula: "V-12345678" });
    assert.equal(r.ok, false);
  });

  it("acepta ayudante sin foto", () => {
    const r = validateCreateHelper({ nombre: "Ana", cedula: "V-12345678" });
    assert.equal(r.ok, true);
    assert.equal(r.data.photoData, null);
  });

  it("valida actualización de camas", () => {
    const r = validateBedsUpdate({ camasTotal: 50, camasOcupadas: 30 });
    assert.equal(r.ok, true);
  });

  it("genera slug desde nombre", () => {
    assert.equal(slugFromNombre("Centro La Vega"), "centro-la-vega");
  });

  it("registro de centro requiere trabajador", () => {
    const r = validateRegisterSede({
      nombre: "Nuevo centro",
      zona: "Caracas",
      slug: "nuevo-centro",
      password: "ayuda",
      trabajadores: [],
    });
    assert.equal(r.ok, false);
  });

  it("acepta registro completo de centro", () => {
    const r = validateRegisterSede({
      nombre: "Nuevo centro",
      zona: "La Vega, Caracas",
      fullAddress: "Av. Principal, La Vega, Caracas, Venezuela",
      lat: 10.48,
      lng: -66.9,
      slug: "nuevo-centro",
      password: "ayuda123",
      camasTotal: 20,
      trabajadores: [{ nombre: "Ana Pérez", cedula: "V-12345678" }],
    });
    assert.equal(r.ok, true);
    assert.equal(r.data.lat, 10.48);
  });

  it("rechaza registro sin ubicación geocodificada", () => {
    const r = validateRegisterSede({
      nombre: "Nuevo centro",
      zona: "La Vega",
      slug: "nuevo-centro",
      password: "ayuda123",
      trabajadores: [{ nombre: "Ana", cedula: "V-12345678" }],
    });
    assert.equal(r.ok, false);
  });

  it("valida necesidad de personal", () => {
    const ok = validateCreateLaborNeed({ skill: "informatica", cantidad: 2, notas: "Red wifi" });
    assert.equal(ok.ok, true);
    const bad = validateCreateLaborNeed({ skill: "invalido", cantidad: 0 });
    assert.equal(bad.ok, false);
  });

  it("valida modos de overview", () => {
    const busco = validateStockOverviewQuery({ modo: "busco", sort: "cercanas" });
    assert.equal(busco.ok, true);
    assert.equal(busco.data.modo, "busco");
    assert.equal(busco.data.filtro, "disponible");
    const personal = validateStockOverviewQuery({ modo: "personal", skill: "traduccion" });
    assert.equal(personal.ok, true);
    assert.equal(personal.data.skill, "traduccion");
    assert.ok(LABOR_SKILL_KEYS.includes("informatica"));
  });

  it("valida contacto de sede", () => {
    const ok = validateSedeContactUpdate({ contacto: "0414-1234567" });
    assert.equal(ok.ok, true);
    const bad = validateSedeContactUpdate({ contacto: "abc" });
    assert.equal(bad.ok, false);
  });
});

describe("stockConstants helpers", () => {
  it("calcula estado de stock", () => {
    assert.equal(stockStatus({ cantidad: 0, umbral: 5 }).key, "Agotado");
    assert.equal(stockStatus({ cantidad: 3, umbral: 5 }).key, "Bajo");
    assert.equal(stockStatus({ cantidad: 20, umbral: 5 }).key, "Disponible");
  });

  it("calcula estado de camas", () => {
    const full = bedsStatus({ camasTotal: 10, camasOcupadas: 10 });
    assert.equal(full.key, "Lleno");
    const ok = bedsStatus({ camasTotal: 10, camasOcupadas: 3 });
    assert.equal(ok.key, "Disponible");
    assert.equal(ok.libres, 7);
  });

  it("formatea tiempo", () => {
    assert.equal(timeAgoStock(Date.now()), "ahora");
  });

  it("calcula estado operativo del centro", () => {
    const ok = sedeOperationalStatus(
      { camasTotal: 10, camasOcupadas: 3, inventoryConfirmedAt: new Date().toISOString() },
      [{ cantidad: 20, umbral: 5 }],
    );
    assert.equal(ok.key, "operativo");
    const crit = sedeOperationalStatus(
      { camasTotal: 10, camasOcupadas: 10 },
      [{ cantidad: 0, umbral: 5 }],
    );
    assert.equal(crit.key, "critico");
  });
});
