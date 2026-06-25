import { WifiOff } from "lucide-react";

export default function OfflineBanner({ cachedAt, pendingCount }) {
  const when = cachedAt
    ? new Date(cachedAt).toLocaleString("es-VE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rda-banner-offline" role="status">
      <WifiOff size={14} />
      <span>
        Sin señal · mostrando última vista
        {when ? ` (${when})` : ""}
        {pendingCount > 0 ? ` · ${pendingCount} cambio(s) pendiente(s)` : ""}
      </span>
    </div>
  );
}
