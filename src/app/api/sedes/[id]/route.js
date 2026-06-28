import { NextResponse } from "next/server";
import { getSedeWithStock } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const sede = await getSedeWithStock(id);
    if (!sede) {
      return NextResponse.json({ errors: ["Sede no encontrada"] }, { status: 404 });
    }
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("GET /api/sedes/[id]", err);
    return NextResponse.json({ error: "Error al cargar sede" }, { status: 500 });
  }
}
