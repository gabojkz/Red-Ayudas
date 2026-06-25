import { TYPES, KIND } from "./constants.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

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

export function buildFeed(needs) {
  return {
    updatedAt: new Date().toISOString(),
    count: needs.length,
    items: needs.map(toFeedItem),
  };
}
