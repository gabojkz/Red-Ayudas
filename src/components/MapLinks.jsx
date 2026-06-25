import { mapLinks } from "@/lib/mapLinks";

export default function MapLinks({ lat, lng, label, compact = false }) {
  const links = mapLinks(lat, lng, label);

  return (
    <div className={`rda-map-links ${compact ? "compact" : ""}`}>
      <span className="rda-map-links-label">Cómo llegar</span>
      <div className="rda-map-links-row">
        <a href={links.google} target="_blank" rel="noopener noreferrer">Google Maps</a>
        <a href={links.apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>
        <a href={links.waze} target="_blank" rel="noopener noreferrer">Waze</a>
        <a href={links.osm} target="_blank" rel="noopener noreferrer">OSM</a>
      </div>
    </div>
  );
}
