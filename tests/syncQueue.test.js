import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const storage = new Map();

globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, val) => storage.set(key, val),
  removeItem: (key) => storage.delete(key),
};

const offline = await import("../src/lib/offlineStore.js");
const { createOfflineReport, patchOfflineStatus, flushQueue } = await import("../src/lib/syncQueue.js");

beforeEach(() => {
  storage.clear();
  offline.clearQueue();
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
    writable: true,
  });
});

describe("createOfflineReport", () => {
  it("encola un reporte pide sin conexión", () => {
    const draft = {
      kind: "need",
      type: "agua",
      urgency: "alta",
      place: " La Guaira ",
      detail: " Agua potable ",
      contact: "0412",
      lat: 10.598,
      lng: -66.948,
    };

    const { need, needs, pendingCount } = createOfflineReport(draft, []);
    assert.equal(need.kind, "need");
    assert.equal(need._pending, true);
    assert.ok(need.id < 0);
    assert.equal(needs.length, 1);
    assert.equal(pendingCount, 1);
    assert.equal(offline.getQueue()[0].payload.kind, "need");
    assert.equal(offline.loadNeedsSnapshot()?.[0].place, "La Guaira");
  });

  it("encola una oferta de transporte sin conexión", () => {
    const draft = {
      kind: "offer",
      type: "transporte",
      urgency: "alta",
      place: "Valencia",
      detail: "Camioneta rumbo a Caracas",
      contact: "",
      lat: 10.172,
      lng: -68.004,
    };

    const { need } = createOfflineReport(draft, []);
    assert.equal(need.kind, "offer");
    assert.equal(need.type, "transporte");
    assert.equal(offline.getQueue()[0].payload.type, "transporte");
  });
});

describe("patchOfflineStatus", () => {
  it("actualiza estado local y encola patch", () => {
    const posts = [{ id: 5, kind: "need", status: "abierto", type: "agua" }];
    const { needs, pendingCount } = patchOfflineStatus(5, "en_camino", posts);
    assert.equal(needs[0].status, "en_camino");
    assert.equal(pendingCount, 1);
    assert.equal(offline.getQueue()[0].needId, 5);
  });

  it("encola patch con tempId para reportes offline", () => {
    const posts = [{ id: -42, kind: "offer", status: "abierto", _pending: true }];
    patchOfflineStatus(-42, "cubierto", posts);
    assert.equal(offline.getQueue()[0].tempId, -42);
  });
});

describe("flushQueue", () => {
  it("no sincroniza si no hay conexión", async () => {
    globalThis.navigator.onLine = false;
    offline.setQueue([{ type: "create", tempId: -1, payload: {} }]);
    const result = await flushQueue([]);
    assert.equal(result.synced, 0);
    assert.equal(result.remaining, 1);
  });

  it("sincroniza creates y resuelve tempId → id real", async () => {
    const prevFetch = globalThis.fetch;
    globalThis.fetch = async (url, opts) => {
      if (url === "/api/needs" && opts.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            need: {
              id: 99,
              kind: "offer",
              type: "transporte",
              urgency: "alta",
              status: "abierto",
              place: "Valencia",
              zone: "Valencia",
              detail: "Camioneta",
              contact: "—",
              lat: 10.17,
              lng: -68.0,
              mins: 0,
            },
          }),
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    offline.setQueue([{
      type: "create",
      tempId: -7,
      payload: {
        kind: "offer",
        type: "transporte",
        urgency: "alta",
        place: "Valencia",
        detail: "Camioneta",
        contact: "",
        lat: 10.17,
        lng: -68.0,
        zone: "Valencia",
      },
    }]);

    const result = await flushQueue([{ id: -7, kind: "offer", status: "abierto" }]);
    assert.equal(result.synced, 1);
    assert.equal(result.remaining, 0);
    assert.equal(result.needs?.[0].id, 99);
    assert.equal(result.needs?.[0]._pending, false);
    globalThis.fetch = prevFetch;
  });
});
