import { NextResponse } from "next/server";
import { listConnections, createConnection, getNeedById } from "@/lib/db";
import { validateCreateConnection, validateListConnectionsQuery } from "@/lib/validation";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

/** Internal — used by the web app, not the public feed API. */
export async function GET(request) {
  try {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ connections: [] });
      }
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { searchParams } = new URL(request.url);
    const query = validateListConnectionsQuery({
      status: searchParams.get("status") || undefined,
    });
    if (!query.ok) {
      return NextResponse.json({ errors: query.errors }, { status: 400 });
    }
    const connections = await listConnections(query.data);
    return NextResponse.json({ connections });
  } catch (err) {
    console.error("GET /api/connections", err);
    return NextResponse.json({ error: "No se pudieron cargar las conexiones" }, { status: 500 });
  }
}

/** Internal — used by the web app, not the public feed API. */
export async function POST(request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Base de datos no configurada. Añade DATABASE_URL en .env.local" },
        { status: 503 }
      );
    }
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateCreateConnection(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }

    const need = await getNeedById(parsed.data.needId);
    const offer = await getNeedById(parsed.data.offerId);
    if (!need || need.kind !== "need") {
      return NextResponse.json({ errors: ["needId no es una necesidad válida"] }, { status: 400 });
    }
    if (!offer || offer.kind !== "offer") {
      return NextResponse.json({ errors: ["offerId no es una oferta válida"] }, { status: 400 });
    }

    const connection = await createConnection(parsed.data);
    return NextResponse.json({ connection }, { status: 201 });
  } catch (err) {
    if (err.code === "23505") {
      return NextResponse.json({ errors: ["Esta conexión ya existe"] }, { status: 409 });
    }
    console.error("POST /api/connections", err);
    return NextResponse.json({ error: "No se pudo crear la conexión" }, { status: 500 });
  }
}
