"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Pill, Soup, Droplet, Wrench, MapPin, Package,
  AlertTriangle, Loader2, Home, Link2, Navigation, Heart,
  HandHeart, Users, LocateFixed, ExternalLink, Building2,
} from "lucide-react";
import {
  STOCK_CATS, STOCK_CAT_KEYS, LABOR_SKILLS, LABOR_SKILL_KEYS,
  stockStatus, timeAgoStock,
} from "@/lib/stockConstants";
import { useUserLocation } from "@/lib/useUserLocation";
import { apiStockOverview } from "@/lib/stockApi";
import { mapLinks } from "@/lib/mapLinks";
import "@/app/necesidades.css";

const CAT_ICONS = {
  medicina: Pill,
  alimentos: Soup,
  agua: Droplet,
  herramientas: Wrench,
  refugio: Home,
};

const MODOS = [
  { id: "busco", label: "Busco ayuda", hint: "Centros con material disponible cerca de ti", Icon: Heart },
  { id: "dono", label: "Quiero donar", hint: "Centros que necesitan donaciones", Icon: HandHeart },
  { id: "personal", label: "Ofrecer tiempo", hint: "Centros que buscan personal o voluntarios", Icon: Users },
];

function CentroLink({ slug, children, className }) {
  if (!slug) return <span className={className}>{children}</span>;
  return (
    <Link href={`/centros/${slug}`} className={`nec-centro-link ${className || ""}`} prefetch={false}>
      {children}
    </Link>
  );
}

function StatusPill({ item }) {
  const e = stockStatus(item);
  return (
    <span className="nec-pill" style={{ background: e.bg, color: e.c }}>
      <span className="nec-pdot" style={{ background: e.c }} />{e.key}
    </span>
  );
}

function DirLinks({ lat, lng, label }) {
  if (lat == null || lng == null) return null;
  const links = mapLinks(lat, lng, label);
  return (
    <div className="nec-dirs">
      <a href={links.google} target="_blank" rel="noopener noreferrer" className="nec-dir">
        <Navigation size={12} /> Cómo llegar
      </a>
      <a href={links.waze} target="_blank" rel="noopener noreferrer" className="nec-dir nec-dir-alt">
        Waze <ExternalLink size={10} />
      </a>
    </div>
  );
}

export default function NecesidadesLista() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todos");
  const [skill, setSkill] = useState("todos");
  const [sort, setSort] = useState("cercanas");
  const [modo, setModo] = useState("busco");
  const [filtroStock, setFiltroStock] = useState("necesita");
  const [rows, setRows] = useState([]);
  const [laborRows, setLaborRows] = useState([]);
  const [sedeCount, setSedeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [originUser, setOriginUser] = useState(false);
  const { coords, status: geoStatus, request: requestGeo } = useUserLocation();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {
      q,
      cat: modo === "personal" ? undefined : cat,
      sort,
      modo,
      skill: modo === "personal" ? skill : undefined,
      filtro: modo === "dono" ? filtroStock : undefined,
      originLat: coords?.lat,
      originLng: coords?.lng,
    };
    apiStockOverview(params)
      .then((data) => {
        if (!cancelled) {
          setRows(data.items || []);
          setLaborRows(data.laborNeeds || []);
          setSedeCount(data.sedes || 0);
          setOriginUser(Boolean(data.origin?.userProvided));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setLaborRows([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, cat, skill, sort, modo, filtroStock, coords]);

  const activeModo = MODOS.find((m) => m.id === modo) || MODOS[0];
  const resultCount = modo === "personal" ? laborRows.length : rows.length;

  return (
    <div className="nec-page">
      <header className="nec-header">
        <div className="nec-header-inner">
          <div className="nec-mark"><Package size={18} /></div>
          <div className="nec-header-text">
            <h1>Encuentra centros de ayuda</h1>
            <p>{sedeCount} centros · materiales, donaciones y personal</p>
          </div>
          <nav className="nec-nav" aria-label="Navegación">
            <Link href="/centros"><Building2 size={14} /> Centros</Link>
            <Link href="/inventario"><Package size={14} /> Gestionar sede</Link>
            <Link href="/reportes"><MapPin size={14} /> Reportes</Link>
            <Link href="/recursos"><Link2 size={14} /> Recursos</Link>
          </nav>
        </div>
      </header>

      <main className="nec-main">
        <div className="nec-modos">
          {MODOS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`nec-modo ${modo === id ? "on" : ""}`}
              onClick={() => setModo(id)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <p className="nec-modo-hint">{activeModo.hint}</p>

        <div className="nec-toolbar">
          <div className="nec-search">
            <Search size={18} color="var(--nec-muted)" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                modo === "personal"
                  ? "Buscar centro o notas…"
                  : "Buscar material o centro…"
              }
              aria-label="Buscar"
            />
          </div>

          <button
            type="button"
            className={`nec-geo ${coords ? "on" : ""}`}
            onClick={requestGeo}
            disabled={geoStatus === "loading"}
          >
            {geoStatus === "loading" ? (
              <Loader2 size={14} className="nec-spin" />
            ) : (
              <LocateFixed size={14} />
            )}
            {coords ? "Usando mi ubicación" : "Cerca de mí"}
          </button>

          <div className="nec-filters">
            {modo === "personal" ? (
              <div className="nec-chips">
                <button type="button" className={`nec-chip ${skill === "todos" ? "on" : ""}`} onClick={() => setSkill("todos")}>
                  Todas las habilidades
                </button>
                {LABOR_SKILL_KEYS.map((k) => {
                  const S = LABOR_SKILLS[k];
                  return (
                    <button key={k} type="button" className={`nec-chip ${skill === k ? "on" : ""}`} onClick={() => setSkill(k)}>
                      {S.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="nec-chips">
                <button type="button" className={`nec-chip ${cat === "todos" ? "on" : ""}`} onClick={() => setCat("todos")}>
                  Todos
                </button>
                {STOCK_CAT_KEYS.filter((k) => k !== "refugio").map((k) => {
                  const C = STOCK_CATS[k];
                  const I = CAT_ICONS[k];
                  return (
                    <button key={k} type="button" className={`nec-chip ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}>
                      <I size={13} /> {C.label}
                    </button>
                  );
                })}
              </div>
            )}

            {modo === "dono" && (
              <div className="nec-seg">
                <button type="button" className={filtroStock === "necesita" ? "on" : ""} onClick={() => setFiltroStock("necesita")}>
                  Con falta
                </button>
                <button type="button" className={filtroStock === "todos" ? "on" : ""} onClick={() => setFiltroStock("todos")}>
                  Todo el stock
                </button>
              </div>
            )}

            <div className="nec-seg">
              <button type="button" className={sort === "recientes" ? "on" : ""} onClick={() => setSort("recientes")}>
                Recientes
              </button>
              <button type="button" className={sort === "cercanas" ? "on" : ""} onClick={() => setSort("cercanas")}>
                Más cercanas
              </button>
            </div>
          </div>
        </div>

        <p className="nec-meta">
          <b>{resultCount}</b>{" "}
          {modo === "personal" && "necesidades de personal"}
          {modo === "busco" && "materiales disponibles en centros"}
          {modo === "dono" && (filtroStock === "necesita" ? "materiales con falta" : "registros de inventario")}
          {originUser && <span> · ordenado desde tu ubicación</span>}
          {geoStatus === "denied" && <span> · activa ubicación para distancias reales</span>}
        </p>

        {modo === "personal" ? (
          <>
            <div className="nec-table-head nec-table-head-labor" aria-hidden>
              <span>Habilidad</span>
              <span>Centro</span>
              <span style={{ textAlign: "right" }}>Personas</span>
              <span style={{ textAlign: "right" }}>Distancia</span>
              <span style={{ textAlign: "right" }}>Ir</span>
            </div>
            {loading ? (
              <div className="nec-empty"><Loader2 size={24} className="nec-spin" /> Cargando…</div>
            ) : laborRows.length === 0 ? (
              <div className="nec-empty">
                <b>Sin necesidades de personal</b>
                Prueba otra habilidad o quita filtros.
              </div>
            ) : (
              <div className="nec-list">
                {laborRows.map((x) => {
                  const S = LABOR_SKILLS[x.skill] || { label: x.skillLabel, bg: "#F1F5F9", color: "#475569" };
                  return (
                    <article className="nec-row nec-row-labor" key={x.id}>
                      <div className="nec-row-head">
                        <div className="nec-row-main">
                          <div className="nec-ico" style={{ background: S.bg }}>
                            <Users size={18} color={S.color} />
                          </div>
                          <div>
                            <div className="nec-row-title">{S.label}</div>
                            {x.notas && <div className="nec-row-note">{x.notas}</div>}
                            <div className="nec-row-sub mobile-only">
                              <MapPin size={12} /> {x.sede}
                              {x.dist != null && <span>· {x.dist} km</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="nec-centro">
                        <CentroLink slug={x.sedeSlug} className="nec-centro-name">{x.sede}</CentroLink>
                        <div className="nec-centro-zone">{x.sedeZona}</div>
                        {x.camasTotal > 0 && (
                          <div className="nec-fresh">{x.camasLibres} camas libres</div>
                        )}
                      </div>
                      <div className="nec-cantidad">
                        <div className="nec-stat-val">{x.cantidad}</div>
                        <div className="nec-stat-unit">personas</div>
                      </div>
                      <div className="nec-camas">
                        {x.dist != null ? `${x.dist} km` : "—"}
                      </div>
                      <div className="nec-estado">
                        <DirLinks lat={x.lat} lng={x.lng} label={x.sede} />
                      </div>
                      <div className="nec-row-stats">
                        <DirLinks lat={x.lat} lng={x.lng} label={x.sede} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="nec-table-head" aria-hidden>
              <span>Material</span>
              <span>Centro</span>
              <span style={{ textAlign: "right" }}>Cantidad</span>
              <span style={{ textAlign: "right" }}>Camas libres</span>
              <span style={{ textAlign: "right" }}>{modo === "busco" ? "Ir" : "Estado"}</span>
            </div>

            {loading ? (
              <div className="nec-empty"><Loader2 size={24} className="nec-spin" /> Cargando…</div>
            ) : rows.length === 0 ? (
              <div className="nec-empty">
                <b>Sin resultados</b>
                {modo === "busco"
                  ? "Ningún centro tiene ese material disponible. Prueba otra categoría."
                  : filtroStock === "necesita"
                    ? "No hay materiales en falta con estos filtros."
                    : "Prueba otra búsqueda o categoría."}
              </div>
            ) : (
              <div className="nec-list">
                {rows.map((x) => {
                  const C = STOCK_CATS[x.cat];
                  const I = CAT_ICONS[x.cat];
                  return (
                    <article className="nec-row" key={`${x.id}-${x.sedeId}`}>
                      <div className="nec-row-head">
                        <div className="nec-row-main">
                          <div className="nec-ico" style={{ background: C.bg }}>
                            <I size={18} color={C.c} />
                          </div>
                          <div>
                            <div className="nec-row-title">{x.nombre}</div>
                            <div className="nec-row-sub mobile-only">
                              <MapPin size={12} /> {x.sede}
                              {x.dist != null && <span>· {x.dist} km</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="nec-centro">
                        <CentroLink slug={x.sedeSlug} className="nec-centro-name">{x.sede}</CentroLink>
                        <div className="nec-centro-zone">{x.sedeZona}</div>
                        {x.dist != null && (
                          <div className="nec-fresh">{x.dist} km · {timeAgoStock(x.updated)}</div>
                        )}
                        <DirLinks lat={x.lat} lng={x.lng} label={x.sede} />
                      </div>

                      <div className="nec-cantidad">
                        <div className="nec-stat-val">{x.cantidad}</div>
                        <div className="nec-stat-unit">{x.unidad}</div>
                      </div>

                      <div className="nec-camas">
                        {x.camasTotal > 0 ? (
                          <><strong>{x.camasLibres}</strong> / {x.camasTotal}</>
                        ) : (
                          "—"
                        )}
                      </div>

                      <div className="nec-estado">
                        {modo === "dono" ? (
                          <StatusPill item={x} />
                        ) : (
                          <DirLinks lat={x.lat} lng={x.lng} label={x.sede} />
                        )}
                      </div>

                      <div className="nec-row-stats">
                        <div className="nec-stat">
                          <span className="nec-stat-lbl">Centro</span>
                          <span className="nec-stat-val" style={{ fontSize: 14 }}>{x.sede}</span>
                        </div>
                        <div className="nec-stat">
                          <span className="nec-stat-lbl">Cantidad</span>
                          <span className="nec-stat-val">{x.cantidad} <span className="nec-stat-unit">{x.unidad}</span></span>
                        </div>
                        {x.camasTotal > 0 && (
                          <div className="nec-stat">
                            <span className="nec-stat-lbl">Camas libres</span>
                            <span className="nec-stat-val">{x.camasLibres}</span>
                          </div>
                        )}
                        {modo === "dono" ? <StatusPill item={x} /> : null}
                        <DirLinks lat={x.lat} lng={x.lng} label={x.sede} />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {modo === "dono" && filtroStock === "necesita" && rows.length > 0 && (
              <p className="nec-tip">
                <AlertTriangle size={13} /> Usa «Cómo llegar» para ir al centro y donar el material que falta.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
