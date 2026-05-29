import { BACKEND_ORIGIN } from "@/app/lib/backend-url";

/**
 * Auth token is persisted by AuthContext as `nadeef_user`.
 * Legacy code may still use `nadeef_session`.
 */
function clearLegacyAuthStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup errors.
  }
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of ["nadeef_user", "nadeef_session"] as const) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as {
        token?: string | null;
        Token?: string | null;
        backendOrigin?: string | null;
      };
      const storedBackendOrigin =
        typeof parsed.backendOrigin === "string" ? parsed.backendOrigin.trim() : "";
      if (!storedBackendOrigin || storedBackendOrigin !== BACKEND_ORIGIN) {
        clearLegacyAuthStorage(key);
        continue;
      }
      const t = parsed.token ?? parsed.Token;
      if (typeof t === "string" && t.length > 0) return t;
    } catch {
      clearLegacyAuthStorage(key);
      continue;
    }
  }
  return null;
}
