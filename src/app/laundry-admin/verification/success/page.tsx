"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  completeVerification,
  getVerificationStatus,
  syncVerificationStatus,
} from "@/app/services/api";
import {
  clearPendingLaundryVerificationSession,
  getPendingLaundryVerificationSession,
  markLaundryVerificationComplete,
} from "@/app/lib/verification-state";

const REVIEW_CALLBACK_STATUSES = new Set(["in review", "pending", "review", "processing"]);

function VerificationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isAuthReady, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Didit may append: verificationSessionId, sessionId, session_id, session, or id
  const sessionIdFromQuery =
    searchParams?.get("verificationSessionId") ||
    searchParams?.get("sessionId") ||
    searchParams?.get("session_id") ||
    searchParams?.get("session") ||
    searchParams?.get("id");

  const sessionIdFromHash = useMemo(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash?.replace(/^#/, "") ?? "";
    if (!hash) return null;
    const hashParams = new URLSearchParams(hash);
    return (
      hashParams.get("verificationSessionId") ||
      hashParams.get("sessionId") ||
      hashParams.get("session_id") ||
      hashParams.get("session") ||
      hashParams.get("id")
    );
  }, []);

  // The session ID Didit sent in the callback URL (may be null if Didit didn't append it)
  const callbackSessionId = sessionIdFromQuery || sessionIdFromHash;
  const status = searchParams?.get("status");
  const urlStatus = status?.trim().toLowerCase() ?? "";

  // Capture mutable values in refs — effect reads current values without re-triggering
  const isLoggedInRef = useRef(isLoggedIn);
  const userRef = useRef(user);
  const logoutRef = useRef(logout);
  const updateUserRef = useRef(updateUser);
  const routerRef = useRef(router);
  isLoggedInRef.current = isLoggedIn;
  userRef.current = user;
  logoutRef.current = logout;
  updateUserRef.current = updateUser;
  routerRef.current = router;

  // Freeze the session ID on first render so it never changes the effect dependency
  const frozenSessionIdRef = useRef(callbackSessionId);

  // Guard: run the check exactly once after auth is ready
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Use the frozen session ID — never read callbackSessionId inside the effect
    const resolvedFromUrl = frozenSessionIdRef.current;

    // Resolve the final session ID: prefer URL param, fall back to locally stored pending session
    const fallbackSessionId = getPendingLaundryVerificationSession();
    const resolvedSessionId = resolvedFromUrl || fallbackSessionId;

    // If Didit provided the session ID in the URL, clear the stored one (it's consumed)
    if (resolvedFromUrl) {
      clearPendingLaundryVerificationSession();
    }

    // Debug log — inside effect, prints exactly once
    console.log(
      "[Didit] Verification callback - Session:", resolvedSessionId,
      "Status:", status,
      "URL:", window.location.href
    );

    let cancelled = false;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const markCompleted = () => {
      markLaundryVerificationComplete();
      clearPendingLaundryVerificationSession();
      updateUserRef.current({ needsVerification: false });
      setIsVerified(true);
      redirectTimeout = setTimeout(() => {
        logoutRef.current();
        routerRef.current.replace("/login");
      }, 1500);
    };

    const checkVerification = async () => {
      try {
        if (!isLoggedInRef.current || !userRef.current) {
          routerRef.current.push("/login");
          return;
        }

        // No session ID from Didit or stored — check if webhook already updated the DB
        if (!resolvedSessionId) {
          // Try a direct status check first (webhook may have already fired)
          const directStatus = await getVerificationStatus(null);
          if (directStatus.isSuccess && directStatus.data?.isVerified) {
            markCompleted();
            return;
          }

          // If rate limited on the status check, stop immediately
          if (!directStatus.isSuccess) {
            const errText = String(directStatus.error ?? "").toLowerCase();
            if (errText.includes("429") || errText.includes("too many")) {
              setError("تم إرسال عدد كبير من محاولات التحقق. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.");
              return;
            }
          }

          // Fallback: ask the backend to re-fetch from Didit and sync
          const completion = await completeVerification();
          if (completion.isSuccess && completion.data?.verified) {
            markCompleted();
            return;
          }
          setError(completion.error || "تعذر تأكيد التحقق الآن.");
          return;
        }

        // Sync the session with the backend first (single call, no polling)
        try {
          await syncVerificationStatus(resolvedSessionId);
        } catch (syncErr: unknown) {
          const syncStatus =
            typeof syncErr === "object" && syncErr !== null && "status" in syncErr
              ? Number((syncErr as { status?: number }).status)
              : null;
          // On 429 during sync — stop immediately, don't poll
          if (syncStatus === 429) {
            setError("تم إرسال عدد كبير من محاولات التحقق. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.");
            return;
          }
          // Other sync errors are non-fatal — continue to poll
          console.warn("[Didit] syncVerificationStatus failed, continuing to poll", syncErr);
        }

        // Poll with increasing backoff until verified or max attempts reached
        // Kept intentionally small (5 tries × ~10 s avg) to stay under rate limits
        const MAX_POLL = 5;
        const POLL_BASE_MS = 8000;

        for (let attempt = 0; attempt < MAX_POLL; attempt += 1) {
          if (cancelled) return;

          const result = await getVerificationStatus(resolvedSessionId);

          if (result.isSuccess && result.data?.isVerified) {
            markCompleted();
            return;
          }

          if (!result.isSuccess) {
            const normalizedError = String(result.error ?? "").toLowerCase();
            const isRateLimited =
              normalizedError.includes("429") ||
              normalizedError.includes("too many") ||
              normalizedError.includes("rate limit");
            if (isRateLimited) {
              setError("تم إرسال عدد كبير من محاولات التحقق. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.");
              return;
            }
          }

          if (!result.isSuccess && attempt === MAX_POLL - 1) {
            // Final fallback: try completeVerification before giving up
            const completion = await completeVerification();
            if (completion.isSuccess && completion.data?.verified) {
              markCompleted();
              return;
            }
            setError(completion.error || result.error || "تعذر التحقق من حالة الحساب.");
            return;
          }

          if (attempt < MAX_POLL - 1) {
            // Exponential-ish backoff: 8s, 9s, 10s, 11s …
            const delayMs = POLL_BASE_MS + attempt * 1000;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        // All attempts exhausted — final fallback
        const completion = await completeVerification();
        if (completion.isSuccess && completion.data?.verified) {
          markCompleted();
          return;
        }
        setError("لم يكتمل تأكيد التحقق بعد. حاول مرة أخرى بعد لحظات.");
      } catch (err: unknown) {
        if (cancelled) return;
        const httpStatus =
          typeof err === "object" && err !== null && "status" in err
            ? Number((err as { status?: number }).status)
            : null;
        if (httpStatus === 429) {
          setError("تم إرسال عدد كبير من محاولات التحقق. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.");
        } else {
          console.error("[Didit] Error checking verification:", err);
          setError(err instanceof Error ? err.message : "تعذر إكمال التحقق الآن.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void checkVerification();

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  // isAuthReady is the only real trigger — session ID is frozen in a ref above
  }, [isAuthReady]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            جاري التحقق من حالة الحساب...
          </h2>
          <p className="text-gray-600">
            يرجى الانتظار بينما نقوم بتأكيد التفعيل.
          </p>
        </div>
      </div>
    );
  }

  if (urlStatus === "declined" || urlStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            تعذر إكمال التحقق
          </h2>
          <p className="text-gray-600 mb-6">
            لم يكتمل التحقق هذه المرة. يمكنك إعادة المحاولة أو الرجوع إلى صفحة التحقق.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/laundry-admin/verification"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              إعادة التحقق
            </Link>
            <Link
              href="/laundry-admin"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (REVIEW_CALLBACK_STATUSES.has(urlStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-yellow-500 text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            جارٍ إنهاء التفعيل
          </h2>
          <p className="text-gray-600 mb-6">
            نراجع حالة الحساب الآن. يمكنك تحديث الصفحة بعد لحظات إذا لزم الأمر.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              تحديث الحالة
            </button>
            <Link
              href="/laundry-admin"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            حدث خطأ
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              إعادة المحاولة
            </button>
            <Link
              href="/laundry-admin/verification"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              العودة للتحقق
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            تم تفعيل الحساب بنجاح
          </h2>
          <p className="text-gray-600 mb-6">
            تم تأكيد الحساب. سيتم تحويلك إلى تسجيل الدخول خلال لحظات.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            الذهاب إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // Fallback: not verified yet after all attempts
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-yellow-500 text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          جارٍ معالجة التفعيل
        </h2>
        <p className="text-gray-600 mb-6">
          ما زلنا نراجع حالة الحساب. يمكنك المحاولة مرة أخرى بعد لحظات.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            تحديث الحالة
          </button>
          <Link
            href="/laundry-admin/verification"
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            العودة للتحقق
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <VerificationSuccessContent />
    </Suspense>
  );
}
