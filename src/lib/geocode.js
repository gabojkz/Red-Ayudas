/** Geocodificación con Nominatim (OpenStreetMap) — uso gratuito vía proxy en /api/geocode */

export const NOMINATIM_USER_AGENT =
  "RedDeAyuda/1.0 (humanitarian inventory; https://github.com/gabojkz/Red-Ayudas)";

export const VENEZUELA_BOUNDS = {
  latMin: 0.5,
  latMax: 12.5,
  lngMin: -73.5,
  lngMax: -59.5,
};

export function isInVenezuela(lat, lng) {
  return (
    Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= VENEZUELA_BOUNDS.latMin
    && lat <= VENEZUELA_BOUNDS.latMax
    && lng >= VENEZUELA_BOUNDS.lngMin
    && lng <= VENEZUELA_BOUNDS.lngMax
  );
}

export function formatGeocodeResult(row) {
  const lat = Number(row.lat);
  const lng = Number(row.lon);
  const addr = row.address || {};
  const short = [
    addr.road || addr.pedestrian || addr.neighbourhood,
    addr.suburb || addr.city_district || addr.town || addr.city,
    addr.state,
  ].filter(Boolean).join(", ") || row.display_name;

  return {
    id: String(row.place_id),
    label: short,
    fullAddress: row.display_name,
    lat,
    lng,
  };
}

export async function searchNominatim(query, { limit = 6 } = {}) {
  const q = String(query ?? "").trim();
  if (q.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "ve");
  url.searchParams.set("limit", String(Math.min(limit, 10)));

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("No se pudo buscar la dirección");
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) return [];

  return rows
    .map(formatGeocodeResult)
    .filter((r) => isInVenezuela(r.lat, r.lng));
}

export function validateGeocodeQuery(q) {
  const text = String(q ?? "").trim();
  if (text.length < 3) return { ok: false, errors: ["mínimo 3 caracteres para buscar"] };
  if (text.length > 120) return { ok: false, errors: ["búsqueda demasiado larga"] };
  return { ok: true, data: { q: text } };
}
