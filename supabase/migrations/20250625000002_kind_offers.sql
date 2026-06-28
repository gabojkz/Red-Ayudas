-- Añade kind (pide/ofrece) y tipos transporte + voluntario
ALTER TABLE needs ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'need'
  CHECK (kind IN ('need', 'offer'));

ALTER TABLE needs DROP CONSTRAINT IF EXISTS needs_type_check;
ALTER TABLE needs ADD CONSTRAINT needs_type_check CHECK (
  type IN (
    'medicamentos', 'agua', 'alimentos', 'rescate', 'refugio',
    'transporte', 'voluntario', 'escombros', 'otros'
  )
);

CREATE INDEX IF NOT EXISTS needs_kind_idx ON needs (kind);
