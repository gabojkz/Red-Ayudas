import { TYPES, URGENCY, STATUS, KIND, CONN_STATUS, nearestZone } from "./constants.js";

const VENEZUELA_LAT = [0.5, 12.5];
const VENEZUELA_LNG = [-73.5, -59.5];

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
  if (!place || typeof place !== "string" || !place.trim()) errors.push("place requerido");
  if (!detail || typeof detail !== "string" || !detail.trim()) errors.push("detail requerido");

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || latNum < VENEZUELA_LAT[0] || latNum > VENEZUELA_LAT[1]) {
    errors.push("lat fuera de rango Venezuela");
  }
  if (!Number.isFinite(lngNum) || lngNum < VENEZUELA_LNG[0] || lngNum > VENEZUELA_LNG[1]) {
    errors.push("lng fuera de rango Venezuela");
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      kind: postKind,
      type,
      urgency,
      place: place.trim().slice(0, 200),
      detail: detail.trim().slice(0, 2000),
      contact: (contact && String(contact).trim()) || "—",
      lat: latNum,
      lng: lngNum,
      zone: nearestZone(latNum, lngNum),
      status: "abierto",
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
    Number.isFinite(lng)
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
      notes: body.notes ? String(body.notes).trim().slice(0, 2000) : undefined,
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
  if (body.notes != null) data.notes = String(body.notes).trim().slice(0, 2000);
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
