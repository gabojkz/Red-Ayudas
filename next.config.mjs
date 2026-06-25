import { randomUUID } from "node:crypto";
import withSerwistInit from "@serwist/next";

const revision = randomUUID();

const withSerwist = withSerwistInit({
  cacheOnNavigation: true,
  reloadOnOnline: false,
  swSrc: "src/sw.js",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/", revision }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
