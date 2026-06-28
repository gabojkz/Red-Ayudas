/** Normaliza rechazos raros (p. ej. un Event) para el overlay de Next dev. */
function normalizeError(err) {
  if (err instanceof Error) return err;
  if (typeof Event !== "undefined" && err instanceof Event) {
    return new Error(`Handler async rechazó un evento (${err.type || "event"})`);
  }
  return new Error(String(err));
}

/** Evita unhandled rejection en handlers async (React 19 / Next dev overlay). */
export function asyncHandler(fn) {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result != null && typeof result.then === "function") {
        result.catch((err) => {
          console.error(normalizeError(err));
        });
      }
      return result;
    } catch (err) {
      console.error(normalizeError(err));
      return undefined;
    }
  };
}
