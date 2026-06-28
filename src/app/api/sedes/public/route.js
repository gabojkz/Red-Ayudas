import { NextResponse } from "next/server";
import { listSedesPublicSummary } from "@/lib/stockDb";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ centros: [] });
    }
    const centros = await listSedesPublicSummary();
    return NextResponse.json({ centros });
  } catch (err) {
    console.error("GET /api/sedes/public", err);
    return NextResponse.json({ error: "Error al cargar centros" }, { status: 500 });
  }
}
