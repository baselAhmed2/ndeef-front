"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { createVerificationSession, getVerificationStatus } from "@/app/services/api";

export default function VerificationPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAuthReady } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user) {
      router.push("/login");
      return;
    }

    // Check if user is LaundryAdmin
    if (user.role !== "LaundryAdmin" && user.role !== "2") {
      router.push("/");
      return;
    }

    const initVerification = async () => {
      try {
        // First check if already verified
        const statusRes = await getVerificationStatus();
        if (statusRes.isSuccess && statusRes.data?.isVerified) {
          // Already verified, go to dashboard
          router.push("/laundry-admin");
          return;
        }

        // Create verification session
        const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
        const sessionRes = await createVerificationSession(redirectUrl);

        if (sessionRes.isSuccess && sessionRes.data?.url) {
          // Redirect to Didit verification URL
          window.location.href = sessionRes.data.url;
        } else {
          setError(sessionRes.error || "Failed to create verification session");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("An unexpected error occurred. Please try again.");
        setIsLoading(false);
      }
    };

    initVerification();
  }, [isLoggedIn, isAuthReady, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            جاري تحضير التحقق من الهوية...
          </h2>
          <p className="text-gray-600">
            سيتم توجيهك إلى صفحة التحقق الآمنة خلال ثوانٍ
          </p>
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
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return null;
}
