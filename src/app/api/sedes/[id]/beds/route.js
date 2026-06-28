import { NextResponse } from "next/server";
import { updateSedeBeds } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateBedsUpdate } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody } from "@/lib/apiSecurity";

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
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateBedsUpdate(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const sede = await updateSedeBeds(id, {
      camasTotal: parsed.data.camasTotal,
      camasOcupadas: parsed.data.camasOcupadas,
    });
    if (!sede) {
      return NextResponse.json({ errors: ["Sede no encontrada"] }, { status: 404 });
    }
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("PATCH /api/sedes/[id]/beds", err);
    return NextResponse.json({ error: "Error al actualizar camas" }, { status: 500 });
  }
}
