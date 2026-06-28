import { TYPES, KIND } from "./constants.js";
import { stockStatus, sedeOperationalStatus, bedsStatus } from "./stockConstants.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const STOCK_STATUS_FEED = {
  Agotado: "agotado",
  Bajo: "bajo",
  Disponible: "disponible",
};

const BEDS_STATUS_FEED = {
  "Sin camas": "sin_camas",
  Lleno: "lleno",
  "Casi lleno": "casi_lleno",
  Disponible: "disponible",
};

/**
 * @typedef {Object} FeedItem
 * @property {number} id
 * @property {'need'|'offer'} kind
 * @property {string} type
 * @property {'critica'|'alta'|'media'} urgency
 * @property {'abierto'|'en_camino'|'cubierto'} status
 * @property {string} place
 * @property {string} zone
 * @property {string} detail
 * @property {number} lat
 * @property {number} lng
 * @property {string} publishedAt - ISO timestamp
 */

/**
 * @typedef {Object} FeedStockItem
 * @property {string} cat
 * @property {string} nombre
 * @property {number} cantidad
 * @property {string} unidad
 * @property {'agotado'|'bajo'|'disponible'} status
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} FeedCentro
 * @property {string} slug
 * @property {string} nombre
 * @property {string} zona
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {string|null} contacto
 * @property {number} camasTotal
 * @property {number} camasLibres
 * @property {'sin_camas'|'lleno'|'casi_lleno'|'disponible'} bedsStatus
 * @property {'operativo'|'atencion'|'critico'} operationalStatus
 * @property {FeedStockItem[]} stock
 */

export function validateFeedQuery({ kind, type, limit } = {}) {
  const errors = [];
  let parsedLimit = DEFAULT_LIMIT;

  if (kind && !KIND[kind]) errors.push("kind inválido");
  if (type && !TYPES[type]) errors.push("type inválido");

  if (limit != null && limit !== "") {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) errors.push("limit inválido (1–500)");
    else parsedLimit = n;
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      kind: kind || undefined,
      type: type || undefined,
      limit: parsedLimit,
    },
  };
}

/** Public feed shape — no contact or internal meta. */
export function toFeedItem(need) {
  return {
    id: need.id,
    kind: need.kind,
    type: need.type,
    urgency: need.urgency,
    status: need.status,
    place: need.place,
    zone: need.zone,
    detail: need.detail,
    lat: need.lat,
    lng: need.lng,
    publishedAt: need.createdAt,
  };
}

/** Public stock line for a centro — no internal ids or thresholds. */
export function toFeedStockItem(item) {
  const st = stockStatus(item);
  return {
    cat: item.cat,
    nombre: item.nombre,
    cantidad: item.cantidad,
    unidad: item.unidad,
    status: STOCK_STATUS_FEED[st.key] || st.key.toLowerCase(),
    updatedAt: item.updatedAt,
  };
}

/** Public centro with inventory for GET /api/feed. */
export function toFeedCentro(sede, stock = []) {
  const op = sedeOperationalStatus(sede, stock);
  const beds = bedsStatus(sede);
  return {
    slug: sede.slug,
    nombre: sede.nombre,
    zona: sede.zona,
    lat: sede.lat,
    lng: sede.lng,
    contacto: sede.contacto || null,
    camasTotal: sede.camasTotal ?? 0,
    camasLibres: sede.camasDisponibles ?? Math.max(0, (sede.camasTotal ?? 0) - (sede.camasOcupadas ?? 0)),
    bedsStatus: BEDS_STATUS_FEED[beds.key] || beds.key.toLowerCase().replace(/\s+/g, "_"),
    operationalStatus: op.key,
    stock: stock.map(toFeedStockItem),
  };
}

export function buildFeed(needs, sedesWithStock = []) {
  const centros = sedesWithStock.map(({ sede, stock }) => toFeedCentro(sede, stock));
  return {
    updatedAt: new Date().toISOString(),
    count: needs.length,
    items: needs.map(toFeedItem),
    centros: {
      count: centros.length,
      items: centros,
    },
  };
}
