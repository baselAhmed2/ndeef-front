"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getVerificationStatus, startVerificationSession } from "@/app/lib/laundry-admin-client";
import {
  clearPendingLaundryVerificationSession,
  storePendingLaundryVerificationSession,
} from "@/app/lib/verification-state";

const RATE_LIMIT_COOLDOWN_SECONDS = 60;

export default function VerificationPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAuthReady, updateUser } = useAuth();
  const [error, setError] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setIsRateLimited(true);
    setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const redirectToDidit = useCallback(async () => {
    if (!user) return;
    const currentUser = user;
    setIsStarting(true);
    setError("");

    try {
      const status = await getVerificationStatus();
      console.log("[Verification] Status response", status);
      const needsVerification = !status.isIdentityVerified;
      updateUser({ needsVerification });

      if (!needsVerification) {
        router.replace("/laundry-admin");
        return;
      }

      const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
      const session = await startVerificationSession(redirectUrl);
      console.log("[Verification] Session created", session);
      if (session.sessionId) {
        storePendingLaundryVerificationSession(session.sessionId);
      } else {
        clearPendingLaundryVerificationSession();
      }
      window.location.href = session.url;
    } catch (err) {
      console.error("[Verification] Could not continue verification flow", {
        error: err instanceof Error ? err.message : err,
        userRole: currentUser.role,
        needsVerification: currentUser.needsVerification,
      });
      if (currentUser.needsVerification === false) {
        router.replace("/laundry-admin");
        return;
      }

      const message = err instanceof Error ? err.message : "Could not start verification.";

      // Detect rate limiting (429) — Didit enforces per-user session limits
      const isRateLimit =
        message.includes("429") ||
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("rate limit");

      if (isRateLimit) {
        setIsRateLimited(true);
        startCooldown();
        clearPendingLaundryVerificationSession();
        setError(
          "Too many verification attempts. Didit limits how often a new session can be created. Please wait 60 seconds before trying again."
        );
      } else {
        clearPendingLaundryVerificationSession();
        setError(message);
      }
    } finally {
      setIsStarting(false);
    }
  }, [user, router, updateUser, startCooldown]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user) {
      router.push("/login?redirect=/laundry-admin/verification");
      return;
    }

    const normalizedRole = (user.role ?? "").trim().toLowerCase().replace(/\s+/g, "");
    if (normalizedRole !== "laundryadmin" && normalizedRole !== "3") {
      router.push("/");
      return;
    }

    void redirectToDidit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isLoggedIn]);

  const handleTryAgain = () => {
    if (isRateLimited || isStarting) return;
    void redirectToDidit();
  };

  const hasError = Boolean(error);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 dark:bg-[#0b131a] px-4 transition-colors">
      <div className="max-w-md w-full rounded-[2rem] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111e29] p-8 text-center shadow-xl shadow-gray-200/50 dark:shadow-black/40 transition-colors">
        {/* Icon */}
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${
          isRateLimited
            ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : hasError
            ? "bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400"
            : "bg-[#1D5B70]/10 dark:bg-[#1D5B70]/20 text-[#1D5B70] dark:text-[#7aafd2]"
        }`}>
          {isRateLimited ? (
            <Clock className="h-8 w-8" />
          ) : hasError ? (
            <AlertTriangle className="h-8 w-8" />
          ) : isStarting ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <ShieldCheck className="h-8 w-8" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-gray-950 dark:text-white">
          {isRateLimited
            ? "Too many attempts"
            : hasError
            ? "Verification could not start"
            : "Preparing identity verification"}
        </h2>

        {/* Description */}
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
          {error || "You will be redirected to the secure Didit verification page in a moment."}
        </p>

        {/* Cooldown badge */}
        {isRateLimited && cooldown > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            You can retry in {cooldown}s
          </div>
        )}

        {/* Try Again button */}
        {hasError && (
          <button
            onClick={handleTryAgain}
            disabled={isRateLimited || isStarting}
            className="mt-6 rounded-2xl bg-[#1D5B70] dark:bg-[#1D5B70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17495a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isStarting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRateLimited
              ? `Wait ${cooldown}s...`
              : isStarting
              ? "Starting..."
              : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}

