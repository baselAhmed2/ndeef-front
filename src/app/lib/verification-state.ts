"use client";

const VERIFIED_AT_KEY = "nadeef_laundry_verified_at";
const VERIFIED_TTL_MS = 1000 * 60 * 30;
const PENDING_SESSION_KEY = "nadeef_laundry_pending_verification_session";
const PENDING_SESSION_TTL_MS = 1000 * 60 * 30;

export function markLaundryVerificationComplete() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VERIFIED_AT_KEY, String(Date.now()));
}

export function clearLaundryVerificationMarker() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VERIFIED_AT_KEY);
}

export function hasRecentLaundryVerificationMarker() {
  if (typeof window === "undefined") return false;

  const raw = window.localStorage.getItem(VERIFIED_AT_KEY);
  const verifiedAt = Number(raw);
  if (!raw || !Number.isFinite(verifiedAt)) return false;

  const isFresh = Date.now() - verifiedAt < VERIFIED_TTL_MS;
  if (!isFresh) {
    clearLaundryVerificationMarker();
    return false;
  }

  return true;
}

export function storePendingLaundryVerificationSession(sessionId: string) {
  if (typeof window === "undefined") return;

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) return;

  window.localStorage.setItem(
    PENDING_SESSION_KEY,
    JSON.stringify({
      sessionId: normalizedSessionId,
      savedAt: Date.now(),
    }),
  );
}

export function clearPendingLaundryVerificationSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_SESSION_KEY);
}

export function getPendingLaundryVerificationSession() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PENDING_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      sessionId?: unknown;
      savedAt?: unknown;
    };
    const sessionId =
      typeof parsed.sessionId === "string" ? parsed.sessionId.trim() : "";
    const savedAt =
      typeof parsed.savedAt === "number" ? parsed.savedAt : Number(parsed.savedAt);

    const isFresh =
      Boolean(sessionId) &&
      Number.isFinite(savedAt) &&
      Date.now() - savedAt < PENDING_SESSION_TTL_MS;

    if (!isFresh) {
      clearPendingLaundryVerificationSession();
      return null;
    }

    return sessionId;
  } catch {
    clearPendingLaundryVerificationSession();
    return null;
  }
}
