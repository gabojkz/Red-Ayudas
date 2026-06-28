import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const storage = new Map();

globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, val) => storage.set(key, val),
  removeItem: (key) => storage.delete(key),
};

const {
  saveNeedsSnapshot,
  loadNeedsSnapshot,
  saveViewState,
  loadViewState,
  getQueue,
  setQueue,
  getCachedAt,
  buildOfflineNeed,
  tempNeedId,
  clearQueue,
} = await import("../src/lib/offlineStore.js");

beforeEach(() => storage.clear());

describe("offlineStore — caché entre sesiones/dispositivos", () => {
  it("guarda y restaura snapshot de necesidades", () => {
    const needs = [{ id: 1, kind: "need", place: "Hospital" }];
    saveNeedsSnapshot(needs);
    assert.deepEqual(loadNeedsSnapshot(), needs);
    assert.ok(getCachedAt());
  });

  it("persiste tab y selección (filtros no se guardan)", () => {
    saveViewState({
      activeTypes: new Set(["agua", "transporte"]),
      statusFilter: "activas",
      selectedId: 3,
      kindFilter: "offer",
      tab: "conexiones",
      listPage: 2,
    });
    const view = loadViewState();
    assert.equal(view.tab, "conexiones");
    assert.equal(view.selectedId, 3);
    assert.equal(view.listPage, 2);
    assert.equal(view.activeTypes, undefined);
    assert.equal(view.kindFilter, undefined);
  });

  it("tolera JSON corrupto en localStorage sin romper la app", () => {
    storage.set("rda:v1:needs", "{no-json");
    assert.equal(loadNeedsSnapshot(), null);
  });

  it("mantiene cola de acciones pendientes", () => {
    setQueue([{ type: "create", tempId: -1 }]);
    assert.equal(getQueue().length, 1);
    clearQueue();
    assert.equal(getQueue().length, 0);
  });
});

describe("offlineStore — reportes offline", () => {
  it("construye need con kind y pending", () => {
    const need = buildOfflineNeed(
      {
        kind: "offer",
        type: "voluntario",
        urgency: "alta",
        place: "Caracas",
        detail: "Médico disponible",
        contact: "",
        lat: 10.49,
        lng: -66.9,
        zone: "Caracas",
      },
      -99,
    );
    assert.equal(need.id, -99);
    assert.equal(need.kind, "offer");
    assert.equal(need._pending, true);
    assert.ok(tempNeedId() < 0);
  });

  it("genera ids temporales únicos en ráfaga", () => {
    const ids = new Set(Array.from({ length: 20 }, () => tempNeedId()));
    assert.equal(ids.size, 20);
  });
});
