import { TYPES, URGENCY, STATUS, KIND, CONN_STATUS, nearestZone } from "./constants.js";
import { validateEscombrosMeta, parseEquipos } from "./escombros.js";
import { sanitizeText } from "./sanitize.js";

const VENEZUELA_LAT = [0.5, 12.5];
const VENEZUELA_LNG = [-73.5, -59.5];
const NEED_STATUS_FILTERS = new Set(["activas", "cubierto"]);
const CONNECTION_STATUS_FILTERS = new Set(["activas", "todas", ...Object.keys(CONN_STATUS)]);

export function validateCreateNeed(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }

  const { kind, type, urgency, place, detail, contact, lat, lng } = body;
  const postKind = kind || "need";

  if (!KIND[postKind]) errors.push("kind inválido (need | offer)");
  if (!type || !TYPES[type]) errors.push("type inválido");
  if (!urgency || !URGENCY[urgency]) errors.push("urgency inválida");
  if (!place || typeof place !== "string" || !sanitizeText(place)) errors.push("place requerido");
  if (!detail || typeof detail !== "string" || !sanitizeText(detail)) errors.push("detail requerido");

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || latNum < VENEZUELA_LAT[0] || latNum > VENEZUELA_LAT[1]) {
    errors.push("lat fuera de rango Venezuela");
  }
  if (!Number.isFinite(lngNum) || lngNum < VENEZUELA_LNG[0] || lngNum > VENEZUELA_LNG[1]) {
    errors.push("lng fuera de rango Venezuela");
  }

  let meta = {};
  if (type === "escombros") {
    const metaCheck = validateEscombrosMeta(body.meta, postKind);
    if (!metaCheck.ok) errors.push(...metaCheck.errors);
    else meta = metaCheck.data;
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      kind: postKind,
      type,
      urgency,
      place: sanitizeText(place, 200),
      detail: sanitizeText(detail, 2000),
      contact: sanitizeText(contact, 200) || "—",
      lat: latNum,
      lng: lngNum,
      zone: nearestZone(latNum, lngNum),
      status: "abierto",
      meta,
    },
  };
}

export function validateStatusUpdate(body) {
  if (!body || typeof body !== "object" || !STATUS[body.status]) {
    return { ok: false, errors: ["status inválido"] };
  }
  return { ok: true, data: { status: body.status } };
}

export function validateNeedId(id) {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return { ok: false, errors: ["id inválido"] };
  }
  return { ok: true, data: num };
}

/** Valida que un borrador del formulario esté listo para publicar (cliente). */
export function isDraftReady(draft) {
  if (!draft || typeof draft !== "object") return false;
  if (draft.role === "coordinador") return false;
  const lat = Number(draft.lat);
  const lng = Number(draft.lng);
  return Boolean(
    String(draft.place ?? "").trim() &&
    String(draft.detail ?? "").trim() &&
    draft.lat != null &&
    draft.lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    (draft.type !== "escombros" || (draft.meta?.equipos?.length > 0 || parseEquipos(draft.meta).length > 0))
  );
}

export function validateCreateConnection(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }

  const needId = Number(body.needId);
  const offerId = Number(body.offerId);
  if (!Number.isInteger(needId) || needId <= 0) errors.push("needId inválido");
  if (!Number.isInteger(offerId) || offerId <= 0) errors.push("offerId inválido");
  if (needId === offerId) errors.push("needId y offerId deben ser distintos");

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      needId,
      offerId,
      notes: body.notes ? sanitizeText(body.notes, 2000) : undefined,
      coordinatorRemote: Boolean(body.coordinatorRemote),
    },
  };
}

export function validateConnectionUpdate(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }

  const data = {};
  if (body.status != null) {
    if (!CONN_STATUS[body.status]) errors.push("status de conexión inválido");
    else data.status = body.status;
  }
  if (body.notes != null) data.notes = sanitizeText(body.notes, 2000);
  if (body.coordinatorRemote != null) data.coordinatorRemote = Boolean(body.coordinatorRemote);

  if (!Object.keys(data).length) errors.push("Nada que actualizar");
  if (errors.length) return { ok: false, errors };

  return { ok: true, data };
}

export function validateConnectionId(id) {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return { ok: false, errors: ["id inválido"] };
  }
  return { ok: true, data: num };
}

export function validateListNeedsQuery({ status, type, kind } = {}) {
  const errors = [];
  if (status && !NEED_STATUS_FILTERS.has(status)) errors.push("status inválido");
  if (type && !TYPES[type]) errors.push("type inválido");
  if (kind && !KIND[kind]) errors.push("kind inválido");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      status: status || undefined,
      type: type || undefined,
      kind: kind || undefined,
    },
  };
}

export function validateListConnectionsQuery({ status } = {}) {
  if (status && !CONNECTION_STATUS_FILTERS.has(status)) {
    return { ok: false, errors: ["status inválido"] };
  }
  return { ok: true, data: { status: status || undefined } };
}
