"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Pill, Droplet, Utensils, LifeBuoy, Home, Package, Truck, HeartHandshake, HardHat,
  Plus, X, MapPin, Clock, Check, AlertTriangle, ChevronLeft, ChevronRight, Loader2,
  Link2, ArrowRight, Radio, Zap, Code2, Phone, Globe, PackageCheck, Search,
} from "lucide-react";
import Link from "next/link";
import { asyncHandler } from "@/lib/asyncHandler";
import { siteConfig } from "@/lib/seo";
import { mapLinks } from "@/lib/mapLinks";
import { ESCOMBROS_EQUIPO, escombrosMetaChips, toggleEquipo, parseEquipos } from "@/lib/escombros";
import {
  TYPES, URGENCY, STATUS, KIND, CONN_STATUS, ROLES, OFFER_TYPES, timeAgoLabel,
} from "@/lib/constants";
import { filterPosts } from "@/lib/filters";
import {
  BOARD_PAGE_SIZE, paginateItems, findItemPage,
} from "@/lib/pagination";
import { isDraftReady, hasDraftLocation, getDraftValidationErrors, isValidPhoneContact, phoneTelHref, phoneWhatsAppHref, PHONE_PLACEHOLDER, buildWhatsAppContactMessage, buildWhatsAppConnectionMessage } from "@/lib/validation";
import { MAP_CENTER } from "@/lib/mapLayers";
import {
  connectionStats, countOrphanNeeds, getMatchCandidates, nextConnectionStatus,
  nextConnectionLabel, needHasCoverage, isActiveConnection,
  filterConnectionsBySearch,
  sortConnectionsByNeedUrgency,
} from "@/lib/connections";
import MapLinks from "@/components/MapLinks";
import {
  saveNeedsSnapshot, loadNeedsSnapshot, saveConnectionsSnapshot, loadConnectionsSnapshot,
  saveViewState, loadViewState, getCachedAt, getQueue, isOnline,
} from "@/lib/offlineStore";
import { flushQueue, createOfflineReport } from "@/lib/syncQueue";
import OfflineBanner from "@/components/OfflineBanner";

const TYPE_ICONS = {
  medicamentos: Pill, agua: Droplet, alimentos: Utensils, escombros: HardHat,
  rescate: LifeBuoy, refugio: Home, transporte: Truck, voluntario: HeartHandshake, otros: Package,
};

export default function RedDeAyuda() {
  const [needs, setNeeds] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTypes, setActiveTypes] = useState(() => new Set());
  const [kindFilter, setKindFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [tab, setTab] = useState("lista");
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view");
  const [draft, setDraft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [connSearch, setConnSearch] = useState("");
  const fetchGenRef = useRef(0);
  const detailRef = useRef(null);

  const mergeNeeds = useCallback((updater) => {
    setNeeds((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveNeedsSnapshot(next);
      setCachedAt(getCachedAt());
      return next;
    });
  }, []);

  const applyNeeds = useCallback((list) => {
    mergeNeeds(list);
  }, [mergeNeeds]);

  const revealInList = useCallback((item) => {
    const nextTypes = new Set(activeTypes);
    nextTypes.add(item.type);
    const filtered = filterPosts(needs, {
      activeTypes: nextTypes,
      kindFilter: "todos",
      statusFilter: "activas",
    });
    setKindFilter("todos");
    setStatusFilter("activas");
    setActiveTypes(nextTypes);
    setListPage(findItemPage(filtered, item.id));
    setSelectedId(item.id);
    setTab("lista");
  }, [needs, activeTypes]);

  const applyConnections = useCallback((list) => {
    setConnections(list);
    saveConnectionsSnapshot(list);
  }, []);

  const syncPending = useCallback(async (currentNeeds) => {
    if (!isOnline()) return;
    const result = await flushQueue(currentNeeds);
    setPendingCount(result.remaining);
    if (result.needs) applyNeeds(result.needs);
    if (result.synced > 0) await fetchAll();
  }, [applyNeeds]);

  const fetchAll = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    const hadCache = loadNeedsSnapshot();
    const hadConns = loadConnectionsSnapshot();
    try {
      setError(null);
      const [needsRes, connRes] = await Promise.all([
        fetch("/api/needs", { cache: "no-store" }),
        fetch("/api/connections", { cache: "no-store" }),
      ]);
      if (gen !== fetchGenRef.current) return;
      if (!needsRes.ok) throw new Error("fetch failed");
      const needsData = await needsRes.json();
      applyNeeds(needsData.needs || []);
      if (connRes.ok) {
        const connData = await connRes.json();
        applyConnections(connData.connections || []);
      }
      setOffline(false);
      await syncPending(needsData.needs || []);
    } catch {
      if (gen !== fetchGenRef.current) return;
      if (hadCache?.length) {
        setNeeds(hadCache);
        setCachedAt(getCachedAt());
        if (hadConns) setConnections(hadConns);
        setOffline(true);
        setError(null);
      } else {
        setError("No se pudieron cargar los datos. Revisa la conexión o la base de datos.");
        setOffline(!isOnline());
      }
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, [applyNeeds, applyConnections, syncPending]);

  useEffect(() => {
    const view = loadViewState();
    if (view) {
      setSelectedId(view.selectedId);
      if (view.tab) setTab(view.tab);
      if (view.listPage) setListPage(view.listPage);
    }
    const cached = loadNeedsSnapshot();
    const cachedConns = loadConnectionsSnapshot();
    if (cached?.length) { setNeeds(cached); setCachedAt(getCachedAt()); }
    if (cachedConns) setConnections(cachedConns);
    setPendingCount(getQueue().length);
    setOffline(!isOnline());
  }, []);

  useEffect(() => {
    saveViewState({ activeTypes, statusFilter, selectedId, kindFilter, tab, listPage });
  }, [activeTypes, statusFilter, selectedId, kindFilter, tab, listPage]);

  useEffect(() => {
    setListPage(1);
  }, [activeTypes, kindFilter, statusFilter]);

  useEffect(() => {
    if (selectedId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const onOnline = () => { setOffline(false); fetchAll(); };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [fetchAll]);

  const toggleType = (k) => {
    const next = new Set(activeTypes);
    next.has(k) ? next.delete(k) : next.add(k);
    setActiveTypes(next);
  };

  const needsList = useMemo(() => needs.filter((n) => n.kind === "need"), [needs]);
  const offersList = useMemo(() => needs.filter((n) => n.kind === "offer"), [needs]);
  const postsById = useMemo(() => new Map(needs.map((n) => [n.id, n])), [needs]);

  const visible = useMemo(() =>
    filterPosts(needs, { activeTypes, kindFilter, statusFilter }),
  [needs, activeTypes, statusFilter, kindFilter]);

  const boardPage = useMemo(
    () => paginateItems(visible, listPage, BOARD_PAGE_SIZE),
    [visible, listPage]
  );

  const goToPage = useCallback((nextPage) => {
    const nextBoard = paginateItems(visible, nextPage, BOARD_PAGE_SIZE);
    setListPage(nextBoard.page);
    setSelectedId((id) => (
      id && nextBoard.items.some((n) => n.id === id) ? id : null
    ));
  }, [visible]);

  const stats = useMemo(() => connectionStats(needs, connections), [needs, connections]);
  const orphanNeeds = useMemo(() => countOrphanNeeds(needs, connections), [needs, connections]);

  const filteredConnections = useMemo(() => {
    const searched = filterConnectionsBySearch(connections, postsById, connSearch);
    return sortConnectionsByNeedUrgency(searched, postsById);
  }, [connections, postsById, connSearch]);

  const selected = needs.find((n) => n.id === selectedId) || null;

  const startReport = () => {
    setSelectedId(null);
    setFormError(null);
    setDraft({
      role: "solicitante",
      kind: "need",
      type: "medicamentos",
      urgency: "alta",
      place: "",
      detail: "",
      contact: "",
      lat: MAP_CENTER.lat,
      lng: MAP_CENTER.lng,
      locationApprox: true,
    });
    setMode("report");
    setTab("lista");
  };

  const startOfferForNeed = (need) => {
    const offerType = OFFER_TYPES.includes(need.type) ? need.type : "otros";
    setSelectedId(need.id);
    setFormError(null);
    setDraft({
      role: "oferente",
      kind: "offer",
      type: offerType,
      urgency: "alta",
      place: "",
      detail: "",
      contact: "",
      lat: MAP_CENTER.lat,
      lng: MAP_CENTER.lng,
      locationApprox: true,
      targetNeedId: need.id,
      targetNeedLabel: `${need.place} · ${need.zone}`,
    });
    setMode("report");
    setTab("lista");
  };

  const publish = async () => {
    const validationErrors = getDraftValidationErrors(draft);
    if (validationErrors.length) {
      setFormError(validationErrors.join(" "));
      return;
    }
    setFormError(null);
    setSubmitting(true);
    const finishPublish = (need) => {
      fetchGenRef.current++;
      mergeNeeds((prev) => [need, ...prev.filter((n) => n.id !== need.id)]);
      revealInList(need);
      setMode("view");
      setDraft(null);
    };
    try {
      if (!isOnline()) {
        const { need, needs: next, pendingCount: pending } = createOfflineReport(draft, needs);
        fetchGenRef.current++;
        applyNeeds(next);
        setPendingCount(pending);
        setOffline(true);
        revealInList(need);
        setMode("view");
        setDraft(null);
        return;
      }

      const res = await fetch("/api/needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind || "need",
          type: draft.type,
          urgency: draft.urgency,
          place: draft.place,
          detail: draft.detail,
          contact: draft.contact,
          lat: draft.lat,
          lng: draft.lng,
          ...(draft.type === "escombros" && draft.meta ? { meta: draft.meta } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.errors?.join(", ")
          || data.error
          || `No se pudo publicar (error ${res.status})`;
        throw new Error(msg);
      }
      const { need } = await res.json();
      const targetNeedId = draft.targetNeedId;
      finishPublish(need);
      if (targetNeedId && need.kind === "offer") {
        const targetNeed = needs.find((n) => n.id === targetNeedId);
        if (targetNeed) await handleConnect(targetNeed, need);
      }
      fetchAll();
    } catch (err) {
      if (!isOnline()) {
        try {
          const { need, needs: next, pendingCount: pending } = createOfflineReport(draft, needs);
          fetchGenRef.current++;
          applyNeeds(next);
          setPendingCount(pending);
          setOffline(true);
          revealInList(need);
          setMode("view");
          setDraft(null);
          setFormError(null);
        } catch (offlineErr) {
          setFormError(offlineErr.message || "No se pudo guardar el reporte offline.");
        }
      } else {
        const msg = err?.message || "No se pudo publicar. Revisa la conexión o la base de datos.";
        setFormError(msg);
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnect = async (needItem, offerItem, coordinatorRemote = false) => {
    const needId = needItem.kind === "need" ? needItem.id : offerItem.id;
    const offerId = needItem.kind === "offer" ? needItem.id : offerItem.id;
    try {
      if (!isOnline()) {
        setError("Conectar requiere conexión. Los reportes offline se sincronizan al volver online.");
        return;
      }
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needId, offerId, coordinatorRemote }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.errors?.join(", ") || "No se pudo conectar");
      }
      const { connection } = await res.json();
      applyConnections([connection, ...connections]);
      setTab("conexiones");
    } catch (err) {
      setError(err.message || "No se pudo crear la conexión");
    }
  };

  const advanceConnection = async (connId, newStatus) => {
    const prev = connections;
    setConnections((arr) => arr.map((c) => (c.id === connId ? { ...c, status: newStatus } : c)));
    try {
      if (!isOnline()) throw new Error("offline");
      const res = await fetch(`/api/connections/${connId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const { connection } = await res.json();
      applyConnections(connections.map((c) => (c.id === connId ? connection : c)));
      if (newStatus === "entregado") {
        const conn = connections.find((c) => c.id === connId);
        if (conn) {
          await Promise.all([
            fetch(`/api/needs/${conn.needId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cubierto" }),
            }),
            fetch(`/api/needs/${conn.offerId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cubierto" }),
            }),
          ]);
          await fetchAll();
        }
      }
    } catch {
      setConnections(prev);
      setError("No se pudo actualizar la conexión");
    }
  };

  return (
    <div className="rda-root">
      <style>{CSS}</style>

      <header className="rda-header">
        <div className="rda-head-left">
          <div className="rda-mark"><Zap size={16} strokeWidth={2.6} /></div>
          <div>
            <h1 className="rda-title">{siteConfig.title}</h1>
            <p className="rda-sub">Coordinación logística para respuesta humanitaria</p>
          </div>
        </div>
        <div className="rda-head-stats">
          <Stat n={stats.openNeeds} label="necesidades" accent="#E03B4B" />
          <Stat n={stats.openOffers} label="ofertas" accent="#1F9E5E" />
          <Stat n={stats.activeConns} label="conexiones" accent="#2563EB" />
          <Stat n={stats.delivered} label="entregados" accent="#6B7280" />
        </div>
        <Link href="/" className="rda-dev-link" title="Necesidades por centro">
          <PackageCheck size={14} /> Inicio
        </Link>
        <Link href="/inventario" className="rda-dev-link" title="Inventario por sede de emergencia">
          <PackageCheck size={14} /> Inventario
        </Link>
        <Link href="/recursos" className="rda-dev-link" title="Desaparecidos y otros recursos">
          <Link2 size={14} strokeWidth={2.4} /> Recursos
        </Link>
        <Link href="/docs/api" className="rda-dev-link" title="Feed público para desarrolladores">
          <Code2 size={14} strokeWidth={2.4} /> Feed
        </Link>
        <button
          type="button"
          className="rda-cta"
          onClick={mode === "report" ? asyncHandler(publish) : startReport}
          disabled={mode === "report" && submitting}
        >
          <Plus size={15} strokeWidth={2.6} />
          {mode === "report"
            ? (submitting ? "Publicando…" : "Enviar reporte")
            : "Publicar"}
        </button>
      </header>

      {offline && <OfflineBanner cachedAt={cachedAt} pendingCount={pendingCount} />}

      {error && (
        <div className="rda-banner-err">
          <AlertTriangle size={14} /> {error}
          <button type="button" onClick={asyncHandler(() => { setError(null); return fetchAll(); })}>Reintentar</button>
        </div>
      )}

      <div className="rda-tabs">
        <button type="button" className={tab === "lista" ? "on" : ""} onClick={() => setTab("lista")}>
          <Package size={13} /> Reportes
        </button>
        <button type="button" className={tab === "conexiones" ? "on" : ""} onClick={() => setTab("conexiones")}>
          <Link2 size={13} /> Conexiones
          {stats.activeConns > 0 && <span className="rda-badge-num">{stats.activeConns}</span>}
        </button>
        {orphanNeeds > 0 && (
          <span className="rda-orphan-alert">
            <Radio size={12} /> {orphanNeeds} sin cobertura
          </span>
        )}
      </div>

      {tab === "lista" ? (
        <>
          <div className="rda-filters">
            <div className="rda-seg">
              {[["todos", "Todo"], ["need", "Necesidades"], ["offer", "Ofertas"]].map(([k, l]) => (
                <button key={k} type="button" className={kindFilter === k ? "on" : ""} onClick={() => setKindFilter(k)}>{l}</button>
              ))}
            </div>
            <div className="rda-chips">
              {Object.entries(TYPES).map(([k, t]) => {
                const on = activeTypes.has(k);
                const Icon = TYPE_ICONS[k];
                return (
                  <button key={k} type="button" className={`rda-chip ${on ? "on" : ""}`} onClick={() => toggleType(k)}
                    style={on ? { borderColor: t.color, color: t.color, background: t.color + "12" } : undefined}>
                    <Icon size={12} strokeWidth={2.4} /> {t.label}
                  </button>
                );
              })}
            </div>
            <div className="rda-seg">
              {[["activas", "Activas"], ["cubierto", "Cubiertas"], ["todas", "Todas"]].map(([k, l]) => (
                <button key={k} type="button" className={statusFilter === k ? "on" : ""} onClick={() => setStatusFilter(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="rda-body rda-body-list">
            <div className="rda-list-col">
              {mode === "report" ? (
                <ReportForm draft={draft} setDraft={setDraft} onPublish={publish} submitting={submitting}
                  formError={formError}
                  onClearError={() => setFormError(null)}
                  onCancel={() => { setMode("view"); setDraft(null); setFormError(null); }} />
              ) : (
                <>
                  {selected && (
                    <DetailPanel
                      ref={detailRef}
                      item={selected}
                      needs={needsList}
                      offers={offersList}
                      connections={connections}
                      onClose={() => setSelectedId(null)}
                      onConnect={asyncHandler(handleConnect)}
                      onOfferHelp={startOfferForNeed}
                      onAdvanceConn={asyncHandler(advanceConnection)}
                    />
                  )}
                  <div className={`rda-list ${selected ? "has-detail" : ""}`}>
                    {loading && <div className="rda-empty">Cargando…</div>}
                    {!loading && boardPage.total === 0 && (
                      <div className="rda-empty">
                        {activeTypes.size === 0 || !kindFilter || !statusFilter
                          ? "Activa filtros arriba (tipo, categoría y estado) para ver reportes."
                          : "Sin resultados con estos filtros."}
                      </div>
                    )}
                    {!loading && boardPage.total > 0 && (
                      <BoardPagination boardPage={boardPage} onPageChange={goToPage} />
                    )}
                    {boardPage.items.map((n) => (
                      <ItemCard key={n.id} item={n} selected={n.id === selectedId}
                        connections={connections}
                        onOfferHelp={startOfferForNeed}
                        onClick={() => setSelectedId(n.id === selectedId ? null : n.id)} />
                    ))}
                    {!loading && boardPage.total > 0 && (
                      <BoardPagination boardPage={boardPage} onPageChange={goToPage} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rda-conn-page">
          <div className="rda-conn-header">
            <h2 className="rda-conn-title">Conexiones activas</h2>
            <p className="rda-conn-sub">Cada conexión enlaza una necesidad con una oferta. Usa los contactos para coordinar y avanza el estado cuando haya novedades.</p>
            {connections.length > 0 && (
              <label className="rda-conn-search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="rda-conn-search-input"
                  placeholder="Buscar por lugar, contacto, teléfono o notas…"
                  value={connSearch}
                  onChange={(e) => setConnSearch(e.target.value)}
                  aria-label="Buscar conexiones"
                />
                {connSearch && (
                  <button
                    type="button"
                    className="rda-conn-search-clear"
                    onClick={() => setConnSearch("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            )}
          </div>
          {orphanNeeds > 0 && (
            <div className="rda-orphan-banner">
              <Radio size={14} />
              <span><b>{orphanNeeds} necesidades abiertas</b> sin oferta conectada. Ve a reportes y conéctalas.</span>
              <button type="button" className="rda-btn rda-btn-sm rda-btn-outline" onClick={() => setTab("lista")}>Ir a reportes</button>
            </div>
          )}
          <div className="rda-conn-grid">
            {connections.length === 0 && (
              <div className="rda-empty" style={{ gridColumn: "1 / -1" }}>
                No hay conexiones aún. Selecciona una necesidad y conéctala a una oferta compatible.
              </div>
            )}
            {connections.length > 0 && filteredConnections.length === 0 && (
              <div className="rda-empty" style={{ gridColumn: "1 / -1" }}>
                Sin resultados para «{connSearch}». Prueba con otro lugar, contacto o nota.
              </div>
            )}
            {filteredConnections.map((c) => (
              <ConnectionCard key={c.id} conn={c} needs={needsList} offers={offersList}
                onAdvance={asyncHandler(advanceConnection)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardPagination({ boardPage, onPageChange }) {
  if (boardPage.total <= boardPage.pageSize) return null;
  return (
    <div className="rda-pagination" role="navigation" aria-label="Paginación del listado">
      <button
        type="button"
        className="rda-page-btn"
        disabled={boardPage.page <= 1}
        onClick={() => onPageChange(boardPage.page - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={14} /> Anterior
      </button>
      <span className="rda-page-info">
        Página <b>{boardPage.page}</b> de <b>{boardPage.pages}</b>
        <span className="rda-page-count">
          · {boardPage.start}–{boardPage.end} de {boardPage.total}
        </span>
      </span>
      <button
        type="button"
        className="rda-page-btn"
        disabled={boardPage.page >= boardPage.pages}
        onClick={() => onPageChange(boardPage.page + 1)}
        aria-label="Página siguiente"
      >
        Siguiente <ChevronRight size={14} />
      </button>
    </div>
  );
}

function Stat({ n, label, accent }) {
  return (
    <div className="rda-stat">
      <b style={{ color: accent }}>{n}</b>
      <span>{label}</span>
    </div>
  );
}

function Badge({ children, color, bg }) {
  return <span className="rda-badge" style={{ color, background: bg || color + "18" }}>{children}</span>;
}

function KindPill({ kind }) {
  return (
    <span className={`rda-kind-pill ${kind}`}>
      {kind === "need" ? "necesita" : "ofrece"}
    </span>
  );
}

function ConnStatusBadge({ status }) {
  const s = CONN_STATUS[status];
  const Icon = status === "en_transito" ? Truck : status === "entregado" ? PackageCheck : Link2;
  return (
    <span className="rda-conn-status-pill" style={{ color: s.color, background: s.bg }}>
      <Icon size={13} strokeWidth={2.2} aria-hidden /> {s.label}
    </span>
  );
}

function connFlowName(item) {
  const place = item.place?.trim() || "—";
  const detail = item.detail?.trim();
  if (!detail) return place;
  const suffix = detail.length > 48 ? `${detail.slice(0, 48)}…` : detail;
  return `${place} — ${suffix}`;
}

function ConnectionCard({ conn, needs, offers, onAdvance }) {
  const need = needs.find((n) => n.id === conn.needId);
  const offer = offers.find((o) => o.id === conn.offerId);
  if (!need || !offer) return null;
  const statusStyle = CONN_STATUS[conn.status] || CONN_STATUS.coordinando;
  const next = nextConnectionStatus(conn.status);
  const nextLabel = nextConnectionLabel(conn.status);
  const directions = mapLinks(need.lat, need.lng, need.place);
  const whatsappMessage = buildWhatsAppConnectionMessage({ need, offer });

  return (
    <div className="rda-conn" style={{ borderTopColor: statusStyle.color }}>
      <div className="rda-conn-status-row">
        <ConnStatusBadge status={conn.status} />
        <span className="rda-conn-ts"><Clock size={12} aria-hidden /> {timeAgoLabel(conn.mins)}</span>
      </div>

      <div className="rda-conn-flow">
        <div className="rda-conn-flow-node need">
          <div className="rda-conn-flow-label">Necesita</div>
          <div className="rda-conn-flow-name">{connFlowName(need)}</div>
        </div>
        <div className="rda-conn-flow-arrow" aria-hidden>
          <ArrowRight size={14} color="#9CA3AF" />
        </div>
        <div className="rda-conn-flow-node offer">
          <div className="rda-conn-flow-label">Ofrece</div>
          <div className="rda-conn-flow-name">{connFlowName(offer)}</div>
        </div>
      </div>

      {conn.notes && <p className="rda-conn-note">{conn.notes}</p>}

      <div className="rda-conn-contacts">
        <ContactBlock label="Quien necesita" value={need.contact} whatsappMessage={whatsappMessage} />
        <ContactBlock label="Quien ofrece" value={offer.contact} whatsappMessage={whatsappMessage} />
      </div>

      <div className="rda-conn-divider" />

      <div className="rda-conn-footer">
        {next && conn.status !== "entregado" && conn.status !== "cancelado" && (
          <button type="button" className="rda-conn-btn-primary" onClick={asyncHandler(() => onAdvance(conn.id, next))}>
            <Check size={13} strokeWidth={2.4} aria-hidden /> {nextLabel}
          </button>
        )}
        {conn.coordinatorRemote && (
          <span className="rda-conn-remote">
            <Globe size={12} aria-hidden /> Coordinador remoto
          </span>
        )}
        <a className="rda-conn-btn-ghost" href={directions.google} target="_blank" rel="noopener noreferrer">
          <MapPin size={13} aria-hidden /> Cómo llegar
        </a>
      </div>
    </div>
  );
}

function ContactBlock({ label, value, whatsappMessage }) {
  const text = value?.trim() || "—";
  const tel = phoneTelHref(text);
  const wa = phoneWhatsAppHref(text, whatsappMessage);
  const hasPhone = Boolean(tel || wa);

  return (
    <div className="rda-conn-contact">
      <div className="rda-conn-contact-role">{label}</div>
      <div className="rda-conn-contact-value">{text}</div>
      {hasPhone && (
        <div className="rda-contact-actions">
          {tel && (
            <a className="rda-contact-btn" href={tel}>
              <Phone size={13} aria-hidden /> Llamar
            </a>
          )}
          {wa && (
            <a className="rda-contact-btn rda-contact-btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, selected, onClick, connections, onOfferHelp }) {
  const t = TYPES[item.type]; const Icon = TYPE_ICONS[item.type];
  const u = URGENCY[item.urgency];
  const covered = needHasCoverage(item.id, connections) ||
    connections.some((c) => c.offerId === item.id && isActiveConnection(c));
  const canOffer = item.kind === "need" && item.status !== "cubierto" && !covered;

  return (
    <article
      className={`rda-card ${selected ? "sel" : ""} ${covered ? "covered" : ""}`}
      style={selected ? { borderColor: t.color, boxShadow: `0 0 0 2px ${t.color}33` } : undefined}
    >
      <button type="button" className="rda-card-hit" onClick={onClick}>
        <span className="rda-card-ic" style={{ background: t.color, opacity: covered ? 0.7 : 1 }}>
          <Icon size={15} strokeWidth={2.5} color="#fff" />
        </span>
        <span className="rda-card-main">
          <span className="rda-card-top">
            <KindPill kind={item.kind} />
            {selected && <span className="rda-card-viewing">Viendo ahora</span>}
            {covered && <span className="rda-covered-label"><Link2 size={10} /> con cobertura</span>}
          </span>
          <b className="rda-card-place">{item.place}</b>
          <span className="rda-card-detail">{item.detail}</span>
          <span className="rda-card-meta">
            {item.kind === "need" && <Badge color={u.color}>{u.label}</Badge>}
            {item.type === "escombros" && <MetaChips meta={item.meta} />}
            <span className="rda-zone"><MapPin size={10} /> {item.zone}</span>
            <span className="rda-time"><Clock size={10} /> {timeAgoLabel(item.mins)}</span>
          </span>
        </span>
      </button>
      {canOffer && (
        <button
          type="button"
          className="rda-card-offer"
          onClick={() => onOfferHelp(item)}
        >
          <HeartHandshake size={13} strokeWidth={2.4} /> Ofrecer ayuda
        </button>
      )}
    </article>
  );
}

const DetailPanel = React.forwardRef(function DetailPanel(
  { item, needs, offers, connections, onClose, onConnect, onOfferHelp, onAdvanceConn },
  ref
) {
  const t = TYPES[item.type]; const Icon = TYPE_ICONS[item.type];
  const u = item.kind === "need" ? URGENCY[item.urgency] : null;
  const relConns = connections.filter((c) => c.needId === item.id || c.offerId === item.id);
  const candidates = getMatchCandidates(item, needs, offers, connections);
  const covered = item.kind === "need" && needHasCoverage(item.id, connections);
  const canOffer = item.kind === "need" && item.status !== "cubierto" && !covered;

  return (
    <div className="rda-detail-wrap" ref={ref}>
      <div className="rda-detail-banner">
        <span className="rda-detail-banner-label">
          <span className="rda-detail-dot" style={{ background: t.color }} />
          Detalle · {KIND[item.kind].label} · {t.label}
        </span>
        <button type="button" className="rda-detail-close" onClick={onClose}>
          <X size={14} /> Cerrar
        </button>
      </div>
      <div className="rda-detail" style={{ borderLeftColor: t.color }}>
        <div className="rda-detail-head">
          <span className="rda-card-ic" style={{ background: t.color }}>
            <Icon size={15} strokeWidth={2.5} color="#fff" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <KindPill kind={item.kind} />
              {u && <Badge color={u.color}>{u.label}</Badge>}
              <span className="rda-zone"><MapPin size={10} /> {item.zone}</span>
            </div>
            <b className="rda-detail-title">{item.place}</b>
          </div>
        </div>
        <p className="rda-detail-body">{item.detail}</p>
        {item.type === "escombros" && item.meta && (
          <div className="rda-detail-meta-block"><MetaChips meta={item.meta} /></div>
        )}
        <div className="rda-detail-contact-block">
          <ContactBlock
            label="Contacto para coordinar"
            value={item.contact}
            whatsappMessage={buildWhatsAppContactMessage({
              place: item.place,
              detail: item.detail,
              label: item.kind === "need" ? "la necesidad" : "la oferta",
            })}
          />
        </div>
        <MapLinks lat={item.lat} lng={item.lng} label={item.place} />

        {canOffer && (
          <button type="button" className="rda-btn rda-btn-offer" onClick={() => onOfferHelp(item)}>
            <HeartHandshake size={15} strokeWidth={2.4} /> Ofrecer ayuda para esto
          </button>
        )}

        {relConns.length > 0 && (
          <div className="rda-detail-section">
            <h4 className="rda-section-title"><Link2 size={12} /> Conexiones</h4>
            {relConns.map((c) => (
              <ConnectionCard key={c.id} conn={c} needs={needs} offers={offers}
                onAdvance={onAdvanceConn} />
            ))}
          </div>
        )}

        {candidates.length > 0 && (
          <div className="rda-detail-section">
            <h4 className="rda-section-title">
              {item.kind === "need" ? "Ofertas que pueden cubrir esto" : "Necesidades que puedo cubrir"}
            </h4>
            {candidates.slice(0, 3).map((m) => (
              <div key={m.id} className="rda-match-row">
                <span className="rda-match-label">
                  <span className="rda-conn-pin" style={{ background: TYPES[m.type].color }}>
                    {(() => { const MI = TYPE_ICONS[m.type]; return <MI size={10} color="#fff" strokeWidth={2.5} />; })()}
                  </span>
                  {m.place}
                </span>
                <button type="button" className="rda-btn rda-btn-sm rda-btn-blue" onClick={asyncHandler(() => onConnect(item, m))}>
                  Conectar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function MetaChips({ meta }) {
  const chips = escombrosMetaChips(meta);
  if (!chips.length) return null;
  return (
    <span className="rda-meta-chips">
      {chips.map((c) => (
        <span key={c.id} className="rda-meta-chip">{c.label}</span>
      ))}
    </span>
  );
}

function EscombrosFields({ draft, set }) {
  const meta = draft.meta || {};
  const setMeta = (k, v) => set("meta", { ...meta, [k]: v, equipo: undefined });
  const equipos = parseEquipos(meta);
  const isOffer = draft.kind === "offer";

  return (
    <div className="rda-escombros-fields">
      <label className="rda-label">
        Tipo de equipo o recurso <span className="rda-req">*</span>
        <span className="rda-opt"> (puedes elegir varios)</span>
      </label>
      <div className="rda-equipo-grid">
        {ESCOMBROS_EQUIPO.map((eq) => (
          <button key={eq} type="button" className={`rda-equipo-btn ${equipos.includes(eq) ? "on" : ""}`}
            onClick={() => setMeta("equipos", toggleEquipo(equipos, eq))}>{eq}</button>
        ))}
      </div>
      {equipos.length > 0 && (
        <p className="rda-equipo-count">{equipos.length} seleccionado{equipos.length !== 1 ? "s" : ""}</p>
      )}
      <div className="rda-meta-row">
        <div className="rda-meta-toggle">
          <span>{isOffer ? "¿Incluye operador / personas?" : "¿Quién va a operar?"}</span>
          <div className="rda-toggle-group">
            {[["true", "Sí incluye"], ["false", "Necesita operador"]].map(([v, l]) => (
              <button key={v} type="button" className={String(meta.operador_incluido) === v ? "on" : ""}
                onClick={() => setMeta("operador_incluido", v === "true")}>{l}</button>
            ))}
          </div>
        </div>
        <div className="rda-meta-toggle">
          <span>¿Necesita transporte para llegar?</span>
          <div className="rda-toggle-group">
            {[["true", "Sí"], ["false", "Se mueve solo"]].map(([v, l]) => (
              <button key={v} type="button" className={String(meta.necesita_transporte) === v ? "on" : ""}
                onClick={() => setMeta("necesita_transporte", v === "true")}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <label className="rda-label">
        {isOffer ? "¿Cuántas personas van?" : "¿Cuántas personas se necesitan?"}
        <span className="rda-opt"> (opcional)</span>
      </label>
      <input className="rda-input" type="number" min="1" placeholder="Ej.: 8"
        value={meta.personas ?? ""}
        onChange={(e) => setMeta("personas", e.target.value ? parseInt(e.target.value, 10) : undefined)} />
    </div>
  );
}

function ReportForm({ draft, setDraft, onPublish, onCancel, submitting, formError, onClearError }) {
  const set = (k, v) => {
    onClearError?.();
    setDraft((d) => ({ ...d, [k]: v }));
  };
  const isEscombros = draft.type === "escombros";
  const ready = isDraftReady(draft);
  const blocking = getDraftValidationErrors(draft);
  const formErrRef = useRef(null);

  useEffect(() => {
    if (formError && formErrRef.current) {
      formErrRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [formError]);

  const setRole = (role) => {
    onClearError?.();
    const kind = ROLES[role]?.kind || "need";
    setDraft((d) => ({ ...d, role, kind }));
  };

  const handlePublishClick = asyncHandler(onPublish);

  return (
    <div className="rda-form">
      <div className="rda-form-head">
        <button type="button" className="rda-back" onClick={onCancel}><ChevronLeft size={15} /> Volver</button>
        <h2>{draft.targetNeedId ? "Ofrecer ayuda" : "Nuevo reporte"}</h2>
        {draft.targetNeedLabel && (
          <p className="rda-form-context">Respondiendo a: <b>{draft.targetNeedLabel}</b></p>
        )}
      </div>

      <label className="rda-label">Soy…</label>
      <div className="rda-role-grid">
        {Object.entries(ROLES).filter(([k]) => k !== "coordinador").map(([k, r]) => (
          <button key={k} type="button" className={`rda-role-btn ${draft.role === k ? "on" : ""}`}
            style={draft.role === k ? { borderColor: r.color, background: r.color + "10", color: r.color } : undefined}
            onClick={() => setRole(k)}>
            <b>{r.label}</b>
            <span>{r.desc}</span>
          </button>
        ))}
      </div>

          <label className="rda-label">Tipo</label>
          <div className="rda-type-grid">
            {(draft.kind === "offer" ? OFFER_TYPES : Object.keys(TYPES).filter((k) => k !== "transporte" && k !== "voluntario")).map((k) => {
              const t = TYPES[k]; const on = draft.type === k; const Icon = TYPE_ICONS[k];
              return (
                <button key={k} type="button" className={`rda-type ${on ? "on" : ""}`}
                  onClick={() => { set("type", k); if (k !== "escombros") set("meta", {}); else set("meta", { equipos: [] }); }}
                  style={on ? { borderColor: t.color, background: t.color + "12", color: t.color } : undefined}>
                  <Icon size={13} strokeWidth={2.4} /> {t.label}
                </button>
              );
            })}
          </div>

          {isEscombros && <EscombrosFields draft={draft} set={set} />}

          {draft.kind === "need" && (
            <>
              <label className="rda-label">Urgencia</label>
              <div className="rda-seg rda-seg-full">
                {Object.entries(URGENCY).map(([k, u]) => (
                  <button key={k} type="button" className={draft.urgency === k ? "on" : ""} onClick={() => set("urgency", k)}
                    style={draft.urgency === k ? { color: u.color, background: u.color + "18" } : undefined}>
                    {u.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="rda-label">Lugar</label>
          <input className="rda-input"
            placeholder={isEscombros ? "Ej.: Av. Soublette frente al edificio azul" : "Ej.: Hospital Vargas, pabellón B"}
            value={draft.place || ""} onChange={(e) => set("place", e.target.value)} />

          <label className="rda-label">Descripción</label>
          <textarea className="rda-input" rows={3}
            placeholder={isEscombros
              ? (draft.kind === "offer"
                ? "Ej.: Retroexcavadora con operador, puede salir en 2 h…"
                : "Ej.: Edificio colapsado, señales de vida, cuántas personas…")
              : (draft.kind === "need" ? "Qué se necesita y cuánto" : "Qué tienes disponible y desde dónde")}
            value={draft.detail || ""} onChange={(e) => set("detail", e.target.value)} />

          <label className="rda-label">Teléfono / WhatsApp <span className="rda-opt"> (opcional)</span></label>
          <input className="rda-input" type="tel" inputMode="tel" autoComplete="tel"
            placeholder={PHONE_PLACEHOLDER}
            value={draft.contact || ""} onChange={(e) => set("contact", e.target.value)} />

          <div className="rda-loc-row">
            <label className="rda-label" style={{ margin: 0 }}>Ubicación</label>
            <div className="rda-loc">
              <MapPin size={13} />
              {String(draft.place ?? "").trim() || "Indica el lugar arriba"}
            </div>
          </div>

          {(formError || (!ready && blocking.length > 0)) && (
            <div className="rda-form-err" ref={formErrRef} role="alert">
              <AlertTriangle size={14} aria-hidden />
              <div>
                {formError ? (
                  <p className="rda-form-err-title">{formError}</p>
                ) : (
                  <>
                    <p className="rda-form-err-title">Completa lo siguiente para publicar:</p>
                    <ul className="rda-form-err-list">
                      {blocking.map((msg) => <li key={msg}>{msg}</li>)}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="rda-form-actions">
            <button type="button" className="rda-btn rda-btn-ghost" onClick={onCancel}>Cancelar</button>
            <button
              type="button"
              className={`rda-btn rda-btn-primary ${!ready && !submitting ? "rda-btn-attention" : ""}`}
              disabled={submitting}
              onClick={handlePublishClick}
            >
              {submitting ? "Publicando…" : draft.targetNeedId ? "Publicar oferta y conectar" : "Publicar"}
            </button>
          </div>
          {ready && !formError && (
            <p className="rda-hint rda-hint-ok">Listo para publicar.</p>
          )}
    </div>
  );
}

const CSS = `
.rda-root{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#1A2233;background:#F4F5F7;min-height:100%;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
.rda-root *{box-sizing:border-box}
.rda-header{display:flex;align-items:center;gap:16px;padding:12px 20px;background:#fff;border-bottom:1px solid #E6E8EC;flex-wrap:wrap}
.rda-head-left{display:flex;align-items:center;gap:11px;flex:1;min-width:0}
.rda-mark{width:32px;height:32px;border-radius:8px;background:#1A2233;color:#fff;display:grid;place-items:center}
.rda-title{font-size:16px;font-weight:750;margin:0;letter-spacing:-.01em}
.rda-sub{font-size:11px;color:#6B7280;margin:1px 0 0}
.rda-head-stats{display:flex;gap:18px;align-items:center}
.rda-stat{display:flex;flex-direction:column;align-items:center;line-height:1.1}
.rda-stat b{font-size:20px;font-weight:800}
.rda-stat span{font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em}
.rda-dev-link{display:inline-flex;align-items:center;gap:5px;color:#2563EB;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:650;text-decoration:none;white-space:nowrap}
.rda-dev-link:hover{background:#DBEAFE;color:#1D4ED8}
.rda-cta{display:inline-flex;align-items:center;gap:6px;background:#1A2233;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:650;cursor:pointer}
.rda-cta:hover{background:#2A3445}
.rda-tabs{display:flex;align-items:center;gap:2px;padding:0 20px;background:#fff;border-bottom:1px solid #E6E8EC}
.rda-tabs button{display:inline-flex;align-items:center;gap:5px;border:none;background:none;padding:11px 14px;font-size:13px;font-weight:600;color:#6B7280;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.rda-tabs button.on{color:#1A2233;border-bottom-color:#1A2233}
.rda-badge-num{display:inline-flex;align-items:center;justify-content:center;background:#2563EB;color:#fff;font-size:10px;font-weight:700;width:17px;height:17px;border-radius:50%}
.rda-orphan-alert{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:650;color:#DC2626;margin-left:auto;padding:4px 10px;background:#FEF2F2;border-radius:20px}
.rda-filters{display:flex;align-items:center;gap:10px;padding:9px 20px;background:#fff;border-bottom:1px solid #E6E8EC;flex-wrap:wrap}
.rda-seg{display:inline-flex;background:#EEF0F3;border-radius:7px;padding:2px}
.rda-seg-full{width:100%;margin-bottom:4px}
.rda-seg button{border:none;background:none;padding:5px 11px;font-size:12px;font-weight:650;color:#6B7280;border-radius:5px;cursor:pointer}
.rda-seg button.on{background:#fff;color:#1A2233;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.rda-chips{display:flex;gap:6px;flex-wrap:wrap}
.rda-chip{display:inline-flex;align-items:center;gap:4px;border:1.5px solid #DDE1E6;background:#fff;color:#6B7280;border-radius:20px;padding:4px 10px;font-size:11.5px;font-weight:600;cursor:pointer}
.rda-body-list{flex-direction:column;padding:14px 20px}
.rda-list-col{flex:1;max-width:720px;margin:0 auto;width:100%;display:flex;flex-direction:column;min-height:0}
.rda-list-col .rda-list{max-height:none;flex:1}
.rda-body{display:flex;flex:1;min-height:0}
.rda-map-col{flex:1.5;display:flex;flex-direction:column;padding:14px 8px 14px 20px;min-width:0}
.rda-map{position:relative;width:100%;aspect-ratio:9/5;border-radius:12px;overflow:hidden;border:1px solid #D8DCE2;min-height:320px}
.rda-map-loading{display:grid;place-items:center;height:100%;min-height:320px;color:#6B7280;gap:10px;font-size:13px;font-weight:600}
.rda-spin{animation:rda-spin 1s linear infinite}
@keyframes rda-spin{to{transform:rotate(360deg)}}
.rda-map-banner{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:#1A2233dd;color:#fff;font-size:12px;font-weight:650;padding:7px 14px;border-radius:20px;white-space:nowrap;z-index:10;pointer-events:none}
.rda-note{font-size:11px;color:#8A93A0;display:flex;align-items:center;gap:4px;margin:8px 2px 0}
.rda-pagination{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:#fff;border-top:1px solid #E9EBEF;flex-wrap:wrap}
.rda-page-btn{display:inline-flex;align-items:center;gap:4px;border:1px solid #CBD5E1;background:#fff;color:#1A2233;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer}
.rda-page-btn:hover:not(:disabled){background:#F8FAFC}
.rda-page-btn:disabled{opacity:.45;cursor:not-allowed}
.rda-page-info{font-size:12px;color:#5B6675;text-align:center;flex:1;min-width:0}
.rda-page-info b{color:#1A2233}
.rda-page-count{color:#9CA3AF}
.rda-list .rda-pagination{border:1px solid #E9EBEF;border-radius:10px;margin-bottom:8px;background:#FAFBFC}
.rda-side{flex:1;min-width:290px;max-width:410px;border-left:1px solid #E6E8EC;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.rda-list{overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
.rda-list.has-detail .rda-card:not(.sel){opacity:.55}
.rda-empty{text-align:center;color:#9AA2AD;font-size:13px;padding:32px 16px;line-height:1.6}
.rda-card{display:flex;flex-direction:column;text-align:left;background:#fff;border:1.5px solid #E9EBEF;border-radius:11px;overflow:hidden;transition:.12s}
.rda-card:hover{border-color:#C8CDD5}
.rda-card.sel{border-width:2px;background:#FAFCFF}
.rda-card.covered{opacity:.65}
.rda-card-hit{display:flex;gap:10px;text-align:left;background:none;border:none;padding:11px;cursor:pointer;width:100%;font:inherit;color:inherit}
.rda-card-hit:hover{background:#F8F9FB}
.rda-card-viewing{font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding:2px 7px;border-radius:20px;background:#1A2233;color:#fff}
.rda-card-offer{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;border:none;border-top:1px solid #E9EBEF;background:#ECFDF5;color:#065F46;padding:9px 11px;font-size:12.5px;font-weight:700;cursor:pointer}
.rda-card-offer:hover{background:#D1FAE5}
.rda-card-ic{flex-shrink:0;width:32px;height:32px;border-radius:8px;display:grid;place-items:center}
.rda-card-main{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.rda-card-top{display:flex;align-items:center;gap:6px}
.rda-kind-pill{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:20px}
.rda-kind-pill.need{background:#FEE2E2;color:#B91C1C}
.rda-kind-pill.offer{background:#D1FAE5;color:#065F46}
.rda-covered-label{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:650;color:#1F9E5E}
.rda-card-place{font-size:13.5px;font-weight:700;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rda-card-detail{font-size:12px;color:#5B6675;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rda-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rda-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px}
.rda-zone,.rda-time{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:#9AA2AD}
.rda-detail-wrap{flex-shrink:0;border-bottom:2px solid #1A2233;background:#fff;box-shadow:0 4px 16px rgba(26,34,51,.1)}
.rda-detail-banner{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:#1A2233;color:#fff}
.rda-detail-banner-label{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
.rda-detail-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.rda-detail-close{display:inline-flex;align-items:center;gap:4px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:7px;padding:4px 9px;font-size:11.5px;font-weight:650;cursor:pointer}
.rda-detail-close:hover{background:rgba(255,255,255,.16)}
.rda-detail{padding:14px 14px 16px 11px;border-left:4px solid;background:#fff}
.rda-detail-head{display:flex;gap:9px;align-items:flex-start;margin-bottom:10px}
.rda-detail-title{font-size:15px;font-weight:800;display:block;margin-top:4px;line-height:1.3}
.rda-detail-body{font-size:13.5px;color:#1A2233;line-height:1.55;margin-bottom:10px;font-weight:500}
.rda-detail-contact{font-size:12px;color:#5B6675;background:#F1F3F6;border-radius:7px;padding:8px 10px;margin-bottom:10px}
.rda-btn-offer{width:100%;justify-content:center;margin:4px 0 12px;background:#059669;color:#fff;padding:11px 14px;font-size:13.5px;font-weight:700}
.rda-btn-offer:hover{background:#047857}
.rda-detail-section{margin-top:10px;padding-top:10px;border-top:1px solid #EDEEF1}
.rda-section-title{font-size:11.5px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:5px;margin-bottom:7px}
.rda-match-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #F0F1F3}
.rda-match-label{display:flex;align-items:center;gap:6px;font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rda-conn{background:#fff;border:1px solid #E9EBEF;border-top-width:3px;border-radius:12px;padding:14px 16px;margin-bottom:0;display:flex;flex-direction:column;gap:11px}
.rda-conn-status-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.rda-conn-status-pill{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:3px 9px;border-radius:20px;line-height:1.2}
.rda-conn-ts{font-size:11px;color:#9CA3AF;display:inline-flex;align-items:center;gap:4px;flex-shrink:0}
.rda-conn-flow{display:flex;align-items:stretch;border:1px solid #E9EBEF;border-radius:8px;overflow:hidden}
.rda-conn-flow-node{flex:1;min-width:0;padding:8px 10px}
.rda-conn-flow-node.need{background:#FEF2F2}
.rda-conn-flow-node.offer{background:#ECFDF5}
.rda-conn-flow-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.rda-conn-flow-node.need .rda-conn-flow-label{color:#B91C1C}
.rda-conn-flow-node.offer .rda-conn-flow-label{color:#047857}
.rda-conn-flow-name{font-size:12px;font-weight:600;color:#1A2233;line-height:1.35;word-break:break-word}
.rda-conn-flow-arrow{display:flex;align-items:center;justify-content:center;padding:0 8px;background:#F8FAFC;border-left:1px solid #E9EBEF;border-right:1px solid #E9EBEF;flex-shrink:0}
.rda-conn-note{font-size:12px;color:#5B6675;line-height:1.5;border-left:2px solid #CBD5E1;padding-left:8px;margin:0}
.rda-conn-contacts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rda-conn-contact{display:flex;flex-direction:column;gap:0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;min-width:0}
.rda-conn-contact-role{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748B;margin-bottom:4px}
.rda-conn-contact-value{font-size:12px;font-weight:600;color:#1A2233;margin-bottom:6px;line-height:1.35;word-break:break-word}
.rda-contact-actions{display:flex;gap:5px;flex-wrap:wrap}
.rda-contact-btn{display:inline-flex;align-items:center;gap:4px;border:1px solid #CBD5E1;background:#fff;color:#475569;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;cursor:pointer}
.rda-contact-btn:hover{background:#F1F5F9;color:#1A2233}
.rda-contact-btn-wa{border-color:#1D9E75;color:#0F6E56;background:#E1F5EE}
.rda-contact-btn-wa:hover{background:#9FE1CB}
.rda-conn-divider{height:1px;background:#E9EBEF}
.rda-conn-footer{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rda-conn-btn-primary{display:inline-flex;align-items:center;gap:5px;border:1px solid #CBD5E1;background:#fff;color:#1A2233;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer}
.rda-conn-btn-primary:hover{background:#F8FAFC}
.rda-conn-btn-ghost{display:inline-flex;align-items:center;gap:5px;border:none;background:none;color:#9CA3AF;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:500;text-decoration:none;cursor:pointer;margin-left:auto}
.rda-conn-btn-ghost:hover{background:#F8FAFC;color:#6B7280}
.rda-conn-remote{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px;background:#EFF6FF;color:#2563EB}
.rda-detail-contact-block{margin-bottom:10px}
.rda-detail-contact-block .rda-conn-contact{grid-column:1/-1}
.rda-conn-page{padding:20px;overflow-y:auto;flex:1}
.rda-conn-header{margin-bottom:16px}
.rda-conn-title{font-size:18px;font-weight:750;margin:0 0 4px}
.rda-conn-sub{font-size:13px;color:#6B7280;margin:0 0 12px}
.rda-conn-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:8px 12px;max-width:480px}
.rda-conn-search:focus-within{border-color:#94A3B8;box-shadow:0 0 0 2px #E2E8F0}
.rda-conn-search-input{flex:1;border:none;background:transparent;font-size:14px;color:#1A2233;min-width:0;outline:none}
.rda-conn-search-input::placeholder{color:#9CA3AF}
.rda-conn-search-clear{display:inline-flex;align-items:center;justify-content:center;border:none;background:#F1F5F9;color:#64748B;border-radius:6px;padding:4px;cursor:pointer;flex-shrink:0}
.rda-conn-search-clear:hover{background:#E2E8F0;color:#1A2233}
.rda-orphan-banner{display:flex;align-items:center;gap:10px;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;flex-wrap:wrap}
.rda-orphan-banner{background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C}
.rda-conn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;max-width:980px}
.rda-form{overflow-y:auto;padding:14px;display:flex;flex-direction:column}
.rda-form-head{margin-bottom:14px}
.rda-form-context{font-size:12.5px;color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:8px 10px;margin:8px 0 0;line-height:1.4}
.rda-form-context b{font-weight:700}
.rda-back{display:inline-flex;align-items:center;gap:3px;background:none;border:none;color:#6B7280;font-size:12px;font-weight:650;cursor:pointer;padding:0 0 8px}
.rda-form-head h2{font-size:16px;font-weight:700;margin:0}
.rda-label{font-size:11.5px;font-weight:700;color:#374151;margin:12px 0 5px;display:block}
.rda-role-grid{display:flex;flex-direction:column;gap:6px}
.rda-role-btn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1.5px solid #DDE1E6;background:#fff;border-radius:9px;padding:9px 11px;cursor:pointer;text-align:left}
.rda-role-btn span{font-size:11px;opacity:.7}
.rda-req{color:#E03B4B;font-weight:700}
.rda-escombros-fields{background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:10px;padding:12px;margin:8px 0;display:flex;flex-direction:column}
.rda-equipo-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:4px}
.rda-equipo-btn{border:1.5px solid #E5D5A8;background:#fff;color:#5B6675;border-radius:8px;padding:7px 9px;font-size:11px;font-weight:650;cursor:pointer;text-align:left;line-height:1.3}
.rda-equipo-btn.on{border-color:#92400E;background:#92400E14;color:#92400E;font-weight:700}
.rda-equipo-count{font-size:11px;color:#92400E;font-weight:650;margin:4px 0 0}
.rda-meta-row{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.rda-meta-toggle{display:flex;flex-direction:column;gap:4px}
.rda-meta-toggle>span{font-size:11.5px;font-weight:650;color:#374151}
.rda-toggle-group{display:flex;gap:6px;flex-wrap:wrap}
.rda-toggle-group button{border:1.5px solid #DDE1E6;background:#fff;color:#5B6675;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:650;cursor:pointer}
.rda-toggle-group button.on{border-color:#92400E;background:#92400E14;color:#92400E}
.rda-meta-chips{display:flex;gap:5px;flex-wrap:wrap}
.rda-meta-chip{display:inline-flex;align-items:center;font-size:10.5px;font-weight:650;padding:2px 8px;border-radius:20px;background:#92400E14;color:#7C2D12}
.rda-detail-meta-block{margin-bottom:10px}
.rda-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rda-type{display:inline-flex;align-items:center;gap:5px;border:1.5px solid #DDE1E6;background:#fff;color:#5B6675;border-radius:8px;padding:7px 9px;font-size:12px;font-weight:650;cursor:pointer}
.rda-input{width:100%;border:1.5px solid #DDE1E6;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;color:#1A2233;background:#fff;resize:vertical}
.rda-loc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
.rda-loc{display:flex;align-items:center;gap:5px;border:1.5px solid #DDE1E6;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:600;color:#1A2233;min-width:0}
.rda-loc.empty{color:#9AA2AD;border-style:dashed;font-weight:500}
.rda-form-actions{display:flex;gap:8px;margin-top:16px}
.rda-form-actions .rda-btn{flex:1;justify-content:center}
.rda-hint{font-size:11px;color:#9AA2AD;margin-top:7px;text-align:center}
.rda-form-err{font-size:12px;color:#B91C1C;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 12px;margin:10px 0 0;display:flex;align-items:flex-start;gap:8px}
.rda-form-err-title{margin:0;font-weight:600;line-height:1.45}
.rda-form-err-list{margin:6px 0 0;padding-left:18px;line-height:1.5}
.rda-form-err-list li{margin:2px 0}
.rda-btn-attention{box-shadow:0 0 0 2px #FCD34D}
.rda-hint-ok{color:#047857}
.rda-btn{display:inline-flex;align-items:center;gap:5px;border:none;border-radius:8px;padding:8px 12px;font-size:12.5px;font-weight:650;cursor:pointer}
.rda-btn-sm{padding:5px 9px;font-size:11.5px}
.rda-btn-blue{background:#2563EB;color:#fff}.rda-btn-blue:hover{background:#1D4FD0}
.rda-btn-primary{background:#1A2233;color:#fff}.rda-btn-primary:hover:not(:disabled){background:#2A3445}
.rda-btn-ghost{background:#EEF0F3;color:#3B4452}.rda-btn-ghost:hover{background:#E2E5EA}
.rda-btn-outline{background:#fff;color:#3B4452;border:1.5px solid #DDE1E6}.rda-btn-outline:hover{border-color:#9CA3AF}
.rda-banner-err{display:flex;align-items:center;gap:8px;padding:10px 20px;background:#FEF2F2;color:#B91C1C;font-size:13px;border-bottom:1px solid #FECACA}
.rda-banner-err button{margin-left:auto;background:#fff;border:1px solid #FECACA;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;color:#B91C1C}
@media(max-width:760px){
  .rda-body{flex-direction:column}
  .rda-map-col{padding:10px}
  .rda-side{max-width:none;border-left:none;border-top:1px solid #E6E8EC;min-height:260px}
  .rda-head-stats{display:none}
}
`;
