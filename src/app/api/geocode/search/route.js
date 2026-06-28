import { NextResponse } from "next/server";
import { searchNominatim, validateGeocodeQuery } from "@/lib/geocode";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = validateGeocodeQuery(searchParams.get("q"));
    if (!parsed.ok) {
      return NextResponse.json({ errors: parsed.errors }, { status: 400 });
    }
    const results = await searchNominatim(parsed.data.q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("GET /api/geocode/search", err);
    return NextResponse.json({ error: "Error al buscar dirección" }, { status: 502 });
  }
}
