# Unidos VE Red de Ayudas

Plataforma colaborativa para coordinar ayuda humanitaria en Venezuela: inventario por sede de emergencia, directorio de centros, reportes en mapa y feed público para integradores.

**Producción:** [www.unidosve.com](https://www.unidosve.com)

## Módulos

| Ruta | Descripción |
|------|-------------|
| `/` | Buscar materiales y personal por centro cerca de ti |
| `/inventario` | Registro y gestión de stock, camas y trabajadores por sede |
| `/centros` | Directorio público de centros (inventario, equipo, contacto) |
| `/reportes` | Mapa de necesidades/ofertas y conexiones entre reportes |
| `/recursos` | Enlaces externos útiles (desaparecidos, etc.) |
| `/docs/api` | Documentación del feed JSON |
| `GET /api/feed` | API pública de solo lectura |

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + React |
| Mapas | MapLibre GL + [OpenFreeMap](https://openfreemap.org/) |
| API | Next.js Route Handlers |
| Base de datos | PostgreSQL (Supabase) |
| Deploy | Vercel + Supabase |
| PWA | Serwist — caché offline de app, API y mapa |
| Tests | Node.js test runner |

## Inicio rápido (desarrollo local)

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
npm install
cp .env.example .env.local   # Postgres local en Docker
npm run setup:dev            # Docker + migraciones + seeds
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

| Comando | Descripción |
|---------|-------------|
| `npm run db:up` | Levanta Postgres en Docker |
| `npm run db:migrate` | Aplica migraciones SQL |
| `npm run db:seed` | Recarga datos de prueba |
| `npm run db:reset` | Borra volumen y recrea todo |
| `npm run db:down` | Para el contenedor |
| `npm test` | Tests del backend |

Seeds: `supabase/seeds/dev.sql` (reportes en mapa) y `stock.sql` (sedes demo, contraseña `ayuda`).

## Producción · Supabase

### 1. Crear proyecto y aplicar tablas

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
npm run db:push
```

O ejecuta manualmente los archivos de `supabase/migrations/` en el **SQL Editor** de Supabase, en orden por fecha.

Tablas principales: `needs`, `connections`, `sedes`, `stock_items`, `sede_helpers`, `sede_labor_needs`.

### 2. (Opcional) Datos de demo

Con `DATABASE_URL` apuntando al **pooler** de Supabase (puerto **6543**):

```bash
npm run db:seed
```

### 3. Variables de entorno

```bash
# Vercel / producción
DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[region].pooler.supabase.com:6543/postgres
NEXT_PUBLIC_APP_URL=https://www.unidosve.com
```

Usa el **Transaction pooler (6543)**, no `db.[ref].supabase.co` (falla en Vercel por IPv6). Si conectas la integración Supabase en Vercel, `POSTGRES_URL` suele bastar.

## Deploy en Vercel

1. Importa el repo en [vercel.com](https://vercel.com).
2. Variables de entorno: `DATABASE_URL` o `POSTGRES_URL`, y `NEXT_PUBLIC_APP_URL=https://www.unidosve.com`.
3. **Settings → Domains:** añade `www.unidosve.com` y redirige `unidosve.com` → `www`.
4. Deploy.

## API pública (feed)

```
GET /api/feed
```

| Parámetro | Descripción |
|-----------|-------------|
| `kind` | `need` u `offer` |
| `type` | categoría (`medicamentos`, `agua`, …) |
| `limit` | máx. ítems (default 100, máx. 500) |

Respuesta: `items` (publicaciones activas) y `centros` (inventario por sede).

Documentación: [www.unidosve.com/docs/api](https://www.unidosve.com/docs/api) · regenerar con `npm run docs:api`.

Las rutas `/api/needs` y `/api/connections` son internas (módulo de reportes).

## PWA offline

En producción (`npm run build && npm start`) la app es instalable y cachea la última vista, `/api/needs` y tiles del mapa. El service worker no se registra en `npm run dev`.

## Estructura

```
src/
  app/               # páginas y route handlers
  app/api/feed/      # feed público
  app/api/sedes/     # inventario por sede
  components/        # UI (InventarioApp, NecesidadesLista, RedDeAyuda, …)
  lib/               # db, stockDb, validation, seo
supabase/migrations/ # esquema SQL
supabase/seeds/      # datos de demo
docs/                # api.es.md, api.en.md (generados)
tests/
```

## Notas para Venezuela

- Mapas sin API key (OpenFreeMap / OpenStreetMap).
- Pooler de Supabase reduce latencia desde Vercel.
- Si un ISP bloquea tiles, puedes auto-hospedar OpenFreeMap ([guía](https://github.com/hyperknot/openfreemap)).
