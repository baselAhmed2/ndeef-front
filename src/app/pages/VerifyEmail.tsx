import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  clearPendingLaundryOnboarding,
  readPendingLaundryOnboarding,
} from "@/app/lib/laundry-onboarding";
import {
  saveLaundryProfile,
  startVerificationSession,
} from "@/app/lib/laundry-admin-client";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const email = searchParams?.get("email") ?? "";
  const requestedRole = searchParams?.get("role") ?? "";
  const next = searchParams?.get("next") ?? "";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      setError("Missing email address for verification.");
      return;
    }

    if (!otpCode.trim()) {
      setError("Verification code is required.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await verifyEmail(email, otpCode.trim());
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Verification failed.");
      return;
    }

    const resolvedRole = (result.user?.role ?? requestedRole).toLowerCase();
    const isLaundryAdmin = resolvedRole.includes("laundryadmin");
    const isCourier = resolvedRole.includes("courier");

    if (isLaundryAdmin) {
      const pendingLaundry = readPendingLaundryOnboarding();

      if (pendingLaundry) {
        try {
          await saveLaundryProfile({
            laundryName: pendingLaundry.laundryName,
            address: pendingLaundry.address,
            latitude: pendingLaundry.latitude,
            longitude: pendingLaundry.longitude,
          });
          clearPendingLaundryOnboarding();
          const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
          const session = await startVerificationSession(redirectUrl);
          window.location.href = session.url;
          return;
        } catch (error) {
          console.error("Failed to complete laundry onboarding", error);
          setError(error instanceof Error ? error.message : "Failed to start identity verification.");
          return;
        }
      }

      try {
        const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
        const session = await startVerificationSession(redirectUrl);
        window.location.href = session.url;
      } catch (error) {
        console.error("Failed to start identity verification", error);
        setError(error instanceof Error ? error.message : "Failed to start identity verification.");
      }
      return;
    }

    router.replace(next || (isCourier ? "/courier" : "/"));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors group"
        >
          <ArrowLeft
            size={16}
            strokeWidth={2}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back
        </button>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1D6076]/10 flex items-center justify-center mb-5">
            <ShieldCheck size={24} className="text-[#1D6076]" strokeWidth={2} />
          </div>

          <h1
            className="text-3xl text-gray-900 mb-2"
            style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Verify your email
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Enter the OTP code the backend sent to{" "}
            <span className="font-medium text-gray-700">{email || "your email"}</span>.
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle
                size={16}
                className="text-red-500 shrink-0"
                strokeWidth={2}
              />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Verification code
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#1D6076] focus:ring-[#1D6076]/20 transition-all"
                />
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D6076] text-white py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2a7a94] active:scale-[0.99] transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                  Verifying...
                </>
              ) : (
                "Verify and continue"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            If you already verified your account, you can{" "}
            <Link href="/login" className="text-[#1D6076] hover:underline">
              sign in here
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
