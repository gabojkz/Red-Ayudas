"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Pill, Droplet, Utensils, LifeBuoy, Home, Package, Truck, HeartHandshake,
  Plus, X, MapPin, Clock, Check, AlertTriangle, ChevronLeft, Loader2,
  Link2, ArrowRight, Globe, Radio, Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  TYPES, URGENCY, STATUS, KIND, CONN_STATUS, ROLES, OFFER_TYPES, timeAgoLabel,
} from "@/lib/constants";
import { filterPosts } from "@/lib/filters";
import { isDraftReady } from "@/lib/validation";
import {
  connectionStats, countOrphanNeeds, getMatchCandidates, nextConnectionStatus,
  nextConnectionLabel, needHasCoverage, buildConnectionsGeoJSON, isActiveConnection,
} from "@/lib/connections";
import MapLinks from "@/components/MapLinks";
import {
  saveNeedsSnapshot, loadNeedsSnapshot, saveConnectionsSnapshot, loadConnectionsSnapshot,
  saveViewState, loadViewState, getCachedAt, getQueue, isOnline,
} from "@/lib/offlineStore";
import { flushQueue, createOfflineReport } from "@/lib/syncQueue";
import OfflineBanner from "@/components/OfflineBanner";

const TYPE_ICONS = {
  medicamentos: Pill, agua: Droplet, alimentos: Utensils, rescate: LifeBuoy,
  refugio: Home, transporte: Truck, voluntario: HeartHandshake, otros: Package,
};

const LibreMap = dynamic(() => import("@/components/LibreMap"), {
  ssr: false,
  loading: () => (
    <div className="rda-map-loading">
      <Loader2 size={28} className="rda-spin" /> Cargando mapa…
    </div>
  ),
});

export default function RedDeAyuda() {
  const [needs, setNeeds] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTypes, setActiveTypes] = useState(new Set(Object.keys(TYPES)));
  const [kindFilter, setKindFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("activas");
  const [tab, setTab] = useState("mapa");
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("view");
  const [draft, setDraft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const fetchGenRef = useRef(0);

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

  const revealOnMap = useCallback((item) => {
    setKindFilter("todos");
    setStatusFilter("activas");
    setActiveTypes((prev) => new Set([...prev, item.type]));
    setSelectedId(item.id);
    setTab("mapa");
  }, []);

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
      setActiveTypes(new Set(view.activeTypes));
      setStatusFilter(view.statusFilter);
      setSelectedId(view.selectedId);
      if (view.kindFilter) setKindFilter(view.kindFilter);
      if (view.tab) setTab(view.tab);
    }
    const cached = loadNeedsSnapshot();
    const cachedConns = loadConnectionsSnapshot();
    if (cached?.length) { setNeeds(cached); setCachedAt(getCachedAt()); }
    if (cachedConns) setConnections(cachedConns);
    setPendingCount(getQueue().length);
    setOffline(!isOnline());
  }, []);

  useEffect(() => {
    saveViewState({ activeTypes, statusFilter, selectedId, kindFilter, tab });
  }, [activeTypes, statusFilter, selectedId, kindFilter, tab]);

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

  const stats = useMemo(() => connectionStats(needs, connections), [needs, connections]);
  const orphanNeeds = useMemo(() => countOrphanNeeds(needs, connections), [needs, connections]);

  const connectionsGeoJSON = useMemo(
    () => buildConnectionsGeoJSON(connections, postsById),
    [connections, postsById]
  );

  const mapNeeds = useMemo(() =>
    visible.map((n) => ({
      ...n,
      color: TYPES[n.type].color,
      kindColor: KIND[n.kind]?.color,
      typeLabel: TYPES[n.type].label,
      Icon: TYPE_ICONS[n.type],
      hasCoverage: needHasCoverage(n.id, connections),
    })),
  [visible, connections]);

  const selected = needs.find((n) => n.id === selectedId) || null;

  const handleMapClick = (lat, lng) => {
    if (mode !== "report") return;
    setDraft((d) => ({ ...(d || {}), lat, lng }));
  };

  const startReport = () => {
    setSelectedId(null);
    setDraft({
      role: "solicitante",
      kind: "need",
      type: "medicamentos",
      urgency: "alta",
      place: "",
      detail: "",
      contact: "",
      lat: null,
      lng: null,
    });
    setMode("report");
    setTab("mapa");
  };

  const publish = async () => {
    if (!draft || !isDraftReady(draft)) return;
    setSubmitting(true);
    const finishPublish = (need) => {
      fetchGenRef.current++;
      mergeNeeds((prev) => [need, ...prev.filter((n) => n.id !== need.id)]);
      revealOnMap(need);
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
        revealOnMap(need);
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.errors?.join(", ") || "Error al publicar");
      }
      const { need } = await res.json();
      finishPublish(need);
      fetchAll();
    } catch (err) {
      if (!isOnline()) {
        const { need, needs: next, pendingCount: pending } = createOfflineReport(draft, needs);
        fetchGenRef.current++;
        applyNeeds(next);
        setPendingCount(pending);
        setOffline(true);
        revealOnMap(need);
        setMode("view");
        setDraft(null);
      } else {
        setError(err.message || "No se pudo publicar");
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

  const assignCoordinator = async (connId) => {
    try {
      const res = await fetch(`/api/connections/${connId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorRemote: true }),
      });
      if (!res.ok) throw new Error();
      const { connection } = await res.json();
      applyConnections(connections.map((c) => (c.id === connId ? connection : c)));
    } catch {
      setError("No se pudo asignar coordinador");
    }
  };

  return (
    <div className="rda-root">
      <style>{CSS}</style>

      <header className="rda-header">
        <div className="rda-head-left">
          <div className="rda-mark"><Zap size={16} strokeWidth={2.6} /></div>
          <div>
            <h1 className="rda-title">Red de Ayuda · Venezuela</h1>
            <p className="rda-sub">Coordinación logística para respuesta humanitaria</p>
          </div>
        </div>
        <div className="rda-head-stats">
          <Stat n={stats.openNeeds} label="necesidades" accent="#E03B4B" />
          <Stat n={stats.openOffers} label="ofertas" accent="#1F9E5E" />
          <Stat n={stats.activeConns} label="conexiones" accent="#2563EB" />
          <Stat n={stats.delivered} label="entregados" accent="#6B7280" />
        </div>
        <button className="rda-cta" onClick={startReport}>
          <Plus size={15} strokeWidth={2.6} /> Publicar
        </button>
      </header>

      {offline && <OfflineBanner cachedAt={cachedAt} pendingCount={pendingCount} />}

      {error && (
        <div className="rda-banner-err">
          <AlertTriangle size={14} /> {error}
          <button type="button" onClick={() => { setError(null); fetchAll(); }}>Reintentar</button>
        </div>
      )}

      <div className="rda-tabs">
        <button type="button" className={tab === "mapa" ? "on" : ""} onClick={() => setTab("mapa")}>
          <MapPin size={13} /> Mapa y tablero
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

      {tab === "mapa" ? (
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

          <div className="rda-body">
            <div className="rda-map-col">
              <div className="rda-map">
                {loading ? (
                  <div className="rda-map-loading"><Loader2 size={28} className="rda-spin" /> Cargando…</div>
                ) : (
                  <LibreMap
                    key={mapNeeds.map((n) => n.id).join("-")}
                    needs={mapNeeds}
                    connectionsGeoJSON={connectionsGeoJSON}
                    selectedId={selectedId}
                    draftLatLng={draft?.lat != null ? { lat: draft.lat, lng: draft.lng } : null}
                    reportMode={mode === "report"}
                    onMapClick={handleMapClick}
                    onPinClick={(id) => { setSelectedId(id); setMode("view"); }}
                  />
                )}
                {mode === "report" && (
                  <div className="rda-map-banner">
                    {draft?.lat == null
                      ? "Toca el mapa para ubicar el reporte"
                      : "Ubicación marcada — toca de nuevo para ajustar"}
                  </div>
                )}
              </div>
              <p className="rda-note"><AlertTriangle size={11} /> Líneas = conexiones activas · pines tenues = ya tienen cobertura</p>
            </div>

            <aside className="rda-side">
              {mode === "report" ? (
                <ReportForm draft={draft} setDraft={setDraft} onPublish={publish} submitting={submitting}
                  onCancel={() => { setMode("view"); setDraft(null); }}
                  onGoConnections={() => { setMode("view"); setDraft(null); setTab("conexiones"); }} />
              ) : (
                <>
                  {selected && (
                    <DetailPanel
                      item={selected}
                      needs={needsList}
                      offers={offersList}
                      connections={connections}
                      onClose={() => setSelectedId(null)}
                      onConnect={handleConnect}
                      onAdvanceConn={advanceConnection}
                      onAssignCoordinator={assignCoordinator}
                    />
                  )}
                  <div className="rda-list">
                    {loading && <div className="rda-empty">Cargando…</div>}
                    {!loading && visible.length === 0 && (
                      <div className="rda-empty">Sin resultados con estos filtros.</div>
                    )}
                    {visible.map((n) => (
                      <ItemCard key={n.id} item={n} selected={n.id === selectedId}
                        connections={connections}
                        onClick={() => setSelectedId(n.id === selectedId ? null : n.id)} />
                    ))}
                  </div>
                </>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div className="rda-conn-page">
          <div className="rda-conn-header">
            <h2 className="rda-conn-title">Conexiones activas</h2>
            <p className="rda-conn-sub">Cada conexión enlaza una necesidad con una oferta. Avanza el estado cuando haya novedades.</p>
          </div>
          {orphanNeeds > 0 && (
            <div className="rda-orphan-banner">
              <Radio size={14} />
              <span><b>{orphanNeeds} necesidades abiertas</b> sin oferta conectada. Ve al mapa y conéctalas.</span>
              <button type="button" className="rda-btn rda-btn-sm rda-btn-outline" onClick={() => setTab("mapa")}>Ir al mapa</button>
            </div>
          )}
          {connections.filter(isActiveConnection).filter((c) => !c.coordinatorRemote).length > 0 && (
            <div className="rda-coord-banner">
              <Globe size={14} />
              <span>Conexiones sin coordinador remoto — la diáspora puede gestionarlas desde fuera.</span>
            </div>
          )}
          <div className="rda-conn-grid">
            {connections.length === 0 && (
              <div className="rda-empty" style={{ gridColumn: "1 / -1" }}>
                No hay conexiones aún. Selecciona una necesidad y conéctala a una oferta compatible.
              </div>
            )}
            {connections.map((c) => (
              <ConnectionCard key={c.id} conn={c} needs={needsList} offers={offersList}
                onAdvance={advanceConnection} onAssignCoordinator={assignCoordinator} />
            ))}
          </div>
        </div>
      )}
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
  return <Badge color={s.color} bg={s.bg}>{s.label}</Badge>;
}

function ConnectionCard({ conn, needs, offers, onAdvance, onAssignCoordinator }) {
  const need = needs.find((n) => n.id === conn.needId);
  const offer = offers.find((o) => o.id === conn.offerId);
  if (!need || !offer) return null;
  const nt = TYPES[need.type]; const ot = TYPES[offer.type];
  const NIcon = TYPE_ICONS[need.type]; const OIcon = TYPE_ICONS[offer.type];
  const next = nextConnectionStatus(conn.status);
  const nextLabel = nextConnectionLabel(conn.status);

  return (
    <div className="rda-conn">
      <div className="rda-conn-row">
        <span className="rda-conn-pin" style={{ background: nt.color }}><NIcon size={12} color="#fff" strokeWidth={2.5} /></span>
        <span className="rda-conn-place">{need.place}</span>
        <ArrowRight size={13} color="#9CA3AF" />
        <span className="rda-conn-pin" style={{ background: ot.color }}><OIcon size={12} color="#fff" strokeWidth={2.5} /></span>
        <span className="rda-conn-place">{offer.place}</span>
      </div>
      <div className="rda-conn-meta">
        <ConnStatusBadge status={conn.status} />
        {conn.coordinatorRemote && (
          <span className="rda-remote-badge"><Globe size={10} /> Coordinador remoto</span>
        )}
        <span className="rda-time"><Clock size={10} /> {timeAgoLabel(conn.mins)}</span>
      </div>
      {conn.notes && <p className="rda-conn-notes">{conn.notes}</p>}
      <div className="rda-conn-actions">
        {next && conn.status !== "entregado" && conn.status !== "cancelado" && (
          <button type="button" className="rda-btn rda-btn-sm rda-btn-outline" onClick={() => onAdvance(conn.id, next)}>
            <Check size={12} /> {nextLabel}
          </button>
        )}
        {!conn.coordinatorRemote && isActiveConnection(conn) && (
          <button type="button" className="rda-btn rda-btn-sm rda-btn-blue" onClick={() => onAssignCoordinator(conn.id)}>
            <Globe size={12} /> Asignarme como coordinador
          </button>
        )}
      </div>
    </div>
  );
}

function ItemCard({ item, selected, onClick, connections }) {
  const t = TYPES[item.type]; const Icon = TYPE_ICONS[item.type];
  const u = URGENCY[item.urgency];
  const covered = needHasCoverage(item.id, connections) ||
    connections.some((c) => c.offerId === item.id && isActiveConnection(c));

  return (
    <button type="button" className={`rda-card ${selected ? "sel" : ""} ${covered ? "covered" : ""}`}
      style={selected ? { borderColor: t.color } : undefined} onClick={onClick}>
      <span className="rda-card-ic" style={{ background: t.color, opacity: covered ? 0.7 : 1 }}>
        <Icon size={15} strokeWidth={2.5} color="#fff" />
      </span>
      <span className="rda-card-main">
        <span className="rda-card-top">
          <KindPill kind={item.kind} />
          {covered && <span className="rda-covered-label"><Link2 size={10} /> con cobertura</span>}
        </span>
        <b className="rda-card-place">{item.place}</b>
        <span className="rda-card-detail">{item.detail}</span>
        <span className="rda-card-meta">
          {item.kind === "need" && <Badge color={u.color}>{u.label}</Badge>}
          <span className="rda-zone"><MapPin size={10} /> {item.zone}</span>
          <span className="rda-time"><Clock size={10} /> {timeAgoLabel(item.mins)}</span>
        </span>
      </span>
    </button>
  );
}

function DetailPanel({ item, needs, offers, connections, onClose, onConnect, onAdvanceConn, onAssignCoordinator }) {
  const t = TYPES[item.type]; const Icon = TYPE_ICONS[item.type];
  const relConns = connections.filter((c) => c.needId === item.id || c.offerId === item.id);
  const candidates = getMatchCandidates(item, needs, offers, connections);

  return (
    <div className="rda-detail" style={{ borderTopColor: t.color }}>
      <div className="rda-detail-head">
        <span className="rda-card-ic" style={{ background: t.color }}><Icon size={15} strokeWidth={2.5} color="#fff" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <KindPill kind={item.kind} />
            <span className="rda-zone"><MapPin size={10} /> {item.zone}</span>
          </div>
          <b style={{ fontSize: 14, display: "block", marginTop: 3 }}>{item.place}</b>
        </div>
        <button type="button" className="rda-x" onClick={onClose}><X size={15} /></button>
      </div>
      <p className="rda-detail-body">{item.detail}</p>
      <div className="rda-detail-contact"><b>Contacto:</b> {item.contact}</div>
      <MapLinks lat={item.lat} lng={item.lng} label={item.place} />

      {relConns.length > 0 && (
        <div className="rda-detail-section">
          <h4 className="rda-section-title"><Link2 size={12} /> Conexiones</h4>
          {relConns.map((c) => (
            <ConnectionCard key={c.id} conn={c} needs={needs} offers={offers}
              onAdvance={onAdvanceConn} onAssignCoordinator={onAssignCoordinator} />
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
              <button type="button" className="rda-btn rda-btn-sm rda-btn-blue" onClick={() => onConnect(item, m)}>
                Conectar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportForm({ draft, setDraft, onPublish, onCancel, submitting, onGoConnections }) {
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const isCoord = draft.role === "coordinador";
  const ready = isDraftReady(draft);

  const setRole = (role) => {
    const kind = ROLES[role]?.kind || "need";
    setDraft((d) => ({ ...d, role, kind }));
  };

  return (
    <div className="rda-form">
      <div className="rda-form-head">
        <button type="button" className="rda-back" onClick={onCancel}><ChevronLeft size={15} /> Volver</button>
        <h2>Nuevo reporte</h2>
      </div>

      <label className="rda-label">Soy…</label>
      <div className="rda-role-grid">
        {Object.entries(ROLES).map(([k, r]) => (
          <button key={k} type="button" className={`rda-role-btn ${draft.role === k ? "on" : ""}`}
            style={draft.role === k ? { borderColor: r.color, background: r.color + "10", color: r.color } : undefined}
            onClick={() => setRole(k)}>
            <b>{r.label}</b>
            <span>{r.desc}</span>
          </button>
        ))}
      </div>

      {isCoord ? (
        <div className="rda-coord-info">
          <Globe size={18} />
          <p>Como coordinador remoto gestionas conexiones existentes — no publicas recursos propios.</p>
          <button type="button" className="rda-btn rda-btn-blue" onClick={onGoConnections}>Ver conexiones sin gestionar</button>
        </div>
      ) : (
        <>
          <label className="rda-label">Tipo</label>
          <div className="rda-type-grid">
            {(draft.kind === "offer" ? OFFER_TYPES : Object.keys(TYPES).filter((k) => k !== "transporte" && k !== "voluntario")).map((k) => {
              const t = TYPES[k]; const on = draft.type === k; const Icon = TYPE_ICONS[k];
              return (
                <button key={k} type="button" className={`rda-type ${on ? "on" : ""}`} onClick={() => set("type", k)}
                  style={on ? { borderColor: t.color, background: t.color + "12", color: t.color } : undefined}>
                  <Icon size={13} strokeWidth={2.4} /> {t.label}
                </button>
              );
            })}
          </div>

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
          <input className="rda-input" placeholder="Ej.: Hospital Vargas, pabellón B"
            value={draft.place || ""} onChange={(e) => set("place", e.target.value)} />

          <label className="rda-label">Descripción</label>
          <textarea className="rda-input" rows={3}
            placeholder={draft.kind === "need" ? "Qué se necesita y cuánto" : "Qué tienes disponible y desde dónde"}
            value={draft.detail || ""} onChange={(e) => set("detail", e.target.value)} />

          <label className="rda-label">Contacto / punto de entrega</label>
          <input className="rda-input" placeholder="WhatsApp, nombre, dirección…"
            value={draft.contact || ""} onChange={(e) => set("contact", e.target.value)} />

          <div className="rda-loc-row">
            <label className="rda-label" style={{ margin: 0 }}>Ubicación en el mapa</label>
            <div className={`rda-loc ${draft.lat == null ? "empty" : ""}`}>
              <MapPin size={13} />
              {draft.lat == null ? "Toca el mapa para ubicar" : `${draft.lat.toFixed(3)}, ${draft.lng.toFixed(3)}`}
            </div>
          </div>

          <div className="rda-form-actions">
            <button type="button" className="rda-btn rda-btn-ghost" onClick={onCancel}>Cancelar</button>
            <button type="button" className="rda-btn rda-btn-primary" disabled={!ready || submitting} onClick={onPublish}>
              {submitting ? "Publicando…" : "Publicar"}
            </button>
          </div>
          {!ready && <p className="rda-hint">Completa lugar, descripción y ubica en el mapa.</p>}
        </>
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
.rda-body{display:flex;flex:1;min-height:0}
.rda-map-col{flex:1.5;display:flex;flex-direction:column;padding:14px 8px 14px 20px;min-width:0}
.rda-map{position:relative;width:100%;aspect-ratio:9/5;border-radius:12px;overflow:hidden;border:1px solid #D8DCE2;min-height:320px}
.rda-map-loading{display:grid;place-items:center;height:100%;min-height:320px;color:#6B7280;gap:10px;font-size:13px;font-weight:600}
.rda-spin{animation:rda-spin 1s linear infinite}
@keyframes rda-spin{to{transform:rotate(360deg)}}
.rda-map-banner{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:#1A2233dd;color:#fff;font-size:12px;font-weight:650;padding:7px 14px;border-radius:20px;white-space:nowrap;z-index:10;pointer-events:none}
.rda-note{font-size:11px;color:#8A93A0;display:flex;align-items:center;gap:4px;margin:8px 2px 0}
.rda-side{flex:1;min-width:290px;max-width:410px;border-left:1px solid #E6E8EC;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.rda-list{overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
.rda-empty{text-align:center;color:#9AA2AD;font-size:13px;padding:32px 16px;line-height:1.6}
.rda-card{display:flex;gap:10px;text-align:left;background:#fff;border:1.5px solid #E9EBEF;border-radius:11px;padding:11px;cursor:pointer;width:100%;transition:.1s}
.rda-card:hover{border-color:#C8CDD5}
.rda-card.sel{border-color:#1A2233}
.rda-card.covered{opacity:.65}
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
.rda-detail{padding:13px;border-top:3px solid;border-bottom:1px solid #EDEEF1;background:#FAFAFA}
.rda-detail-head{display:flex;gap:9px;align-items:flex-start;margin-bottom:9px}
.rda-x{margin-left:auto;background:none;border:none;color:#9AA2AD;cursor:pointer;padding:2px}
.rda-detail-body{font-size:13px;color:#3B4452;line-height:1.5;margin-bottom:9px}
.rda-detail-contact{font-size:12px;color:#5B6675;background:#F1F3F6;border-radius:7px;padding:8px 10px;margin-bottom:10px}
.rda-detail-section{margin-top:10px}
.rda-section-title{font-size:11.5px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:5px;margin-bottom:7px}
.rda-match-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #F0F1F3}
.rda-match-label{display:flex;align-items:center;gap:6px;font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rda-conn{background:#fff;border:1.5px solid #E9EBEF;border-radius:10px;padding:11px;margin-bottom:8px}
.rda-conn-row{display:flex;align-items:center;gap:6px;margin-bottom:7px;flex-wrap:wrap}
.rda-conn-pin{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;flex-shrink:0}
.rda-conn-place{font-size:12px;font-weight:650;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rda-conn-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}
.rda-remote-badge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:650;color:#2563EB;background:#EFF6FF;padding:2px 7px;border-radius:20px}
.rda-conn-notes{font-size:11.5px;color:#5B6675;margin-bottom:8px;line-height:1.4}
.rda-conn-actions{display:flex;gap:6px;flex-wrap:wrap}
.rda-conn-page{padding:20px;overflow-y:auto;flex:1}
.rda-conn-header{margin-bottom:16px}
.rda-conn-title{font-size:18px;font-weight:750;margin:0 0 4px}
.rda-conn-sub{font-size:13px;color:#6B7280;margin:0}
.rda-orphan-banner,.rda-coord-banner{display:flex;align-items:center;gap:10px;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:13px;flex-wrap:wrap}
.rda-orphan-banner{background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C}
.rda-coord-banner{background:#EFF6FF;border:1px solid #BFDBFE;color:#1D4ED8}
.rda-conn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.rda-form{overflow-y:auto;padding:14px;display:flex;flex-direction:column}
.rda-form-head{margin-bottom:14px}
.rda-back{display:inline-flex;align-items:center;gap:3px;background:none;border:none;color:#6B7280;font-size:12px;font-weight:650;cursor:pointer;padding:0 0 8px}
.rda-form-head h2{font-size:16px;font-weight:700;margin:0}
.rda-label{font-size:11.5px;font-weight:700;color:#374151;margin:12px 0 5px;display:block}
.rda-role-grid{display:flex;flex-direction:column;gap:6px}
.rda-role-btn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1.5px solid #DDE1E6;background:#fff;border-radius:9px;padding:9px 11px;cursor:pointer;text-align:left}
.rda-role-btn span{font-size:11px;opacity:.7}
.rda-coord-info{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:24px 12px;color:#374151;font-size:13px;line-height:1.5}
.rda-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rda-type{display:inline-flex;align-items:center;gap:5px;border:1.5px solid #DDE1E6;background:#fff;color:#5B6675;border-radius:8px;padding:7px 9px;font-size:12px;font-weight:650;cursor:pointer}
.rda-input{width:100%;border:1.5px solid #DDE1E6;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;color:#1A2233;background:#fff;resize:vertical}
.rda-loc-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
.rda-loc{display:flex;align-items:center;gap:5px;border:1.5px solid #DDE1E6;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:600;color:#1A2233;min-width:0}
.rda-loc.empty{color:#9AA2AD;border-style:dashed;font-weight:500}
.rda-form-actions{display:flex;gap:8px;margin-top:16px}
.rda-form-actions .rda-btn{flex:1;justify-content:center}
.rda-hint{font-size:11px;color:#9AA2AD;margin-top:7px;text-align:center}
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
