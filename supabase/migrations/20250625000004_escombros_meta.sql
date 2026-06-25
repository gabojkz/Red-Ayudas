-- Tipo escombros + campo meta flexible (equipo, operador, transporte, etc.)
ALTER TABLE needs DROP CONSTRAINT IF EXISTS needs_type_check;
ALTER TABLE needs ADD CONSTRAINT needs_type_check CHECK (
  type IN (
    'medicamentos', 'agua', 'alimentos', 'rescate', 'refugio',
    'transporte', 'voluntario', 'escombros', 'otros'
  )
);

ALTER TABLE needs ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS needs_meta_equipo_idx
  ON needs ((meta->>'equipo'))
  WHERE type = 'escombros';

CREATE INDEX IF NOT EXISTS needs_meta_transporte_idx
  ON needs ((meta->>'necesita_transporte'))
  WHERE type = 'escombros';
