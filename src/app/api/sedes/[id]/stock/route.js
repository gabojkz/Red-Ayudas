import { NextResponse } from "next/server";
import {
  listStockForSede, createStockItem, confirmSedeInventory,
} from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validateCreateStockItem } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ items: [] });
    }
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const items = await listStockForSede(id);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/sedes/[id]/stock", err);
    return NextResponse.json({ error: "Error al cargar inventario" }, { status: 500 });
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
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateCreateStockItem(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const item = await createStockItem(id, parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("POST /api/sedes/[id]/stock", err);
    return NextResponse.json({ error: "Error al agregar material" }, { status: 500 });
  }
}
