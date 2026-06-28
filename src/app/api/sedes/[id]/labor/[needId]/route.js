import { NextResponse } from "next/server";
import { deleteLaborNeed } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id, needId } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const ok = await deleteLaborNeed(id, needId);
    if (!ok) {
      return NextResponse.json({ errors: ["Necesidad no encontrada"] }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/sedes/[id]/labor/[needId]", err);
    return NextResponse.json({ error: "Error al eliminar necesidad" }, { status: 500 });
  }
}
