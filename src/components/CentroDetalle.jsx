"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, MapPin, Phone, Users, Package, AlertTriangle, CheckCircle2,
  Loader2, ChevronLeft, Navigation, Home, Clock, Pill, Soup, Droplet, Wrench,
  ExternalLink, Link2,
} from "lucide-react";
import {
  STOCK_CATS, LABOR_SKILLS, SEDE_ROLES, stockStatus, timeAgoStock,
} from "@/lib/stockConstants";
import { apiGetCentroPublic } from "@/lib/stockApi";
import { siteConfig } from "@/lib/seo";
import { mapLinks } from "@/lib/mapLinks";
import { phoneTelHref, phoneWhatsAppHref } from "@/lib/phone";
import "@/app/centros/centros.css";

const CAT_ICONS = {
  medicina: Pill,
  alimentos: Soup,
  agua: Droplet,
  herramientas: Wrench,
  refugio: Home,
};

function StockList({ items, emptyLabel }) {
  if (!items.length) {
    return <p className="cen-muted">{emptyLabel}</p>;
  }
  return (
    <>
      <div className="cen-stock-table-head" aria-hidden>
        <span>Material</span>
        <span />
        <span>Cantidad</span>
        <span>Estado</span>
      </div>
      <div className="cen-stock-list">
        {items.map((i) => <StockRow key={i.id} item={i} />)}
      </div>
    </>
  );
}

function StockRow({ item }) {
  const C = STOCK_CATS[item.cat];
  const I = CAT_ICONS[item.cat] || Package;
  const st = stockStatus(item);
  return (
    <div className="cen-stock-row">
      <div className="cen-stock-ico" style={{ background: C?.bg || "#F1F5F9" }}>
        <I size={16} color={C?.color || "#475569"} />
      </div>
      <div className="cen-stock-main">
        <div className="cen-stock-name">{item.nombre}</div>
        <div className="cen-stock-meta">{C?.label} · {timeAgoStock(item.updated)}</div>
      </div>
      <div className="cen-stock-qty">
        <strong>{item.cantidad}</strong> {item.unidad}
      </div>
      <span className="cen-pill cen-pill-sm" style={{ background: st.bg, color: st.color }}>{st.key}</span>
    </div>
  );
}

export default function CentroDetalle({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetCentroPublic(slug)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) { setData(null); setError(e.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="cen-page">
        <div className="cen-empty"><Loader2 size={24} className="cen-spin" /> Cargando centro…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cen-page">
        <main className="cen-main">
          <Link href="/centros" className="cen-back"><ChevronLeft size={16} /> Todos los centros</Link>
          <div className="cen-empty">
            <b>{error || "Centro no encontrado"}</b>
          </div>
        </main>
      </div>
    );
  }

  const { sede, equipo, stockDisponible, stockFalta, personalNecesita } = data;
  const links = sede.lat != null ? mapLinks(sede.lat, sede.lng, sede.nombre) : null;
  const tel = sede.contacto ? phoneTelHref(sede.contacto) : null;
  const wa = sede.contacto
    ? phoneWhatsAppHref(sede.contacto, `Hola, vi el centro ${sede.nombre} en ${siteConfig.name}.`)
    : null;

  return (
    <div className="cen-page">
      <header className="cen-header cen-header-detail">
        <div className="cen-header-inner">
          <Link href="/centros" className="cen-back cen-back-header"><ChevronLeft size={16} /> Centros</Link>
          <nav className="cen-nav" aria-label="Navegación">
            <Link href="/"><Package size={14} /> Buscar ayuda</Link>
            <Link href="/inventario"><Building2 size={14} /> Gestionar sede</Link>
            <Link href="/recursos"><Link2 size={14} /> Recursos</Link>
          </nav>
        </div>
      </header>

      <main className="cen-main cen-detail">
        <section className="cen-hero">
          {sede.photoUrl ? (
            <img src={sede.photoUrl} alt="" className="cen-hero-photo" />
          ) : (
            <div className="cen-hero-photo cen-hero-photo-ph"><Building2 size={32} /></div>
          )}
          <div className="cen-hero-body">
            <div className="cen-hero-top">
              <h1>{sede.nombre}</h1>
              <span className="cen-pill" style={{ background: sede.status.bg, color: sede.status.color }}>
                {sede.status.label}
              </span>
            </div>
            <p className="cen-hero-zone"><MapPin size={14} /> {sede.zona}</p>
            <p className="cen-hero-status">{sede.status.detail}</p>
            {sede.inventoryConfirmedAt && (
              <p className="cen-hero-upd">
                <Clock size={13} /> Inventario confirmado {timeAgoStock(new Date(sede.inventoryConfirmedAt).getTime())}
              </p>
            )}
            <div className="cen-hero-actions">
              {tel && (
                <a href={tel} className="cen-btn cen-btn-pri"><Phone size={15} /> Llamar</a>
              )}
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="cen-btn">WhatsApp</a>
              )}
              {links && (
                <a href={links.google} target="_blank" rel="noopener noreferrer" className="cen-btn">
                  <Navigation size={15} /> Cómo llegar
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="cen-detail-grid">
          <div className="cen-detail-aside">
            {sede.camasTotal > 0 && (
              <section className="cen-section">
                <h2><Home size={16} /> Refugio · camas</h2>
                <div className="cen-beds">
                  <div><span className="lbl">Total</span><strong>{sede.camasTotal}</strong></div>
                  <div><span className="lbl">Ocupadas</span><strong>{sede.camasOcupadas}</strong></div>
                  <div><span className="lbl">Libres</span><strong>{sede.camasLibres}</strong></div>
                  <span className="cen-pill" style={{ background: sede.beds.bg, color: sede.beds.color }}>
                    {sede.beds.key}
                  </span>
                </div>
              </section>
            )}

            <section className="cen-section">
              <h2><Users size={16} /> Equipo operativo ({equipo.length})</h2>
              {equipo.length === 0 ? (
                <p className="cen-muted">Sin personal registrado públicamente.</p>
              ) : (
                <div className="cen-team">
                  {equipo.map((p) => {
                    const R = SEDE_ROLES[p.rol] || SEDE_ROLES.voluntario;
                    return (
                      <div className="cen-person" key={p.id}>
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="cen-person-photo" />
                        ) : (
                          <div className="cen-person-photo cen-person-photo-ph"><Users size={18} /></div>
                        )}
                        <div>
                          <div className="cen-person-name">{p.nombre}</div>
                          <span className="cen-role" style={{ background: R.bg, color: R.color }}>{p.rolLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {personalNecesita.length > 0 && (
              <section className="cen-section">
                <h2><AlertTriangle size={16} /> Personal que necesitan</h2>
                <div className="cen-needs">
                  {personalNecesita.map((n) => {
                    const S = LABOR_SKILLS[n.skill];
                    return (
                      <div className="cen-need" key={n.id}>
                        <span className="cen-role" style={{ background: S?.bg, color: S?.color }}>{n.skillLabel}</span>
                        <span>{n.cantidad} persona{n.cantidad > 1 ? "s" : ""}</span>
                        {n.notas && <span className="cen-muted">· {n.notas}</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {links && (
              <section className="cen-section cen-map-links">
                <h2><Navigation size={16} /> Ubicación</h2>
                <div className="cen-links">
                  <a href={links.google} target="_blank" rel="noopener noreferrer">Google Maps <ExternalLink size={12} /></a>
                  <a href={links.waze} target="_blank" rel="noopener noreferrer">Waze <ExternalLink size={12} /></a>
                  <a href={links.osm} target="_blank" rel="noopener noreferrer">OpenStreetMap <ExternalLink size={12} /></a>
                </div>
              </section>
            )}
          </div>

          <div className="cen-detail-main">
            <section className="cen-section">
              <h2><CheckCircle2 size={16} /> Disponible ({stockDisponible.length})</h2>
              <StockList items={stockDisponible} emptyLabel="Nada por encima del umbral mínimo." />
            </section>

            <section className="cen-section">
              <h2><AlertTriangle size={16} /> Con falta o agotado ({stockFalta.length})</h2>
              <StockList items={stockFalta} emptyLabel="Inventario completo en todos los materiales." />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
