import { getSedeAuthHeaders } from "@/lib/stockClientAuth.js";

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.errors?.join(", ") || data.error || res.statusText;
    throw new Error(msg);
  }
  return data;
}

export async function apiStockSearch(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.cat && params.cat !== "todos") qs.set("cat", params.cat);
  if (params.sort) qs.set("sort", params.sort);
  if (params.originLat != null) qs.set("originLat", params.originLat);
  if (params.originLng != null) qs.set("originLng", params.originLng);
  const res = await fetch(`/api/stock/search?${qs}`);
  return parseJson(res);
}

export async function apiStockOverview(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.cat && params.cat !== "todos") qs.set("cat", params.cat);
  if (params.sort) qs.set("sort", params.sort);
  if (params.modo) qs.set("modo", params.modo);
  if (params.filtro) qs.set("filtro", params.filtro);
  if (params.skill && params.skill !== "todos") qs.set("skill", params.skill);
  if (params.originLat != null) qs.set("originLat", params.originLat);
  if (params.originLng != null) qs.set("originLng", params.originLng);
  const res = await fetch(`/api/stock/overview?${qs}`);
  return parseJson(res);
}

export async function apiSedeLogin(slug, password) {
  const res = await fetch("/api/sedes/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, password }),
  });
  return parseJson(res);
}

export async function apiRegisterSede(payload) {
  const res = await fetch("/api/sedes/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function apiGetSede(session) {
  const res = await fetch(`/api/sedes/${session.sede.id}`, {
    headers: getSedeAuthHeaders(session),
  });
  return parseJson(res);
}

export async function apiAddStock(session, item) {
  const res = await fetch(`/api/sedes/${session.sede.id}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify(item),
  });
  return parseJson(res);
}

export async function apiAdjustStock(session, itemId, delta) {
  const res = await fetch(`/api/sedes/${session.sede.id}/stock/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify({ delta }),
  });
  return parseJson(res);
}

export async function apiDeleteStock(session, itemId) {
  const res = await fetch(`/api/sedes/${session.sede.id}/stock/${itemId}`, {
    method: "DELETE",
    headers: getSedeAuthHeaders(session),
  });
  return parseJson(res);
}

export async function apiConfirmStock(session) {
  const res = await fetch(`/api/sedes/${session.sede.id}/stock/confirm`, {
    method: "POST",
    headers: getSedeAuthHeaders(session),
  });
  return parseJson(res);
}

export async function apiUpdateBeds(session, beds) {
  const res = await fetch(`/api/sedes/${session.sede.id}/beds`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify(beds),
  });
  return parseJson(res);
}

export async function apiAddHelper(session, helper) {
  const res = await fetch(`/api/sedes/${session.sede.id}/helpers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify(helper),
  });
  return parseJson(res);
}

export async function apiDeleteHelper(session, helperId) {
  const res = await fetch(`/api/sedes/${session.sede.id}/helpers/${helperId}`, {
    method: "DELETE",
    headers: getSedeAuthHeaders(session),
  });
  return parseJson(res);
}

export async function apiAddLaborNeed(session, need) {
  const res = await fetch(`/api/sedes/${session.sede.id}/labor`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify(need),
  });
  return parseJson(res);
}

export async function apiDeleteLaborNeed(session, needId) {
  const res = await fetch(`/api/sedes/${session.sede.id}/labor/${needId}`, {
    method: "DELETE",
    headers: getSedeAuthHeaders(session),
  });
  return parseJson(res);
}

export async function apiListCentrosPublic() {
  const res = await fetch("/api/sedes/public");
  return parseJson(res);
}

export async function apiGetCentroPublic(slug) {
  const res = await fetch(`/api/sedes/public/${encodeURIComponent(slug)}`);
  return parseJson(res);
}

export async function apiUpdateSedeContact(session, contacto) {
  const res = await fetch(`/api/sedes/${session.sede.id}/contact`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify({ contacto }),
  });
  return parseJson(res);
}

export async function apiUpdateSedePhoto(session, photoData) {
  const res = await fetch(`/api/sedes/${session.sede.id}/photo`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify({ photoData }),
  });
  return parseJson(res);
}

export async function apiUpdateHelperPhoto(session, helperId, photoData) {
  const res = await fetch(`/api/sedes/${session.sede.id}/helpers/${helperId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getSedeAuthHeaders(session) },
    body: JSON.stringify({ photoData }),
  });
  return parseJson(res);
}

const SESSION_KEY = "rda:sede-session";

export function loadSedeSession() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSedeSession(session) {
  if (typeof sessionStorage === "undefined") return;
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
