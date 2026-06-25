/** Enlaces para abrir ubicaciones en apps de mapas */

export function mapLinks(lat, lng, label = "Destino") {
  const name = encodeURIComponent(label);
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    apple: `https://maps.apple.com/?daddr=${lat},${lng}&q=${name}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`,
  };
}
