import { NextResponse } from "next/server";
import { verifySedeLogin } from "@/lib/stockDb";
import { validateSedeLogin } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";
import { parseJsonBody } from "@/lib/apiSecurity";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
    }
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ errors: bodyResult.errors }, { status: bodyResult.status });
    }
    const parsed = validateSedeLogin(bodyResult.data);
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const sede = await verifySedeLogin(parsed.data.slug, parsed.data.password);
    if (!sede) {
      return NextResponse.json({ errors: ["Usuario o contraseña incorrectos"] }, { status: 401 });
    }
    return NextResponse.json({ sede });
  } catch (err) {
    console.error("POST /api/sedes/login", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
