import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultBackendOrigin =
  process.env.NODE_ENV === "production"
    ? "http://server2careers.pravarontechnologies.com"
    : "http://localhost:5000";

const backendOrigin = (process.env.API_PROXY_ORIGIN || defaultBackendOrigin).replace(/\/+$/, "");

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function targetUrl(request: NextRequest) {
  const suffix = request.nextUrl.pathname.slice("/api/v1".length);
  return `${backendOrigin}/api/v1${suffix}${request.nextUrl.search}`;
}

function requestHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }
  headers.delete("host");
  headers.delete("content-length");
  headers.set("accept-encoding", "identity");

  const host = request.headers.get("host");
  if (host) {
    headers.set("x-forwarded-host", host);
  }
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

function responseHeaders(upstreamHeaders: Headers) {
  const headers = new Headers(upstreamHeaders);

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }
  headers.delete("content-length");

  return headers;
}

async function proxyRequest(request: NextRequest) {
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: requestHeaders(request),
    cache: "no-store",
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl(request), init);
  } catch (error) {
    console.error("API proxy failed", {
      backendOrigin,
      path: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Backend service unavailable" }, { status: 502 });
  }

  const body =
    method === "HEAD" || upstreamResponse.status === 204 || upstreamResponse.status === 304
      ? null
      : upstreamResponse.body;

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders(upstreamResponse.headers),
  });
}

export {
  proxyRequest as DELETE,
  proxyRequest as GET,
  proxyRequest as HEAD,
  proxyRequest as OPTIONS,
  proxyRequest as PATCH,
  proxyRequest as POST,
  proxyRequest as PUT,
};
