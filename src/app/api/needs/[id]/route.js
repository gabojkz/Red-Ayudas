import { NextResponse } from "next/server";
import { getNeedById, updateNeedStatus } from "@/lib/db";
import { validateNeedId, validateStatusUpdate } from "@/lib/validation";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

/** Internal — used by the web app, not the public feed API. */
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const idCheck = validateNeedId(id);
    if (!idCheck.ok) {
      return NextResponse.json({ errors: idCheck.errors }, { status: 400 });
    }
    const need = await getNeedById(idCheck.data);
    if (!need) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ need });
  } catch (err) {
    console.error("GET /api/needs/[id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

/** Internal — used by the web app, not the public feed API. */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const idCheck = validateNeedId(id);
    if (!idCheck.ok) {
      return NextResponse.json({ errors: idCheck.errors }, { status: 400 });
    }

    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateStatusUpdate(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }

    const need = await updateNeedStatus(idCheck.data, parsed.data.status);
    if (!need) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    return NextResponse.json({ need });
  } catch (err) {
    console.error("PATCH /api/needs/[id]", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
