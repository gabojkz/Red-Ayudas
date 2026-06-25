/** Zonas afectadas por el sismo — polígonos aproximados para mapa 2D */

export const AFFECTED_ZONES = [
  {
    id: "yaracuy",
    name: "Yaracuy",
    subtitle: "Epicentro · daños estructurales",
    color: "#DC2626",
    fillOpacity: 0.22,
    center: { lat: 10.34, lng: -68.74 },
    /** vértices [lng, lat] — contorno simplificado del estado */
    polygon: [
      [-69.05, 10.55], [-68.95, 10.72], [-68.55, 10.78], [-68.15, 10.65],
      [-68.05, 10.42], [-68.18, 10.18], [-68.55, 10.08], [-68.95, 10.15],
      [-69.05, 10.35], [-69.05, 10.55],
    ],
  },
  {
    id: "caracas",
    name: "Caracas",
    subtitle: "Área metropolitana · réplicas",
    color: "#EA580C",
    fillOpacity: 0.18,
    center: { lat: 10.49, lng: -66.90 },
    polygon: [
      [-67.08, 10.58], [-66.72, 10.58], [-66.68, 10.48], [-66.72, 10.38],
      [-66.88, 10.32], [-67.02, 10.35], [-67.08, 10.45], [-67.08, 10.58],
    ],
  },
  {
    id: "la-guaira",
    name: "La Guaira",
    subtitle: "Costa · evacuaciones costeras",
    color: "#2563EB",
    fillOpacity: 0.16,
    center: { lat: 10.60, lng: -66.93 },
    polygon: [
      [-67.02, 10.68], [-66.78, 10.68], [-66.72, 10.58], [-66.82, 10.52],
      [-66.95, 10.52], [-67.02, 10.58], [-67.02, 10.68],
    ],
  },
];

/** Refugios y hospitales operativos (infraestructura fija, no reportes ciudadanos) */
export const FACILITIES = [
  {
    id: "fac-h-vargas",
    name: "Hospital Vargas",
    type: "hospital",
    zone: "Caracas",
    lat: 10.498,
    lng: -66.905,
    status: "operativo",
    detail: "Urgencias y cirugía. Capacidad reducida en pabellón B.",
    capacity: "180 camas",
  },
  {
    id: "fac-h-clinicas",
    name: "Hospital de Clínicas Caracas",
    type: "hospital",
    zone: "Caracas",
    lat: 10.508,
    lng: -66.888,
    status: "operativo",
    detail: "Trauma y pediatría operativos.",
    capacity: "320 camas",
  },
  {
    id: "fac-h-militar",
    name: "Hospital Militar Dr. Carlos Arvelo",
    type: "hospital",
    zone: "Caracas",
    lat: 10.512,
    lng: -66.918,
    status: "operativo",
    detail: "Atención civil habilitada en emergencia.",
    capacity: "250 camas",
  },
  {
    id: "fac-h-yaracuy",
    name: "Hospital Central Yaracuy",
    type: "hospital",
    zone: "Yaracuy",
    lat: 10.341,
    lng: -68.742,
    status: "operativo",
    detail: "Referencia regional. Quirófano móvil instalado.",
    capacity: "95 camas",
  },
  {
    id: "fac-h-guaira",
    name: "Hospital Luis Razetti · La Guaira",
    type: "hospital",
    zone: "La Guaira",
    lat: 10.599,
    lng: -66.938,
    status: "operativo",
    detail: "Urgencias 24h. Evacuados de zona costera.",
    capacity: "60 camas",
  },
  {
    id: "fac-r-polideportivo",
    name: "Refugio Polideportivo Caracas",
    type: "refugio",
    zone: "Caracas",
    lat: 10.485,
    lng: -66.872,
    status: "operativo",
    detail: "Albergue temporal · comida y agua.",
    capacity: "~400 personas",
  },
  {
    id: "fac-r-guaira",
    name: "Refugio Escuela Bolivariana La Guaira",
    type: "refugio",
    zone: "La Guaira",
    lat: 10.605,
    lng: -66.952,
    status: "operativo",
    detail: "Familias evacuadas del litoral.",
    capacity: "~220 personas",
  },
  {
    id: "fac-r-yaracuy",
    name: "Refugio Gimnasio San Felipe",
    type: "refugio",
    zone: "Yaracuy",
    lat: 10.338,
    lng: -68.728,
    status: "operativo",
    detail: "Desplazados del epicentro.",
    capacity: "~150 personas",
  },
];

export const FACILITY_STYLES = {
  hospital: { color: "#0D9488", label: "Hospital operativo", icon: "H" },
  refugio: { color: "#1F9E5E", label: "Refugio operativo", icon: "R" },
};

export function buildAffectedZonesGeoJSON() {
  return {
    type: "FeatureCollection",
    features: AFFECTED_ZONES.map((z) => ({
      type: "Feature",
      id: z.id,
      properties: {
        id: z.id,
        name: z.name,
        subtitle: z.subtitle,
        color: z.color,
        fillOpacity: z.fillOpacity,
      },
      geometry: {
        type: "Polygon",
        coordinates: [z.polygon],
      },
    })),
  };
}

export function buildFacilitiesGeoJSON() {
  return {
    type: "FeatureCollection",
    features: FACILITIES.map((f) => ({
      type: "Feature",
      id: f.id,
      properties: {
        ...f,
        color: FACILITY_STYLES[f.type].color,
      },
      geometry: {
        type: "Point",
        coordinates: [f.lng, f.lat],
      },
    })),
  };
}

/** Epicentro de referencia (Yaracuy) */
export const EPICENTER = { lat: 10.55, lng: -68.55, label: "Epicentro · Yaracuy" };

/** Vista que encuadra las tres zonas afectadas */
export const MAP_CENTER = { lat: 10.42, lng: -67.55, zoom: 7.6 };

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
