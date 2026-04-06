"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const email = useMemo(() => (searchParams.get("email") ?? "").trim(), [searchParams]);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is missing. Please request a new reset code.");
      return;
    }

    if (!otpCode.trim()) {
      setError("OTP code is required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otpCode.trim(), newPassword);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to reset password.");
      return;
    }

    setSuccess(result.message ?? "Password reset successfully.");
    setTimeout(() => router.push("/login"), 1200);
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

          <h1 className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Reset your password
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Enter the OTP code sent to <span className="font-medium text-gray-700">{email || "your email"}</span> and
            set a new password.
          </p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <AlertCircle size={16} className="text-red-500 shrink-0" strokeWidth={2} />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 mb-5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" strokeWidth={2} />
              <p className="text-emerald-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">OTP code</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#1D6076] focus:ring-[#1D6076]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#1D6076] focus:ring-[#1D6076]/20 transition-all"
                />
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#1D6076] focus:ring-[#1D6076]/20 transition-all"
                />
                <Lock
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
                  Updating password...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            Back to{" "}
            <Link href="/login" className="text-[#1D6076] hover:underline">
              sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
