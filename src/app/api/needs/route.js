import { NextResponse } from "next/server";
import { listNeeds, createNeed } from "@/lib/db";
import { validateCreateNeed } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    if (!process.env.DATABASE_URL) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ needs: [] });
      }
      return NextResponse.json(
        { error: "Base de datos no configurada" },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const kind = searchParams.get("kind") || undefined;
    const needs = await listNeeds({ status, type, kind });
    return NextResponse.json({ needs });
  } catch (err) {
    console.error("GET /api/needs", err);
    return NextResponse.json(
      { error: "No se pudieron cargar las necesidades" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Base de datos no configurada. Añade DATABASE_URL en .env.local" },
        { status: 503 }
      );
    }
    const body = await request.json();
    const parsed = validateCreateNeed(body);
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
