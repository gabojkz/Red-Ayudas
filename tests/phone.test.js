import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidPhoneContact,
  normalizePhoneForLinks,
  phoneTelHref,
  phoneWhatsAppHref,
  WHATSAPP_CONTACT_MESSAGE,
  buildWhatsAppContactMessage,
  buildWhatsAppConnectionMessage,
} from "../src/lib/phone.js";

describe("isValidPhoneContact", () => {
  it("acepta móvil venezolano local y con +58", () => {
    assert.equal(isValidPhoneContact("0414-555-0101"), true);
    assert.equal(isValidPhoneContact("+58 414 555 0101"), true);
  });

  it("acepta teléfonos internacionales con prefijo +", () => {
    assert.equal(isValidPhoneContact("+57 300 123 4567"), true);
    assert.equal(isValidPhoneContact("+1 555 123 4567"), true);
    assert.equal(isValidPhoneContact("+34 612 345 678"), true);
    assert.equal(isValidPhoneContact("+504 8765 4321"), true);
  });

  it("rechaza vacío o demasiado corto", () => {
    assert.equal(isValidPhoneContact(""), false);
    assert.equal(isValidPhoneContact("1234"), false);
  });

  it("acepta números libres sin prefijo internacional", () => {
    assert.equal(isValidPhoneContact("1234567"), true);
    assert.equal(isValidPhoneContact("5551234567"), true);
    assert.equal(isValidPhoneContact("0424-123-4567"), true);
  });
});

describe("normalizePhoneForLinks", () => {
  it("conserva código de país internacional", () => {
    assert.equal(normalizePhoneForLinks("+57 300 123 4567"), "573001234567");
    assert.equal(normalizePhoneForLinks("+1 555 123 4567"), "15551234567");
    assert.equal(normalizePhoneForLinks("+34 612 345 678"), "34612345678");
    assert.equal(normalizePhoneForLinks("+504 8765 4321"), "50487654321");
  });

  it("convierte móvil venezolano local a 58", () => {
    assert.equal(normalizePhoneForLinks("0414-555-0101"), "584145550101");
  });

  it("usa dígitos tal cual si no hay prefijo +", () => {
    assert.equal(normalizePhoneForLinks("5551234567"), "5551234567");
    assert.equal(normalizePhoneForLinks("12345678"), "12345678");
  });
});

describe("buildWhatsAppContactMessage", () => {
  it("incluye lugar y detalle como motivo", () => {
    const msg = buildWhatsAppContactMessage({
      place: "Playa Grande",
      detail: "menor atrapada",
      label: "la necesidad",
    });
    assert.ok(msg.includes("Playa Grande"));
    assert.ok(msg.includes("menor atrapada"));
    assert.ok(msg.includes("la necesidad"));
  });
});

describe("buildWhatsAppConnectionMessage", () => {
  it("incluye necesidad y oferta", () => {
    const msg = buildWhatsAppConnectionMessage({
      need: { place: "Playa Grande", detail: "menor atrapada" },
      offer: { place: "Brigada USAR", detail: "equipo de rescate" },
    });
    assert.ok(msg.includes("Necesidad: Playa Grande — menor atrapada"));
    assert.ok(msg.includes("Oferta: Brigada USAR — equipo de rescate"));
  });
});

describe("phoneWhatsAppHref", () => {
  it("genera wa.me con mensaje predeterminado", () => {
    const href = phoneWhatsAppHref("+1 555 123 4567");
    assert.ok(href.startsWith("https://wa.me/15551234567?"));
    assert.ok(href.includes(encodeURIComponent(WHATSAPP_CONTACT_MESSAGE)));
  });

  it("permite mensaje personalizado", () => {
    const href = phoneWhatsAppHref("+58 414 555 0101", "Hola");
    assert.equal(href, "https://wa.me/584145550101?text=Hola");
  });
});

describe("phoneTelHref", () => {
  it("genera enlace tel con +", () => {
    assert.equal(phoneTelHref("0414-555-0101"), "tel:+584145550101");
  });
});
