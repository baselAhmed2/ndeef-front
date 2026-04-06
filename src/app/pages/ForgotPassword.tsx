"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function ForgotPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const value = email.trim();
    if (!value) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    const result = await forgotPassword(value);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to send reset code.");
      return;
    }

    setSuccess(result.message ?? "A reset code has been sent.");
    router.push(`/reset-password?email=${encodeURIComponent(value)}`);
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
            <Mail size={24} className="text-[#1D6076]" strokeWidth={2} />
          </div>

          <h1 className="text-3xl text-gray-900 mb-2" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Forgot your password?
          </h1>

          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Enter your email and we will send you the OTP reset code.
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  Sending code...
                </>
              ) : (
                "Send reset code"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            Remembered your password?{" "}
            <Link href="/login" className="text-[#1D6076] hover:underline">
              Back to sign in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
