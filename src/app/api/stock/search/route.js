import { NextResponse } from "next/server";
import { searchStock, listSedes } from "@/lib/stockDb";
import { validateStockSearchQuery } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ items: [], sedes: [] });
    }
    const { searchParams } = new URL(request.url);
    const parsed = validateStockSearchQuery({
      q: searchParams.get("q") || undefined,
      cat: searchParams.get("cat") || undefined,
      sort: searchParams.get("sort") || undefined,
      originLat: searchParams.get("originLat") || undefined,
      originLng: searchParams.get("originLng") || undefined,
    });
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const [{ items, origin }, sedes] = await Promise.all([
      searchStock(parsed.data),
      listSedes(),
    ]);
    return NextResponse.json({ items, sedes: sedes.length, origin });
  } catch (err) {
    console.error("GET /api/stock/search", err);
    return NextResponse.json({ error: "Error al buscar materiales" }, { status: 500 });
  }
}
