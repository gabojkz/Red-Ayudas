import { getPool } from "./db.js";
import {
  rowToSede, rowToStockItem, rowToHelper, rowToLaborNeed,
  attachDist, resolveSearchOrigin, sedeOperationalStatus, buildSedePublicDetail,
} from "./stockConstants.js";
import { isInVenezuela } from "./geocode.js";

const SEDE_COLUMNS =
  "id, slug, nombre, zona, lat, lng, camas_total, camas_ocupadas, inventory_confirmed_at, photo_data, contacto";

export async function getSedeBySlug(slug) {
  const { rows } = await getPool().query(
    `SELECT ${SEDE_COLUMNS} FROM sedes WHERE slug = $1`,
    [slug]
  );
  return rowToSede(rows[0]);
}

export async function registerSede({
  nombre, zona, slug, password, camasTotal, lat, lng, photoData, contacto, trabajadores,
}) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO sedes (slug, nombre, zona, password, camas_total, lat, lng, photo_data, contacto)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${SEDE_COLUMNS}`,
      [slug, nombre, zona, password, camasTotal, lat, lng, photoData, contacto]
    );
    const sede = rowToSede(rows[0]);
    const helpers = [];
    for (const t of trabajadores) {
      const { rows: hRows } = await client.query(
        `INSERT INTO sede_helpers (sede_id, nombre, cedula, photo_data, rol)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, sede_id, nombre, cedula, photo_data, rol, created_at`,
        [sede.id, t.nombre, t.cedula, t.photoData, t.rol || "voluntario"]
      );
      helpers.push(rowToHelper(hRows[0]));
    }
    await client.query("COMMIT");
    return { sede, helpers };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function verifySedeLogin(slug, password) {
  const { rows } = await getPool().query(
    `SELECT ${SEDE_COLUMNS} FROM sedes WHERE slug = $1 AND password = $2 LIMIT 1`,
    [slug, password]
  );
  return rowToSede(rows[0]);
}

export async function getSedeById(id) {
  const { rows } = await getPool().query(
    `SELECT ${SEDE_COLUMNS} FROM sedes WHERE id = $1`,
    [id]
  );
  return rowToSede(rows[0]);
}

export async function listSedes() {
  const { rows } = await getPool().query(
    `SELECT ${SEDE_COLUMNS} FROM sedes ORDER BY nombre`
  );
  return rows.map(rowToSede);
}

export async function listStockForSede(sedeId) {
  const { rows } = await getPool().query(
    `SELECT id, sede_id, cat, nombre, cantidad, unidad, umbral, updated_at
     FROM stock_items WHERE sede_id = $1 ORDER BY updated_at DESC`,
    [sedeId]
  );
  return rows.map(rowToStockItem);
}

export async function listStockOverview({ q, cat, sort, filtro, originLat, originLng }) {
  const origin = resolveSearchOrigin(originLat, originLng, isInVenezuela);
  const clauses = [];
  const params = [];

  if (filtro === "necesita") {
    clauses.push("(si.cantidad <= si.umbral OR si.cantidad = 0)");
  } else if (filtro === "disponible") {
    clauses.push("si.cantidad > 0");
  }

  if (cat) {
    clauses.push(`si.cat = $${params.length + 1}`);
    params.push(cat);
  }
  if (q) {
    clauses.push(`(si.nombre ILIKE $${params.length + 1} OR s.nombre ILIKE $${params.length + 1})`);
    params.push(`%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT si.id, si.sede_id, si.cat, si.nombre, si.cantidad, si.unidad, si.umbral, si.updated_at,
           s.slug AS sede_slug, s.nombre AS sede_nombre, s.zona AS sede_zona, s.lat, s.lng,
           s.camas_total, s.camas_ocupadas
    FROM stock_items si
    JOIN sedes s ON s.id = si.sede_id
    ${where}
    ORDER BY
      CASE WHEN si.cantidad <= 0 THEN 0 WHEN si.cantidad <= si.umbral THEN 1 ELSE 2 END,
      si.updated_at DESC
  `;
  const { rows } = await getPool().query(sql, params);
  const items = rows.map((row) => {
    const item = rowToStockItem(row);
    const dist = attachDist(row, origin);
    const camasLibres = Math.max(0, (row.camas_total ?? 0) - (row.camas_ocupadas ?? 0));
    return {
      ...item,
      sedeSlug: row.sede_slug,
      sede: row.sede_nombre,
      sedeZona: row.sede_zona,
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      dist,
      camasTotal: row.camas_total,
      camasOcupadas: row.camas_ocupadas,
      camasLibres,
    };
  });

  if (sort === "cercanas") {
    items.sort((a, b) =>
      (a.dist ?? 999) - (b.dist ?? 999)
      || (a.cantidad <= a.umbral ? 0 : 1) - (b.cantidad <= b.umbral ? 0 : 1));
  }
  return { items, origin };
}

export async function searchStock({ q, cat, sort, originLat, originLng }) {
  const origin = resolveSearchOrigin(originLat, originLng, isInVenezuela);
  const clauses = ["si.cantidad > 0"];
  const params = [];

  if (cat) {
    clauses.push(`si.cat = $${params.length + 1}`);
    params.push(cat);
  }
  if (q) {
    clauses.push(`si.nombre ILIKE $${params.length + 1}`);
    params.push(`%${q}%`);
  }

  const sql = `
    SELECT si.id, si.sede_id, si.cat, si.nombre, si.cantidad, si.unidad, si.umbral, si.updated_at,
           s.slug AS sede_slug, s.nombre AS sede_nombre, s.zona AS sede_zona, s.lat, s.lng, s.contacto AS sede_contacto
    FROM stock_items si
    JOIN sedes s ON s.id = si.sede_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY si.updated_at DESC
  `;
  const { rows } = await getPool().query(sql, params);
  const items = rows.map((row) => {
    const item = rowToStockItem(row);
    return {
      ...item,
      sedeSlug: row.sede_slug,
      sede: row.sede_nombre,
      sedeZona: row.sede_zona,
      contacto: row.sede_contacto || null,
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      dist: attachDist(row, origin),
    };
  });

  if (sort === "cercanas") {
    items.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
  }
  return { items, origin };
}

export async function createStockItem(sedeId, data) {
  const { rows } = await getPool().query(
    `INSERT INTO stock_items (sede_id, cat, nombre, cantidad, unidad, umbral)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, sede_id, cat, nombre, cantidad, unidad, umbral, updated_at`,
    [sedeId, data.cat, data.nombre, data.cantidad, data.unidad, data.umbral]
  );
  return rowToStockItem(rows[0]);
}

export async function adjustStockItem(sedeId, itemId, delta) {
  const { rows } = await getPool().query(
    `UPDATE stock_items
     SET cantidad = GREATEST(0, cantidad + $3), updated_at = NOW()
     WHERE id = $1 AND sede_id = $2
     RETURNING id, sede_id, cat, nombre, cantidad, unidad, umbral, updated_at`,
    [itemId, sedeId, delta]
  );
  return rowToStockItem(rows[0]);
}

export async function deleteStockItem(sedeId, itemId) {
  const { rowCount } = await getPool().query(
    `DELETE FROM stock_items WHERE id = $1 AND sede_id = $2`,
    [itemId, sedeId]
  );
  return rowCount > 0;
}

export async function confirmSedeInventory(sedeId) {
  await getPool().query(
    `UPDATE stock_items SET updated_at = NOW() WHERE sede_id = $1`,
    [sedeId]
  );
  const { rows } = await getPool().query(
    `UPDATE sedes SET inventory_confirmed_at = NOW() WHERE id = $1
     RETURNING ${SEDE_COLUMNS}`,
    [sedeId]
  );
  return rowToSede(rows[0]);
}

export async function updateSedeBeds(sedeId, { camasTotal, camasOcupadas }) {
  const sets = [];
  const params = [sedeId];
  if (camasTotal != null) {
    params.push(camasTotal);
    sets.push(`camas_total = $${params.length}`);
  }
  if (camasOcupadas != null) {
    params.push(camasOcupadas);
    sets.push(`camas_ocupadas = $${params.length}`);
  }
  const { rows } = await getPool().query(
    `UPDATE sedes SET ${sets.join(", ")} WHERE id = $1
     RETURNING ${SEDE_COLUMNS}`,
    params
  );
  return rowToSede(rows[0]);
}

export async function updateSedeContact(sedeId, contacto) {
  const { rows } = await getPool().query(
    `UPDATE sedes SET contacto = $2 WHERE id = $1
     RETURNING ${SEDE_COLUMNS}`,
    [sedeId, contacto]
  );
  return rowToSede(rows[0]);
}

export async function updateSedePhoto(sedeId, photoData) {
  const { rows } = await getPool().query(
    `UPDATE sedes SET photo_data = $2 WHERE id = $1
     RETURNING ${SEDE_COLUMNS}`,
    [sedeId, photoData]
  );
  return rowToSede(rows[0]);
}

export async function listHelpers(sedeId) {
  const { rows } = await getPool().query(
    `SELECT id, sede_id, nombre, cedula, photo_data, rol, created_at
     FROM sede_helpers WHERE sede_id = $1 ORDER BY nombre`,
    [sedeId]
  );
  return rows.map(rowToHelper);
}

export async function createHelper(sedeId, data) {
  const { rows } = await getPool().query(
    `INSERT INTO sede_helpers (sede_id, nombre, cedula, photo_data, rol)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, sede_id, nombre, cedula, photo_data, rol, created_at`,
    [sedeId, data.nombre, data.cedula, data.photoData, data.rol || "voluntario"]
  );
  return rowToHelper(rows[0]);
}

export async function deleteHelper(sedeId, helperId) {
  const { rowCount } = await getPool().query(
    `DELETE FROM sede_helpers WHERE id = $1 AND sede_id = $2`,
    [helperId, sedeId]
  );
  return rowCount > 0;
}

export async function updateHelperPhoto(sedeId, helperId, photoData) {
  const { rows } = await getPool().query(
    `UPDATE sede_helpers SET photo_data = $3 WHERE id = $2 AND sede_id = $1
     RETURNING id, sede_id, nombre, cedula, photo_data, rol, created_at`,
    [sedeId, helperId, photoData]
  );
  return rows[0] ? rowToHelper(rows[0]) : null;
}

export async function listLaborNeeds(sedeId) {
  const { rows } = await getPool().query(
    `SELECT id, sede_id, skill, cantidad, notas, created_at
     FROM sede_labor_needs WHERE sede_id = $1 ORDER BY skill`,
    [sedeId]
  );
  return rows.map(rowToLaborNeed);
}

export async function listLaborNeedsPublic({ q, skill, sort, originLat, originLng }) {
  const origin = resolveSearchOrigin(originLat, originLng, isInVenezuela);
  const clauses = [];
  const params = [];

  if (skill) {
    clauses.push(`ln.skill = $${params.length + 1}`);
    params.push(skill);
  }
  if (q) {
    clauses.push(`(s.nombre ILIKE $${params.length + 1} OR ln.notas ILIKE $${params.length + 1})`);
    params.push(`%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT ln.id, ln.sede_id, ln.skill, ln.cantidad, ln.notas, ln.created_at,
           s.slug AS sede_slug, s.nombre AS sede_nombre, s.zona AS sede_zona, s.lat, s.lng,
           s.camas_total, s.camas_ocupadas
    FROM sede_labor_needs ln
    JOIN sedes s ON s.id = ln.sede_id
    ${where}
    ORDER BY ln.created_at DESC
  `;
  const { rows } = await getPool().query(sql, params);
  const laborNeeds = rows.map((row) => {
    const need = rowToLaborNeed(row);
    const dist = attachDist(row, origin);
    const camasLibres = Math.max(0, (row.camas_total ?? 0) - (row.camas_ocupadas ?? 0));
    return {
      ...need,
      sedeSlug: row.sede_slug,
      sede: row.sede_nombre,
      sedeZona: row.sede_zona,
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      dist,
      camasTotal: row.camas_total,
      camasOcupadas: row.camas_ocupadas,
      camasLibres,
    };
  });

  if (sort === "cercanas") {
    laborNeeds.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
  }
  return { laborNeeds, origin };
}

export async function createLaborNeed(sedeId, data) {
  const { rows } = await getPool().query(
    `INSERT INTO sede_labor_needs (sede_id, skill, cantidad, notas)
     VALUES ($1, $2, $3, $4)
     RETURNING id, sede_id, skill, cantidad, notas, created_at`,
    [sedeId, data.skill, data.cantidad, data.notas]
  );
  return rowToLaborNeed(rows[0]);
}

export async function deleteLaborNeed(sedeId, needId) {
  const { rowCount } = await getPool().query(
    `DELETE FROM sede_labor_needs WHERE id = $1 AND sede_id = $2`,
    [needId, sedeId]
  );
  return rowCount > 0;
}

export async function getSedeWithStock(sedeId) {
  const sede = await getSedeById(sedeId);
  if (!sede) return null;
  const stock = await listStockForSede(sedeId);
  const helpers = await listHelpers(sedeId);
  const laborNeeds = await listLaborNeeds(sedeId);
  return { ...sede, stock, helpers, laborNeeds };
}

export async function getSedePublicBySlug(slug) {
  const sede = await getSedeBySlug(slug);
  if (!sede) return null;
  const stock = await listStockForSede(sede.id);
  const helpers = await listHelpers(sede.id);
  const laborNeeds = await listLaborNeeds(sede.id);
  return buildSedePublicDetail(sede, stock, helpers, laborNeeds);
}

/** Sedes with full stock lists for the public feed (single batch query). */
export async function listSedesWithStockForFeed() {
  const sedes = await listSedes();
  if (!sedes.length) return [];

  const ids = sedes.map((s) => s.id);
  const { rows } = await getPool().query(
    `SELECT id, sede_id, cat, nombre, cantidad, unidad, umbral, updated_at
     FROM stock_items WHERE sede_id = ANY($1::int[])
     ORDER BY sede_id, updated_at DESC`,
    [ids]
  );

  const stockBySede = new Map(ids.map((id) => [id, []]));
  for (const row of rows) {
    stockBySede.get(row.sede_id).push(rowToStockItem(row));
  }

  return sedes.map((sede) => ({
    sede,
    stock: stockBySede.get(sede.id) || [],
  }));
}

export async function listSedesPublicSummary() {
  const sedes = await listSedes();
  const summaries = await Promise.all(sedes.map(async (sede) => {
    const [stock, helpers, laborNeeds] = await Promise.all([
      listStockForSede(sede.id),
      listHelpers(sede.id),
      listLaborNeeds(sede.id),
    ]);
    return {
      slug: sede.slug,
      nombre: sede.nombre,
      zona: sede.zona,
      lat: sede.lat,
      lng: sede.lng,
      photoUrl: sede.photoUrl,
      contacto: sede.contacto,
      camasTotal: sede.camasTotal,
      camasLibres: sede.camasDisponibles,
      equipoCount: helpers.length,
      faltanCount: stock.filter((i) => i.cantidad <= i.umbral).length,
      personalNecesita: laborNeeds.length,
      status: sedeOperationalStatus(sede, stock),
    };
  }));
  return summaries;
}
