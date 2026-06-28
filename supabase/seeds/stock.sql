-- Seed inventario por sede (demo — contraseña: ayuda)

INSERT INTO sedes (slug, nombre, zona, lat, lng, password, camas_total, camas_ocupadas)
VALUES
  ('chacao', 'Centro Chacao', 'Plaza Bolívar de Chacao', 10.495, -66.854, 'ayuda', 120, 87),
  ('catia', 'Liceo Andrés Bello', 'Catia, oeste de Caracas', 10.408, -66.958, 'ayuda', 80, 62),
  ('petare', 'Iglesia San José', 'Petare', 10.489, -66.816, 'ayuda', 45, 41),
  ('elvalle', 'Módulo CDI El Valle', 'El Valle, sur de Caracas', 10.462, -66.901, 'ayuda', 60, 18)
ON CONFLICT (slug) DO NOTHING;

UPDATE sedes SET contacto = v.contacto
FROM (VALUES
  ('chacao', '0414-2233445'),
  ('catia', '0424-5566778'),
  ('petare', '0412-9988776'),
  ('elvalle', '0426-1122334')
) AS v(slug, contacto)
WHERE sedes.slug = v.slug;

INSERT INTO stock_items (sede_id, cat, nombre, cantidad, unidad, umbral, updated_at)
SELECT s.id, v.cat, v.nombre, v.cantidad, v.unidad, v.umbral, NOW() - v.age
FROM sedes s
JOIN (
  VALUES
    ('chacao', 'medicina', 'Insulina', 8, 'viales', 5, INTERVAL '2 hours'),
    ('chacao', 'medicina', 'Paracetamol 500mg', 40, 'cajas', 10, INTERVAL '30 minutes'),
    ('chacao', 'alimentos', 'Arroz', 120, 'kg', 30, INTERVAL '1 hour'),
    ('chacao', 'agua', 'Agua potable', 0, 'litros', 40, INTERVAL '5 hours'),
    ('chacao', 'herramientas', 'Linternas', 6, 'u', 4, INTERVAL '26 hours'),
    ('catia', 'medicina', 'Suero fisiológico', 15, 'bolsas', 8, INTERVAL '9 hours'),
    ('catia', 'alimentos', 'Atún enlatado', 200, 'latas', 40, INTERVAL '3 hours'),
    ('catia', 'agua', 'Agua potable', 300, 'litros', 60, INTERVAL '42 minutes'),
    ('catia', 'herramientas', 'Palas', 4, 'u', 3, INTERVAL '40 hours'),
    ('petare', 'medicina', 'Insulina', 3, 'viales', 5, INTERVAL '1 hour'),
    ('petare', 'medicina', 'Gasas estériles', 25, 'paquetes', 10, INTERVAL '20 hours'),
    ('petare', 'alimentos', 'Harina de maíz', 60, 'kg', 25, INTERVAL '4 hours'),
    ('petare', 'agua', 'Agua potable', 50, 'litros', 40, INTERVAL '7 hours'),
    ('elvalle', 'medicina', 'Amoxicilina', 12, 'cajas', 6, INTERVAL '50 hours'),
    ('elvalle', 'agua', 'Agua potable', 0, 'litros', 40, INTERVAL '2 hours'),
    ('elvalle', 'herramientas', 'Generador eléctrico', 1, 'u', 1, INTERVAL '6 hours'),
    ('elvalle', 'alimentos', 'Leche en polvo', 18, 'kg', 10, INTERVAL '90 minutes')
) AS v(slug, cat, nombre, cantidad, unidad, umbral, age) ON s.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM stock_items si
  WHERE si.sede_id = s.id AND si.nombre = v.nombre AND si.cat = v.cat
);

INSERT INTO sede_helpers (sede_id, nombre, cedula, rol)
SELECT s.id, h.nombre, h.cedula, h.rol
FROM sedes s
CROSS JOIN LATERAL (
  VALUES
    ('chacao', 'María González', 'V-12345678', 'coordinador'),
    ('chacao', 'Carlos Pérez', 'V-87654321', 'logistica'),
    ('catia', 'Ana Rodríguez', 'V-11223344', 'cocina'),
    ('petare', 'Luis Mendoza', 'V-99887766', 'medico')
) AS h(slug, nombre, cedula, rol)
WHERE s.slug = h.slug
ON CONFLICT (sede_id, cedula) DO UPDATE SET rol = EXCLUDED.rol;

INSERT INTO sede_labor_needs (sede_id, skill, cantidad, notas)
SELECT s.id, v.skill, v.cantidad, v.notas
FROM sedes s
JOIN (
  VALUES
    ('chacao', 'informatica', 2, 'Soporte de red y equipos'),
    ('chacao', 'traduccion', 1, 'Inglés y portugués'),
    ('catia', 'cocina', 3, 'Turnos de comida caliente'),
    ('catia', 'logistica', 2, 'Recepción y despacho de donaciones'),
    ('petare', 'medico', 1, 'Médico general o residente'),
    ('petare', 'enfermeria', 2, NULL),
    ('elvalle', 'comunicacion', 1, 'Redes y prensa'),
    ('elvalle', 'general', 4, 'Apoyo en refugio y limpieza')
) AS v(slug, skill, cantidad, notas) ON s.slug = v.slug
ON CONFLICT (sede_id, skill) DO NOTHING;
