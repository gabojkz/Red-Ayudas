/** @module apiSecurity */

export const MAX_JSON_BYTES = 32_768;

/**
 * Parse JSON body with size limits and plain-object guard.
 * @param {Request} request
 * @param {number} [maxBytes]
 */
export async function parseJsonBody(request, maxBytes = MAX_JSON_BYTES) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) {
    return { ok: false, status: 413, errors: ["Cuerpo demasiado grande"] };
  }

  let text;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, errors: ["No se pudo leer el cuerpo"] };
  }

  if (text.length > maxBytes) {
    return { ok: false, status: 413, errors: ["Cuerpo demasiado grande"] };
  }

  if (!text.trim()) {
    return { ok: false, status: 400, errors: ["Cuerpo JSON requerido"] };
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, errors: ["JSON inválido"] };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, status: 400, errors: ["Cuerpo JSON inválido"] };
  }

  return { ok: true, data };
}
