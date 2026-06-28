import { NextResponse } from "next/server";
import { listStockOverview, listLaborNeedsPublic, listSedes } from "@/lib/stockDb";
import { validateStockOverviewQuery } from "@/lib/stockValidation";
import { hasDatabase } from "@/lib/databaseUrl";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ items: [], laborNeeds: [], sedes: 0 });
    }
    const { searchParams } = new URL(request.url);
    const parsed = validateStockOverviewQuery({
      q: searchParams.get("q") || undefined,
      cat: searchParams.get("cat") || undefined,
      sort: searchParams.get("sort") || undefined,
      modo: searchParams.get("modo") || undefined,
      filtro: searchParams.get("filtro") || undefined,
      skill: searchParams.get("skill") || undefined,
      originLat: searchParams.get("originLat") || undefined,
      originLng: searchParams.get("originLng") || undefined,
    });
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }

    const { modo, filtro, skill, originLat, originLng, ...query } = parsed.data;
    const sedes = await listSedes();

    if (modo === "personal") {
      const { laborNeeds, origin } = await listLaborNeedsPublic({
        q: query.q,
        skill,
        sort: query.sort,
        originLat,
        originLng,
      });
      return NextResponse.json({
        modo,
        laborNeeds,
        items: [],
        sedes: sedes.length,
        origin,
      });
    }

    const { items, origin } = await listStockOverview({
      ...query,
      filtro,
      originLat,
      originLng,
    });
    return NextResponse.json({
      modo,
      items,
      laborNeeds: [],
      sedes: sedes.length,
      origin,
    });
  } catch (err) {
    console.error("GET /api/stock/overview", err);
    return NextResponse.json({ error: "Error al cargar necesidades" }, { status: 500 });
  }
}
