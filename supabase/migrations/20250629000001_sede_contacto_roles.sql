-- Contacto público del centro y rol del equipo operativo

ALTER TABLE sedes ADD COLUMN IF NOT EXISTS contacto TEXT;

ALTER TABLE sede_helpers ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'voluntario'
  CHECK (rol IN (
    'coordinador', 'medico', 'enfermeria', 'logistica',
    'cocina', 'comunicacion', 'seguridad', 'voluntario'
  ));

UPDATE sede_helpers SET rol = 'voluntario' WHERE rol IS NULL;
