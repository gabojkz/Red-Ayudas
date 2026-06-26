import { URGENCY } from "./constants.js";

export function urgencyRank(urgency) {
  return URGENCY[urgency]?.rank ?? 99;
}

/** Crítico arriba; a igual urgencia, necesidades antes que ofertas; luego más recientes. */
export function comparePostsByPriority(a, b) {
  const byUrgency = urgencyRank(a.urgency) - urgencyRank(b.urgency);
  if (byUrgency !== 0) return byUrgency;

  if (a.kind !== b.kind) {
    if (a.kind === "need") return -1;
    if (b.kind === "need") return 1;
  }

  return (a.mins ?? 0) - (b.mins ?? 0);
}

export function sortPostsByPriority(posts) {
  return [...posts].sort(comparePostsByPriority);
}

export function compareConnectionsByNeedUrgency(a, b, postsById) {
  const needA = postsById.get(a.needId);
  const needB = postsById.get(b.needId);
  return comparePostsByPriority(
    needA || { urgency: "media", kind: "need", mins: 999_999 },
    needB || { urgency: "media", kind: "need", mins: 999_999 },
  );
}

export function sortConnectionsByNeedUrgency(connections, postsById) {
  return [...connections].sort((a, b) => compareConnectionsByNeedUrgency(a, b, postsById));
}
