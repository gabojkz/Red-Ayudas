import { defaultCache } from "@serwist/next/worker";
import { Serwist, NetworkFirst, CacheFirst, ExpirationPlugin } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname === "/api/needs",
      handler: new NetworkFirst({
        cacheName: "rda-api-needs",
        networkTimeoutSeconds: 8,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 8,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    {
      matcher: ({ url }) =>
        url.hostname === "tiles.openfreemap.org" ||
        url.hostname.endsWith(".openfreemap.org"),
      handler: new CacheFirst({
        cacheName: "rda-map-tiles",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 600,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
