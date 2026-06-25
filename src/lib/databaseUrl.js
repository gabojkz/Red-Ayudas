/** Direct Supabase host (IPv6) — does not resolve from Vercel; use pooler instead. */
export function isDirectSupabaseUrl(url) {
  if (!url) return false;
  return (
    /@db\.[^./]+\.supabase\.co(?::\d+)?\//i.test(url) ||
    /^db\.[^./]+\.supabase\.co(?::\d+)?$/i.test(url.split("@").pop()?.split("/")[0] || "")
  );
}

export function isPoolerUrl(url) {
  return /pooler\.supabase\.com|:6543/i.test(url || "");
}

function normalizeUrl(url) {
  return url.replace(/\/$/, "");
}

export function isLocalDatabase(url) {
  return /localhost|127\.0\.0\.1|@postgres[:/]/i.test(url || "");
}

/** pg merges connection-string sslmode over Pool.ssl — strip it so rejectUnauthorized applies. */
export function connectionStringForPg(url) {
  if (!url || isLocalDatabase(url)) return url;
  return url
    .replace(/([?&])sslmode=[^&]*/gi, "$1")
    .replace(/([?&])sslrootcert=[^&]*/gi, "$1")
    .replace(/([?&])sslcert=[^&]*/gi, "$1")
    .replace(/([?&])sslkey=[^&]*/gi, "$1")
    .replace(/\?&/g, "?")
    .replace(/[?&]$/g, "")
    .replace(/\?$/g, "");
}

export function getPgPoolConfig(connectionString) {
  const local = isLocalDatabase(connectionString);
  return {
    connectionString: connectionStringForPg(connectionString),
    ssl: local ? false : { rejectUnauthorized: false },
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}

function buildFromPostgresParts() {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE } = process.env;
  if (!POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_HOST || !POSTGRES_DATABASE) {
    return null;
  }
  const user = encodeURIComponent(POSTGRES_USER);
  const pass = encodeURIComponent(POSTGRES_PASSWORD);
  return `postgresql://${user}:${pass}@${POSTGRES_HOST}/${POSTGRES_DATABASE}`;
}

function collectCandidates() {
  const urls = [];
  for (const key of ["POSTGRES_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL"]) {
    const value = process.env[key];
    if (value) urls.push(normalizeUrl(value));
  }
  const built = buildFromPostgresParts();
  if (built) urls.push(built);
  return urls;
}

function pickForVercel(urls) {
  const usable = urls.filter((url) => !isDirectSupabaseUrl(url));
  const pooler = usable.find(isPoolerUrl);
  if (pooler) return pooler;
  return usable[0] || null;
}

/** Resolve DB URL from Vercel Supabase integration or manual DATABASE_URL. */
export function getDatabaseUrl() {
  const candidates = collectCandidates();
  if (!candidates.length) return null;

  if (process.env.VERCEL) {
    return pickForVercel(candidates);
  }

  if (process.env.DATABASE_URL) return normalizeUrl(process.env.DATABASE_URL);
  if (process.env.POSTGRES_URL) return normalizeUrl(process.env.POSTGRES_URL);
  if (process.env.POSTGRES_PRISMA_URL) return normalizeUrl(process.env.POSTGRES_PRISMA_URL);
  return buildFromPostgresParts();
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}
