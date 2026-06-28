"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2, MapPin, Package, Users, Phone, Loader2, ChevronRight,
  AlertTriangle, Home, Link2, Search, LocateFixed,
} from "lucide-react";
import { haversineKm } from "@/lib/stockConstants";
import { useUserLocation } from "@/lib/useUserLocation";
import { apiListCentrosPublic } from "@/lib/stockApi";
import "@/app/centros/centros.css";

function matchCentro(c, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    c.nombre?.toLowerCase().includes(needle)
    || c.zona?.toLowerCase().includes(needle)
  );
}

export default function CentrosLista() {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("cercanas");
  const { coords, status: geoStatus, request: requestGeo } = useUserLocation();

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    apiListCentrosPublic()
      .then((data) => {
        if (!cancelled) setCentros(Array.isArray(data.centros) ? data.centros : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setCentros([]);
          setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los centros");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    const filtered = centros
      .filter((c) => matchCentro(c, q.trim()))
      .map((c) => {
        const dist = coords
          ? haversineKm(coords.lat, coords.lng, c.lat, c.lng)
          : null;
        return {
          ...c,
          dist: dist != null ? Math.round(dist * 10) / 10 : null,
        };
      });

    if (sort === "cercanas" && coords) {
      filtered.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
    } else {
      filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
    }
    return filtered;
  }, [centros, q, sort, coords]);

  return (
    <div className="cen-page">
      <header className="cen-header">
        <div className="cen-header-inner">
          <div className="cen-mark"><Building2 size={18} /></div>
          <div className="cen-header-text">
            <h1>Centros de emergencia</h1>
            <p>Estado, equipo, inventario y contacto de cada sede</p>
          </div>
          <nav className="cen-nav" aria-label="Navegación">
            <Link href="/"><Package size={14} /> Buscar ayuda</Link>
            <Link href="/inventario"><Building2 size={14} /> Gestionar sede</Link>
            <Link href="/recursos"><Link2 size={14} /> Recursos</Link>
          </nav>
        </div>
      </header>

      <main className="cen-main">
        <div className="cen-toolbar">
          <div className="cen-search">
            <Search size={18} color="var(--cen-muted)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o dirección…"
              aria-label="Buscar centros"
            />
          </div>
          <button
            type="button"
            className={`cen-geo ${coords ? "on" : ""}`}
            onClick={requestGeo}
            disabled={geoStatus === "loading"}
          >
            {geoStatus === "loading" ? (
              <Loader2 size={14} className="cen-spin" />
            ) : (
              <LocateFixed size={14} />
            )}
            {coords ? "Usando mi ubicación" : "Cerca de mí"}
          </button>
          <div className="cen-filters">
            <div className="cen-seg">
              <button
                type="button"
                className={sort === "cercanas" ? "on" : ""}
                onClick={() => setSort("cercanas")}
              >
                Más cercanos
              </button>
              <button
                type="button"
                className={sort === "nombre" ? "on" : ""}
                onClick={() => setSort("nombre")}
              >
                Por nombre
              </button>
            </div>
          </div>
        </div>

        <p className="cen-meta">
          <b>{rows.length}</b> centro{rows.length === 1 ? "" : "s"}
          {coords && sort === "cercanas" && " · ordenados por distancia"}
          {geoStatus === "denied" && " · activa ubicación para ver km reales"}
          {!coords && sort === "cercanas" && " · pulsa «Cerca de mí» para calcular km"}
        </p>

        {loadError && (
          <p className="cen-load-err">{loadError}</p>
        )}

        {loading ? (
          <div className="cen-empty"><Loader2 size={24} className="cen-spin" /> Cargando centros…</div>
        ) : rows.length === 0 ? (
          <div className="cen-empty">
            <b>Sin resultados</b>
            {q.trim()
              ? "Prueba otra dirección o quita el filtro de búsqueda."
              : loadError || "Aún no hay sedes en el sistema."}
          </div>
        ) : (
          <div className="cen-grid">
            {rows.map((c) => {
              const status = c.status || { label: "—", bg: "#F1F5F9", color: "#475569" };
              return (
                <Link href={`/centros/${c.slug}`} className="cen-card" key={c.slug} prefetch={false}>
                  <div className="cen-card-top">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt="" className="cen-card-photo" />
                    ) : (
                      <div className="cen-card-photo cen-card-photo-ph"><Building2 size={22} /></div>
                    )}
                    <div className="cen-card-head">
                      <h2>{c.nombre}</h2>
                      <span className="cen-pill" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <p className="cen-card-zone">
                    <MapPin size={13} /> {c.zona}
                    {c.dist != null && <span className="cen-dist"> · {c.dist} km</span>}
                  </p>
                  <div className="cen-card-stats">
                    <span><Users size={13} /> {c.equipoCount} en equipo</span>
                    {c.faltanCount > 0 && (
                      <span className="warn"><AlertTriangle size={13} /> {c.faltanCount} faltantes</span>
                    )}
                    {c.personalNecesita > 0 && (
                      <span>{c.personalNecesita} personal buscado</span>
                    )}
                    {c.camasTotal > 0 && (
                      <span><Home size={13} /> {c.camasLibres}/{c.camasTotal} camas</span>
                    )}
                  </div>
                  {c.contacto && (
                    <p className="cen-card-contact"><Phone size={13} /> {c.contacto}</p>
                  )}
                  <span className="cen-card-more">Ver detalle <ChevronRight size={14} /></span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
