import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateCreateNeed,
  validateStatusUpdate,
  validateNeedId,
  isDraftReady,
  validateCreateConnection,
  validateConnectionUpdate,
  validateConnectionId,
} from "../src/lib/validation.js";
import { getDraftValidationErrors, hasDraftLocation } from "../src/lib/validation.js";
import { nearestZone, minutesAgo, timeAgoLabel, rowToNeed, rowToConnection } from "../src/lib/constants.js";

const PHONE = "04145550101";

describe("validateCreateNeed — reportes (pide)", () => {
  const valid = {
    kind: "need",
    type: "medicamentos",
    urgency: "alta",
    place: "Hospital Vargas",
    detail: "Insulina",
    contact: PHONE,
    lat: 10.49,
    lng: -66.90,
  };

  it("acepta un reporte válido en Venezuela", () => {
    const r = validateCreateNeed(valid);
    assert.equal(r.ok, true);
    assert.equal(r.data.kind, "need");
    assert.equal(r.data.zone, "Caracas");
    assert.equal(r.data.status, "abierto");
  });

  it("recorta textos largos para proteger la DB", () => {
    const r = validateCreateNeed({
      ...valid,
      place: "x".repeat(300),
      detail: "y".repeat(3000),
    });
    assert.equal(r.ok, true);
    assert.equal(r.data.place.length, 200);
    assert.equal(r.data.detail.length, 2000);
  });

  it("acepta coordenadas en los límites de Venezuela", () => {
    assert.equal(validateCreateNeed({ ...valid, lat: 0.5, lng: -73.5 }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, lat: 12.5, lng: -59.5 }).ok, true);
  });

  it("rechaza tipo inválido", () => {
    const r = validateCreateNeed({ ...valid, type: "invalido" });
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes("type inválido"));
  });

  it("rechaza urgencia inválida", () => {
    const r = validateCreateNeed({ ...valid, urgency: "extrema" });
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes("urgency inválida"));
  });

  it("rechaza coordenadas fuera de Venezuela", () => {
    const r = validateCreateNeed({ ...valid, lat: 40.7, lng: -74.0 });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("lat")));
  });

  it("rechaza lat/lng no numéricos", () => {
    const r = validateCreateNeed({ ...valid, lat: "abc", lng: null });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("lat")));
    assert.ok(r.errors.some((e) => e.includes("lng")));
  });

  it("rechaza place y detail vacíos", () => {
    assert.equal(validateCreateNeed({ ...valid, place: "   " }).ok, false);
    assert.equal(validateCreateNeed({ ...valid, detail: "" }).ok, false);
  });

  it("rechaza cuerpo inválido", () => {
    assert.equal(validateCreateNeed(null).ok, false);
    assert.equal(validateCreateNeed("texto").ok, false);
  });

  it("teléfono opcional; rechaza formato inválido si se indica", () => {
    assert.equal(validateCreateNeed(valid).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "" }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "1234" }).ok, false);
    assert.equal(validateCreateNeed({ ...valid, contact: "1234567" }).ok, true);
    assert.ok(validateCreateNeed({ ...valid, contact: "1234" }).errors.some((e) => e.includes("teléfono")));
  });

  it("acepta teléfonos internacionales", () => {
    assert.equal(validateCreateNeed({ ...valid, contact: "+57 300 123 4567" }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "+1 555 123 4567" }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "+58 414 555 0101" }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "+34 612 345 678" }).ok, true);
    assert.equal(validateCreateNeed({ ...valid, contact: "+504 8765 4321" }).ok, true);
  });

  it("preserva contacto con espacios recortados", () => {
    const r = validateCreateNeed({ ...valid, contact: "  0414-555-0101  " });
    assert.equal(r.data.contact, "0414-555-0101");
  });
});

describe("getDraftValidationErrors", () => {
  it("lista campos faltantes", () => {
    const errors = getDraftValidationErrors({
      place: "",
      detail: "",
      contact: "",
      lat: null,
      lng: null,
    });
    assert.ok(errors.some((e) => e.includes("lugar")));
    assert.ok(errors.some((e) => e.includes("descripción")));
    assert.ok(!errors.some((e) => e.toLowerCase().includes("teléfono")));
  });

  it("vacío cuando el borrador está listo", () => {
    assert.deepEqual(getDraftValidationErrors({
      place: "Hospital",
      detail: "Insulina",
      contact: PHONE,
      lat: 10.49,
      lng: -66.9,
    }), []);
  });
});

describe("hasDraftLocation", () => {
  it("requiere lat y lng numéricos", () => {
    assert.equal(hasDraftLocation({ lat: 10.49, lng: -66.9 }), true);
    assert.equal(hasDraftLocation({ lat: 10.49, lng: null }), false);
  });
});

describe("validateCreateNeed — ofertas (ofrece)", () => {
  const base = {
    kind: "offer",
    urgency: "alta",
    place: "Salida Valencia",
    detail: "Camioneta 4x4 con 800 kg",
    contact: PHONE,
    lat: 10.17,
    lng: -68.0,
  };

  it("acepta oferta de transporte", () => {
    const r = validateCreateNeed({ ...base, type: "transporte" });
    assert.equal(r.ok, true);
    assert.equal(r.data.kind, "offer");
    assert.equal(r.data.type, "transporte");
  });

  it("acepta oferta de voluntario", () => {
    const r = validateCreateNeed({ ...base, type: "voluntario", place: "Caracas" });
    assert.equal(r.ok, true);
    assert.equal(r.data.type, "voluntario");
  });

  it("acepta oferta de agua con 300 botellas en detalle", () => {
    const r = validateCreateNeed({
      ...base,
      type: "agua",
      detail: "300 botellas de agua embotellada",
      lat: 10.502,
      lng: -66.878,
    });
    assert.equal(r.ok, true);
    assert.equal(r.data.zone, "Caracas");
  });

  it("rechaza kind inválido", () => {
    const r = validateCreateNeed({ ...base, kind: "wishlist", type: "agua" });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("kind")));
  });

  it("default kind es need si no se envía", () => {
    const r = validateCreateNeed({
      type: "medicamentos",
      urgency: "alta",
      place: "Hospital",
      detail: "Insulina",
      contact: PHONE,
      lat: 10.49,
      lng: -66.90,
    });
    assert.equal(r.ok, true);
    assert.equal(r.data.kind, "need");
  });

  it("acepta escombros con meta JSONB", () => {
    const r = validateCreateNeed({
      kind: "need",
      type: "escombros",
      urgency: "critica",
      place: "Av. Soublette",
      detail: "Edificio colapsado",
      contact: PHONE,
      lat: 10.599,
      lng: -66.93,
      meta: {
        equipos: ["Retroexcavadora", "Pico, pala y carretilla"],
        operador_incluido: false,
        necesita_transporte: false,
        personas: 10,
      },
    });
    assert.equal(r.ok, true);
    assert.deepEqual(r.data.meta.equipos, ["Retroexcavadora", "Pico, pala y carretilla"]);
    assert.equal(r.data.meta.personas, 10);
  });

  it("rechaza escombros sin equipos", () => {
    const r = validateCreateNeed({
      kind: "need",
      type: "escombros",
      urgency: "alta",
      place: "San Bernardino",
      detail: "Techos caídos",
      lat: 10.507,
      lng: -66.904,
      meta: {},
    });
    assert.equal(r.ok, false);
  });
});

describe("isDraftReady — formulario cliente", () => {
  it("requiere lugar, detalle y coordenadas (teléfono opcional)", () => {
    assert.equal(isDraftReady({
      place: "Hospital",
      detail: "Insulina",
      contact: PHONE,
      lat: 10.49,
      lng: -66.9,
    }), true);
    assert.equal(isDraftReady({
      place: "Hospital",
      detail: "Insulina",
      contact: "",
      lat: 10.49,
      lng: -66.9,
    }), true);
  });

  it("rechaza borrador con teléfono inválido", () => {
    assert.equal(isDraftReady({
      place: "Hospital",
      detail: "Insulina",
      contact: "1234",
      lat: 10.49,
      lng: -66.9,
    }), false);
  });

  it("rechaza borrador sin ubicación en el mapa", () => {
    assert.equal(isDraftReady({
      place: "Hospital",
      detail: "Insulina",
      lat: null,
      lng: null,
    }), false);
  });

  it("rechaza coordenadas inválidas aunque lat no sea null", () => {
    assert.equal(isDraftReady({
      place: "Hospital",
      detail: "Insulina",
      lat: "norte",
      lng: -66.9,
    }), false);
  });

  it("rechaza strings solo con espacios", () => {
    assert.equal(isDraftReady({
      place: "   ",
      detail: "Agua",
      lat: 10.0,
      lng: -66.0,
    }), false);
  });

  it("acepta oferta lista para publicar offline", () => {
    assert.equal(isDraftReady({
      kind: "offer",
      type: "transporte",
      place: "Valencia",
      detail: "Pickup hacia La Guaira",
      contact: PHONE,
      lat: 10.172,
      lng: -68.004,
    }), true);
  });

  it("rechaza rol coordinador (no publica recursos)", () => {
    assert.equal(isDraftReady({
      role: "coordinador",
      place: "Madrid",
      detail: "Coordino envío",
      lat: 10.49,
      lng: -66.9,
    }), false);
  });

  it("requiere equipos para escombros", () => {
    assert.equal(isDraftReady({
      type: "escombros",
      place: "Av. Soublette",
      detail: "Colapso",
      lat: 10.599,
      lng: -66.93,
      meta: { equipos: [] },
    }), false);
    assert.equal(isDraftReady({
      type: "escombros",
      place: "Av. Soublette",
      detail: "Colapso",
      contact: PHONE,
      lat: 10.599,
      lng: -66.93,
      meta: { equipos: ["Grúa", "Retroexcavadora"] },
    }), true);
  });
});

describe("validateStatusUpdate", () => {
  it("acepta estados válidos del flujo de ayuda", () => {
    for (const status of ["abierto", "en_camino", "cubierto"]) {
      assert.equal(validateStatusUpdate({ status }).ok, true);
    }
  });

  it("rechaza estado inválido", () => {
    assert.equal(validateStatusUpdate({ status: "cerrado" }).ok, false);
    assert.equal(validateStatusUpdate(null).ok, false);
  });
});

describe("validateNeedId", () => {
  it("parsea ids enteros positivos desde string", () => {
    assert.equal(validateNeedId("42").data, 42);
  });

  it("rechaza ids inválidos", () => {
    assert.equal(validateNeedId("0").ok, false);
    assert.equal(validateNeedId("-1").ok, false);
    assert.equal(validateNeedId("abc").ok, false);
    assert.equal(validateNeedId("3.14").ok, false);
  });
});

describe("nearestZone", () => {
  it("elige la zona más cercana", () => {
    assert.equal(nearestZone(10.49, -66.90), "Caracas");
    assert.equal(nearestZone(10.17, -68.00), "Valencia");
    assert.equal(nearestZone(10.34, -68.74), "Yaracuy");
  });
});

describe("time helpers", () => {
  it("calcula minutos transcurridos", () => {
    const ago = new Date(Date.now() - 30 * 60_000).toISOString();
    assert.ok(minutesAgo(ago) >= 29 && minutesAgo(ago) <= 31);
  });

  it("formatea etiquetas de tiempo para distintos dispositivos", () => {
    assert.equal(timeAgoLabel(0), "ahora");
    assert.equal(timeAgoLabel(15), "hace 15 min");
    assert.equal(timeAgoLabel(120), "hace 2 h");
  });
});

describe("rowToNeed", () => {
  it("transforma fila de Postgres incluyendo kind", () => {
    const row = {
      id: "1",
      kind: "offer",
      type: "transporte",
      urgency: "media",
      status: "abierto",
      place: "Valencia",
      zone: "Valencia",
      detail: "Camioneta",
      contact: "—",
      lat: 10.17,
      lng: -68.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const need = rowToNeed(row);
    assert.equal(need.id, 1);
    assert.equal(need.kind, "offer");
    assert.equal(need.type, "transporte");
    assert.equal(typeof need.mins, "number");
  });

  it("asume kind need en filas legacy sin columna", () => {
    const row = {
      id: "2",
      type: "agua",
      urgency: "alta",
      status: "abierto",
      place: "Plaza",
      zone: "Maracay",
      detail: "Agua",
      contact: "—",
      lat: 10.25,
      lng: -67.6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    assert.equal(rowToNeed(row).kind, "need");
  });
});

describe("validateCreateConnection", () => {
  it("acepta needId y offerId válidos", () => {
    const r = validateCreateConnection({ needId: 1, offerId: 10 });
    assert.equal(r.ok, true);
    assert.equal(r.data.needId, 1);
    assert.equal(r.data.offerId, 10);
  });

  it("rechaza ids inválidos o iguales", () => {
    assert.equal(validateCreateConnection({ needId: 0, offerId: 10 }).ok, false);
    assert.equal(validateCreateConnection({ needId: 5, offerId: 5 }).ok, false);
  });
});

describe("validateConnectionUpdate", () => {
  it("acepta avance de estado", () => {
    assert.equal(validateConnectionUpdate({ status: "en_transito" }).ok, true);
    assert.equal(validateConnectionUpdate({ coordinatorRemote: true }).ok, true);
  });

  it("rechaza status inválido", () => {
    assert.equal(validateConnectionUpdate({ status: "abierto" }).ok, false);
  });
});

describe("rowToConnection", () => {
  it("transforma fila de Postgres", () => {
    const row = {
      id: "1",
      need_id: "2",
      offer_id: "10",
      status: "coordinando",
      notes: "Iniciada",
      coordinator_remote: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const c = rowToConnection(row);
    assert.equal(c.needId, 2);
    assert.equal(c.offerId, 10);
    assert.equal(c.coordinatorRemote, true);
  });
});
