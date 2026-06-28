import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSedeReportSections, sedeReportToCsv,
} from "../src/lib/sedeReportExport.js";

const SAMPLE_SEDE = {
  slug: "chacao",
  nombre: "Centro Chacao",
  zona: "Plaza Bolívar",
  contacto: "0414-1111111",
  camasTotal: 10,
  camasOcupadas: 7,
  stock: [
    {
      cat: "medicina",
      nombre: "Insulina",
      cantidad: 12,
      unidad: "u",
      umbral: 5,
      updated: Date.now(),
    },
  ],
  helpers: [
    { nombre: "Ana Pérez", rolLabel: "Coordinación", cedula: "V-12345678" },
  ],
  laborNeeds: [
    { skill: "informatica", skillLabel: "Informática", cantidad: 2, notas: "Red" },
  ],
};

test("buildSedeReportSections groups materiales and personal", () => {
  const report = buildSedeReportSections(SAMPLE_SEDE);
  assert.equal(report.header.nombre, "Centro Chacao");
  assert.equal(report.materiales.length, 1);
  assert.equal(report.materiales[0].items[0].nombre, "Insulina");
  assert.equal(report.equipo.length, 1);
  assert.equal(report.personalNecesita.length, 1);
});

test("sedeReportToCsv includes materiales and personal sections", () => {
  const csv = sedeReportToCsv(SAMPLE_SEDE);
  assert.match(csv, /MATERIALES/);
  assert.match(csv, /Insulina/);
  assert.match(csv, /PERSONAL EN EL CENTRO/);
  assert.match(csv, /Ana Pérez/);
  assert.match(csv, /PERSONAL QUE NECESITAMOS/);
  assert.match(csv, /Informática/);
});
