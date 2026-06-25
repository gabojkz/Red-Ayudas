import { URGENCY } from "./constants.js";

/**
 * Filtra y ordena publicaciones para la lista de la app.
 * @param {Array<{ kind: string; type: string; status: string; urgency: string; mins?: number }>} posts
 * @param {{ activeTypes: Set<string> | string[]; kindFilter: string; statusFilter: string }} opts
 */
export function filterPosts(posts, { activeTypes, kindFilter, statusFilter }) {
  const types = activeTypes instanceof Set ? activeTypes : new Set(activeTypes);

  return posts
    .filter((n) => kindFilter === "todos" || n.kind === kindFilter)
    .filter((n) => types.has(n.type))
    .filter((n) =>
      statusFilter === "todas" ? true :
      statusFilter === "cubierto" ? n.status === "cubierto" :
      n.status !== "cubierto")
    .sort((a, b) =>
      URGENCY[a.urgency].rank - URGENCY[b.urgency].rank ||
      (a.mins ?? 0) - (b.mins ?? 0));
}

/** @param {ReturnType<typeof filterPosts>} matches */
export function countPosts(posts, matches = []) {
  return {
    pide: posts.filter((n) => n.kind === "need" && n.status !== "cubierto").length,
    ofrece: posts.filter((n) => n.kind === "offer" && n.status !== "cubierto").length,
    criticas: posts.filter((n) =>
      n.kind === "need" && n.urgency === "critica" && n.status !== "cubierto").length,
    matchable: matches.length,
  };
}
