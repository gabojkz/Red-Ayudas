import { useState, useRef, useEffect } from "react";
import { Building2, Home, MapPin } from "lucide-react";
import {
  MAP_CENTER,
  MAP_STYLE,
  EPICENTER,
  AFFECTED_ZONES,
  FACILITIES,
  FACILITY_STYLES,
  buildAffectedZonesGeoJSON,
} from "@/lib/mapLayers";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";

const zonesGeoJSON = buildAffectedZonesGeoJSON();

const zoneFillLayer = {
  id: "affected-zones-fill",
  type: "fill",
  paint: {
    "fill-color": ["get", "color"],
    "fill-opacity": ["get", "fillOpacity"],
  },
};

const zoneLineLayer = {
  id: "affected-zones-line",
  type: "line",
  paint: {
    "line-color": ["get", "color"],
    "line-width": 2,
    "line-dasharray": [3, 2],
  },
};

function FacilityPin({ facility, selected, onClick }) {
  const style = FACILITY_STYLES[facility.type];
  const Icon = facility.type === "hospital" ? Building2 : Home;
  return (
    <button
      type="button"
      className={`rda-facility ${selected ? "sel" : ""}`}
      style={{ background: style.color }}
      onClick={onClick}
      aria-label={`${style.label}: ${facility.name}`}
    >
      <Icon size={12} strokeWidth={2.5} color="#fff" />
    </button>
  );
}

function MapLegend({ showZones, showFacilities, onToggleZones, onToggleFacilities }) {
  return (
    <div className="rda-map-legend">
      <button
        type="button"
        className={`rda-legend-toggle ${showZones ? "on" : ""}`}
        onClick={onToggleZones}
      >
        Zonas afectadas
      </button>
      {AFFECTED_ZONES.map((z) => (
        <span key={z.id} className="rda-legend-item">
          <i style={{ background: z.color }} /> {z.name}
        </span>
      ))}
      <hr />
      <button
        type="button"
        className={`rda-legend-toggle ${showFacilities ? "on" : ""}`}
        onClick={onToggleFacilities}
      >
        Infraestructura
      </button>
      {Object.entries(FACILITY_STYLES).map(([k, s]) => (
        <span key={k} className="rda-legend-item">
          <i style={{ background: s.color }} /> {s.label}
        </span>
      ))}
      <hr />
      <span className="rda-legend-item"><i className="rda-legend-line" style={{ background: "#2563EB" }} /> Conexión activa</span>
      <span className="rda-legend-item" style={{ opacity: 0.55 }}><i className="rda-legend-dot" style={{ background: "#999" }} /> Con cobertura</span>
    </div>
  );
}

const connLinePaint = {
  "line-color": ["get", "color"],
  "line-width": 2,
  "line-opacity": 0.65,
};

const connLineSolidLayer = {
  id: "connection-lines-solid",
  type: "line",
  filter: ["!=", ["get", "dashed"], 1],
  paint: connLinePaint,
};

const connLineDashedLayer = {
  id: "connection-lines-dashed",
  type: "line",
  filter: ["==", ["get", "dashed"], 1],
  paint: {
    ...connLinePaint,
    "line-dasharray": [6, 4],
  },
};

export default function LibreMap({
  needs = [],
  connectionsGeoJSON = null,
  selectedId,
  draftLatLng,
  reportMode,
  onMapClick,
  onPinClick,
  fitBoundsKey,
}) {
  const [showZones, setShowZones] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const pin = needs.find((n) => n.id === selectedId);
    const map = mapRef.current?.getMap?.();
    if (!pin || !map || !Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
    map.flyTo({
      center: [pin.lng, pin.lat],
      zoom: Math.max(map.getZoom(), 11),
      duration: 700,
    });
  }, [selectedId, needs]);

  useEffect(() => {
    if (!fitBoundsKey) return;
    const map = mapRef.current?.getMap?.();
    if (!map || needs.length === 0) return;

    const lngs = [];
    const lats = [];
    for (const n of needs) {
      const lat = Number(n.lat);
      const lng = Number(n.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        lats.push(lat);
        lngs.push(lng);
      }
    }
    if (!lngs.length) return;

    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 56, duration: 600, maxZoom: 12 }
    );
  }, [fitBoundsKey, needs]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: MAP_CENTER.lat,
        longitude: MAP_CENTER.lng,
        zoom: MAP_CENTER.zoom,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onClick={(e) => {
        if (reportMode && onMapClick) {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        } else {
          setSelectedFacility(null);
        }
      }}
      cursor={reportMode ? "crosshair" : "grab"}
      attributionControl={true}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {showZones && (
        <Source id="affected-zones" type="geojson" data={zonesGeoJSON}>
          <Layer {...zoneFillLayer} />
          <Layer {...zoneLineLayer} />
        </Source>
      )}

      {showZones &&
        AFFECTED_ZONES.map((z) => (
          <Marker
            key={`label-${z.id}`}
            latitude={z.center.lat}
            longitude={z.center.lng}
            anchor="center"
          >
            <span className="rda-zone-label" style={{ color: z.color, borderColor: z.color }}>
              {z.name}
            </span>
          </Marker>
        ))}

      {/* Epicentro */}
      {showZones && (
        <Marker latitude={EPICENTER.lat} longitude={EPICENTER.lng} anchor="center">
          <div className="rda-epi" title={EPICENTER.label}>
            <span className="rda-epi-ring" />
            <span className="rda-epi-dot" />
          </div>
        </Marker>
      )}

      {showFacilities &&
        FACILITIES.map((f) => (
          <Marker
            key={f.id}
            latitude={f.lat}
            longitude={f.lng}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFacility(selectedFacility?.id === f.id ? null : f);
            }}
          >
            <FacilityPin
              facility={f}
              selected={selectedFacility?.id === f.id}
              onClick={(e) => e.stopPropagation()}
            />
          </Marker>
        ))}

      {connectionsGeoJSON?.features?.length > 0 && (
        <Source id="connections" type="geojson" data={connectionsGeoJSON}>
          <Layer {...connLineSolidLayer} />
          <Layer {...connLineDashedLayer} />
        </Source>
      )}

      {needs.map((n) => {
        const lat = Number(n.lat);
        const lng = Number(n.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const selected = n.id === selectedId;
        const crit = n.kind === "need" && n.urgency === "critica" && n.status !== "cubierto" && !n.hasCoverage;
        const dimmed = n.hasCoverage || n.status === "cubierto";
        const PinIcon = n.Icon;
        return (
          <Marker
            key={n.id}
            latitude={lat}
            longitude={lng}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedFacility(null);
              onPinClick?.(n.id);
            }}
          >
            <button
              type="button"
              className={`rda-pin ${selected ? "sel" : ""} ${crit ? "crit" : ""} ${n.kind === "offer" ? "offer" : ""} ${n.type === "escombros" ? "escombros" : ""}`}
              style={{
                background: n.color,
                opacity: dimmed ? 0.55 : 1,
                outline: n.kind === "offer" ? `2px solid ${n.kindColor}` : undefined,
              }}
              aria-label={`${n.typeLabel} en ${n.place}`}
            >
              <PinIcon size={13} strokeWidth={2.6} color="#fff" />
            </button>
          </Marker>
        );
      })}

      {reportMode && draftLatLng
        && Number.isFinite(draftLatLng.lat)
        && Number.isFinite(draftLatLng.lng) && (
        <Marker latitude={draftLatLng.lat} longitude={draftLatLng.lng} anchor="center">
          <div className="rda-target" />
        </Marker>
      )}

      {selectedFacility && (
        <div className="rda-facility-card">
          <div className="rda-facility-card-head">
            <span
              className="rda-facility-card-ic"
              style={{ background: FACILITY_STYLES[selectedFacility.type].color }}
            >
              {selectedFacility.type === "hospital" ? (
                <Building2 size={14} color="#fff" />
              ) : (
                <Home size={14} color="#fff" />
              )}
            </span>
            <div>
              <b>{selectedFacility.name}</b>
              <span><MapPin size={10} /> {selectedFacility.zone} · {selectedFacility.status}</span>
            </div>
            <button type="button" className="rda-facility-close" onClick={() => setSelectedFacility(null)}>×</button>
          </div>
          <p>{selectedFacility.detail}</p>
          <span className="rda-facility-cap">{selectedFacility.capacity}</span>
        </div>
      )}

      <MapLegend
        showZones={showZones}
        showFacilities={showFacilities}
        onToggleZones={() => setShowZones((v) => !v)}
        onToggleFacilities={() => setShowFacilities((v) => !v)}
      />
    </Map>
  );
}
