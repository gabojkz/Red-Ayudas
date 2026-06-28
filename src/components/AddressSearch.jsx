"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";

export default function AddressSearch({ value, onChange, placeholder, inputClassName = "inv-inp" }) {
  const [query, setQuery] = useState(value?.label || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value?.label && query !== value.label) {
      setQuery(value.label);
    }
  }, [value?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || query.trim().length < 3) {
      setResults([]);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.errors?.join(", ") || data.error || "Error de búsqueda");
        setResults(data.results || []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setResults([]);
          setError(e.message || "No se pudo buscar");
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (item) => {
    setQuery(item.label);
    setOpen(false);
    onChange({
      label: item.label,
      fullAddress: item.fullAddress,
      lat: item.lat,
      lng: item.lng,
    });
  };

  const clearSelection = () => {
    setQuery("");
    onChange(null);
    setOpen(true);
  };

  return (
    <div className="inv-address" ref={wrapRef}>
      <div className="inv-address-field">
        <MapPin size={16} color="var(--inv-muted)" aria-hidden />
        <input
          className={inputClassName}
          style={{ border: 0, padding: "10px 0", flex: 1, background: "transparent" }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Busca calle, barrio o referencia en Venezuela…"}
          autoComplete="off"
        />
        {loading && <Loader2 size={16} className="inv-spin" aria-hidden />}
      </div>

      {value?.fullAddress && (
        <div className="inv-address-confirmed">
          <Check size={14} aria-hidden />
          <span>{value.fullAddress}</span>
          <button type="button" className="inv-address-clear" onClick={clearSelection}>Cambiar</button>
        </div>
      )}

      {error && <p className="inv-address-err">{error}</p>}

      {open && !value && results.length > 0 && (
        <ul className="inv-address-list" role="listbox">
          {results.map((item) => (
            <li key={item.id}>
              <button type="button" role="option" onClick={() => pick(item)}>
                <strong>{item.label}</strong>
                <span>{item.fullAddress}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim().length >= 3 && !value && results.length === 0 && !error && (
        <p className="inv-address-hint">Sin resultados. Prueba con otra referencia o barrio.</p>
      )}

      <p className="inv-address-note">OpenStreetMap · selecciona la dirección exacta de la lista</p>
    </div>
  );
}
