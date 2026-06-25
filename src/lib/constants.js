export const KIND = {
  need: { label: "Pide", short: "Pide", color: "#E03B4B" },
  offer: { label: "Ofrece", short: "Ofrece", color: "#0D9488" },
};

export const TYPES = {
  medicamentos: { label: "Medicamentos", color: "#E03B4B" },
  agua: { label: "Agua", color: "#2D8FD4" },
  alimentos: { label: "Alimentos", color: "#E8870E" },
  escombros: { label: "Escombros", color: "#92400E" },
  rescate: { label: "Rescate", color: "#7C3AED" },
  refugio: { label: "Refugio", color: "#1F9E5E" },
  transporte: { label: "Transporte", color: "#6366F1" },
  voluntario: { label: "Voluntario", color: "#0891B2" },
  otros: { label: "Otros", color: "#6B7280" },
};

export const OFFER_TYPES = [
  "transporte", "voluntario", "escombros", "agua", "alimentos",
  "medicamentos", "refugio", "rescate", "otros",
];

export const TYPE_COMPAT = {
  medicamentos: ["medicamentos", "voluntario", "transporte"],
  agua: ["agua", "transporte"],
  alimentos: ["alimentos", "transporte"],
  escombros: ["escombros", "transporte", "voluntario"],
  rescate: ["rescate", "voluntario", "transporte", "escombros"],
  refugio: ["refugio", "transporte", "voluntario"],
  otros: ["otros", "transporte", "voluntario"],
};

export const URGENCY = {
  critica: { label: "Crítica", rank: 0, color: "#DC2626" },
  alta: { label: "Alta", rank: 1, color: "#EA580C" },
  media: { label: "Media", rank: 2, color: "#B45309" },
};

export const STATUS = {
  abierto: { label: "Abierto", color: "#1A2233" },
  en_camino: { label: "En camino", color: "#2563EB" },
  cubierto: { label: "Cubierto", color: "#1F9E5E" },
};

export const CONN_STATUS = {
  coordinando: { label: "Coordinando", color: "#2563EB", bg: "#EFF6FF" },
  en_transito: { label: "En tránsito", color: "#7C3AED", bg: "#F5F3FF" },
  entregado: { label: "Entregado", color: "#1F9E5E", bg: "#F0FDF4" },
  cancelado: { label: "Cancelado", color: "#6B7280", bg: "#F9FAFB" },
};

export const ROLES = {
  solicitante: { label: "Solicitante", desc: "Necesito algo", color: "#E03B4B", kind: "need" },
  oferente: { label: "Oferente", desc: "Tengo algo para dar", color: "#1F9E5E", kind: "offer" },
  coordinador: { label: "Coordinador remoto", desc: "Gestiono desde fuera", color: "#2563EB", kind: null },
};

/** Fases de respuesta humanitaria (modelo de datos preparado para escalar) */
export const PHASES = {
  rescate: {
    label: "Semana 1 · Rescate",
    types: ["agua", "medicamentos", "rescate", "refugio", "escombros"],
  },
  estabilizacion: {
    label: "Semanas 2–8 · Estabilización",
    types: ["medicamentos", "alimentos", "refugio", "otros"],
  },
  recuperacion: {
    label: "Meses 2–6 · Recuperación",
    types: ["alimentos", "transporte", "voluntario", "otros"],
  },
};

export const ZONES = [
  { name: "Caracas", lat: 10.49, lng: -66.90 },
  { name: "La Guaira", lat: 10.60, lng: -66.93 },
  { name: "Yaracuy", lat: 10.34, lng: -68.74 },
  { name: "Maracay", lat: 10.25, lng: -67.60 },
  { name: "Valencia", lat: 10.17, lng: -68.00 },
  { name: "Morón", lat: 10.49, lng: -68.19 },
  { name: "San Felipe", lat: 10.34, lng: -68.74 },
];

export { MAP_CENTER, MAP_STYLE } from "./mapLayers.js";

export function nearestZone(lat, lng) {
  return ZONES.reduce((best, z) => {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    return !best || d < best.d ? { z, d } : best;
  }, null).z.name;
}

export function minutesAgo(isoDate) {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins <= 0) return 0;
  return mins;
}

export function timeAgoLabel(mins) {
  if (mins <= 0) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  return `hace ${Math.floor(mins / 60)} h`;
}

function parseMeta(value) {
  if (value == null) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function rowToNeed(row) {
  const mins = minutesAgo(row.created_at);
  return {
    id: Number(row.id),
    kind: row.kind || "need",
    type: row.type,
    urgency: row.urgency,
    status: row.status,
    place: row.place,
    zone: row.zone,
    detail: row.detail,
    contact: row.contact,
    lat: Number(row.lat),
    lng: Number(row.lng),
    meta: parseMeta(row.meta),
    mins,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToConnection(row) {
  const mins = minutesAgo(row.created_at);
  return {
    id: Number(row.id),
    needId: Number(row.need_id),
    offerId: Number(row.offer_id),
    status: row.status,
    notes: row.notes || "",
    coordinatorRemote: Boolean(row.coordinator_remote),
    mins,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
