/** Resolve DB URL from Vercel Supabase integration or manual DATABASE_URL. */
export function getDatabaseUrl() {
  const direct =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (direct) return direct.replace(/\/$/, "");

  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_DATABASE } = process.env;
  if (POSTGRES_USER && POSTGRES_PASSWORD && POSTGRES_HOST && POSTGRES_DATABASE) {
    const user = encodeURIComponent(POSTGRES_USER);
    const pass = encodeURIComponent(POSTGRES_PASSWORD);
    return `postgresql://${user}:${pass}@${POSTGRES_HOST}/${POSTGRES_DATABASE}?sslmode=require`;
  }

  return null;
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}
