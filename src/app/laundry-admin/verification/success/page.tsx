"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getVerificationStatus } from "@/app/lib/laundry-admin-client";

export default function VerificationSuccessPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user) {
      router.push("/login");
      return;
    }

    async function checkStatus() {
      try {
        const status = await getVerificationStatus();
        setVerified(Boolean(status.isIdentityVerified));
        if (status.isIdentityVerified) {
          window.setTimeout(() => router.push("/laundry-admin"), 2500);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not check verification status.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [isLoggedIn, isAuthReady, user, router]);

  const Icon = loading ? Loader2 : error ? ShieldAlert : verified ? CheckCircle2 : Clock;
  const bodyText = loading
    ? "Please wait while we confirm the latest status with the backend."
    : error
      ? error
      : verified
        ? "Your identity is verified. Redirecting to your laundry dashboard."
        : "If you completed Didit verification, the backend may take a few minutes to update.";

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${
            error
              ? "bg-red-50 text-red-600"
              : verified
                ? "bg-green-50 text-green-600"
                : "bg-[#1D5B70]/10 text-[#1D5B70]"
          }`}
        >
          <Icon className={`h-8 w-8 ${loading ? "animate-spin" : ""}`} />
        </div>
        <h2 className="text-xl font-black text-gray-950">
          {loading
            ? "Checking verification status"
            : error
              ? "Status check failed"
              : verified
                ? "Verification complete"
                : "Verification is processing"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {bodyText}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/laundry-admin"
            className="rounded-2xl bg-[#1D5B70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17495a]"
          >
            Go to Dashboard
          </Link>
          {!verified && (
            <Link
              href="/laundry-admin/verification"
              className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Retry
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
