import { NextResponse } from "next/server";
import { listNeeds, createNeed } from "@/lib/db";
import { validateCreateNeed, validateListNeedsQuery } from "@/lib/validation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

/** Internal — used by the web app, not the public feed API. */
export async function GET(request) {
  try {
    if (!hasDatabase()) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ needs: [] });
      }
      return NextResponse.json(
        { error: "Base de datos no configurada" },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const query = validateListNeedsQuery({
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      kind: searchParams.get("kind") || undefined,
    });
    if (!query.ok) {
      return NextResponse.json({ errors: query.errors }, { status: 400 });
    }
    const needs = await listNeeds(query.data);
    return NextResponse.json({ needs });
  } catch (err) {
    console.error("GET /api/needs", err);
    return NextResponse.json(
      { error: "No se pudieron cargar las necesidades" },
      { status: 500 }
    );
  }
}

/** Internal — used by the web app, not the public feed API. */
export async function POST(request) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Base de datos no configurada. Añade DATABASE_URL en .env.local" },
        { status: 503 }
      );
    }
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateCreateNeed(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const need = await createNeed(parsed.data);
    return NextResponse.json({ need }, { status: 201 });
  } catch (err) {
    console.error("POST /api/needs", err);
    return NextResponse.json(
      { error: "No se pudo publicar la necesidad" },
      { status: 500 }
    );
  }
}
