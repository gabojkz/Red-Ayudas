"use client";

import { useEffect } from "react";

export default function SerwistProvider({ children }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return children;
}
