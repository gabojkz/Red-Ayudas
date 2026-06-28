import { NextResponse } from "next/server";
import { registerSede } from "@/lib/stockDb";
import { validateRegisterSede } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody, MAX_JSON_BYTES } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const bodyResult = await parseJsonBody(request, MAX_JSON_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateRegisterSede(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const result = await registerSede(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { errors: ["Ese usuario de sede ya existe. Elige otro nombre de usuario."] },
        { status: 409 }
      );
    }
    console.error("POST /api/sedes/register", err);
    return NextResponse.json({ error: "Error al registrar el centro" }, { status: 500 });
  }
}
