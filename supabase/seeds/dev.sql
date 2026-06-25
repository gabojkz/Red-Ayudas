-- =============================================================
-- Seed ESCOMBROS — datos reales verificados
-- Fuentes: AFP, EFE, Reuters, AP, CNN, RTVC, Infobae, El Tiempo
-- 25 jun 2026 — Solo incluye hechos confirmados por medios.
-- =============================================================
TRUNCATE connections, needs RESTART IDENTITY CASCADE;

-- ─── NECESIDADES DE ESCOMBROS (kind = 'need') ───────────────

-- 1. Playa Grande, La Guaira — AFP / Dani Rizo
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'critica', 'abierto',
  'Playa Grande — vivienda colapsada (menor atrapada)',
  'La Guaira',
  'Niña atrapada bajo vivienda colapsada. Vecinos escuchan señales de vida. Se necesita retroexcavadora urgente. Ciudadanos removiendo con manos.',
  'Vecinos en el lugar — referencia AFP / Dani Rizo',
  10.596, -66.914,
  '{"equipos":["Retroexcavadora"],"operador_incluido":false,"necesita_transporte":false,"situacion":"menor_atrapada","fuente":"AFP/El Financiero"}'::jsonb,
  NOW() - INTERVAL '10 hours'
);

-- 2. Maripérez, Caracas oeste — Infobae, RTVC, EFE / Maikel Rincón
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'critica', 'abierto',
  'Maripérez (sector oeste de Caracas)',
  'Caracas',
  'Bloque residencial colapsado. Rescate manual en curso — sin maquinaria. Al menos un joven rescatado con vida (Fabián, 17 años), otras personas aún atrapadas. Se necesitan palas, tobos/baldes, plantas eléctricas para iluminar y maquinaria ligera.',
  'Protección Civil municipio Libertador — sin coordinación centralizada aún',
  10.497, -66.912,
  '{"equipos":["Pico, pala y carretilla","Generador eléctrico"],"operador_incluido":false,"necesita_transporte":false,"personas":20,"situacion":"rescate_activo_sin_maquinaria","fuente":"Infobae/EFE/RTVC"}'::jsonb,
  NOW() - INTERVAL '12 hours'
);

-- 3. El Paraíso, Caracas oeste
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'alta', 'abierto',
  'El Paraíso (sector oeste de Caracas)',
  'Caracas',
  'Estructuras colapsadas. Vecinos y voluntarios remueven escombros con herramientas básicas. Sin maquinaria pesada. Se necesitan baldes, carretillas, picos y al menos un minicargador.',
  'Bomberos Caracas — zona oeste',
  10.488, -66.920,
  '{"equipos":["Minicargador (bobcat)","Pico, pala y carretilla"],"operador_incluido":false,"necesita_transporte":false,"personas":15,"fuente":"Infobae/RTVC"}'::jsonb,
  NOW() - INTERVAL '11 hours'
);

-- 4. San Bernardino — La Jornada, El Tiempo
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'alta', 'abierto',
  'San Bernardino — edificio colapsado, centro-norte Caracas',
  'Caracas',
  'Edificio colapsado. Al menos 5 personas rescatadas con vida hasta ahora. Labores continúan. Sin maquinaria — se necesita equipo de corte y minicargador. Bomberos presentes.',
  'Cuerpo de Bomberos Caracas — San Bernardino',
  10.506, -66.903,
  '{"equipos":["Equipo de corte (sierra, discos)","Minicargador (bobcat)"],"operador_incluido":false,"necesita_transporte":false,"personas":10,"rescatadas_hasta_ahora":5,"fuente":"La Jornada/El Tiempo"}'::jsonb,
  NOW() - INTERVAL '13 hours'
);

-- 5. Los Palos Grandes, Chacao — BBC, CNN, Reuters / alcalde Duque
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'critica', 'abierto',
  'Los Palos Grandes — dos edificios colapsados (8 y 12 pisos)',
  'Caracas',
  'Derrumbe confirmado de edificio de 8 y otro de 12 pisos. 18 personas rescatadas con vida hasta el momento. Maquinaria trabajando pero insuficiente para la magnitud. Se necesitan más excavadoras y personal certificado.',
  'Defensa Civil Chacao — Alcalde Gustavo Duque',
  10.503, -66.852,
  '{"equipos":["Retroexcavadora","Detectores de vida / cámaras"],"operador_incluido":false,"necesita_transporte":false,"personas":30,"rescatadas_hasta_ahora":18,"fuente":"BBC/CNN/Reuters"}'::jsonb,
  NOW() - INTERVAL '15 hours'
);

-- 6. Caraballeda — CNN / José Pacheco, Grupo Rescate Unido
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'critica', 'abierto',
  'Caraballeda — múltiples estructuras colapsadas',
  'La Guaira',
  'Zona con +14 edificaciones afectadas. Ciudadanos removiendo solos sin apoyo oficial. José Pacheco (Grupo Rescate Unido Venezuela, 30 años de experiencia): "nunca había visto algo parecido". Se necesita maquinaria pesada urgente y brigadas certificadas.',
  'Grupo de Rescate Unido de Venezuela — José Pacheco · frente al malecón',
  10.604, -66.841,
  '{"equipos":["Retroexcavadora","Camión volquete"],"operador_incluido":false,"necesita_transporte":false,"personas":50,"situacion":"zona_sin_apoyo_oficial","fuente":"CNN"}'::jsonb,
  NOW() - INTERVAL '14 hours'
);

-- 7. Catia La Mar — EFE, AFP, El Tiempo
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'need', 'escombros', 'critica', 'abierto',
  'Catia La Mar — zona residencial (varios derrumbes)',
  'La Guaira',
  'Múltiples derrumbes en zona residencial. Gritos de personas atrapadas. Sin presencia de cuerpos de rescate organizados. Se necesitan equipos técnicos de Caracas urgentemente. Prioridad: maquinaria que pueda llegar por la vía Caracas-La Guaira.',
  'Comunidad Catia La Mar — referencia EFE',
  10.602, -67.025,
  '{"equipos":["Minicargador (bobcat)","Equipo de corte (sierra, discos)"],"operador_incluido":false,"necesita_transporte":false,"personas":20,"via_acceso":"carretera_caracas_la_guaira","fuente":"EFE/AFP/El Tiempo"}'::jsonb,
  NOW() - INTERVAL '13 hours'
);

-- ─── OFERTAS DE ESCOMBROS (kind = 'offer') ──────────────────

-- Maquinaria llegando — AP/EFE/RTVC (macro, sin contacto directo verificado)
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'offer', 'escombros', 'critica', 'abierto',
  'Maquinaria pesada — Protección Civil Nacional (llegando a zonas)',
  'Caracas',
  'Maquinaria pesada comenzando a llegar a zonas afectadas según AP/EFE (25 jun, mañana). Presente en al menos Caracas. Coordinación a través del Estado Mayor de Emergencia. Delcy Rodríguez pidió a empresas constructoras poner a disposición equipo pesado.',
  'Estado Mayor Emergencia — Gral. Juan Ernesto Sulbarán (coordinador único) · VenApp',
  10.491, -66.882,
  '{"equipos":["Retroexcavadora","Camión volquete"],"operador_incluido":true,"necesita_transporte":false,"fuente":"AP/EFE 25jun2026","nota":"Sin contacto directo verificado — coordinar vía Protección Civil"}'::jsonb,
  NOW() - INTERVAL '6 hours'
);

-- Brigada USAR Colombia — CNN, Proceso / UNGRD
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'offer', 'escombros', 'critica', 'abierto',
  'Brigada USAR Colombia — 60 especialistas + 4 perros + 12 t equipo',
  'Caracas',
  'Equipo confirmado por gobierno colombiano: 60+ especialistas, 4 binomios caninos, 12 toneladas de equipos. Integrado por Bomberos, Defensa Civil, Cruz Roja, Policía (Ponalsar), Armada y Ejército de Colombia. Transporte: Fuerza Aeroespacial Colombiana. Coordinación UNGRD.',
  'UNGRD Colombia — Javier Pava (director encargado) · coordinación con Protección Civil Venezuela',
  10.491, -66.882,
  '{"equipos":["Detectores de vida / cámaras","Voluntarios sin equipo"],"operador_incluido":true,"necesita_transporte":false,"personas":60,"perros_caninos":4,"toneladas_equipo":12,"pais":"Colombia","fuente":"CNN/Proceso"}'::jsonb,
  NOW() - INTERVAL '5 hours'
);

-- USAR Fairfax County — CNN / John Morrison
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'offer', 'escombros', 'critica', 'abierto',
  'USAR Fairfax County (Virginia, EE.UU.) — 80 personas + 6 perros',
  'Caracas',
  'Equipo confirmado por portavoz John Morrison: 80 especialistas, 6 perros de búsqueda, 3 médicos, 3 especialistas en estructuras, ~32 toneladas de equipos. Uno de los equipos USAR más avanzados del mundo. Coordinación vía Departamento de Defensa EE.UU./Southcom.',
  'USAR Fairfax County · Coordinación: Southcom (Comando Sur EE.UU.) y Protección Civil Venezuela',
  10.491, -66.882,
  '{"equipos":["Detectores de vida / cámaras","Equipo de corte (sierra, discos)"],"operador_incluido":true,"necesita_transporte":false,"personas":80,"perros_caninos":6,"medicos":3,"toneladas_equipo":32,"pais":"EEUU_Fairfax","fuente":"CNN"}'::jsonb,
  NOW() - INTERVAL '4 hours'
);

-- Los Topos Tlatelolco — México (despliegue pendiente confirmación)
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'offer', 'escombros', 'alta', 'abierto',
  'Brigada de Rescate Topos Tlatelolco A.C. — México',
  'Caracas',
  'Los Topos informaron el 24 jun que monitorean la emergencia para decidir despliegue. Brigada voluntaria con experiencia en Haití, Turquía, Nepal. Actuarán "apegados a protocolos internacionales". Presidenta Sheinbaum instruyó apoyo con personal de rescate especializado.',
  'Brigada Rescate Topos Tlatelolco A.C. · @ToposTlatelolco · Coordinación: SRE México',
  10.491, -66.882,
  '{"equipos":["Detectores de vida / cámaras"],"operador_incluido":true,"necesita_transporte":false,"pais":"Mexico","estado":"pendiente_confirmacion_despliegue","fuente":"Infobae/CNN"}'::jsonb,
  NOW() - INTERVAL '8 hours'
);

-- UME España + Bomberos Madrid (bloqueados por cierre Maiquetía)
INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at)
VALUES (
  'offer', 'escombros', 'alta', 'abierto',
  'UME España + Bomberos SUMMA112 Madrid — 97 efectivos + 12 perros',
  'Caracas',
  '57 militares de la Unidad Militar de Emergencias (UME) + 40 efectivos Equipo Emergencia Madrid (bomberos especialistas en estructuras colapsadas y profesionales SUMMA112) + 12 perros de búsqueda. Pendiente gestión de permisos de aterrizaje dado el cierre del aeropuerto Maiquetía.',
  'UME España · Coordinación: Ministerio de Defensa España y Embajada española en Caracas · +34 91 000 1249',
  10.491, -66.882,
  '{"equipos":["Detectores de vida / cámaras","Equipo de corte (sierra, discos)"],"operador_incluido":true,"necesita_transporte":false,"personas":97,"perros_caninos":12,"pais":"Espana","bloqueado_por":"cierre_aeropuerto_maiquetia","fuente":"Voz Populi"}'::jsonb,
  NOW() - INTERVAL '3 hours'
);

-- ─── Conexiones de ejemplo (need 1–7, offer 8–12) ───────────
INSERT INTO connections (need_id, offer_id, status, notes, coordinator_remote, created_at)
VALUES
  (5, 10, 'coordinando', 'Fairfax County en coordinación con Defensa Civil Chacao. 18 rescatadas, labores continúan.', TRUE, NOW() - INTERVAL '3 hours'),
  (1, 9, 'coordinando', 'UNGRD Colombia evalúa despliegue hacia Playa Grande / La Guaira.', TRUE, NOW() - INTERVAL '4 hours'),
  (6, 8, 'en_transito', 'Maquinaria Protección Civil Nacional rumbo a Caraballeda según AP/EFE.', FALSE, NOW() - INTERVAL '5 hours'),
  (2, 10, 'coordinando', 'Fairfax asignado a apoyo técnico en Maripérez — rescate manual activo.', TRUE, NOW() - INTERVAL '2 hours');
