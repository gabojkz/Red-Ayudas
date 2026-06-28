import { NextResponse } from "next/server";
import { confirmSedeInventory } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

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
    const sede = await confirmSedeInventory(id);
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("POST /api/sedes/[id]/stock/confirm", err);
    return NextResponse.json({ error: "Error al confirmar inventario" }, { status: 500 });
  }
}
