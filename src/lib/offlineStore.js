import { normalizeEscombrosMeta } from "./escombros.js";

const PREFIX = "rda:v1";
const KEYS = {
  needs: `${PREFIX}:needs`,
  connections: `${PREFIX}:connections`,
  view: `${PREFIX}:view`,
  queue: `${PREFIX}:queue`,
  cachedAt: `${PREFIX}:cachedAt`,
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function read(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return safeParse(raw, fallback);
}

function write(key, value) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function saveNeedsSnapshot(needs) {
  write(KEYS.needs, needs);
  write(KEYS.cachedAt, new Date().toISOString());
}

export function saveConnectionsSnapshot(connections) {
  write(KEYS.connections, connections);
}

export function loadConnectionsSnapshot() {
  return read(KEYS.connections, null);
}

export function loadNeedsSnapshot() {
  return read(KEYS.needs, null);
}

export function getCachedAt() {
  return read(KEYS.cachedAt, null);
}

export function saveViewState(state) {
  write(KEYS.view, {
    activeTypes: [...state.activeTypes],
    statusFilter: state.statusFilter,
    selectedId: state.selectedId,
    kindFilter: state.kindFilter || "todos",
    tab: state.tab || "mapa",
  });
}

export function loadViewState() {
  return read(KEYS.view, null);
}

export function getQueue() {
  return read(KEYS.queue, []);
}

export function enqueueAction(action) {
  const queue = getQueue();
  queue.push({ ...action, id: crypto.randomUUID(), at: Date.now() });
  write(KEYS.queue, queue);
  return queue;
}

export function setQueue(queue) {
  write(KEYS.queue, queue);
}

export function clearQueue() {
  write(KEYS.queue, []);
}

let tempSeq = 0;

/** Genera id temporal negativo para reportes offline */
export function tempNeedId() {
  tempSeq = (tempSeq + 1) % 100_000;
  return -(Date.now() * 100 + tempSeq);
}

export function buildOfflineNeed(draft, id) {
  const now = new Date().toISOString();
  return {
    id,
    kind: draft.kind || "need",
    type: draft.type,
    urgency: draft.urgency,
    status: "abierto",
    place: draft.place.trim(),
    zone: draft.zone || "Sin zona",
    detail: draft.detail.trim(),
    contact: draft.contact?.trim() || "—",
    lat: draft.lat,
    lng: draft.lng,
    mins: 0,
    meta: draft.type === "escombros" ? normalizeEscombrosMeta(draft.meta, draft.kind || "need") : {},
    createdAt: now,
    updatedAt: now,
    _pending: true,
  };
}

export { KEYS };
