"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Sparkles,
  Shield,
  Key,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function ForgotPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState(searchParams?.get("email") ?? "");
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
    setTimeout(() => {
      router.push(`/reset-password?email=${encodeURIComponent(value)}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Left Panel - Form */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12"
      >
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onClick={() => router.push("/login")}
            whileHover={{ x: -4 }}
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0f4c5c] transition-colors mb-8"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to login
          </motion.button>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4c5c] to-[#2d6b7a] flex items-center justify-center mb-6 shadow-lg shadow-[#0f4c5c]/25"
            >
              <Key size={28} className="text-white" strokeWidth={2} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 mb-3 tracking-tight"
            >
              Forgot password?
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-gray-500 text-sm mb-8 leading-relaxed"
            >
              No worries! Enter your email and we&apos;ll send you a magic link to reset your password.
            </motion.p>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-5"
                >
                  <div className="flex items-center gap-2 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-xl">
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <AlertCircle size={18} className="text-red-500 shrink-0" />
                    </motion.div>
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-5"
                >
                  <div className="flex items-center gap-2 p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    </motion.div>
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative group">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c5c] transition-colors"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className={`w-full border-2 rounded-xl px-4 py-4 pl-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-300 ${
                      error
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30"
                        : "border-gray-200 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 hover:border-gray-300"
                    }`}
                  />
                  <AnimatePresence>
                    {email && !error && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle2 size={18} className="text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading || !email}
                  whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="relative overflow-hidden w-full py-4 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-xl shadow-[#0f4c5c]/30 hover:shadow-2xl hover:shadow-[#0f4c5c]/40"
                >
                  {/* Shimmer Effect */}
                  {!loading && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatDelay: 3 }}
                    />
                  )}
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 relative z-10"
                      >
                        <Loader2 size={18} className="animate-spin" />
                        <span>Sending magic link...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="submit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 relative z-10"
                      >
                        <Sparkles size={18} />
                        <span>Send Reset Link</span>
                        <ArrowRight size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <p className="text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#0f4c5c] hover:text-[#0a3440] transition-colors hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Visual */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0f4c5c] via-[#1a5a6a] to-[#2d6b7a] relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Circles */}
          <motion.div
            animate={{
              y: [0, -30, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-white/3 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-md"
          >
            {/* Large Icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8 border border-white/20"
            >
              <Lock size={48} className="text-white" strokeWidth={1.5} />
            </motion.div>

            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Security First
            </h2>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              We&apos;ve got your back! Our secure password recovery process ensures only you can access your account.
            </p>

            {/* Feature List */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Bank-level encryption" },
                { icon: Mail, text: "Instant email delivery" },
                { icon: Key, text: "Secure OTP verification" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <item.icon size={22} className="text-white" />
                  </div>
                  <span className="text-white/90 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f4c5c]/50 to-transparent" />
      </motion.div>
    </div>
  );
}
