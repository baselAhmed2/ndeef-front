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
  const storedValue =
    typeof window !== "undefined" ? window.localStorage.getItem(API_BASE_STORAGE_KEY) : null;
  const envValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  return (storedValue?.trim() || envValue?.trim() || FALLBACK_API_BASE_URL).replace(/\/+$/, "");
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

  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

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
