"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getVerificationStatus } from "@/app/services/api";
import Link from "next/link";

function VerificationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isAuthReady, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get params from URL (Didit returns: ?sessionId=xxx&status=Approved)
  const sessionId = searchParams?.get("sessionId") || searchParams?.get("session_id");
  const status = searchParams?.get("status");
  const urlStatus = status?.toLowerCase();
  const isApprovedFromDidit = urlStatus === "approved";
  
  // Log for debugging
  console.log("Verification callback - Session:", sessionId, "Status:", status);
  console.log("Full URL:", typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (!isAuthReady) return;

    let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!isLoggedIn || !user) {
      router.push("/login");
      return () => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
      };
    }

    const checkVerification = async () => {
      try {
        if (isApprovedFromDidit) {
          setIsVerified(true);
          redirectTimeout = setTimeout(() => {
            logout();
            router.replace("/login");
          }, 1500);
          return;
        }

        // Check verification status from backend
        const result = await getVerificationStatus();

        if (result.isSuccess && result.data) {
          setIsVerified(result.data.isVerified);

          // If verified, wait a moment, then send the user to login.
          if (result.data.isVerified) {
            redirectTimeout = setTimeout(() => {
              logout();
              router.replace("/login");
            }, 3000);
          }
        } else {
          setError(result.error || "Failed to check verification status");
        }
      } catch (err) {
        console.error("Error checking verification:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [isLoggedIn, isAuthReady, user, router, logout, isApprovedFromDidit]);

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

  if (urlStatus === "in review" || urlStatus === "pending") {
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

  if (isVerified || urlStatus === "approved") {
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

  // Not verified yet
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
