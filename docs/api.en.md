# Public feed — Unidos VE Red de Ayudas

One read-only GET endpoint with active posts and per-center inventory. To publish or coordinate aid, use the web app.

## URL

`https://www.unidosve.com/api/feed` — cached 30 s.

## Feed fields

Each entry in `items` includes:

- `id`, `kind`, `type`, `urgency`, `status`, `place`, `zone`, `detail`, `lat`, `lng`, `publishedAt`

**Enums (posts)**

- **kind:** `need`, `offer`
- **type:** `medicamentos`, `agua`, `alimentos`, `escombros`, `rescate`, `refugio`, `transporte`, `voluntario`, `otros`
- **urgency:** `critica`, `alta`, `media`
- **status:** `abierto`, `en_camino`, `cubierto`

Active posts only (`status` ≠ `cubierto`). No contact info in `items`.

**Centers and inventory (`centros.items`)**

Each registered center includes public data and current stock:

- `slug`, `nombre`, `zona`, `lat`, `lng`, `contacto`, `camasTotal`, `camasLibres`, `bedsStatus`, `operationalStatus`, `stock`

**Enums (centers)**

- **bedsStatus:** `sin_camas`, `lleno`, `casi_lleno`, `disponible`
- **operationalStatus:** `operativo`, `atencion`, `critico`

**Enums (stock per item)**

- **cat:** `medicina`, `alimentos`, `agua`, `herramientas`, `refugio`
- **status:** `agotado`, `bajo`, `disponible`

Each `stock` line includes: `cat`, `nombre`, `cantidad`, `unidad`, `status`, `updatedAt`.

## `GET /api/feed`

Public read-only feed of active humanitarian posts.

**Optional parameters**

| Name | Type | Description |
|------|------|-------------|
| `[kind]` | `string` | `need` or `offer` | |
| `[type]` | `string` | Category filter | |
| `[limit=100]` | `number` | Max items, 1–500 | |

**Response**

| Status | Description |
|--------|-------------|
| `200` | `{ updatedAt, count, items, centros: { count, items: FeedCentro[] } }` | |
| `400` | `{ errors: string[] }` | |
| `503` | `{ error }` — database not configured | |
| `500` | `{ error }` | |

**Sample response**

```json
{
  "updatedAt": "2026-06-25T12:00:00.000Z",
  "count": 1,
  "items": [{
    "id": 1,
    "kind": "need",
    "type": "medicamentos",
    "urgency": "alta",
    "status": "abierto",
    "place": "Hospital Vargas",
    "zone": "Caracas",
    "detail": "Insulina",
    "lat": 10.498,
    "lng": -66.905,
    "publishedAt": "2026-06-25T10:00:00.000Z"
  }],
  "centros": {
    "count": 1,
    "items": [{
      "slug": "chacao",
      "nombre": "Centro Chacao",
      "zona": "Plaza Bolívar de Chacao",
      "lat": 10.495,
      "lng": -66.854,
      "contacto": "0414-2233445",
      "camasTotal": 120,
      "camasLibres": 33,
      "bedsStatus": "disponible",
      "operationalStatus": "operativo",
      "stock": [{
        "cat": "medicina",
        "nombre": "Insulina",
        "cantidad": 24,
        "unidad": "u",
        "status": "disponible",
        "updatedAt": "2026-06-25T11:00:00.000Z"
      }]
    }]
  }
}
```

**Sample request**

```
curl -s "https://www.unidosve.com/api/feed?kind=need&limit=20"
```

