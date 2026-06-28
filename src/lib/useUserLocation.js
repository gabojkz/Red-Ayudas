import { useCallback, useState } from "react";
import { asyncHandler } from "@/lib/asyncHandler";

export function useUserLocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStatus("ok");
        },
        () => setStatus("denied"),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    } catch {
      setStatus("denied");
    }
  }, []);

  return { coords, status, request: asyncHandler(request) };
}
