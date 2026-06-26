import { parsePhoneNumberFromString } from "libphonenumber-js";

export const PHONE_PLACEHOLDER =
  "Ej.: 0414 555 0101 · +57 300 123 4567 · +1 555 123 4567";

export const WHATSAPP_CONTACT_MESSAGE =
  "Hola, necesito hablar sobre la situación. Agradecemos tu ayuda.";

const MAX_MOTIVO_CHARS = 220;

function trimMotivo(text) {
  const s = String(text ?? "").trim();
  if (s.length <= MAX_MOTIVO_CHARS) return s;
  return `${s.slice(0, MAX_MOTIVO_CHARS - 1)}…`;
}

/** Mensaje con motivo para un reporte (necesidad u oferta). */
export function buildWhatsAppContactMessage({ place, detail, label } = {}) {
  const motivo = trimMotivo([place, detail].map((s) => String(s ?? "").trim()).filter(Boolean).join(" — "));
  if (!motivo) return WHATSAPP_CONTACT_MESSAGE;
  const about = label ? `${label}: ${motivo}` : motivo;
  return `Hola, necesito hablar sobre ${about}. Agradecemos tu ayuda.`;
}

/** Mensaje con contexto de una conexión (necesidad + oferta). */
export function buildWhatsAppConnectionMessage({ need, offer } = {}) {
  const needText = trimMotivo([need?.place, need?.detail].filter(Boolean).join(" — "));
  const offerText = trimMotivo([offer?.place, offer?.detail].filter(Boolean).join(" — "));
  if (!needText && !offerText) return WHATSAPP_CONTACT_MESSAGE;

  const parts = ["Hola, necesito hablar sobre la coordinación de ayuda."];
  if (needText) parts.push(`Necesidad: ${needText}`);
  if (offerText) parts.push(`Oferta: ${offerText}`);
  parts.push("Agradecemos tu ayuda.");
  return parts.join("\n\n");
}

const MIN_PHONE_DIGITS = 5;
const MAX_PHONE_DIGITS = 15;

export function parsePhoneDigits(text) {
  return String(text ?? "").replace(/\D/g, "");
}

function looksLikeVenezuelaLocal(text) {
  const digits = parsePhoneDigits(text);
  if (digits.startsWith("0") && digits.length === 11) return /^04/.test(digits);
  if (digits.length === 10 && !digits.startsWith("0")) return /^4[1246]/.test(digits);
  return false;
}

function parseContact(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("+")) return parsePhoneNumberFromString(raw);
  if (looksLikeVenezuelaLocal(raw)) return parsePhoneNumberFromString(raw, "VE");
  return null;
}

/** Presente y con longitud razonable; no exige formato internacional estricto. */
export function isValidPhoneContact(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return false;
  const digits = parsePhoneDigits(raw);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

/** E.164 digits without "+" for wa.me / tel links. */
export function normalizePhoneForLinks(text) {
  const phone = parseContact(text);
  if (phone?.isPossible()) return phone.number.slice(1);

  const raw = String(text ?? "").trim();
  if (!isValidPhoneContact(raw)) return null;
  const digits = parsePhoneDigits(raw);

  if (raw.startsWith("+")) return digits;
  if (looksLikeVenezuelaLocal(raw)) {
    return digits.startsWith("0") ? `58${digits.slice(1)}` : `58${digits}`;
  }
  return digits;
}

export function phoneTelHref(text) {
  const digits = normalizePhoneForLinks(text);
  return digits ? `tel:+${digits}` : null;
}

export function phoneWhatsAppHref(text, message = WHATSAPP_CONTACT_MESSAGE) {
  const digits = normalizePhoneForLinks(text);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
