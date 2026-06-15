const DEFAULT_BACKEND_ORIGIN =
  "https://basel-ahmed-nazeef.hf.space";

function normalizeOrigin(value: string | undefined) {
  return (value?.trim() || DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, "");
}

export const BACKEND_ORIGIN = normalizeOrigin(
  process.env.NEXT_PUBLIC_NDEEF_BACKEND_URL ?? process.env.NDEEF_BACKEND_URL,
);

export const BACKEND_API_BASE = `${BACKEND_ORIGIN}/api`;
export const BACKEND_PROXY_BASE = "/api/backend";

export const NEARBY_CACHE_VERSION = `backend:${BACKEND_ORIGIN}`;
