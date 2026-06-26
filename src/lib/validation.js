import { TYPES, URGENCY, STATUS, KIND, CONN_STATUS, nearestZone } from "./constants.js";
import { validateEscombrosMeta, parseEquipos } from "./escombros.js";
import { sanitizeText } from "./sanitize.js";
import { isValidPhoneContact } from "./phone.js";

export {
  isValidPhoneContact,
  normalizePhoneForLinks,
  phoneTelHref,
  phoneWhatsAppHref,
  PHONE_PLACEHOLDER,
  WHATSAPP_CONTACT_MESSAGE,
  buildWhatsAppContactMessage,
  buildWhatsAppConnectionMessage,
} from "./phone.js";

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
  if (!isValidPhoneContact(contact)) {
    errors.push("teléfono requerido (mínimo 5 dígitos)");
  }

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
      contact: sanitizeText(contact, 200),
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
export function hasDraftLocation(draft) {
  if (draft?.lat == null || draft?.lng == null) return false;
  const lat = Number(draft.lat);
  const lng = Number(draft.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function isDraftReady(draft) {
  return getDraftValidationErrors(draft).length === 0;
}

/** Mensajes concretos para mostrar al usuario cuando no puede publicar. */
export function getDraftValidationErrors(draft) {
  const errors = [];
  if (!draft || typeof draft !== "object") {
    errors.push("Abre el formulario con el botón Publicar del header.");
    return errors;
  }
  if (draft.role === "coordinador") {
    errors.push("El rol coordinador no publica recursos en el mapa.");
  }
  if (!String(draft.place ?? "").trim()) errors.push("Indica el lugar.");
  if (!String(draft.detail ?? "").trim()) errors.push("Indica la descripción.");
  if (!isValidPhoneContact(draft.contact)) {
    errors.push("Indica un teléfono de contacto (mínimo 5 dígitos).");
  }
  if (!hasDraftLocation(draft)) errors.push("Marca la ubicación tocando el mapa.");
  if (
    draft.type === "escombros"
    && !(draft.meta?.equipos?.length > 0 || parseEquipos(draft.meta).length > 0)
  ) {
    errors.push("Selecciona al menos un tipo de equipo.");
  }
  return errors;
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

export function validateListNeedsQuery({ status, type, kind, types, page, limit } = {}) {
  const errors = [];
  if (status && !NEED_STATUS_FILTERS.has(status)) errors.push("status inválido");
  if (type && !TYPES[type]) errors.push("type inválido");
  if (kind && !KIND[kind]) errors.push("kind inválido");

  let typesList;
  if (types) {
    typesList = String(types)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!typesList.length) errors.push("types inválido");
    for (const t of typesList) {
      if (!TYPES[t]) errors.push("types inválido");
    }
  }

  let pageNum;
  let limitNum;
  if (page != null && page !== "") {
    pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum < 1) errors.push("page inválido");
  }
  if (limit != null && limit !== "") {
    limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push("limit inválido (1–100)");
    }
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      status: status || undefined,
      type: type || undefined,
      kind: kind || undefined,
      types: typesList,
      page: pageNum,
      limit: limitNum,
    },
  };
}

export function validateListConnectionsQuery({ status } = {}) {
  if (status && !CONNECTION_STATUS_FILTERS.has(status)) {
    return { ok: false, errors: ["status inválido"] };
  }
  return { ok: true, data: { status: status || undefined } };
}
