/** Client-safe auth headers for sede API calls. */

export function getSedeAuthHeaders(session) {
  if (!session?.slug || !session?.password) return {};
  return {
    "X-Sede-Slug": session.slug,
    "X-Sede-Password": session.password,
  };
}
