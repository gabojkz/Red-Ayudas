import { NextResponse } from "next/server";
import { updateSedePhoto } from "@/lib/stockDb";
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
    const { id } = await params;
    const auth = await requireSedeAuth(request, id);
    if (!auth.ok) {
      return NextResponse.json({ errors: auth.errors }, { status: auth.status });
    }
    const bodyResult = await parseJsonBody(request, MAX_PHOTO_JSON_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validatePhotoUpdate(bodyResult.data, "foto del centro");
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const sede = await updateSedePhoto(id, parsed.data.photoData);
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("PATCH /api/sedes/[id]/photo", err);
    return NextResponse.json({ error: "Error al actualizar foto" }, { status: 500 });
  }
}
