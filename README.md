# Red de Ayuda

Mapa colaborativo para coordinar necesidades de ayuda humanitaria en Venezuela. Frontend en Next.js, backend en JavaScript con PostgreSQL (Supabase), desplegable en **Vercel** + **Supabase**, con **mapas libres** (OpenFreeMap / OpenStreetMap) accesibles sin API keys.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + React |
| Mapas | MapLibre GL + [OpenFreeMap](https://openfreemap.org/) (libre, sin bloqueos de Google) |
| API | Next.js Route Handlers (`/api/needs`) |
| Base de datos | PostgreSQL en Supabase |
| Deploy | Vercel (app) + Supabase (DB) |
| PWA | Serwist — caché offline de app, API y mapa |
| Tests | Node.js test runner |

## Por qué OpenFreeMap

- **Libre y open source** — datos de OpenStreetMap, sin licencias propietarias.
- **Sin API key** — funciona en Venezuela sin depender de Google Maps ni servicios bloqueados.
- **Gratis** — sin límites estrictos para uso comunitario.

## PWA offline

La app es instalable como PWA y funciona **sin señal** mostrando la última vista:

- **Service Worker (Serwist)** — precachea la app y guarda respuestas de `/api/needs` y tiles del mapa.
- **localStorage** — snapshot de reportes, filtros y selección activa.
- **Cola offline** — reportes y cambios de estado se encolan y sincronizan al recuperar conexión.
- **Banner amarillo** — indica modo offline y cuántos cambios están pendientes.

Para probar offline en producción:

```bash
npm run build && npm start
# Instala la PWA desde el navegador, visita la app con señal, luego activa modo avión
```

> El service worker solo se registra en producción (`npm run build && npm start`), no en `npm run dev`.

## Inicio rápido (desarrollo local)

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
npm install
cp .env.example .env.local   # ya apunta a Postgres en Docker
npm run setup:dev            # levanta Docker, migra y carga 12 reportes fake
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run db:up` | Levanta Postgres en Docker |
| `npm run db:seed` | Recarga datos de prueba (borra y reinserta) |
| `npm run db:reset` | Borra volumen, recrea DB + seed |
| `npm run db:down` | Para el contenedor |

Los datos fake están en `supabase/seeds/dev.sql` — cubren todos los tipos, urgencias y estados en Caracas, La Guaira, Yaracuy y más.

## Inicio rápido (producción · Supabase)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Aplica el esquema con `supabase db push` (ver abajo) o ejecuta los SQL de `supabase/migrations/` en el **SQL Editor**.
3. Copia la **Connection string** (modo **Transaction pooler**, puerto **6543**) desde *Project Settings → Database*.

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Edita DATABASE_URL con tu connection string de Supabase
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Tests

```bash
npm test
```

## API pública (feed)

Endpoint de solo lectura para integradores:

```
GET /api/feed
```

| Parámetro | Descripción |
|-----------|-------------|
| `kind` | `need` u `offer` |
| `type` | categoría (`medicamentos`, `agua`, …) |
| `limit` | máx. ítems de publicaciones (default 100, máx. 500) |

La respuesta incluye `items` (necesidades/ofertas activas) y `centros` (inventario de stock por centro registrado).

Documentación: [`/docs/api`](/docs/api) · regenerar con `npm run docs:api`.

Las rutas `/api/needs` y `/api/connections` son internas (app web).

## Deploy en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en [vercel.com](https://vercel.com).
3. Añade variables de entorno:
   - `DATABASE_URL` (connection string de Supabase pooler)
   - `NEXT_PUBLIC_APP_URL` (tu URL de producción, p. ej. `https://red-ayudas.vercel.app`) — necesaria para SEO (canonical, sitemap, Open Graph)
4. Deploy.

Vercel detecta Next.js automáticamente. No necesitas configuración extra.

## Estructura

```
src/
  app/api/feed/      # API pública (GET feed)
  app/api/needs/     # interno (app web)
  components/        # RedDeAyuda, LibreMap
  lib/               # db, validation, constants
supabase/migrations/ # SQL schema
tests/               # tests del backend
```

## Notas para Venezuela

- Vercel y Supabase tienen presencia global; el pooler de Supabase reduce latencia.
- Los tiles de OpenFreeMap se sirven desde servidores dedicados (no Google).
- Si algún ISP bloquea un dominio de tiles, puedes auto-hospedar OpenFreeMap (ver su [guía](https://github.com/hyperknot/openfreemap)).
