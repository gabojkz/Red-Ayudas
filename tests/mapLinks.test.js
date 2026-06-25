import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapLinks } from "../src/lib/mapLinks.js";

describe("mapLinks", () => {
  const lat = 10.498;
  const lng = -66.905;
  const label = "Hospital Vargas";

  it("genera URLs válidas para apps de navegación", () => {
    const links = mapLinks(lat, lng, label);
    assert.match(links.google, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=10\.498,-66\.905$/);
    assert.match(links.apple, /^https:\/\/maps\.apple\.com\/\?daddr=10\.498,-66\.905&q=/);
    assert.match(links.waze, /^https:\/\/waze\.com\/ul\?ll=10\.498,-66\.905&navigate=yes$/);
    assert.match(links.osm, /^https:\/\/www\.openstreetmap\.org\/\?mlat=10\.498&mlon=-66\.905/);
  });

  it("codifica etiquetas con espacios y caracteres especiales", () => {
    const links = mapLinks(lat, lng, "Hospital Vargas · Caracas");
    assert.ok(links.apple.includes(encodeURIComponent("Hospital Vargas · Caracas")));
  });

  it("funciona sin etiqueta (destino genérico)", () => {
    const links = mapLinks(lat, lng);
    assert.ok(links.google.includes(`${lat},${lng}`));
    assert.ok(links.apple.includes("Destino"));
  });
});
