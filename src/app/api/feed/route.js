import { NextResponse } from "next/server";
import { listNeeds } from "@/lib/db";
import { validateFeedQuery, buildFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

/**
 * @en Public read-only feed of active humanitarian posts.
 * @es Feed público de solo lectura con publicaciones activas de ayuda humanitaria.
 *
 * @route GET /api/feed
 *
 * @query {string} [kind] - @en `need` or `offer` | @es `need` u `offer`
 * @query {string} [type] - @en Category filter | @es Filtra por categoría
 * @query {number} [limit=100] - @en Max items, 1–500 | @es Máximo de ítems, 1–500
 *
 * @response 200 - @en `{ updatedAt, count, items: FeedItem[] }` | @es `{ updatedAt, count, items: FeedItem[] }`
 * @response 400 - @en `{ errors: string[] }` | @es `{ errors: string[] }`
 * @response 503 - @en `{ error }` — database not configured | @es `{ error }` — base de datos no configurada
 * @response 500 - @en `{ error }` | @es `{ error }`
 *
 * @example
 * curl -s "https://red-ayudas.vercel.app/api/feed?kind=need&limit=20"
 */
export async function GET(request) {
  try {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(buildFeed([]));
      }
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const query = validateFeedQuery({
      kind: searchParams.get("kind") || undefined,
      type: searchParams.get("type") || undefined,
      limit: searchParams.get("limit") || undefined,
    });
    if (!query.ok) {
      return NextResponse.json({ errors: query.errors }, { status: 400 });
    }

    const needs = await listNeeds({
      status: "activas",
      kind: query.data.kind,
      type: query.data.type,
    });

    const feed = buildFeed(needs.slice(0, query.data.limit));
    return NextResponse.json(feed, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("GET /api/feed", err);
    return NextResponse.json({ error: "No se pudo cargar el feed" }, { status: 500 });
  }
}
