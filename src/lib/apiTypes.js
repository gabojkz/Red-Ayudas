/**
 * Public feed types for GET /api/feed.
 * @module apiTypes
 */

/**
 * @typedef {Object} FeedItem
 * @property {number} id
 * @property {'need'|'offer'} kind
 * @property {string} type
 * @property {'critica'|'alta'|'media'} urgency
 * @property {'abierto'|'en_camino'|'cubierto'} status
 * @property {string} place
 * @property {string} zone
 * @property {string} detail
 * @property {number} lat
 * @property {number} lng
 * @property {string} publishedAt - ISO timestamp
 */

/**
 * @typedef {Object} FeedStockItem
 * @property {string} cat - medicina, alimentos, agua, herramientas, refugio
 * @property {string} nombre
 * @property {number} cantidad
 * @property {string} unidad
 * @property {'agotado'|'bajo'|'disponible'} status
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {Object} FeedCentro
 * @property {string} slug
 * @property {string} nombre
 * @property {string} zona
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {string|null} contacto
 * @property {number} camasTotal
 * @property {number} camasLibres
 * @property {'sin_camas'|'lleno'|'casi_lleno'|'disponible'} bedsStatus
 * @property {'operativo'|'atencion'|'critico'} operationalStatus
 * @property {FeedStockItem[]} stock
 */

/**
 * @typedef {Object} FeedResponse
 * @property {string} updatedAt - ISO timestamp
 * @property {number} count - active posts count
 * @property {FeedItem[]} items
 * @property {{ count: number, items: FeedCentro[] }} centros
 */
