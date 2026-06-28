import { NextResponse } from "next/server";
import { listHelpers, createHelper } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateCreateHelper } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody, MAX_PHOTO_JSON_BYTES } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ helpers: [] });
    }
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const helpers = await listHelpers(id);
    return NextResponse.json({ helpers });
  } catch (err) {
    console.error("GET /api/sedes/[id]/helpers", err);
    return NextResponse.json({ error: "Error al cargar ayudantes" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const bodyResult = await parseJsonBody(request, MAX_PHOTO_JSON_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateCreateHelper(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const helper = await createHelper(id, parsed.data);
    return NextResponse.json({ helper }, { status: 201 });
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json({ errors: ["Ya existe un ayudante con esa cédula"] }, { status: 409 });
    }
    console.error("POST /api/sedes/[id]/helpers", err);
    return NextResponse.json({ error: "Error al registrar ayudante" }, { status: 500 });
  }
}
