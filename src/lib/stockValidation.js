import { STOCK_CAT_KEYS, LABOR_SKILL_KEYS, SEDE_ROLE_KEYS } from "./stockConstants.js";
import { sanitizeText } from "./sanitize.js";
import { isInVenezuela } from "./geocode.js";
import { isValidPhoneContact } from "./phone.js";

const MAX_PHOTO_CHARS = 280_000;

function parsePhotoData(body, errors, label = "foto") {
  if (body == null || body === "") return null;
  const raw = String(body);
  if (raw.length > MAX_PHOTO_CHARS) {
    errors.push(`${label} demasiado grande`);
    return null;
  }
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(raw)) {
    errors.push(`${label} debe ser JPEG, PNG o WebP`);
    return null;
  }
  return raw;
}

export function normalizeCedula(text) {
  const raw = String(text ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (!raw) return "";
  const digits = raw.replace(/^V-?/, "");
  if (!/^\d{6,10}$/.test(digits)) return raw;
  return `V-${digits}`;
}

export function isValidCedula(text) {
  const norm = normalizeCedula(text);
  const digits = norm.replace(/^V-/, "");
  return /^\d{6,10}$/.test(digits);
}

export function validateSedeLogin(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }
  const slug = normalizeSlug(body.slug);
  const password = String(body.password ?? "");
  if (!slug) return { ok: false, errors: ["Usuario de sede requerido"] };
  if (!password) return { ok: false, errors: ["Contraseña requerida"] };
  return { ok: true, data: { slug, password } };
}

export function normalizeSlug(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isValidSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(slug);
}

export function slugFromNombre(nombre) {
  return normalizeSlug(nombre);
}

/** Registro público de un centro + al menos un trabajador. */
export function validateRegisterSede(body) {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }

  const nombre = sanitizeText(body.nombre, 200);
  const slug = normalizeSlug(body.slug || slugFromNombre(nombre));
  const password = String(body.password ?? "");
  const camasTotal = body.camasTotal != null && body.camasTotal !== ""
    ? Number(body.camasTotal)
    : 0;
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const fullAddress = sanitizeText(body.fullAddress || body.zona, 400);
  const zona = fullAddress || sanitizeText(body.zona, 400);
  const photoData = parsePhotoData(body.photoData, errors, "foto del centro");
  const contactoRaw = sanitizeText(body.contacto, 40);
  const contacto = contactoRaw || null;

  if (!nombre) errors.push("nombre del centro requerido");
  if (!zona) errors.push("selecciona la dirección del centro en el buscador");
  if (!isInVenezuela(lat, lng)) {
    errors.push("ubicación inválida — elige una dirección de la lista");
  }
  if (!slug || !isValidSlug(slug)) errors.push("usuario de sede inválido (3–32 caracteres, letras y números)");
  if (password.length < 4) errors.push("contraseña mínimo 4 caracteres");

  if (!Number.isInteger(camasTotal) || camasTotal < 0) {
    errors.push("camas totales inválidas");
  }
  if (contacto && !isValidPhoneContact(contacto)) {
    errors.push("teléfono de contacto inválido");
  }

  const rawWorkers = Array.isArray(body.trabajadores) ? body.trabajadores : [];
  if (rawWorkers.length === 0) {
    errors.push("registra al menos un trabajador del centro");
  }

  const trabajadores = [];
  for (let i = 0; i < rawWorkers.length; i++) {
    const w = validateCreateHelper(rawWorkers[i]);
    if (!w.ok) {
      errors.push(`trabajador ${i + 1}: ${w.errors.join(", ")}`);
    } else {
      trabajadores.push(w.data);
    }
  }

  const cedulas = new Set();
  for (const t of trabajadores) {
    if (cedulas.has(t.cedula)) errors.push("cédulas duplicadas entre trabajadores");
    cedulas.add(t.cedula);
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    data: { nombre, zona, slug, password, camasTotal, lat, lng, photoData, contacto, trabajadores },
  };
}

export function validateCreateStockItem(body) {
  const errors = [];
  if (!body || typeof body !== "object") errors.push("Cuerpo JSON inválido");
  if (errors.length) return { ok: false, errors };

  const cat = String(body.cat ?? "").trim();
  const nombre = sanitizeText(body.nombre, 200);
  const cantidad = Number(body.cantidad);
  const unidad = sanitizeText(body.unidad || "u", 40) || "u";
  const umbral = Number(body.umbral ?? 0);

  if (!STOCK_CAT_KEYS.includes(cat)) errors.push("categoría inválida");
  if (!nombre) errors.push("nombre requerido");
  if (!Number.isInteger(cantidad) || cantidad < 0) errors.push("cantidad inválida");
  if (!Number.isInteger(umbral) || umbral < 0) errors.push("umbral inválido");

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { cat, nombre, cantidad, unidad, umbral } };
}

export function validateStockDelta(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }
  const delta = Number(body.delta);
  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, errors: ["delta inválido"] };
  }
  return { ok: true, data: { delta } };
}

export function validateBedsUpdate(body) {
  const errors = [];
  if (!body || typeof body !== "object") errors.push("Cuerpo JSON inválido");
  if (errors.length) return { ok: false, errors };

  const data = {};
  if (body.camasTotal != null) {
    const n = Number(body.camasTotal);
    if (!Number.isInteger(n) || n < 0) errors.push("camasTotal inválido");
    else data.camasTotal = n;
  }
  if (body.camasOcupadas != null) {
    const n = Number(body.camasOcupadas);
    if (!Number.isInteger(n) || n < 0) errors.push("camasOcupadas inválido");
    else data.camasOcupadas = n;
  }
  if (!Object.keys(data).length) errors.push("Nada que actualizar");
  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}

export function validateCreateHelper(body) {
  const errors = [];
  if (!body || typeof body !== "object") errors.push("Cuerpo JSON inválido");
  if (errors.length) return { ok: false, errors };

  const nombre = sanitizeText(body.nombre, 120);
  const cedula = normalizeCedula(body.cedula);
  const rol = String(body.rol ?? "voluntario").trim();
  let photoData = null;

  if (!nombre) errors.push("nombre requerido");
  if (!isValidCedula(cedula)) errors.push("cédula inválida (ej. V-12345678)");
  if (!SEDE_ROLE_KEYS.includes(rol)) errors.push("rol inválido");

  if (body.photoData != null && body.photoData !== "") {
    photoData = parsePhotoData(body.photoData, errors, "foto");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { nombre, cedula, rol, photoData } };
}

export function validateSedeContactUpdate(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }
  const contactoRaw = sanitizeText(body.contacto, 40);
  const contacto = contactoRaw || null;
  if (contacto && !isValidPhoneContact(contacto)) {
    return { ok: false, errors: ["teléfono de contacto inválido"] };
  }
  return { ok: true, data: { contacto } };
}

export function validatePhotoUpdate(body, label = "foto") {
  const errors = [];
  if (!body || typeof body !== "object") {
    return { ok: false, errors: ["Cuerpo JSON inválido"] };
  }
  let photoData = null;
  if (body.photoData != null && body.photoData !== "") {
    photoData = parsePhotoData(body.photoData, errors, label);
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { photoData } };
}

export function validateStockSearchQuery({ q, cat, sort, originLat, originLng } = {}) {
  const catNorm = cat && cat !== "todos" ? String(cat) : undefined;
  if (catNorm && !STOCK_CAT_KEYS.includes(catNorm)) {
    return { ok: false, errors: ["categoría inválida"] };
  }
  const sortNorm = sort === "cercanas" ? "cercanas" : "recientes";
  const origin = parseOrigin(originLat, originLng);
  if (!origin.ok) return origin;
  return {
    ok: true,
    data: {
      q: q ? String(q).trim().slice(0, 80) : "",
      cat: catNorm,
      sort: sortNorm,
      originLat: origin.data?.lat,
      originLng: origin.data?.lng,
    },
  };
}

function parseOrigin(originLat, originLng) {
  if (originLat == null && originLng == null) return { ok: true, data: null };
  const lat = Number(originLat);
  const lng = Number(originLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, errors: ["ubicación inválida"] };
  }
  if (!isInVenezuela(lat, lng)) {
    return { ok: false, errors: ["ubicación fuera de Venezuela"] };
  }
  return { ok: true, data: { lat, lng } };
}

/** modo: busco (disponible) | dono (necesita) | personal */
export function validateStockOverviewQuery(params = {}) {
  const base = validateStockSearchQuery(params);
  if (!base.ok) return base;

  let modo = String(params.modo || "").trim();
  if (!modo) {
    if (params.filtro === "disponible") modo = "busco";
    else modo = "dono";
  }

  const validModos = ["busco", "dono", "personal"];
  if (!validModos.includes(modo)) {
    return { ok: false, errors: ["modo inválido"] };
  }

  let filtro = "necesita";
  if (modo === "busco") filtro = "disponible";
  else if (modo === "dono" && params.filtro === "todos") filtro = "todos";

  const skill = params.skill && params.skill !== "todos" ? String(params.skill) : undefined;
  if (skill && !LABOR_SKILL_KEYS.includes(skill)) {
    return { ok: false, errors: ["habilidad inválida"] };
  }

  return {
    ok: true,
    data: {
      ...base.data,
      modo,
      filtro,
      skill,
      originLat: base.data.originLat,
      originLng: base.data.originLng,
    },
  };
}

export function validateCreateLaborNeed(body) {
  const errors = [];
  if (!body || typeof body !== "object") errors.push("Cuerpo JSON inválido");
  if (errors.length) return { ok: false, errors };

  const skill = String(body.skill ?? "").trim();
  const cantidad = Number(body.cantidad ?? 1);
  const notas = body.notas != null && body.notas !== ""
    ? sanitizeText(body.notas, 300)
    : null;

  if (!LABOR_SKILL_KEYS.includes(skill)) errors.push("tipo de personal inválido");
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
    errors.push("cantidad inválida (1–99)");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: { skill, cantidad, notas } };
}
