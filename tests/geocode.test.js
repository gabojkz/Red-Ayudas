import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isInVenezuela, formatGeocodeResult, validateGeocodeQuery,
} from "../src/lib/geocode.js";

describe("geocode", () => {
  it("valida coordenadas en Venezuela", () => {
    assert.equal(isInVenezuela(10.5, -66.9), true);
    assert.equal(isInVenezuela(40, -74), false);
  });

  it("formatea resultado de Nominatim", () => {
    const r = formatGeocodeResult({
      place_id: 1,
      lat: "10.5",
      lon: "-66.9",
      display_name: "Caracas, Venezuela",
      address: { road: "Av. Principal", city: "Caracas", state: "Distrito Capital" },
    });
    assert.equal(r.label.includes("Av. Principal"), true);
    assert.equal(r.lat, 10.5);
  });

  it("rechaza búsqueda muy corta", () => {
    assert.equal(validateGeocodeQuery("ab").ok, false);
    assert.equal(validateGeocodeQuery("plaza bolivar").ok, true);
  });
});
