import { NextResponse } from "next/server";
import { adjustStockItem, deleteStockItem } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateStockDelta } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id, itemId } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateStockDelta(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const item = await adjustStockItem(id, itemId, parsed.data.delta);
    if (!item) {
      return NextResponse.json({ errors: ["Material no encontrado"] }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    console.error("PATCH /api/sedes/[id]/stock/[itemId]", err);
    return NextResponse.json({ error: "Error al actualizar cantidad" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id, itemId } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const ok = await deleteStockItem(id, itemId);
    if (!ok) {
      return NextResponse.json({ errors: ["Material no encontrado"] }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/sedes/[id]/stock/[itemId]", err);
    return NextResponse.json({ error: "Error al eliminar material" }, { status: 500 });
  }
}
