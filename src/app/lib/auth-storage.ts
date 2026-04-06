/**
 * Auth token is persisted by AuthContext as `nadeef_user`.
 * Legacy code may still use `nadeef_session`.
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of ["nadeef_user", "nadeef_session"] as const) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { token?: string | null; Token?: string | null };
      const t = parsed.token ?? parsed.Token;
      if (typeof t === "string" && t.length > 0) return t;
    } catch {
      continue;
    }
  }
  return null;
}
