-- Necesidades de personal / voluntariado por sede

CREATE TABLE IF NOT EXISTS sede_labor_needs (
  id BIGSERIAL PRIMARY KEY,
  sede_id BIGINT NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN (
    'informatica', 'traduccion', 'medico', 'enfermeria', 'logistica',
    'cocina', 'psicologia', 'legal', 'comunicacion', 'general'
  )),
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad >= 1 AND cantidad <= 99),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sede_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_sede_labor_needs_sede ON sede_labor_needs(sede_id);
CREATE INDEX IF NOT EXISTS idx_sede_labor_needs_skill ON sede_labor_needs(skill);
