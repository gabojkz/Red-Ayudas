import { nearestZone } from "./constants.js";
import { normalizeEscombrosMeta } from "./escombros.js";
import {
  getQueue,
  setQueue,
  isOnline,
  buildOfflineNeed,
  tempNeedId,
  saveNeedsSnapshot,
} from "./offlineStore.js";

async function postNeed(payload) {
  const res = await fetch("/api/needs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.errors?.join(", ") || "POST failed");
  }
  return res.json();
}

async function patchNeed(id, status) {
  const res = await fetch(`/api/needs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("PATCH failed");
  return res.json();
}

/**
 * Sincroniza la cola offline con el servidor.
 * @returns {{ synced: number, remaining: number, needs: import('./constants.js').Need[] | null }}
 */
export async function flushQueue(currentNeeds) {
  if (!isOnline()) return { synced: 0, remaining: getQueue().length, needs: null };

  const queue = getQueue();
  if (!queue.length) return { synced: 0, remaining: 0, needs: null };

  const tempToReal = new Map();
  const remaining = [];
  let synced = 0;
  let needs = [...currentNeeds];

  for (const item of queue) {
    try {
      if (item.type === "create") {
        const payload = {
          ...item.payload,
          zone: item.payload.zone || nearestZone(item.payload.lat, item.payload.lng),
        };
        const { need } = await postNeed(payload);
        if (item.tempId != null) tempToReal.set(item.tempId, need.id);
        needs = needs.map((n) => (n.id === item.tempId ? { ...need, _pending: false } : n));
        synced++;
      } else if (item.type === "patch") {
        const id = item.needId ?? tempToReal.get(item.tempId);
        if (!id || id < 0) {
          remaining.push(item);
          continue;
        }
        const { need } = await patchNeed(id, item.payload.status);
        needs = needs.map((n) => (n.id === id || n.id === item.tempId ? need : n));
        synced++;
      }
    } catch {
      remaining.push(item);
    }
  }

  setQueue(remaining);
  saveNeedsSnapshot(needs);
  return { synced, remaining: remaining.length, needs };
}

export function createOfflineReport(draft, currentNeeds) {
  const tempId = tempNeedId();
  const zone = nearestZone(draft.lat, draft.lng);
  const need = buildOfflineNeed({ ...draft, zone }, tempId);
  const next = [need, ...currentNeeds];
  saveNeedsSnapshot(next);

  const queue = getQueue();
  queue.push({
    type: "create",
    tempId,
    payload: {
      kind: draft.kind || "need",
      type: draft.type,
      urgency: draft.urgency,
      place: draft.place.trim(),
      detail: draft.detail.trim(),
      contact: draft.contact?.trim() || "",
      lat: draft.lat,
      lng: draft.lng,
      zone,
      meta: draft.type === "escombros" ? normalizeEscombrosMeta(draft.meta, draft.kind || "need") : {},
    },
    at: Date.now(),
  });
  setQueue(queue);

  return { need, needs: next, pendingCount: queue.length };
}

export function patchOfflineStatus(id, status, currentNeeds) {
  const next = currentNeeds.map((n) =>
    n.id === id ? { ...n, status, _pending: n._pending || !isOnline() } : n
  );
  saveNeedsSnapshot(next);

  const queue = getQueue();
  const entry = id < 0
    ? { type: "patch", tempId: id, payload: { status }, at: Date.now() }
    : { type: "patch", needId: id, payload: { status }, at: Date.now() };
  queue.push(entry);
  setQueue(queue);

  return { needs: next, pendingCount: queue.length };
}
