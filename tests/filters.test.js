import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterPosts, countPosts } from "../src/lib/filters.js";

const posts = [
  { id: 1, kind: "need", type: "agua", urgency: "critica", status: "abierto", mins: 5 },
  { id: 2, kind: "need", type: "medicamentos", urgency: "alta", status: "en_camino", mins: 10 },
  { id: 3, kind: "need", type: "agua", urgency: "media", status: "cubierto", mins: 30 },
  { id: 4, kind: "offer", type: "transporte", urgency: "alta", status: "abierto", mins: 2 },
  { id: 5, kind: "offer", type: "voluntario", urgency: "media", status: "abierto", mins: 15 },
  { id: 6, kind: "offer", type: "agua", urgency: "alta", status: "cubierto", mins: 40 },
];

describe("filterPosts", () => {
  it("muestra solo pide cuando el filtro es need", () => {
    const out = filterPosts(posts, {
      activeTypes: new Set(["agua", "medicamentos", "transporte", "voluntario"]),
      kindFilter: "need",
      statusFilter: "activas",
    });
    assert.ok(out.every((p) => p.kind === "need"));
    assert.ok(out.every((p) => p.status !== "cubierto"));
  });

  it("muestra solo ofrece cuando el filtro es offer", () => {
    const out = filterPosts(posts, {
      activeTypes: new Set(["agua", "transporte", "voluntario"]),
      kindFilter: "offer",
      statusFilter: "activas",
    });
    assert.deepEqual(out.map((p) => p.id), [4, 5]);
  });

  it("ordena por urgencia crítica primero", () => {
    const out = filterPosts(posts, {
      activeTypes: new Set(["agua", "medicamentos"]),
      kindFilter: "need",
      statusFilter: "todas",
    });
    assert.equal(out[0].urgency, "critica");
  });

  it("respeta chips de tipo desactivados", () => {
    const out = filterPosts(posts, {
      activeTypes: new Set(["medicamentos"]),
      kindFilter: "todos",
      statusFilter: "todas",
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].type, "medicamentos");
  });

  it("filtro cubiertas solo muestra status cubierto", () => {
    const out = filterPosts(posts, {
      activeTypes: new Set(["agua", "transporte", "voluntario", "medicamentos"]),
      kindFilter: "todos",
      statusFilter: "cubierto",
    });
    assert.ok(out.every((p) => p.status === "cubierto"));
    assert.equal(out.length, 2);
  });

  it("acepta activeTypes como array (estado restaurado de localStorage)", () => {
    const out = filterPosts(posts, {
      activeTypes: ["transporte"],
      kindFilter: "offer",
      statusFilter: "activas",
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].type, "transporte");
  });
});

describe("countPosts", () => {
  it("cuenta pide, ofrece y críticas activas", () => {
    const c = countPosts(posts, [{ need: { id: 1 }, matches: [] }]);
    assert.equal(c.pide, 2);
    assert.equal(c.ofrece, 2);
    assert.equal(c.criticas, 1);
    assert.equal(c.matchable, 1);
  });
});
