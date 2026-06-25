/** Direct Supabase host (IPv6) — does not resolve from Vercel; use pooler instead. */
export function isDirectSupabaseUrl(url) {
  if (!url) return false;
  return (
    /@db\.[^./]+\.supabase\.co(?::\d+)?\//i.test(url) ||
    /^db\.[^./]+\.supabase\.co(?::\d+)?$/i.test(url.split("@").pop()?.split("/")[0] || "")
  );
}

function normalizeUrl(url) {
  return url.replace(/\/$/, "");
}

/** Resolve DB URL from Vercel Supabase integration or manual DATABASE_URL. */
export function getDatabaseUrl() {
  // Pooler from Supabase ↔ Vercel integration (IPv4, port 6543)
  if (process.env.POSTGRES_URL) {
    return normalizeUrl(process.env.POSTGRES_URL);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !(process.env.VERCEL && isDirectSupabaseUrl(databaseUrl))) {
    return normalizeUrl(databaseUrl);
  }

  if (process.env.POSTGRES_PRISMA_URL) {
    return normalizeUrl(process.env.POSTGRES_PRISMA_URL);
  }

  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE } = process.env;
  if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST && POSTGRES_DATABASE) {
    const host = POSTGRES_HOST.split(":")[0];
    if (process.env.VERCEL && /^db\.[^.]+\.supabase\.co$/i.test(host)) {
      return null;
    }
    const user = encodeURIComponent(POSTGRES_USER);
    const pass = encodeURIComponent(POSTGRES_PASSWORD);
    return `postgresql://${user}:${pass}@${POSTGRES_HOST}/${POSTGRES_DATABASE}?sslmode=require`;
  }

  return null;
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}
