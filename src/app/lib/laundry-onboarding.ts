"use client";

const STORAGE_KEY = "nadeef_pending_laundry_onboarding";

export const LAUNDRY_ADMIN_DIDIT_SIGNUP_URL =
  "https://verify.didit.me/u/ueKcLhvVTo-8x_fXAt0ogw";

export interface PendingLaundryOnboarding {
  laundryName: string;
  address: string;
  latitude: number;
  longitude: number;
}

export function savePendingLaundryOnboarding(data: PendingLaundryOnboarding) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function readPendingLaundryOnboarding(): PendingLaundryOnboarding | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingLaundryOnboarding;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingLaundryOnboarding() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
