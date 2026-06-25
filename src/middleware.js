import { NextResponse } from "next/server";

const WRITE_LIMIT = 30;
const WRITE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 32_768;
const buckets = new Map();

function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isWriteMethod(method) {
  return method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
}

function rateLimit(ip) {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now >= bucket.reset) {
    bucket = { count: 0, reset: now + WRITE_WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count += 1;

  if (buckets.size > 10_000) {
    for (const [key, value] of buckets) {
      if (now >= value.reset) buckets.delete(key);
    }
  }

  return bucket.count <= WRITE_LIMIT;
}

export function middleware(request) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isWriteMethod(request.method)) {
    const ip = clientIp(request);
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Cuerpo demasiado grande" }, { status: 413 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
