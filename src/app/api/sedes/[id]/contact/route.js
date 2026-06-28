import { NextResponse } from "next/server";
import { updateSedeContact } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateSedeContactUpdate } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody, MAX_JSON_BYTES } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
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
    const parsed = validateSedeContactUpdate(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const sede = await updateSedeContact(id, parsed.data.contacto);
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("PATCH /api/sedes/[id]/contact", err);
    return NextResponse.json({ error: "Error al actualizar contacto" }, { status: 500 });
  }
}
