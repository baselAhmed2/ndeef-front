"use client";

import { useEffect, useMemo, useState, Suspense, useRef } from "react";
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
const MAX_ATTEMPTS = 10;
const BASE_DELAY_MS = 5000;

function VerificationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isAuthReady, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
  const [hasResolvedSessionLookup, setHasResolvedSessionLookup] = useState(false);

  // Didit may return verificationSessionId, sessionId, session_id, session, or id
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
  const callbackSessionId = sessionIdFromQuery || sessionIdFromHash;
  const status = searchParams?.get("status");
  const urlStatus = status?.trim().toLowerCase() ?? "";

  // Capture mutable values in refs so the effect doesn't re-run when they change reference
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

  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Guard: only run once, and only after auth is ready
    if (!isAuthReady) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Debug log — inside effect so it prints exactly once
    console.log("[Didit] Verification callback - Session:", sessionId, "Status:", status, "URL:", window.location.href);

    let cancelled = false;
    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    const markCompleted = () => {
      markLaundryVerificationComplete();
      clearPendingLaundryVerificationSession();
      updateUser({ needsVerification: false });
      setIsVerified(true);
      redirectTimeout = setTimeout(() => {
        logout();
        router.replace("/login");
      }, 1500);
    };

    const checkVerification = async () => {
      try {
        if (sessionId) {
          await syncVerificationStatus(sessionId);
        }

        if (!isLoggedInRef.current || !userRef.current) {
          routerRef.current.push("/login");
          return;
        }

        if (!resolvedSessionId) {
          const completion = await completeVerification();
          if (completion.isSuccess && completion.data?.verified) {
            markCompleted();
            return;
          }

          setError(completion.error || "تعذر تأكيد التحقق الآن.");
          return;
        }

        await syncVerificationStatus(resolvedSessionId);

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
          if (cancelled) return;

          const result = await getVerificationStatus(resolvedSessionId);
          if (result.isSuccess && result.data?.isVerified) {
            markLaundryVerificationComplete();
            updateUserRef.current({ needsVerification: false });
            setIsVerified(true);
            redirectTimeout = setTimeout(() => {
              logoutRef.current();
              routerRef.current.replace("/login");
            }, 1500);
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

          if (!result.isSuccess && attempt === MAX_ATTEMPTS - 1) {
            const completion = await completeVerification();
            if (completion.isSuccess && completion.data?.verified) {
              markCompleted();
              return;
            }

            setError(completion.error || result.error || "تعذر التحقق من حالة الحساب.");
            return;
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            const delayMs = BASE_DELAY_MS + attempt * 1000;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        setError("Verification is still being processed. Please try again in a moment.");
      } catch (err) {
        console.error("[Didit] Error checking verification:", err);
        setError(err instanceof Error ? err.message : "Unable to complete verification right now.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void checkVerification();

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  // Only re-run if auth readiness or sessionId changes — everything else is via refs
  }, [isAuthReady, sessionId]);

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
          <div className="text-red-500 text-5xl mb-4">X</div>
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
          <div className="text-yellow-500 text-5xl mb-4">...</div>
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
          <div className="text-red-500 text-5xl mb-4">!</div>
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
          <div className="text-green-500 text-5xl mb-4">OK</div>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-yellow-500 text-5xl mb-4">...</div>
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
