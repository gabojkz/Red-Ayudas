import { CONN_STATUS, URGENCY } from "./constants.js";
import { scoreMatch } from "./match.js";

export function isActiveConnection(conn) {
  return conn.status !== "entregado" && conn.status !== "cancelado";
}

export function needHasCoverage(needId, connections) {
  return connections.some((c) => c.needId === needId && isActiveConnection(c));
}

export function countOrphanNeeds(needs, connections) {
  return needs.filter(
    (n) => n.kind === "need" && n.status !== "cubierto" && !needHasCoverage(n.id, connections)
  ).length;
}

export function connectionStats(needs, connections) {
  const openNeeds = needs.filter((n) => n.kind === "need" && n.status !== "cubierto").length;
  const openOffers = needs.filter((n) => n.kind === "offer" && n.status !== "cubierto").length;
  const activeConns = connections.filter(isActiveConnection).length;
  const delivered = connections.filter((c) => c.status === "entregado").length;
  const orphans = countOrphanNeeds(needs, connections);
  const uncoordinated = connections.filter(
    (c) => isActiveConnection(c) && !c.coordinatorRemote
  ).length;

  return { openNeeds, openOffers, activeConns, delivered, orphans, uncoordinated };
}

function normalizeSearch(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Texto indexable de una conexión para búsqueda libre. */
export function connectionSearchText(conn, need, offer) {
  const statusLabel = CONN_STATUS[conn.status]?.label ?? conn.status;
  return [
    statusLabel,
    conn.notes,
    need?.place,
    need?.detail,
    need?.contact,
    need?.zone,
    offer?.place,
    offer?.detail,
    offer?.contact,
    offer?.zone,
  ].filter(Boolean).join(" ");
}

export function filterConnectionsBySearch(connections, postsById, query) {
  const q = normalizeSearch(query);
  if (!q) return connections;
  return connections.filter((conn) => {
    const need = postsById.get(conn.needId);
    const offer = postsById.get(conn.offerId);
    if (!need || !offer) return false;
    return normalizeSearch(connectionSearchText(conn, need, offer)).includes(q);
  });
}

export { sortConnectionsByNeedUrgency } from "./priority.js";

export function nextConnectionStatus(status) {
  if (status === "coordinando") return "en_transito";
  if (status === "en_transito") return "entregado";
  return null;
}

export function nextConnectionLabel(status) {
  const labels = {
    coordinando: "Marcar en tránsito",
    en_transito: "Marcar entregado",
  };
  return labels[status] || null;
}

/** Ofertas/necesidades compatibles sin conexión activa ya existente */
export function getMatchCandidates(item, needs, offers, connections) {
  const all = [...needs, ...offers];
  const linkedNeedIds = new Set(
    connections.filter(isActiveConnection).map((c) => c.needId)
  );

  if (item.kind === "need") {
    return offers
      .filter((o) => scoreMatch(item, o).score > 0)
      .filter((o) => !connections.some(
        (c) => c.needId === item.id && c.offerId === o.id && c.status !== "cancelado"
      ))
      .sort((a, b) => scoreMatch(item, b).score - scoreMatch(item, a).score)
      .slice(0, 5);
  }

  return needs
    .filter((n) => n.status !== "cubierto" && !linkedNeedIds.has(n.id))
    .filter((n) => scoreMatch(n, item).score > 0)
    .sort((a, b) =>
      URGENCY[a.urgency].rank - URGENCY[b.urgency].rank ||
      scoreMatch(b, item).score - scoreMatch(a, item).score)
    .slice(0, 5);
}

/** GeoJSON LineString para líneas en el mapa */
export function buildConnectionsGeoJSON(connections, postsById) {
  const features = connections
    .filter((c) => c.status !== "cancelado")
    .map((c) => {
      const need = postsById.get(c.needId);
      const offer = postsById.get(c.offerId);
      if (!need || !offer) return null;
      if (!Number.isFinite(need.lat) || !Number.isFinite(need.lng)) return null;
      if (!Number.isFinite(offer.lat) || !Number.isFinite(offer.lng)) return null;
      const style = CONN_STATUS[c.status] || CONN_STATUS.coordinando;
      return {
        type: "Feature",
        properties: {
          id: c.id,
          status: c.status,
          color: style.color,
          dashed: c.status === "en_transito" ? 1 : 0,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [need.lng, need.lat],
            [offer.lng, offer.lat],
          ],
        },
      };
    })
    .filter(Boolean);

  return { type: "FeatureCollection", features };
}
