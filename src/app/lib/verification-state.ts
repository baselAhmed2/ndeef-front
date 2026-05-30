"use client";

const VERIFIED_AT_KEY = "nadeef_laundry_verified_at";
const VERIFIED_TTL_MS = 1000 * 60 * 30;

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
