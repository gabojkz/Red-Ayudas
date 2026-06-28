import { verifySedeLogin } from "./stockDb.js";

export { getSedeAuthHeaders } from "./stockClientAuth.js";

export async function requireSedeAuth(request, sedeId) {
  const slug = request.headers.get("x-sede-slug");
  const password = request.headers.get("x-sede-password");
  if (!slug || !password) {
    return { ok: false, status: 401, errors: ["Autenticación de sede requerida"] };
  }
  const sede = await verifySedeLogin(slug, password);
  if (!sede) {
    return { ok: false, status: 401, errors: ["Usuario o contraseña incorrectos"] };
  }
  if (Number(sedeId) !== Number(sede.id)) {
    return { ok: false, status: 403, errors: ["No autorizado para esta sede"] };
  }
  return { ok: true, sede };
}
