import pg from "pg";
import { rowToNeed, rowToConnection } from "./constants.js";
import { getDatabaseUrl, getPgPoolConfig } from "./databaseUrl.js";

const { Pool } = pg;

const NEED_COLUMNS =
  "id, kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta, created_at, updated_at";

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL no configurada");
    }
    pool = new Pool(getPgPoolConfig(connectionString));
  }
  return pool;
}

export async function listNeeds({ status, type, kind } = {}) {
  const clauses = [];
  const params = [];

  if (kind && kind !== "todos") {
    clauses.push(`kind = $${params.length + 1}`);
    params.push(kind);
  }

  if (status === "activas") {
    clauses.push(`status != $${params.length + 1}`);
    params.push("cubierto");
  } else if (status === "cubierto") {
    clauses.push(`status = $${params.length + 1}`);
    params.push("cubierto");
  }

  if (type && type !== "todas") {
    clauses.push(`type = $${params.length + 1}`);
    params.push(type);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `
    SELECT ${NEED_COLUMNS}
    FROM needs
    ${where}
    ORDER BY
      CASE urgency WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 ELSE 2 END,
      created_at DESC
  `;

  const { rows } = await getPool().query(sql, params);
  return rows.map(rowToNeed);
}

export async function createNeed(data) {
  const sql = `
    INSERT INTO needs (kind, type, urgency, status, place, zone, detail, contact, lat, lng, meta)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    RETURNING ${NEED_COLUMNS}
  `;
  const params = [
    data.kind || "need",
    data.type,
    data.urgency,
    data.status,
    data.place,
    data.zone,
    data.detail,
    data.contact,
    data.lat,
    data.lng,
    JSON.stringify(data.meta || {}),
  ];
  const { rows } = await getPool().query(sql, params);
  return rowToNeed(rows[0]);
}

export async function updateNeedStatus(id, status) {
  const sql = `
    UPDATE needs SET status = $2
    WHERE id = $1
    RETURNING ${NEED_COLUMNS}
  `;
  const { rows } = await getPool().query(sql, [id, status]);
  return rows[0] ? rowToNeed(rows[0]) : null;
}

export async function getNeedById(id) {
  const { rows } = await getPool().query(
    `SELECT ${NEED_COLUMNS} FROM needs WHERE id = $1`,
    [id]
  );
  return rows[0] ? rowToNeed(rows[0]) : null;
}

export async function listConnections({ status } = {}) {
  const clauses = [];
  const params = [];

  if (status === "activas") {
    clauses.push(`status NOT IN ($${params.length + 1}, $${params.length + 2})`);
    params.push("entregado", "cancelado");
  } else if (status && status !== "todas") {
    clauses.push(`status = $${params.length + 1}`);
    params.push(status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const sql = `
    SELECT id, need_id, offer_id, status, notes, coordinator_remote, created_at, updated_at
    FROM connections
    ${where}
    ORDER BY
      CASE status
        WHEN 'coordinando' THEN 0
        WHEN 'en_transito' THEN 1
        WHEN 'entregado' THEN 2
        ELSE 3
      END,
      created_at DESC
  `;
  const { rows } = await getPool().query(sql, params);
  return rows.map(rowToConnection);
}

export async function createConnection({ needId, offerId, notes, coordinatorRemote }) {
  const sql = `
    INSERT INTO connections (need_id, offer_id, status, notes, coordinator_remote)
    VALUES ($1, $2, 'coordinando', $3, $4)
    RETURNING id, need_id, offer_id, status, notes, coordinator_remote, created_at, updated_at
  `;
  const { rows } = await getPool().query(sql, [
    needId,
    offerId,
    notes || "Conexión iniciada.",
    Boolean(coordinatorRemote),
  ]);
  return rowToConnection(rows[0]);
}

export async function updateConnection(id, { status, notes, coordinatorRemote }) {
  const sets = ["updated_at = NOW()"];
  const params = [id];

  if (status != null) {
    params.push(status);
    sets.push(`status = $${params.length}`);
  }
  if (notes != null) {
    params.push(notes);
    sets.push(`notes = $${params.length}`);
  }
  if (coordinatorRemote != null) {
    params.push(Boolean(coordinatorRemote));
    sets.push(`coordinator_remote = $${params.length}`);
  }

  const sql = `
    UPDATE connections SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING id, need_id, offer_id, status, notes, coordinator_remote, created_at, updated_at
  `;
  const { rows } = await getPool().query(sql, params);
  return rows[0] ? rowToConnection(rows[0]) : null;
}

export async function getConnectionById(id) {
  const { rows } = await getPool().query(
    `SELECT id, need_id, offer_id, status, notes, coordinator_remote, created_at, updated_at
     FROM connections WHERE id = $1`,
    [id]
  );
  return rows[0] ? rowToConnection(rows[0]) : null;
}

/** Cierra el pool (útil en tests) */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
