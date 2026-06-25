import { TYPE_COMPAT, URGENCY } from "./constants.js";

function distKm(a, b) {
  const dLat = (b.lat - a.lat) * 111;
  const dLng = (b.lng - a.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function typeCompatible(needType, offerType) {
  if (needType === offerType) return true;
  if (offerType === "transporte") return true;
  return (TYPE_COMPAT[needType] || []).includes(offerType);
}

function typeReason(needType, offerType) {
  if (needType === offerType) return "Mismo tipo de recurso";
  if (offerType === "transporte") return "Transporte disponible";
  if (offerType === "voluntario") return "Voluntario disponible";
  return "Recurso compatible";
}

export function scoreMatch(need, offer) {
  if (need.kind !== "need" || offer.kind !== "offer") return { score: 0, reasons: [], km: 0 };
  if (offer.status === "cubierto") return { score: 0, reasons: [], km: 0 };
  if (!typeCompatible(need.type, offer.type)) return { score: 0, reasons: [], km: 0 };

  let score = 0;
  const reasons = [];
  const km = distKm(need, offer);

  if (need.type === offer.type) score += 12;
  else if (offer.type === "transporte") score += 7;
  else if (offer.type === "voluntario") score += 8;
  else score += 9;

  reasons.push(typeReason(need.type, offer.type));

  if (need.zone === offer.zone) {
    score += 10;
    reasons.push(`Misma zona · ${need.zone}`);
  } else if (
    offer.type === "transporte" &&
    offer.detail.toLowerCase().includes(need.zone.toLowerCase())
  ) {
    score += 8;
    reasons.push(`Ruta hacia ${need.zone}`);
  } else if (km < 40) {
    score += 4;
    reasons.push(`~${Math.round(km)} km`);
  }

  if (need.urgency === "critica") score += 3;
  if (km < 15) score += 3;

  return { score, reasons, km };
}

export function buildMatches(posts) {
  const needs = posts.filter((p) => p.kind === "need" && p.status !== "cubierto");
  const offers = posts.filter((p) => p.kind === "offer" && p.status !== "cubierto");

  return needs
    .map((need) => {
      const matches = offers
        .map((offer) => ({ offer, ...scoreMatch(need, offer) }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score || a.km - b.km)
        .slice(0, 4);
      return { need, matches };
    })
    .filter((m) => m.matches.length > 0)
    .sort(
      (a, b) =>
        URGENCY[a.need.urgency].rank - URGENCY[b.need.urgency].rank ||
        a.matches[0].score - b.matches[0].score
    );
}
