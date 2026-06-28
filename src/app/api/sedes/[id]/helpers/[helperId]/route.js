import { NextResponse } from "next/server";
import { deleteHelper, updateHelperPhoto } from "@/lib/stockDb";
import { requireSedeAuth } from "@/lib/stockAuth";
import { validatePhotoUpdate } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody, MAX_PHOTO_JSON_BYTES } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function PATCH(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id, helperId } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const bodyResult = await parseJsonBody(request, MAX_PHOTO_JSON_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validatePhotoUpdate(bodyResult.data, "foto del trabajador");
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const helper = await updateHelperPhoto(id, helperId, parsed.data.photoData);
    if (!helper) {
      return NextResponse.json({ errors: ["Trabajador no encontrado"] }, { status: 404 });
    }
    return NextResponse.json({ helper });
  } catch (err) {
    console.error("PATCH /api/sedes/[id]/helpers/[helperId]", err);
    return NextResponse.json({ error: "Error al actualizar foto" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const { id, helperId } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const ok = await deleteHelper(id, helperId);
    if (!ok) {
      return NextResponse.json({ errors: ["Ayudante no encontrado"] }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/sedes/[id]/helpers/[helperId]", err);
    return NextResponse.json({ error: "Error al eliminar ayudante" }, { status: 500 });
  }
}
