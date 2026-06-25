-- Red de Ayuda · esquema inicial
-- Ejecutar en Supabase SQL Editor o con: npm run db:migrate

CREATE TABLE IF NOT EXISTS needs (
  id            BIGSERIAL PRIMARY KEY,
  kind          TEXT NOT NULL DEFAULT 'need' CHECK (kind IN ('need', 'offer')),
  type          TEXT NOT NULL CHECK (type IN ('medicamentos', 'agua', 'alimentos', 'rescate', 'refugio', 'transporte', 'voluntario', 'otros')),
  urgency       TEXT NOT NULL CHECK (urgency IN ('critica', 'alta', 'media')),
  status        TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_camino', 'cubierto')),
  place         TEXT NOT NULL,
  zone          TEXT NOT NULL,
  detail        TEXT NOT NULL,
  contact       TEXT NOT NULL DEFAULT '—',
  lat           DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN 0.5 AND 12.5),
  lng           DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -73.5 AND -59.5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS needs_kind_idx ON needs (kind);
CREATE INDEX IF NOT EXISTS needs_status_idx ON needs (status);
CREATE INDEX IF NOT EXISTS needs_urgency_idx ON needs (urgency);
CREATE INDEX IF NOT EXISTS needs_created_at_idx ON needs (created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS needs_updated_at ON needs;
CREATE TRIGGER needs_updated_at
  BEFORE UPDATE ON needs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

