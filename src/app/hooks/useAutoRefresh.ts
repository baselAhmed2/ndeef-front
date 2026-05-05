"use client";

import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
  refreshOnFocus?: boolean;
  refreshOnVisibility?: boolean;
}

export function useAutoRefresh(
  refresh: () => void | Promise<void>,
  {
    enabled = true,
    intervalMs = 10000,
    refreshOnFocus = true,
    refreshOnVisibility = true,
  }: UseAutoRefreshOptions = {},
) {
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const runRefresh = () => {
      if (document.hidden) return;
      void refreshRef.current();
    };

    const intervalId = window.setInterval(runRefresh, intervalMs);

    if (refreshOnFocus) {
      window.addEventListener("focus", runRefresh);
    }

    if (refreshOnVisibility) {
      document.addEventListener("visibilitychange", runRefresh);
    }

    return () => {
      window.clearInterval(intervalId);

      if (refreshOnFocus) {
        window.removeEventListener("focus", runRefresh);
      }

      if (refreshOnVisibility) {
        document.removeEventListener("visibilitychange", runRefresh);
      }
    };
  }, [enabled, intervalMs, refreshOnFocus, refreshOnVisibility]);
}
