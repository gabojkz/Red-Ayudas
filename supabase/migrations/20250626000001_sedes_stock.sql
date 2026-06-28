-- Inventario por sede de emergencia · stock, camas y ayudantes

CREATE TABLE IF NOT EXISTS sedes (
  id                    BIGSERIAL PRIMARY KEY,
  slug                  TEXT NOT NULL UNIQUE,
  nombre                TEXT NOT NULL,
  zona                  TEXT NOT NULL,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  password              TEXT NOT NULL,
  camas_total           INT NOT NULL DEFAULT 0 CHECK (camas_total >= 0),
  camas_ocupadas        INT NOT NULL DEFAULT 0 CHECK (camas_ocupadas >= 0),
  inventory_confirmed_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sede_camas_ocupadas_lte_total CHECK (camas_ocupadas <= camas_total)
);

CREATE TABLE IF NOT EXISTS stock_items (
  id          BIGSERIAL PRIMARY KEY,
  sede_id     BIGINT NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  cat         TEXT NOT NULL CHECK (cat IN ('medicina', 'alimentos', 'agua', 'herramientas', 'refugio')),
  nombre      TEXT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  unidad      TEXT NOT NULL DEFAULT 'u',
  umbral      INT NOT NULL DEFAULT 0 CHECK (umbral >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sede_helpers (
  id          BIGSERIAL PRIMARY KEY,
  sede_id     BIGINT NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  cedula      TEXT NOT NULL,
  photo_data  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sede_id, cedula)
);

CREATE INDEX IF NOT EXISTS stock_items_sede_idx ON stock_items (sede_id);
CREATE INDEX IF NOT EXISTS stock_items_cat_idx ON stock_items (cat);
CREATE INDEX IF NOT EXISTS stock_items_updated_idx ON stock_items (updated_at DESC);
CREATE INDEX IF NOT EXISTS sede_helpers_sede_idx ON sede_helpers (sede_id);

DROP TRIGGER IF EXISTS sedes_updated_at ON sedes;
CREATE TRIGGER sedes_updated_at
  BEFORE UPDATE ON sedes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS stock_items_updated_at ON stock_items;
CREATE TRIGGER stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
