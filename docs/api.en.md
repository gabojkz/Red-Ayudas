# Public feed — Red de Ayuda

One read-only GET endpoint. To publish or coordinate aid, use the web app.

## URL

`https://red-ayudas.vercel.app/api/feed` — cached 30 s.

## Feed fields

Each entry in `items` includes:

- `id`, `kind`, `type`, `urgency`, `status`, `place`, `zone`, `detail`, `lat`, `lng`, `publishedAt`

**Enums**

- **kind:** `need`, `offer`
- **type:** `medicamentos`, `agua`, `alimentos`, `escombros`, `rescate`, `refugio`, `transporte`, `voluntario`, `otros`
- **urgency:** `critica`, `alta`, `media`
- **status:** `abierto`, `en_camino`, `cubierto`

Active posts only (`status` ≠ `cubierto`). No contact info.

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
| `200` | `{ updatedAt, count, items: FeedItem[] }` | |
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
  }]
}
```

**Sample request**

```
curl -s "https://red-ayudas.vercel.app/api/feed?kind=need&limit=20"
```

