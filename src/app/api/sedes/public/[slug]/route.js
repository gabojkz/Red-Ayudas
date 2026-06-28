import { NextResponse } from "next/server";
import { getSedePublicBySlug } from "@/lib/stockDb";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ errors: ["Base de datos no configurada"] }, { status: 503 });
    }
    const { slug } = await params;
    const centro = await getSedePublicBySlug(String(slug).trim().toLowerCase());
    if (!centro) {
      return NextResponse.json({ errors: ["Centro no encontrado"] }, { status: 404 });
    }
    return NextResponse.json(centro);
  } catch (err) {
    console.error("GET /api/sedes/public/[slug]", err);
    return NextResponse.json({ error: "Error al cargar el centro" }, { status: 500 });
  }
}
