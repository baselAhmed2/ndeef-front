import { getStoredAuthToken } from "@/app/lib/auth-storage";

const FALLBACK_API_BASE_URL = "/api/backend";
const API_BASE_STORAGE_KEY = "nadeef_admin_api_base_url";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveApiBaseUrl() {
  // In the browser we always prefer the local Next.js proxy so requests
  // share the app's origin/session and avoid cross-origin fetch failures.
  if (typeof window !== "undefined") {
    const storedValue = window.localStorage.getItem(API_BASE_STORAGE_KEY)?.trim();
    const clientBase =
      storedValue && storedValue.startsWith("/") ? storedValue : FALLBACK_API_BASE_URL;
    return clientBase.replace(/\/+$/, "");
  }

  const envValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  return (envValue?.trim() || FALLBACK_API_BASE_URL).replace(/\/+$/, "");
}

function getToken() {
  return getStoredAuthToken();
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      ...init,
      cache: init.cache ?? "no-store",
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Network error while calling ${path}: ${error.message}`
        : `Network error while calling ${path}.`;
    throw new ApiError(message, 0);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string; Message?: string; title?: string };
      message = payload.Message || payload.message || payload.title || message;
    } catch {
      // Ignore non-JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
