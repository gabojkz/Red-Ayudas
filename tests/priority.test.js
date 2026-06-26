import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  comparePostsByPriority,
  sortPostsByPriority,
  sortConnectionsByNeedUrgency,
} from "../src/lib/priority.js";

describe("comparePostsByPriority", () => {
  it("ordena crítica antes que alta y media", () => {
    const posts = sortPostsByPriority([
      { id: 1, kind: "need", urgency: "media", mins: 1 },
      { id: 2, kind: "need", urgency: "critica", mins: 50 },
      { id: 3, kind: "need", urgency: "alta", mins: 2 },
    ]);
    assert.deepEqual(posts.map((p) => p.id), [2, 3, 1]);
  });

  it("a igual urgencia, necesidades antes que ofertas", () => {
    assert.ok(comparePostsByPriority(
      { kind: "need", urgency: "alta", mins: 10 },
      { kind: "offer", urgency: "alta", mins: 1 },
    ) < 0);
  });
});

describe("sortConnectionsByNeedUrgency", () => {
  it("ordena conexiones por urgencia de la necesidad", () => {
    const postsById = new Map([
      [1, { kind: "need", urgency: "media", mins: 1 }],
      [2, { kind: "need", urgency: "critica", mins: 5 }],
    ]);
    const sorted = sortConnectionsByNeedUrgency([
      { id: 10, needId: 1, offerId: 99 },
      { id: 11, needId: 2, offerId: 98 },
    ], postsById);
    assert.equal(sorted[0].needId, 2);
  });
});
