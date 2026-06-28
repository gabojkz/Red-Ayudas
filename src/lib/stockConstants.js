/** @module stockConstants */

export const STOCK_CATS = {
  medicina: { label: "Medicina", color: "#9333EA", bg: "#F3E8FF" },
  alimentos: { label: "Alimentos", color: "#C2410C", bg: "#FFEDD5" },
  agua: { label: "Agua", color: "#0369A1", bg: "#E0F2FE" },
  herramientas: { label: "Herramientas", color: "#475569", bg: "#F1F5F9" },
  refugio: { label: "Refugio", color: "#0E5A6B", bg: "#E2F1F3" },
};

export const STOCK_CAT_KEYS = Object.keys(STOCK_CATS);

export const LABOR_SKILLS = {
  informatica: { label: "Informática", color: "#2563EB", bg: "#DBEAFE" },
  traduccion: { label: "Traducción", color: "#7C3AED", bg: "#EDE9FE" },
  medico: { label: "Personal médico", color: "#DC2626", bg: "#FEE2E2" },
  enfermeria: { label: "Enfermería", color: "#DB2777", bg: "#FCE7F3" },
  logistica: { label: "Logística", color: "#475569", bg: "#F1F5F9" },
  cocina: { label: "Cocina", color: "#C2410C", bg: "#FFEDD5" },
  psicologia: { label: "Apoyo psicológico", color: "#0D9488", bg: "#CCFBF1" },
  legal: { label: "Asesoría legal", color: "#854D0E", bg: "#FEF9C3" },
  comunicacion: { label: "Comunicación", color: "#0369A1", bg: "#E0F2FE" },
  general: { label: "Voluntariado general", color: "#15803D", bg: "#DCFCE7" },
};

export const LABOR_SKILL_KEYS = Object.keys(LABOR_SKILLS);

export const SEDE_ROLES = {
  coordinador: { label: "Coordinación", color: "#0E5A6B", bg: "#E2F1F3" },
  medico: { label: "Médico/a", color: "#DC2626", bg: "#FEE2E2" },
  enfermeria: { label: "Enfermería", color: "#DB2777", bg: "#FCE7F3" },
  logistica: { label: "Logística", color: "#475569", bg: "#F1F5F9" },
  cocina: { label: "Cocina", color: "#C2410C", bg: "#FFEDD5" },
  comunicacion: { label: "Comunicación", color: "#0369A1", bg: "#E0F2FE" },
  seguridad: { label: "Seguridad", color: "#854D0E", bg: "#FEF9C3" },
  voluntario: { label: "Voluntario/a", color: "#15803D", bg: "#DCFCE7" },
};

export const SEDE_ROLE_KEYS = Object.keys(SEDE_ROLES);

export const FRESHNESS_MS = 3600000;
export const SEARCH_ORIGIN = { lat: 10.48, lng: -66.9 };

export function rowToSede(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    zona: row.zona,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    camasTotal: row.camas_total,
    camasOcupadas: row.camas_ocupadas,
    camasDisponibles: Math.max(0, row.camas_total - row.camas_ocupadas),
    inventoryConfirmedAt: row.inventory_confirmed_at,
    photoUrl: row.photo_data || null,
    contacto: row.contacto || null,
  };
}

export function rowToStockItem(row) {
  return {
    id: row.id,
    sedeId: row.sede_id,
    cat: row.cat,
    nombre: row.nombre,
    cantidad: row.cantidad,
    unidad: row.unidad,
    umbral: row.umbral,
    updated: new Date(row.updated_at).getTime(),
    updatedAt: row.updated_at,
  };
}

export function rowToHelper(row) {
  const rolMeta = SEDE_ROLES[row.rol] || SEDE_ROLES.voluntario;
  return {
    id: row.id,
    sedeId: row.sede_id,
    nombre: row.nombre,
    cedula: row.cedula,
    rol: row.rol || "voluntario",
    rolLabel: rolMeta.label,
    photoUrl: row.photo_data || null,
    createdAt: row.created_at,
  };
}

export function rowToHelperPublic(row) {
  const h = rowToHelper(row);
  return {
    id: h.id,
    nombre: h.nombre,
    rol: h.rol,
    rolLabel: h.rolLabel,
    photoUrl: h.photoUrl,
  };
}

export function rowToLaborNeed(row) {
  const skillMeta = LABOR_SKILLS[row.skill];
  return {
    id: row.id,
    sedeId: row.sede_id,
    skill: row.skill,
    skillLabel: skillMeta?.label || row.skill,
    cantidad: row.cantidad,
    notas: row.notas || null,
    createdAt: row.created_at,
  };
}

export function resolveSearchOrigin(originLat, originLng, isValidCoord) {
  const lat = Number(originLat);
  const lng = Number(originLng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && isValidCoord?.(lat, lng)) {
    return { lat, lng, userProvided: true };
  }
  return { ...SEARCH_ORIGIN, userProvided: false };
}

export function attachDist(row, origin) {
  const dist = haversineKm(origin.lat, origin.lng, row.lat, row.lng);
  return dist != null ? Math.round(dist * 10) / 10 : null;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lng1) || !Number.isFinite(lat2) || !Number.isFinite(lng2)) {
    return null;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function timeAgoStock(ms) {
  const m = (Date.now() - ms) / 60000;
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${Math.round(m)} min`;
  const h = m / 60;
  if (h < 24) return `hace ${Math.round(h)} h`;
  const d = h / 24;
  return d < 2 ? "ayer" : `hace ${Math.round(d)} d`;
}

export function freshnessMeta(ms) {
  const h = (Date.now() - ms) / FRESHNESS_MS;
  if (h < 6) return { key: "fresh", color: "var(--inv-fresh)", bg: "var(--inv-freshbg)" };
  if (h < 24) return { key: "aging", color: "var(--inv-aging)", bg: "var(--inv-agingbg)" };
  return { key: "stale", color: "var(--inv-stale)", bg: "var(--inv-stalebg)" };
}

export function decayPct(ms) {
  return Math.max(6, Math.min(100, (1 - (Date.now() - ms) / (24 * FRESHNESS_MS)) * 100));
}

export function stockStatus(item) {
  if (item.cantidad <= 0) return { key: "Agotado", color: "var(--inv-stale)", bg: "var(--inv-stalebg)" };
  if (item.cantidad <= item.umbral) return { key: "Bajo", color: "var(--inv-aging)", bg: "var(--inv-agingbg)" };
  return { key: "Disponible", color: "var(--inv-fresh)", bg: "var(--inv-freshbg)" };
}

export function bedsStatus(sede) {
  const total = sede.camasTotal ?? 0;
  const ocupadas = sede.camasOcupadas ?? 0;
  const libres = Math.max(0, total - ocupadas);
  if (total <= 0) return { key: "Sin camas", color: "var(--inv-muted)", bg: "var(--inv-canvas)", libres: 0 };
  const pct = libres / total;
  if (libres <= 0) return { key: "Lleno", color: "var(--inv-stale)", bg: "var(--inv-stalebg)", libres: 0 };
  if (pct <= 0.15) return { key: "Casi lleno", color: "var(--inv-aging)", bg: "var(--inv-agingbg)", libres };
  return { key: "Disponible", color: "var(--inv-fresh)", bg: "var(--inv-freshbg)", libres };
}

/** Estado operativo del centro según inventario, camas y actualización. */
export function sedeOperationalStatus(sede, stock = []) {
  const items = stock || [];
  const agotados = items.filter((i) => i.cantidad <= 0).length;
  const bajos = items.filter((i) => i.cantidad > 0 && i.cantidad <= i.umbral).length;
  const beds = bedsStatus(sede);
  const invMs = sede.inventoryConfirmedAt
    ? new Date(sede.inventoryConfirmedAt).getTime()
    : null;
  const fresh = invMs ? freshnessMeta(invMs) : { key: "stale" };

  if (agotados > 0 || beds.key === "Lleno") {
    return {
      key: "critico",
      label: "Crítico",
      color: "var(--nec-stale)",
      bg: "var(--nec-stalebg)",
      detail: agotados > 0
        ? `${agotados} material${agotados > 1 ? "es" : ""} agotado${agotados > 1 ? "s" : ""}`
        : "Refugio sin camas libres",
    };
  }
  if (bajos > 0 || beds.key === "Casi lleno" || fresh.key === "stale") {
    const parts = [];
    if (bajos > 0) parts.push(`${bajos} con stock bajo`);
    if (beds.key === "Casi lleno") parts.push("refugio casi lleno");
    if (fresh.key === "stale") parts.push("inventario desactualizado");
    return {
      key: "atencion",
      label: "Requiere atención",
      color: "var(--nec-aging)",
      bg: "var(--nec-agingbg)",
      detail: parts.join(" · ") || "Revisar inventario",
    };
  }
  return {
    key: "operativo",
    label: "Operativo",
    color: "var(--nec-fresh)",
    bg: "var(--nec-freshbg)",
    detail: "Inventario y refugio en condiciones",
  };
}

export function buildSedePublicDetail(sede, stock, helpers, laborNeeds) {
  const status = sedeOperationalStatus(sede, stock);
  const beds = bedsStatus(sede);
  const stockDisponible = stock.filter((i) => i.cantidad > i.umbral);
  const stockFalta = stock.filter((i) => i.cantidad <= i.umbral);

  return {
    sede: {
      id: sede.id,
      slug: sede.slug,
      nombre: sede.nombre,
      zona: sede.zona,
      lat: sede.lat,
      lng: sede.lng,
      photoUrl: sede.photoUrl,
      contacto: sede.contacto,
      camasTotal: sede.camasTotal,
      camasOcupadas: sede.camasOcupadas,
      camasLibres: sede.camasDisponibles,
      inventoryConfirmedAt: sede.inventoryConfirmedAt,
      status,
      beds,
    },
    equipo: helpers.map((h) => ({
      id: h.id,
      nombre: h.nombre,
      rol: h.rol,
      rolLabel: h.rolLabel,
      photoUrl: h.photoUrl,
    })),
    stockDisponible,
    stockFalta,
    personalNecesita: laborNeeds,
  };
}
