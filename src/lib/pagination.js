/** Resultados por página en mapa + listado (sincronizados). */
export const BOARD_PAGE_SIZE = 25;

export function paginateItems(items, page, pageSize = BOARD_PAGE_SIZE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    pages,
    start: total === 0 ? 0 : start + 1,
    end: Math.min(start + pageSize, total),
  };
}

export function findItemPage(items, itemId, pageSize = BOARD_PAGE_SIZE) {
  const index = items.findIndex((n) => n.id === itemId);
  if (index < 0) return 1;
  return Math.floor(index / pageSize) + 1;
}

export function buildNeedsBoardQuery({
  page,
  limit = BOARD_PAGE_SIZE,
  activeTypes,
  kindFilter,
  statusFilter,
  allTypeKeys,
}) {
  const q = new URLSearchParams();
  if (statusFilter && statusFilter !== "todas") q.set("status", statusFilter);
  if (kindFilter && kindFilter !== "todos") q.set("kind", kindFilter);
  const types = [...activeTypes];
  if (types.length > 0 && types.length < allTypeKeys.length) {
    q.set("types", types.join(","));
  }
  q.set("page", String(page));
  q.set("limit", String(limit));
  return q;
}
