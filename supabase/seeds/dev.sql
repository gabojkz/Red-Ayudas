-- Datos de prueba para desarrollo local (npm run db:seed)
TRUNCATE connections, needs RESTART IDENTITY CASCADE;

INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, created_at)
VALUES
  -- PIDE (needs)
  ('need', 'medicamentos', 'alta', 'abierto', 'Hospital Vargas', 'Caracas',
   'Insulina y antibióticos para pacientes evacuados del pabellón B.',
   'Coordinación: recepción pabellón B', 10.498, -66.905, NOW() - INTERVAL '18 minutes'),

  ('need', 'rescate', 'critica', 'abierto', 'Edificio colapsado, Av. Soublette', 'La Guaira',
   'Personas atrapadas. Se necesita maquinaria ligera y equipos de rescate.',
   'Punto de mando frente al edificio', 10.602, -66.925, NOW() - INTERVAL '7 minutes'),

  ('need', 'agua', 'media', 'abierto', 'Refugio Escuela Bolivariana', 'Maracay',
   'Agua potable para unas 120 personas alojadas.',
   'Dirección de la escuela', 10.253, -67.604, NOW() - INTERVAL '41 minutes'),

  ('need', 'alimentos', 'alta', 'abierto', 'Plaza Bolívar', 'Yaracuy',
   'Alimentos no perecederos y fórmula para lactantes.',
   'Carpa de Protección Civil', 10.341, -68.742, NOW() - INTERVAL '33 minutes'),

  ('need', 'refugio', 'alta', 'abierto', 'Albergue temporal Polideportivo', 'Caracas',
   'Carpas, mantas y colchonetas para familias desplazadas.',
   'Entrada principal del polideportivo', 10.487, -66.872, NOW() - INTERVAL '52 minutes'),

  ('need', 'medicamentos', 'alta', 'en_camino', 'Ambulatorio de Catia', 'Caracas',
   'Analgésicos y material de curación.',
   'Enfermería', 10.505, -66.93, NOW() - INTERVAL '64 minutes'),

  ('need', 'agua', 'alta', 'abierto', 'Sector La Zorra', 'La Guaira',
   'Agua y purificadores; el suministro está cortado.',
   'Junta comunal', 10.598, -66.948, NOW() - INTERVAL '22 minutes'),

  ('need', 'rescate', 'critica', 'abierto', 'Edificio residencial San Felipe', 'Yaracuy',
   'Familias atrapadas en planta baja. Se necesitan palas, detectores y médicos.',
   'Frente al mercado municipal', 10.336, -68.735, NOW() - INTERVAL '12 minutes'),

  ('need', 'alimentos', 'media', 'abierto', 'Iglesia San Judas Tadeo', 'La Guaira',
   'Comida caliente para 80 personas evacuadas del malecón.',
   'Voluntarios en la puerta lateral', 10.607, -66.941, NOW() - INTERVAL '28 minutes'),

  -- OFRECE (offers)
  ('offer', 'transporte', 'alta', 'abierto', 'Salida desde Valencia', 'Valencia',
   'Camioneta 4x4 con 800 kg de capacidad. Rumbo a Caracas y La Guaira hoy 16:00.',
   'WhatsApp: 0414-555-0101', 10.172, -68.004, NOW() - INTERVAL '25 minutes'),

  ('offer', 'agua', 'alta', 'abierto', 'Acopio Parque Los Caobos', 'Caracas',
   '300 botellas de agua embotellada + 20 garrafones de 20 L.',
   'Entregar en recepción del parque', 10.502, -66.878, NOW() - INTERVAL '15 minutes'),

  ('offer', 'voluntario', 'alta', 'abierto', 'Médico general disponible', 'Caracas',
   'Soy médico, disponible para urgencias y triaje. Puedo desplazarme en Chacao y Catia.',
   'Dr. R. Mendoza · 0424-555-0202', 10.496, -66.852, NOW() - INTERVAL '40 minutes'),

  ('offer', 'transporte', 'media', 'abierto', 'Ruta Valencia → Yaracuy', 'Valencia',
   'Camión de carga mediana. Sale mañana 7am con espacio para insumos hacia San Felipe.',
   'Coordinación por Telegram', 10.168, -67.998, NOW() - INTERVAL '90 minutes'),

  ('offer', 'medicamentos', 'alta', 'abierto', 'Farmacia comunitaria La Candelaria', 'Caracas',
   'Analgésicos, antisépticos y gasas estériles. Donación de 50 kits de primeros auxilios.',
   'Retirar en mostrador principal', 10.508, -66.902, NOW() - INTERVAL '35 minutes'),

  ('offer', 'voluntario', 'media', 'abierto', 'Brigada de rescate disponible', 'La Guaira',
   '4 rescatistas certificados con equipo ligero. Disponibles para estructuras colapsadas.',
   'Brigada Delta · 0412-555-0303', 10.595, -66.935, NOW() - INTERVAL '20 minutes'),

  ('offer', 'alimentos', 'media', 'abierto', 'Comedor social La Pastora', 'Caracas',
   '200 raciones calientes listas. Pueden recogerse o entregamos si hay transporte.',
   'Av. Urdaneta, puerta 3', 10.508, -66.918, NOW() - INTERVAL '50 minutes'),

  ('offer', 'transporte', 'alta', 'abierto', 'Pickup hacia La Guaira', 'Caracas',
   'Pickup disponible ahora. 500 kg. Ruta: Caracas centro → La Guaira (Av. Soublette).',
   '0416-555-0404', 10.501, -66.895, NOW() - INTERVAL '10 minutes');

-- Conexiones de ejemplo (need_id 1–9, offer_id 10–17)
INSERT INTO connections (need_id, offer_id, status, notes, coordinator_remote, created_at)
VALUES
  (2, 15, 'coordinando', 'Brigada de rescate confirmada. Esperando desplazamiento al sitio.', FALSE, NOW() - INTERVAL '20 minutes'),
  (7, 17, 'en_transito', 'Pickup cargado con garrafones. ETA 45 min hacia La Zorra.', TRUE, NOW() - INTERVAL '55 minutes'),
  (5, 11, 'coordinando', 'Coordinador remoto gestiona entrega de agua al albergue.', TRUE, NOW() - INTERVAL '30 minutes');
