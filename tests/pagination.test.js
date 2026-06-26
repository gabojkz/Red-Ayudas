import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BOARD_PAGE_SIZE,
  paginateItems,
  findItemPage,
  buildNeedsBoardQuery,
} from "../src/lib/pagination.js";

describe("paginateItems", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));

  it("divide en páginas de BOARD_PAGE_SIZE", () => {
    const p1 = paginateItems(items, 1);
    assert.equal(p1.items.length, BOARD_PAGE_SIZE);
    assert.equal(p1.page, 1);
    assert.equal(p1.pages, 2);
    assert.equal(p1.total, 30);
    assert.equal(p1.start, 1);
    assert.equal(p1.end, BOARD_PAGE_SIZE);

    const p2 = paginateItems(items, 2);
    assert.equal(p2.items.length, 5);
    assert.equal(p2.start, BOARD_PAGE_SIZE + 1);
    assert.equal(p2.end, 30);
  });

  it("corrige página fuera de rango", () => {
    assert.equal(paginateItems(items, 99).page, 2);
    assert.equal(paginateItems(items, 0).page, 1);
  });
});

describe("findItemPage", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));

  it("encuentra la página de un id", () => {
    assert.equal(findItemPage(items, 1), 1);
    assert.equal(findItemPage(items, BOARD_PAGE_SIZE), 1);
    assert.equal(findItemPage(items, BOARD_PAGE_SIZE + 1), 2);
  });
});

describe("buildNeedsBoardQuery", () => {
  it("incluye filtros y paginación", () => {
    const q = buildNeedsBoardQuery({
      page: 2,
      limit: 25,
      activeTypes: new Set(["agua", "medicamentos"]),
      kindFilter: "need",
      statusFilter: "activas",
      allTypeKeys: ["agua", "medicamentos", "otros"],
    });
    assert.equal(q.get("page"), "2");
    assert.equal(q.get("limit"), "25");
    assert.equal(q.get("kind"), "need");
    assert.equal(q.get("status"), "activas");
    assert.equal(q.get("types"), "agua,medicamentos");
  });
});
