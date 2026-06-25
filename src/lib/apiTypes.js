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
 * @typedef {Object} FeedResponse
 * @property {string} updatedAt - ISO timestamp
 * @property {number} count
 * @property {FeedItem[]} items
 */
