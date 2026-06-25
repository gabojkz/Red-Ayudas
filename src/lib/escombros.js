/** Opciones de equipo para reportes tipo escombros (selección múltiple) */
import { sanitizeText } from "./sanitize.js";
export const ESCOMBROS_EQUIPO = [
  "Retroexcavadora",
  "Grúa",
  "Minicargador (bobcat)",
  "Camión volquete",
  "Compresor / martillo neumático",
  "Generador eléctrico",
  "Equipo de corte (sierra, discos)",
  "Detectores de vida / cámaras",
  "Pico, pala y carretilla",
  "Voluntarios sin equipo",
  "Otro",
];

const EQUIPO_SET = new Set(ESCOMBROS_EQUIPO);
const MAX_EQUIPOS = 8;

/** @returns {string[]} */
export function parseEquipos(raw) {
  if (!raw || typeof raw !== "object") return [];

  if (Array.isArray(raw.equipos)) {
    return [...new Set(
      raw.equipos
        .filter((e) => typeof e === "string" && e.trim())
        .map((e) => e.trim())
        .filter((e) => EQUIPO_SET.has(e))
    )].slice(0, MAX_EQUIPOS);
  }

  const legacy = String(raw.equipo ?? "").trim();
  if (legacy && EQUIPO_SET.has(legacy)) return [legacy];

  return [];
}

export function normalizeEscombrosMeta(raw, kind = "need") {
  if (!raw || typeof raw !== "object") return {};

  const meta = {};
  const equipos = parseEquipos(raw);
  if (equipos.length) meta.equipos = equipos;

  if (raw.operador_incluido != null) {
    meta.operador_incluido = Boolean(raw.operador_incluido);
  }

  if (raw.necesita_transporte != null) {
    meta.necesita_transporte = Boolean(raw.necesita_transporte);
  }

  const personas = Number(raw.personas ?? raw.personas_solicitadas ?? raw.personas_disponibles);
  if (Number.isFinite(personas) && personas > 0) {
    meta.personas = Math.min(Math.floor(personas), 9999);
  }

  const capacidad = sanitizeText(raw.capacidad, 40);
  if (capacidad) meta.capacidad = capacidad;

  const disponibleDesde = sanitizeText(raw.disponible_desde, 80);
  if (disponibleDesde) meta.disponible_desde = disponibleDesde;

  return meta;
}

export function validateEscombrosMeta(raw, kind = "need") {
  const errors = [];
  const meta = normalizeEscombrosMeta(raw, kind);

  if (!meta.equipos?.length) {
    errors.push("al menos un equipo requerido para escombros");
  }

  if (errors.length) return { ok: false, errors };

  return { ok: true, data: meta };
}

export function toggleEquipo(current, item) {
  const list = Array.isArray(current) ? [...current] : [];
  if (list.includes(item)) return list.filter((e) => e !== item);
  if (list.length >= MAX_EQUIPOS) return list;
  return [...list, item];
}

/** Chips compactos para tarjetas y detalle */
export function escombrosMetaChips(meta) {
  if (!meta || typeof meta !== "object") return [];
  const chips = [];
  const equipos = parseEquipos(meta);
  equipos.forEach((eq, i) => chips.push({ id: `equipo-${i}`, label: eq }));
  if (meta.necesita_transporte === false) chips.push({ id: "in-situ", label: "In situ" });
  if (meta.necesita_transporte === true) chips.push({ id: "transporte", label: "Necesita transporte" });
  if (meta.operador_incluido === true) chips.push({ id: "operador", label: "Con operador" });
  if (meta.operador_incluido === false) chips.push({ id: "sin-operador", label: "Sin operador" });
  if (meta.personas) chips.push({ id: "personas", label: `${meta.personas} pers.` });
  if (meta.capacidad) chips.push({ id: "capacidad", label: meta.capacidad });
  return chips;
}
