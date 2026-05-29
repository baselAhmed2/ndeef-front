import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ORIGIN } from "@/app/lib/backend-url";

const BACKEND_BASE_URL = BACKEND_ORIGIN;

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const backendPath = resolvedParams.path?.join("/") ?? "";
  const backendUrl = new URL(`/api/${backendPath}`, BACKEND_BASE_URL);
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  const response = await fetch(backendUrl.toString(), {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseContentType = response.headers.get("content-type") ?? "";
  const responseHeaders = new Headers();
  if (responseContentType) responseHeaders.set("content-type", responseContentType);
  const cacheControl = response.headers.get("cache-control");
  if (cacheControl) responseHeaders.set("cache-control", cacheControl);
  const xAccel = response.headers.get("x-accel-buffering");
  if (xAccel) responseHeaders.set("x-accel-buffering", xAccel);

  // IMPORTANT: For SSE (text/event-stream) we must stream the response body
  // directly; otherwise Next will buffer it and the UI won't show "letter-by-letter".
  if (responseContentType.includes("text/event-stream") && response.body) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  const responseBody = await response.text();
  const isExpectedNoActiveRun =
    backendPath === "driver/runs/active" &&
    (response.status === 400 || response.status === 404) &&
    responseBody.toLowerCase().includes("no active run");

  if (!response.ok && !isExpectedNoActiveRun) {
    console.error("[backend proxy error]", {
      method: request.method,
      backendUrl: backendUrl.toString(),
      status: response.status,
      statusText: response.statusText,
      requestBodyPreview: body ? body.toString("utf8").slice(0, 500) : undefined,
      responseBodyPreview: responseBody.slice(0, 1000),
    });
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";

export { proxyRequest as GET };
export { proxyRequest as POST };
export { proxyRequest as PUT };
export { proxyRequest as PATCH };
export { proxyRequest as DELETE };
