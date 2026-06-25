-- Conexiones: enlace need ↔ offer con flujo de coordinación logística
CREATE TABLE IF NOT EXISTS connections (
  id                BIGSERIAL PRIMARY KEY,
  need_id           BIGINT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  offer_id          BIGINT NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'coordinando'
                    CHECK (status IN ('coordinando', 'en_transito', 'entregado', 'cancelado')),
  notes             TEXT,
  coordinator_remote BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (need_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_need_id ON connections(need_id);
CREATE INDEX IF NOT EXISTS idx_connections_offer_id ON connections(offer_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
