import { NextResponse } from "next/server";
import { listLaborNeeds, createLaborNeed } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateCreateLaborNeed } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody, MAX_JSON_BYTES } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ laborNeeds: [] });
    }
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const laborNeeds = await listLaborNeeds(id);
    return NextResponse.json({ laborNeeds });
  } catch (err) {
    console.error("GET /api/sedes/[id]/labor", err);
    return NextResponse.json({ error: "Error al cargar necesidades de personal" }, { status: 500 });
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
    const bodyResult = await parseJsonBody(request, MAX_JSON_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateCreateLaborNeed(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const laborNeed = await createLaborNeed(id, parsed.data);
    return NextResponse.json({ laborNeed }, { status: 201 });
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json({ errors: ["Ya registraste esa habilidad"] }, { status: 409 });
    }
    console.error("POST /api/sedes/[id]/labor", err);
    return NextResponse.json({ error: "Error al registrar necesidad" }, { status: 500 });
  }
}
