"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Pill, Soup, Droplet, Wrench, Plus, Minus, MapPin, Clock,
  Check, LogOut, Lock, RefreshCw, AlertTriangle, Trash2, ShieldCheck,
  ArrowRight, Package, Users, Home, UserPlus, Camera, Building2, ChevronLeft,
  Printer, Download, Phone, ExternalLink, Navigation,
} from "lucide-react";
import {
  STOCK_CATS, STOCK_CAT_KEYS, LABOR_SKILLS, LABOR_SKILL_KEYS, SEDE_ROLES, SEDE_ROLE_KEYS,
  timeAgoStock, freshnessMeta, decayPct, stockStatus, bedsStatus,
} from "@/lib/stockConstants";
import AddressSearch from "@/components/AddressSearch";
import {
  apiStockSearch, apiSedeLogin, apiRegisterSede, apiGetSede, apiAddStock, apiAdjustStock,
  apiDeleteStock, apiConfirmStock, apiUpdateBeds, apiAddHelper, apiDeleteHelper,
  apiAddLaborNeed, apiDeleteLaborNeed, apiUpdateSedeContact, apiUpdateSedePhoto, apiUpdateHelperPhoto,
  loadSedeSession, saveSedeSession,
} from "@/lib/stockApi";
import { slugFromNombre } from "@/lib/stockValidation";
import { asyncHandler } from "@/lib/asyncHandler";
import { downloadSedeReportCsv, printSedeReport } from "@/lib/sedeReportExport";
import { mapLinks } from "@/lib/mapLinks";
import { phoneTelHref } from "@/lib/phone";
import { useUserLocation } from "@/lib/useUserLocation";
import "@/app/inventario/inventario.css";

const CAT_ICONS = {
  medicina: Pill,
  alimentos: Soup,
  agua: Droplet,
  herramientas: Wrench,
  refugio: Home,
};

function FreshBadge({ updated }) {
  const f = freshnessMeta(updated);
  return (
    <span className="inv-fresh" style={{ background: f.bg, color: f.c }}>
      <Clock size={12} /> {timeAgoStock(updated)}
      <span className="inv-decay"><i style={{ width: `${decayPct(updated)}%`, background: f.c }} /></span>
    </span>
  );
}

function StatusPill({ item }) {
  const e = stockStatus(item);
  return (
    <span className="inv-pill" style={{ background: e.bg, color: e.c }}>
      <span className="inv-pdot" style={{ background: e.c }} />{e.key}
    </span>
  );
}

const MAX_PHOTO_BYTES = 200_000;

function readPhotoFile(file, onDone, onError) {
  if (!file) return;
  if (file.size > MAX_PHOTO_BYTES) {
    onError("La foto debe ser menor a 200 KB");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result);
  reader.readAsDataURL(file);
}

function SedePhotoControl({ session, photoUrl, onUpdated, toast }) {
  const upload = async (photoData) => {
    try {
      await apiUpdateSedePhoto(session, photoData);
      onUpdated();
      toast(photoData ? "Foto del centro actualizada" : "Foto eliminada");
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <label className="inv-sede-photo-wrap" title="Subir foto del centro">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="inv-sede-photo" />
      ) : (
        <div className="inv-sede-photo inv-sede-photo-ph"><Building2 size={24} /></div>
      )}
      <span className="inv-sede-photo-badge"><Camera size={14} /></span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          readPhotoFile(file, (data) => { void upload(data); }, toast);
        }}
      />
    </label>
  );
}

function HelperPhotoControl({ session, helper, onUpdated, toast, compact }) {
  const upload = async (photoData) => {
    try {
      await apiUpdateHelperPhoto(session, helper.id, photoData);
      onUpdated();
      toast(photoData ? "Foto actualizada" : "Foto eliminada");
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <label className={`inv-helper-photo-wrap ${compact ? "inv-helper-photo-wrap-sm" : ""}`} title="Subir foto">
      {helper.photoUrl ? (
        <img src={helper.photoUrl} alt="" className="inv-helper-photo" />
      ) : (
        <div className="inv-helper-photo-ph"><Camera size={compact ? 18 : 20} /></div>
      )}
      <span className="inv-helper-photo-badge"><Camera size={12} /></span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          readPhotoFile(file, (data) => { void upload(data); }, toast);
        }}
      />
    </label>
  );
}

function LoginView({ onLogin, onGuest, onRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    setLoading(true);
    try {
      const { sede } = await apiSedeLogin(u.trim().toLowerCase(), p);
      onLogin({ slug: u.trim().toLowerCase(), password: p, sede });
    } catch (e) {
      setErr(e.message || "Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inv-login">
      <div className="inv-login-scroll">
        <div className="inv-mark"><ShieldCheck size={26} color="#fff" /></div>
        <h1>Red de Ayuda</h1>
        <div className="tag">Registro de materiales por sede · Coordinación de emergencia</div>
        {err && <div className="inv-err"><AlertTriangle size={15} />{err}</div>}
        <div className="inv-lf">
          <label>Usuario de la sede</label>
          <input value={u} onChange={(e) => setU(e.target.value)} placeholder="ej. chacao" autoCapitalize="none" />
        </div>
        <div className="inv-lf">
          <label>Contraseña</label>
          <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); asyncHandler(go)(); } }} />
        </div>
      </div>
      <div className="inv-login-actions">
        <button type="button" className="inv-loginbtn" onClick={asyncHandler(go)} disabled={loading}>
          {loading ? "Entrando…" : "Entrar a mi sede"}
        </button>
        <button type="button" className="inv-loginbtn-sec" onClick={onRegister}>
          <Building2 size={16} /> Registrar nuevo centro
        </button>
        <div className="inv-hint">
          <b>Demo:</b> usuario <b>chacao</b> · contraseña <b>ayuda</b>
        </div>
        <button type="button" className="inv-linkbtn inv-linkbtn-light" onClick={onGuest}>
          Solo buscar materiales <ArrowRight size={14} style={{ verticalAlign: -2 }} />
        </button>
      </div>
    </div>
  );
}

const EMPTY_WORKER = () => ({ nombre: "", cedula: "", rol: "voluntario" });

function RegisterSedeView({ onRegistered, onBack }) {
  const [form, setForm] = useState({
    nombre: "",
    location: null,
    slug: "",
    slugTouched: false,
    password: "",
    camasTotal: "",
    contacto: "",
  });
  const [workers, setWorkers] = useState([EMPTY_WORKER()]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === "nombre" && !f.slugTouched) next.slug = slugFromNombre(v);
    return next;
  });

  const setWorker = (idx, patch) => {
    setWorkers((list) => list.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  };

  const submit = async () => {
    setErr("");
    if (!form.location?.lat) {
      setErr("Busca y selecciona la dirección exacta del centro.");
      return;
    }
    setLoading(true);
    try {
      const { sede, helpers } = await apiRegisterSede({
        nombre: form.nombre,
        zona: form.location.label,
        fullAddress: form.location.fullAddress,
        lat: form.location.lat,
        lng: form.location.lng,
        slug: form.slug,
        password: form.password,
        camasTotal: form.camasTotal === "" ? 0 : Number(form.camasTotal),
        contacto: form.contacto.trim() || null,
        trabajadores: workers.map(({ nombre, cedula, rol }) => ({ nombre, cedula, rol })),
      });
      onRegistered({
        slug: form.slug,
        password: form.password,
        sede: { ...sede, helpers },
      });
    } catch (e) {
      setErr(e.message || "No se pudo registrar el centro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inv-login">
      <div className="inv-login-scroll">
        <button type="button" className="inv-linkbtn" onClick={onBack} style={{ marginBottom: 14 }}>
          <ChevronLeft size={14} style={{ verticalAlign: -2 }} /> Volver
        </button>
        <div className="inv-mark"><Building2 size={26} color="#fff" /></div>
        <h1>Registrar centro</h1>
        <div className="tag">Registro rápido · las fotos se suben después en Mi sede y Trabajadores</div>
        {err && <div className="inv-err"><AlertTriangle size={15} />{err}</div>}

        <div className="inv-reg-section">Datos del centro</div>
        <div className="inv-lf">
          <label>Nombre del centro</label>
          <input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)}
            placeholder="ej. Centro comunitario La Vega" />
        </div>
        <div className="inv-lf">
          <label>Dirección del centro</label>
          <AddressSearch
            value={form.location}
            onChange={(location) => setForm((f) => ({ ...f, location }))}
            placeholder="Ej. Av. Principal, La Vega, Caracas"
            inputClassName="inv-inp-login"
          />
        </div>
        <div className="inv-lf">
          <label>Usuario de acceso</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))}
            placeholder="ej. la-vega" autoCapitalize="none" />
        </div>
        <div className="inv-lf">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)}
            placeholder="Mínimo 4 caracteres" />
        </div>
        <div className="inv-lf">
          <label>Teléfono de contacto <span className="inv-opt-light">(público, opcional)</span></label>
          <input inputMode="tel" value={form.contacto}
            onChange={(e) => setField("contacto", e.target.value)}
            placeholder="0414-1234567" />
        </div>
        <div className="inv-lf">
          <label>Camas totales (refugio)</label>
          <input inputMode="numeric" value={form.camasTotal}
            onChange={(e) => setField("camasTotal", e.target.value.replace(/\D/g, ""))}
            placeholder="0 si no aplica" />
        </div>

        <div className="inv-reg-section">Trabajadores del centro</div>
        {workers.map((w, idx) => (
          <div className="inv-reg-worker" key={idx}>
            <div className="inv-reg-worker-head">
              <span>Trabajador {idx + 1}</span>
              {workers.length > 1 && (
                <button type="button" className="inv-linkbtn" onClick={() => setWorkers((l) => l.filter((_, i) => i !== idx))}>
                  Quitar
                </button>
              )}
            </div>
            <div className="inv-lf" style={{ marginBottom: 8 }}>
              <label>Rol en el centro</label>
              <select className="inv-inp" value={w.rol || "voluntario"}
                onChange={(e) => setWorker(idx, { rol: e.target.value })}>
                {SEDE_ROLE_KEYS.map((k) => (
                  <option key={k} value={k}>{SEDE_ROLES[k].label}</option>
                ))}
              </select>
            </div>
            <div className="inv-lf" style={{ marginBottom: 8 }}>
              <label>Nombre completo</label>
              <input value={w.nombre} onChange={(e) => setWorker(idx, { nombre: e.target.value })}
                placeholder="Nombre y apellido" />
            </div>
            <div className="inv-lf" style={{ marginBottom: 0 }}>
              <label>Cédula</label>
              <input value={w.cedula} onChange={(e) => setWorker(idx, { cedula: e.target.value })}
                placeholder="6176211 o V-6176211" />
            </div>
          </div>
        ))}
        <button type="button" className="inv-linkbtn" onClick={() => setWorkers((l) => [...l, EMPTY_WORKER()])}>
          + Agregar otro trabajador
        </button>
      </div>
      <div className="inv-login-actions">
        <button type="button" className="inv-loginbtn" onClick={asyncHandler(submit)} disabled={loading}>
          {loading ? "Registrando…" : "Crear centro y continuar"}
        </button>
      </div>
    </div>
  );
}

function BuscarCentroLink({ slug, children }) {
  if (!slug) return children;
  return (
    <Link href={`/centros/${slug}`} className="inv-centro-link" prefetch={false}>
      {children}
    </Link>
  );
}

function BuscarDirLinks({ lat, lng, label }) {
  if (lat == null || lng == null) return null;
  const links = mapLinks(lat, lng, label);
  return (
    <div className="inv-search-dirs">
      <a href={links.google} target="_blank" rel="noopener noreferrer" className="inv-search-dir">
        <Navigation size={13} /> Cómo llegar
      </a>
      <a href={links.waze} target="_blank" rel="noopener noreferrer" className="inv-search-dir">
        Waze <ExternalLink size={11} />
      </a>
    </div>
  );
}

function BuscarView({ sedeCount, guest, onLoginPrompt }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todos");
  const [sort, setSort] = useState("recientes");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { coords } = useUserLocation();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiStockSearch({
      q,
      cat,
      sort,
      originLat: coords?.lat,
      originLng: coords?.lng,
    })
      .then((data) => { if (!cancelled) setRows(data.items || []); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q, cat, sort, coords?.lat, coords?.lng]);

  return (
    <>
      <div className="inv-bar">
        <div className="inv-bar-top">
          <div>
            <h1>Buscar materiales</h1>
            <div className="sub">{sedeCount} sedes activas · cerca de ti</div>
          </div>
          <Link href="/" className="inv-back-link">← Inicio</Link>
        </div>
      </div>
      <div className="inv-body">
        {guest && (
          <div className="inv-strip">
            <span className="t">Estás en modo búsqueda. Entra para administrar el inventario de tu sede.</span>
            <button type="button" className="inv-btn inv-btn-pri inv-btn-sm" onClick={onLoginPrompt}>Entrar</button>
          </div>
        )}
        <div className="inv-field">
          <Search size={18} color="var(--inv-muted)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Insulina, agua, arroz, linternas…" />
        </div>
        <div className="inv-chips">
          <button type="button" className={`inv-chip ${cat === "todos" ? "on" : ""}`} onClick={() => setCat("todos")}>Todos</button>
          {STOCK_CAT_KEYS.filter((k) => k !== "refugio").map((k) => {
            const C = STOCK_CATS[k];
            const I = CAT_ICONS[k];
            return (
              <button key={k} type="button" className={`inv-chip ${cat === k ? "on" : ""}`} onClick={() => setCat(k)}>
                <I size={14} />{C.label}
              </button>
            );
          })}
        </div>
        <div className="inv-sortrow">
          <span className="lbl"><span className="inv-num">{rows.length}</span> resultados</span>
          <div className="inv-seg">
            <button type="button" className={sort === "recientes" ? "on" : ""} onClick={() => setSort("recientes")}>Recientes</button>
            <button type="button" className={sort === "cercanas" ? "on" : ""} onClick={() => setSort("cercanas")}>Cercanas</button>
          </div>
        </div>
        {loading ? (
          <div className="inv-empty"><div className="ec"><Search size={22} color="var(--inv-muted)" /></div>Cargando…</div>
        ) : rows.length === 0 ? (
          <div className="inv-empty">
            <div className="ec"><Search size={22} color="var(--inv-muted)" /></div>
            <div style={{ fontWeight: 600, color: "var(--inv-ink)" }}>Sin coincidencias</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Prueba otra palabra o quita el filtro de categoría.</div>
          </div>
        ) : (
        <div className="inv-results-grid">
        {rows.map((x) => {
          const C = STOCK_CATS[x.cat];
          const I = CAT_ICONS[x.cat];
          const tel = x.contacto ? phoneTelHref(x.contacto) : null;
          return (
            <article className="inv-card inv-search-card" key={`${x.id}-${x.sede}`}>
              <div className="inv-row">
                <div className="inv-ico" style={{ background: C.bg }}><I size={19} color={C.c} /></div>
                <div className="inv-search-main">
                  <div className="inv-title">{x.nombre}</div>
                  <div className="inv-search-cat">{C.label}</div>
                  <div style={{ marginTop: 6 }}><FreshBadge updated={x.updated} /></div>
                </div>
                <div className="inv-qty">
                  <div className="inv-qty-line inv-num">{x.cantidad} {x.unidad}</div>
                  <div className="inv-qty-hint">unidad del centro</div>
                  <div style={{ marginTop: 6 }}><StatusPill item={x} /></div>
                </div>
              </div>

              <div className="inv-search-centro">
                <div className="inv-search-centro-head">
                  <Building2 size={14} aria-hidden />
                  <BuscarCentroLink slug={x.sedeSlug}>
                    <span className="inv-search-centro-name">{x.sede}</span>
                  </BuscarCentroLink>
                  {x.dist != null && <span className="inv-search-dist inv-num">{x.dist} km</span>}
                </div>
                {x.sedeZona && (
                  <p className="inv-search-zone"><MapPin size={13} /> {x.sedeZona}</p>
                )}
                {tel ? (
                  <a href={tel} className="inv-search-contact">
                    <Phone size={13} /> {x.contacto}
                  </a>
                ) : (
                  <p className="inv-search-no-contact">Sin teléfono publicado · coordina desde la ficha del centro</p>
                )}
              </div>

              <div className="inv-search-actions">
                {x.sedeSlug && (
                  <Link href={`/centros/${x.sedeSlug}`} className="inv-search-cta" prefetch={false}>
                    Ver centro <ArrowRight size={14} />
                  </Link>
                )}
                <BuscarDirLinks lat={x.lat} lng={x.lng} label={x.sede} />
              </div>
            </article>
          );
        })}
        </div>
        )}
      </div>
    </>
  );
}

function SedeExportActions({ sedeData }) {
  if (!sedeData) return null;
  return (
    <div className="inv-export">
      <span className="inv-export-label">Lista de recursos</span>
      <button
        type="button"
        className="inv-export-btn"
        onClick={() => printSedeReport(sedeData)}
        title="Imprimir materiales y personal"
      >
        <Printer size={15} aria-hidden /> Imprimir
      </button>
      <button
        type="button"
        className="inv-export-btn"
        onClick={() => downloadSedeReportCsv(sedeData)}
        title="Descargar CSV con materiales y personal"
      >
        <Download size={15} aria-hidden /> Descargar
      </button>
    </div>
  );
}

function BedsPanel({ sede, session, onUpdate, toast }) {
  const bs = bedsStatus(sede);
  const patch = async (field, delta) => {
    const next = {
      camasTotal: sede.camasTotal,
      camasOcupadas: sede.camasOcupadas,
    };
    if (field === "total") next.camasTotal = Math.max(0, next.camasTotal + delta);
    else next.camasOcupadas = Math.max(0, Math.min(next.camasTotal, next.camasOcupadas + delta));
    try {
      const { sede: updated } = await apiUpdateBeds(session, next);
      onUpdate(updated);
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="inv-beds">
      <div className="inv-beds-title"><Home size={14} /> Refugio · camas y vivienda temporal</div>
      <div className="inv-beds-row">
        <div className="inv-beds-stat">
          <div className="lbl">Total camas</div>
          <div className="inv-beds-step">
            <button type="button" onClick={asyncHandler(() => patch("total", -1))} aria-label="Menos camas"><Minus size={14} /></button>
            <span className="inv-num">{sede.camasTotal}</span>
            <button type="button" onClick={asyncHandler(() => patch("total", 1))} aria-label="Más camas"><Plus size={14} /></button>
          </div>
        </div>
        <div className="inv-beds-stat">
          <div className="lbl">Ocupadas</div>
          <div className="inv-beds-step">
            <button type="button" onClick={asyncHandler(() => patch("ocupadas", -1))} aria-label="Menos ocupadas"><Minus size={14} /></button>
            <span className="inv-num">{sede.camasOcupadas}</span>
            <button type="button" onClick={asyncHandler(() => patch("ocupadas", 1))} aria-label="Más ocupadas"><Plus size={14} /></button>
          </div>
        </div>
        <div className="inv-beds-stat">
          <div className="lbl">Libres</div>
          <div className="val inv-num">{bs.libres ?? 0}</div>
          <span className="inv-pill" style={{ background: bs.bg, color: bs.color, marginTop: 4 }}>
            <span className="inv-pdot" style={{ background: bs.color }} />{bs.key}
          </span>
        </div>
      </div>
    </div>
  );
}

function ContactPanel({ session, sede, onUpdate, toast }) {
  const [contacto, setContacto] = useState(sede.contacto || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContacto(sede.contacto || "");
  }, [sede.contacto]);

  const save = async () => {
    setSaving(true);
    try {
      const { sede: updated } = await apiUpdateSedeContact(session, contacto.trim() || null);
      onUpdate(updated);
      toast("Contacto actualizado");
    } catch (e) {
      toast(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inv-beds" style={{ marginTop: 12 }}>
      <div className="inv-beds-title">Teléfono de contacto público</div>
      <p className="inv-beds-hint">
        Aparece en la ficha pública del centro para donaciones y voluntarios.
      </p>
      <div className="g">
        <input className="inv-inp" inputMode="tel" value={contacto}
          onChange={(e) => setContacto(e.target.value)} placeholder="0414-1234567" />
        <button type="button" className="inv-btn inv-btn-pri inv-btn-sm" onClick={asyncHandler(save)} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function LaborNeedsPanel({ session, laborNeeds, onRefresh, toast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ skill: "general", cantidad: "1", notas: "" });
  const usedSkills = new Set((laborNeeds || []).map((n) => n.skill));

  const submit = async () => {
    try {
      await apiAddLaborNeed(session, {
        skill: form.skill,
        cantidad: Number(form.cantidad) || 1,
        notas: form.notas.trim() || null,
      });
      setForm({ skill: "general", cantidad: "1", notas: "" });
      setAdding(false);
      onRefresh();
      toast("Necesidad de personal publicada");
    } catch (e) {
      toast(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await apiDeleteLaborNeed(session, id);
      onRefresh();
      toast("Necesidad eliminada");
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="inv-beds" style={{ marginTop: 12 }}>
      <div className="inv-beds-title"><Users size={14} /> Personal que necesitamos</div>
      <p className="inv-beds-hint">
        Aparece en la búsqueda pública para quien quiera colaborar (informática, traducción, cocina, etc.).
      </p>
      {(laborNeeds || []).map((n) => {
        const S = LABOR_SKILLS[n.skill];
        return (
          <div className="inv-card" key={n.id} style={{ marginBottom: 8 }}>
            <div className="inv-row">
              <div style={{ flex: 1 }}>
                <div className="inv-title">{S?.label || n.skillLabel}</div>
                <div className="inv-meta">{n.cantidad} persona{n.cantidad > 1 ? "s" : ""}{n.notas ? ` · ${n.notas}` : ""}</div>
              </div>
              <button type="button" className="inv-del" onClick={asyncHandler(() => remove(n.id))} aria-label="Eliminar">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
      {adding ? (
        <div className="inv-addform" style={{ marginTop: 8 }}>
          <select className="inv-inp" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}>
            {LABOR_SKILL_KEYS.filter((k) => !usedSkills.has(k) || k === form.skill).map((k) => (
              <option key={k} value={k}>{LABOR_SKILLS[k].label}</option>
            ))}
          </select>
          <div className="g" style={{ marginTop: 8 }}>
            <input className="inv-inp" placeholder="Cantidad" inputMode="numeric" value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value.replace(/\D/g, "") })} />
            <input className="inv-inp" placeholder="Notas (opcional)" value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 8 }}>
            <button type="button" className="inv-btn inv-btn-pri" onClick={asyncHandler(submit)}>Publicar</button>
            <button type="button" className="inv-btn inv-btn-gh" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" className="inv-btn inv-btn-gh inv-btn-sm" onClick={() => setAdding(true)}>
          <Plus size={15} /> Agregar necesidad
        </button>
      )}
    </div>
  );
}

function MiSedeView({ session, sedeData, onRefresh, toast }) {
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ cat: "medicina", nombre: "", cantidad: "", unidad: "u", umbral: "" });

  const stock = sedeData?.stock || [];
  const oldest = stock.length ? Math.min(...stock.map((x) => x.updated)) : Date.now();
  const oldestFresh = freshnessMeta(oldest);
  const oldestStatusLabel = oldestFresh.key === "fresh"
    ? "Datos recientes"
    : oldestFresh.key === "aging"
      ? "Conviene verificar"
      : "Datos desactualizados";

  const setQty = async (id, d) => {
    try {
      await apiAdjustStock(session, id, d);
      onRefresh();
    } catch (e) {
      toast(e.message);
    }
  };

  const del = async (id) => {
    try {
      await apiDeleteStock(session, id);
      onRefresh();
      toast("Material eliminado");
    } catch (e) {
      toast(e.message);
    }
  };

  const confirmAll = async () => {
    try {
      await apiConfirmStock(session);
      onRefresh();
      toast("Inventario confirmado · todo marcado como actual");
    } catch (e) {
      toast(e.message);
    }
  };

  const add = async () => {
    if (!nf.nombre.trim() || nf.cantidad === "") return;
    try {
      await apiAddStock(session, {
        cat: nf.cat,
        nombre: nf.nombre.trim(),
        cantidad: +nf.cantidad,
        unidad: nf.unidad || "u",
        umbral: +nf.umbral || 0,
      });
      setNf({ cat: "medicina", nombre: "", cantidad: "", unidad: "u", umbral: "" });
      setAdding(false);
      onRefresh();
      toast("Material agregado");
    } catch (e) {
      toast(e.message);
    }
  };

  const byCat = STOCK_CAT_KEYS
    .map((k) => ({ k, items: stock.filter((x) => x.cat === k) }))
    .filter((g) => g.items.length);

  return (
    <>
      <div className="inv-bar">
        <div className="inv-bar-top">
          <div>
            <h1>Mi sede</h1>
            <div className="sub">Control de inventario</div>
          </div>
          <div className="inv-bar-actions">
            <SedeExportActions sedeData={sedeData} />
            <Link href="/" className="inv-back-link">← Inicio</Link>
          </div>
        </div>
      </div>
      <div className="inv-body inv-body-sede">
        <aside className="inv-sede-aside">
          <div className="inv-sedehead">
            <div className="inv-sedehead-top">
              <SedePhotoControl
                session={session}
                photoUrl={sedeData.photoUrl}
                onUpdated={onRefresh}
                toast={toast}
              />
              <div>
                <div className="nm">{sedeData.nombre}</div>
                <div className="loc"><MapPin size={13} /> {sedeData.zona}</div>
              </div>
            </div>
            <BedsPanel sede={sedeData} session={session} onUpdate={() => onRefresh()} toast={toast} />
            <ContactPanel
              session={session}
              sede={sedeData}
              onUpdate={() => onRefresh()}
              toast={toast}
            />
            <LaborNeedsPanel
              session={session}
              laborNeeds={sedeData.laborNeeds}
              onRefresh={onRefresh}
              toast={toast}
            />
            <div className="inv-conf-block">
              <div className="inv-conf-head">
                <ShieldCheck size={20} aria-hidden />
                <div>
                  <div className="inv-conf-title">Confirmar inventario al día</div>
                  <p className="inv-conf-hint">
                    Revisa que las cantidades coincidan con lo que hay en bodega. Este botón avisa
                    a donantes y al público que tu stock es confiable en la búsqueda.
                  </p>
                </div>
              </div>
              <p className="inv-conf-when">
                <strong>Úsalo</strong> al cerrar turno, después de contar material o cuando hace rato
                que no tocas una línea del inventario.
              </p>
              <span
                className="inv-conf-badge"
                style={{ background: oldestFresh.bg, color: oldestFresh.c }}
              >
                {oldestStatusLabel} · dato más antiguo {timeAgoStock(oldest)}
              </span>
              <button type="button" className="inv-conf-btn" onClick={asyncHandler(confirmAll)}>
                <RefreshCw size={16} aria-hidden />
                Sí, revisé el stock — marcar como actual
              </button>
            </div>
          </div>
        </aside>

        <div className="inv-sede-main">
        {adding ? (
          <div className="inv-addform">
            <div className="g">
              <select className="inv-inp" value={nf.cat} onChange={(e) => setNf({ ...nf, cat: e.target.value })}>
                {STOCK_CAT_KEYS.filter((k) => k !== "refugio").map((k) => (
                  <option key={k} value={k}>{STOCK_CATS[k].label}</option>
                ))}
              </select>
              <input className="inv-inp" placeholder="Cantidad" inputMode="numeric" value={nf.cantidad}
                onChange={(e) => setNf({ ...nf, cantidad: e.target.value.replace(/\D/g, "") })} />
            </div>
            <input className="inv-inp" style={{ marginBottom: 9 }} placeholder="Nombre del material"
              value={nf.nombre} onChange={(e) => setNf({ ...nf, nombre: e.target.value })} />
            <div className="g">
              <input className="inv-inp" placeholder="Unidad (kg, u, litros)" value={nf.unidad}
                onChange={(e) => setNf({ ...nf, unidad: e.target.value })} />
              <input className="inv-inp" placeholder="Umbral bajo" inputMode="numeric" value={nf.umbral}
                onChange={(e) => setNf({ ...nf, umbral: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
              <button type="button" className="inv-btn inv-btn-pri" onClick={asyncHandler(add)}>Agregar</button>
              <button type="button" className="inv-btn inv-btn-gh" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button type="button" className="inv-btn inv-btn-gh" style={{ marginBottom: 4 }} onClick={() => setAdding(true)}>
            <Plus size={17} /> Agregar material
          </button>
        )}

        {byCat.map(({ k, items }) => {
          const C = STOCK_CATS[k];
          const I = CAT_ICONS[k];
          return (
            <div key={k}>
              <div className="inv-secthead">
                <I size={15} color={C.c} />
                <span className="e">{C.label}</span><span className="ln" /><span className="cnt">{items.length}</span>
              </div>
              {items.map((x) => (
                <div className="inv-card" key={x.id}>
                  <div className="inv-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="inv-title">{x.nombre}</div>
                      <div style={{ marginTop: 7, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                        <StatusPill item={x} /><FreshBadge updated={x.updated} />
                      </div>
                      <div className="inv-step">
                        <button type="button" onClick={asyncHandler(() => setQty(x.id, -1))} aria-label="Restar"><Minus size={16} /></button>
                        <span className="v inv-num">{x.cantidad}</span>
                        <button type="button" onClick={asyncHandler(() => setQty(x.id, 1))} aria-label="Sumar"><Plus size={16} /></button>
                      </div>
                    </div>
                    <div className="inv-qty">
                      <div className="u" style={{ marginBottom: 6 }}>{x.unidad}</div>
                      <button type="button" className="inv-del" onClick={asyncHandler(() => del(x.id))} aria-label="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        </div>
      </div>
    </>
  );
}

function TrabajadoresView({ session, sedeData, helpers, onRefresh, toast }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nombre: "", cedula: "", rol: "voluntario" });

  const submit = async () => {
    if (!form.nombre.trim() || !form.cedula.trim()) {
      toast("Nombre y cédula son requeridos");
      return;
    }
    try {
      await apiAddHelper(session, {
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        rol: form.rol,
      });
      setForm({ nombre: "", cedula: "", rol: "voluntario" });
      setAdding(false);
      onRefresh();
      toast("Trabajador registrado · puedes subir su foto abajo");
    } catch (e) {
      toast(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await apiDeleteHelper(session, id);
      onRefresh();
      toast("Trabajador eliminado");
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <>
      <div className="inv-bar">
        <div className="inv-bar-top">
          <div>
            <h1>Trabajadores</h1>
            <div className="sub">Equipo asignado a este centro</div>
          </div>
          <div className="inv-bar-actions">
            <SedeExportActions sedeData={sedeData} />
            <Link href="/" className="inv-back-link">← Inicio</Link>
          </div>
        </div>
      </div>
      <div className="inv-body">
        <p style={{ fontSize: 13, color: "var(--inv-muted)", margin: "0 2px 14px", lineHeight: 1.5 }}>
          Registra a cada persona con nombre, cédula y rol. Toca la foto de cada trabajador para subirla después.
        </p>

        {adding ? (
          <div className="inv-addform">
            <input className="inv-inp" style={{ marginBottom: 9 }} placeholder="Nombre completo"
              value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className="inv-inp" style={{ marginBottom: 9 }} placeholder="6176211 o V-6176211"
              value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
            <select className="inv-inp" style={{ marginBottom: 9 }} value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              {SEDE_ROLE_KEYS.map((k) => (
                <option key={k} value={k}>{SEDE_ROLES[k].label}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 9 }}>
              <button type="button" className="inv-btn inv-btn-pri" onClick={asyncHandler(submit)}>Registrar</button>
              <button type="button" className="inv-btn inv-btn-gh" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button type="button" className="inv-btn inv-btn-gh" style={{ marginBottom: 14 }} onClick={() => setAdding(true)}>
            <UserPlus size={17} /> Agregar trabajador
          </button>
        )}

        {helpers.length === 0 ? (
          <div className="inv-empty">
            <div className="ec"><Users size={22} color="var(--inv-muted)" /></div>
            <div style={{ fontWeight: 600, color: "var(--inv-ink)" }}>Sin trabajadores registrados</div>
          </div>
        ) : (
        <div className="inv-helpers-list">
        {helpers.map((h) => (
          <div className="inv-card" key={h.id}>
            <div className="inv-helper">
              <HelperPhotoControl
                session={session}
                helper={h}
                onUpdated={onRefresh}
                toast={toast}
              />
              <div className="inv-helper-info">
                <div className="inv-helper-name">{h.nombre}</div>
                <div className="inv-helper-ced">{h.rolLabel || SEDE_ROLES.voluntario.label} · {h.cedula}</div>
              </div>
              <button type="button" className="inv-del" onClick={asyncHandler(() => remove(h.id))} aria-label="Eliminar">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        </div>
        )}
      </div>
    </>
  );
}

export default function InventarioApp() {
  const [view, setView] = useState("login");
  const [session, setSession] = useState(null);
  const [sedeData, setSedeData] = useState(null);
  const [tab, setTab] = useState("buscar");
  const [toastMsg, setToastMsg] = useState(null);
  const [sedeCount, setSedeCount] = useState(0);

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(window.__invToast);
    window.__invToast = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const refreshSede = useCallback(async () => {
    if (!session) return;
    try {
      const { sede } = await apiGetSede(session);
      setSedeData(sede);
      setSession((s) => ({ ...s, sede: { ...s.sede, ...sede } }));
    } catch (e) {
      toast(e.message);
    }
  }, [session, toast]);

  useEffect(() => {
    apiStockSearch().then((d) => setSedeCount(d.sedes || 0)).catch(() => setSedeCount(0));
  }, []);

  useEffect(() => {
    const saved = loadSedeSession();
    if (saved?.sede?.id) {
      setSession(saved);
      setView("app");
      setTab("sede");
    }
  }, []);

  useEffect(() => {
    if (view === "app" && session) {
      void refreshSede().catch(() => {});
    }
  }, [view, session?.sede?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (s) => {
    saveSedeSession(s);
    setSession(s);
    setView("app");
    setTab("sede");
    setSedeCount((c) => c + (s._new ? 1 : 0));
  };

  const handleRegistered = (s) => {
    handleLogin({ ...s, _new: true });
    toast("Centro registrado · sube las fotos en Mi sede y Trabajadores");
  };

  const handleLogout = () => {
    saveSedeSession(null);
    setSession(null);
    setSedeData(null);
    setView("guest");
    setTab("buscar");
  };

  return (
    <div className="inv-page-wrap">
      <div className={`inv-root ${view === "app" || view === "guest" ? "inv-root--app" : "inv-root--auth"}`}>
        {view === "login" && (
          <LoginView
            onLogin={handleLogin}
            onGuest={() => { setView("guest"); setTab("buscar"); }}
            onRegister={() => setView("register")}
          />
        )}

        {view === "register" && (
          <RegisterSedeView
            onRegistered={handleRegistered}
            onBack={() => setView("login")}
          />
        )}

        {(view === "app" || view === "guest") && (
          <>
            <div className="inv-tabs">
              <button type="button" className={`inv-tab ${tab === "buscar" ? "on" : ""}`} onClick={() => setTab("buscar")}>
                <Search size={20} /> Buscar
              </button>
              {view === "app" ? (
                <>
                  <button type="button" className={`inv-tab ${tab === "sede" ? "on" : ""}`} onClick={() => setTab("sede")}>
                    <Package size={20} /> Mi sede
                  </button>
                  <button type="button" className={`inv-tab ${tab === "trabajadores" ? "on" : ""}`} onClick={() => setTab("trabajadores")}>
                    <Users size={20} /> Trabajadores
                  </button>
                  <button type="button" className="inv-tab" onClick={handleLogout}>
                    <LogOut size={20} /> Salir
                  </button>
                </>
              ) : (
                <button type="button" className="inv-tab" onClick={() => setView("login")}>
                  <Lock size={20} /> Entrar
                </button>
              )}
            </div>

            <div className="inv-shell">
            {tab === "buscar" && (
              <BuscarView sedeCount={sedeCount} guest={view === "guest"} onLoginPrompt={() => setView("login")} />
            )}
            {tab === "sede" && view === "app" && sedeData && (
              <MiSedeView session={session} sedeData={sedeData} onRefresh={refreshSede} toast={toast} />
            )}
            {tab === "trabajadores" && view === "app" && sedeData && (
              <TrabajadoresView
                session={session}
                sedeData={sedeData}
                helpers={sedeData?.helpers || []}
                onRefresh={refreshSede}
                toast={toast}
              />
            )}
            </div>

            {toastMsg && (
              <div className="inv-toast"><Check size={16} color="var(--inv-fresh)" /> {toastMsg}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
