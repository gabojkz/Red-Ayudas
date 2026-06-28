# Feed público — Unidos VE Red de Ayudas

Un endpoint GET de solo lectura con publicaciones activas e inventario por centro. Para publicar o coordinar ayuda, usa la app web.

## URL

`https://www.unidosve.com/api/feed` — cache 30 s.

## Campos del feed

Cada ítem en `items` incluye:

- `id`, `kind`, `type`, `urgency`, `status`, `place`, `zone`, `detail`, `lat`, `lng`, `publishedAt`

**Enums (publicaciones)**

- **kind:** `need`, `offer`
- **type:** `medicamentos`, `agua`, `alimentos`, `escombros`, `rescate`, `refugio`, `transporte`, `voluntario`, `otros`
- **urgency:** `critica`, `alta`, `media`
- **status:** `abierto`, `en_camino`, `cubierto`

Solo publicaciones activas (`status` ≠ `cubierto`). Sin datos de contacto en `items`.

**Centros e inventario (`centros.items`)**

Cada centro registrado incluye datos públicos y su stock actual:

- `slug`, `nombre`, `zona`, `lat`, `lng`, `contacto`, `camasTotal`, `camasLibres`, `bedsStatus`, `operationalStatus`, `stock`

**Enums (centros)**

- **bedsStatus:** `sin_camas`, `lleno`, `casi_lleno`, `disponible`
- **operationalStatus:** `operativo`, `atencion`, `critico`

**Enums (stock por ítem)**

- **cat:** `medicina`, `alimentos`, `agua`, `herramientas`, `refugio`
- **status:** `agotado`, `bajo`, `disponible`

Cada línea de `stock` incluye: `cat`, `nombre`, `cantidad`, `unidad`, `status`, `updatedAt`.

## `GET /api/feed`

Feed público de solo lectura con publicaciones activas de ayuda humanitaria.

**Parámetros opcionales**

| Name | Type | Description |
|------|------|-------------|
| `[kind]` | `string` | `need` u `offer` |
| `[type]` | `string` | Filtra por categoría |
| `[limit=100]` | `number` | Máximo de ítems, 1–500 |

**Respuesta**

| Status | Description |
|--------|-------------|
| `200` | `{ updatedAt, count, items, centros: { count, items: FeedCentro[] } }` |
| `400` | `{ errors: string[] }` |
| `503` | `{ error }` — base de datos no configurada |
| `500` | `{ error }` |

**Ejemplo de respuesta**

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

**Ejemplo de solicitud**

```
curl -s "https://www.unidosve.com/api/feed?kind=need&limit=20"
```

