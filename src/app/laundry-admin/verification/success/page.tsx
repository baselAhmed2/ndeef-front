"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getVerificationStatus, syncVerificationStatus } from "@/app/services/api";
import Link from "next/link";
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

  // Didit may return either verificationSessionId, sessionId, or session_id depending on the callback path.
  const sessionId =
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
  const sessionId = sessionIdFromQuery || sessionIdFromHash;
  const status = searchParams?.get("status");
  const urlStatus = status?.trim().toLowerCase() ?? "";
  
  // Log for debugging
  console.log("Verification callback - Session:", callbackSessionId, "Status:", status);
  console.log("Full URL:", typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    const fallbackSessionId = getPendingLaundryVerificationSession();
    const nextSessionId = callbackSessionId || fallbackSessionId;
    setResolvedSessionId(nextSessionId);
    setHasResolvedSessionLookup(true);

    if (callbackSessionId) {
      clearPendingLaundryVerificationSession();
    }
  }, [callbackSessionId]);

  useEffect(() => {
    if (!isAuthReady || !hasResolvedSessionLookup) return;

    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const checkVerification = async () => {
      try {
        if (!sessionId) {
          setError("Verification session could not be found. Please return to the verification page and try again.");
          return;
        }

        if (sessionId) {
          await syncVerificationStatus(sessionId);
        }

        if (!isLoggedIn || !user) {
          router.push("/login");
          return;
        }

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
          if (cancelled) return;
          const result = await getVerificationStatus(sessionId);

          if (result.isSuccess && result.data?.isVerified) {
            markLaundryVerificationComplete();
            clearPendingLaundryVerificationSession();
            updateUser({ needsVerification: false });
            setIsVerified(true);
            redirectTimeout = setTimeout(() => {
              logout();
              router.replace("/login");
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
              setError("Too many verification checks were sent. Please wait a moment, then return and try again.");
              return;
            }
          }

          if (!result.isSuccess && attempt === MAX_ATTEMPTS - 1) {
            setError(result.error || "Failed to check verification status");
            return;
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            const delayMs = BASE_DELAY_MS + attempt * 1000;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }

        setError(
          "Verification is still being processed. Please try again in a moment.",
        );
      } catch (err) {
        console.error("Error checking verification:", err);
        setError(err instanceof Error ? err.message : "Unable to complete verification right now.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkVerification();

    return () => {
      cancelled = true;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [isLoggedIn, isAuthReady, user, router, logout, resolvedSessionId, updateUser, hasResolvedSessionLookup]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            جاري التحقق من حالة التحقق...
          </h2>
          <p className="text-gray-600">
            يرجى الانتظار بينما نتحقق من اكتمال التحقق
          </p>
        </div>
      </div>
    );
  }

  // Show declined/review status immediately from URL
  if (urlStatus === "declined" || urlStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            تم رفض التحقق
          </h2>
          <p className="text-gray-600 mb-6">
            لم يتم قبول التحقق. يرجى التأكد من صحة المستندات والمحاولة مرة أخرى.
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
            قيد المراجعة
          </h2>
          <p className="text-gray-600 mb-6">
            تم إرسال التحقق للمراجعة. سيتم إخطارك بالنتيجة خلال 24 ساعة.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              التحقق من الحالة
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
            تم التحقق بنجاح!
          </h2>
          <p className="text-gray-600 mb-6">
            تم التحقق من هويتك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول خلال ثوانٍ...
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

  // Not verified yet after several checks
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-yellow-500 text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          جاري معالجة التحقق
        </h2>
        <p className="text-gray-600 mb-6">
          لم يتم الانتهاء من التحقق بعد. إذا كنت قد أكملت التحقق، فقد يستغرق الأمر بضع دقائق للتحديث. يمكنك المحاولة مرة أخرى أو الاتصال بالدعم.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            التحقق من الحالة
          </button>
          <Link
            href="/laundry-admin/verification"
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            إعادة التحقق
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <VerificationSuccessContent />
    </Suspense>
  );
}
