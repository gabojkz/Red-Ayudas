# Feed público — Red de Ayuda

Un solo endpoint GET de solo lectura. Para publicar o coordinar ayuda, usa la app web.

## URL

`https://red-ayudas.vercel.app/api/feed` — cache 30 s.

## Campos del feed

Cada ítem en `items` incluye:

- `id`, `kind`, `type`, `urgency`, `status`, `place`, `zone`, `detail`, `lat`, `lng`, `publishedAt`

**Enums**

- **kind:** `need`, `offer`
- **type:** `medicamentos`, `agua`, `alimentos`, `escombros`, `rescate`, `refugio`, `transporte`, `voluntario`, `otros`
- **urgency:** `critica`, `alta`, `media`
- **status:** `abierto`, `en_camino`, `cubierto`

Solo publicaciones activas (`status` ≠ `cubierto`). Sin datos de contacto.

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
| `200` | `{ updatedAt, count, items: FeedItem[] }` |
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
  }]
}
```

**Ejemplo de solicitud**

```
curl -s "https://red-ayudas.vercel.app/api/feed?kind=need&limit=20"
```

