import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AFFECTED_ZONES,
  FACILITIES,
  buildAffectedZonesGeoJSON,
  buildFacilitiesGeoJSON,
  EPICENTER,
} from "../src/lib/mapLayers.js";

describe("mapLayers", () => {
  it("incluye las tres zonas afectadas", () => {
    const ids = AFFECTED_ZONES.map((z) => z.id);
    assert.deepEqual(ids, ["yaracuy", "caracas", "la-guaira"]);
  });

  it("genera GeoJSON válido de zonas", () => {
    const geo = buildAffectedZonesGeoJSON();
    assert.equal(geo.type, "FeatureCollection");
    assert.equal(geo.features.length, 3);
    assert.equal(geo.features[0].geometry.type, "Polygon");
  });

  it("incluye hospitales y refugios operativos", () => {
    const hospitals = FACILITIES.filter((f) => f.type === "hospital");
    const refugios = FACILITIES.filter((f) => f.type === "refugio");
    assert.ok(hospitals.length >= 3);
    assert.ok(refugios.length >= 2);
    assert.ok(FACILITIES.every((f) => f.status === "operativo"));
  });

  it("genera GeoJSON de instalaciones", () => {
    const geo = buildFacilitiesGeoJSON();
    assert.equal(geo.features.length, FACILITIES.length);
    assert.equal(geo.features[0].geometry.type, "Point");
  });

  it("marca epicentro en Yaracuy", () => {
    assert.ok(EPICENTER.label.includes("Yaracuy"));
  });
});
