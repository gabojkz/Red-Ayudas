import { NextResponse } from "next/server";
import { getConnectionById, updateConnection } from "@/lib/db";
import { validateConnectionId, validateConnectionUpdate } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const idCheck = validateConnectionId(id);
    if (!idCheck.ok) {
      return NextResponse.json({ errors: idCheck.errors }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validateConnectionUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }

    const connection = await updateConnection(idCheck.data, parsed.data);
    if (!connection) {
      return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ connection });
  } catch (err) {
    console.error("PATCH /api/connections/[id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const idCheck = validateConnectionId(id);
    if (!idCheck.ok) {
      return NextResponse.json({ errors: idCheck.errors }, { status: 400 });
    }
    const connection = await getConnectionById(idCheck.data);
    if (!connection) {
      return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ connection });
  } catch (err) {
    console.error("GET /api/connections/[id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
