"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {

  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Store,
  Check,
  Truck,

} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
// Note: laundry-admin-client functions are dynamically imported in resolveLaundryAdminLoginPath
type AccountType = "Customer" | "LaundryAdmin" | "Courier";

function getNoAccountMessage(accountType: AccountType) {
  switch (accountType) {
    case "LaundryAdmin":
      return "No laundry owner account found with this email.";
    case "Courier":
      return "No courier account found with this email.";
    default:
      return "No customer account found with this email.";
  }
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (v: AccountType) => void;
}) {
  const options: { key: AccountType; label: string; icon: React.ElementType }[] = [
    { key: "Customer", label: "Customer", icon: User },
    { key: "LaundryAdmin", label: "Laundry Owner", icon: Store },
    { key: "Courier", label: "Courier", icon: Truck },
  ];
  return (
    <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
      {options.map(({ key, label, icon: Icon }) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative ${value === key
              ? "text-[#1D6076]"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          {value === key && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white rounded-xl shadow-md shadow-black/5"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Icon size={16} className={value === key ? "text-[#1D6076]" : ""} />
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function resolvePostLoginPath(role?: string, from?: string) {
  const normalizedRole = (role ?? "").toLowerCase();
  if (normalizedRole.includes("courier")) return "/courier";
  if (normalizedRole.includes("laundryadmin")) return "/laundry-admin";
  if (normalizedRole.includes("admin")) return "/admin";
  if (from && from !== "/") return from;
  return "/";
}

async function resolveLaundryAdminLoginPath(
  requiresVerification?: boolean,
  onVerificationResolved?: (needsVerification: boolean) => void,
) {
  try {
    const { getVerificationStatus } = await import("@/app/lib/laundry-admin-client");
    const status = await getVerificationStatus();
    const needsVerification = !status.isIdentityVerified;
    onVerificationResolved?.(needsVerification);
    return needsVerification ? "/laundry-admin/verification" : "/laundry-admin";
  } catch {
    const needsVerification = Boolean(requiresVerification);
    onVerificationResolved?.(needsVerification);
    return needsVerification ? "/laundry-admin/verification" : "/laundry-admin";
  }
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, socialLogin, updateUser } = useAuth();

  const from = searchParams?.get("from") || "/";
  const initialRole = searchParams?.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState("");
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "checking">(
    "idle",
  );
  const [accountType, setAccountType] = useState<AccountType>(
    initialRole === "LaundryAdmin" ? "LaundryAdmin" : initialRole === "Courier" ? "Courier" : "Customer",
  );
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginProgress, setLoginProgress] = useState("");

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    setLoginPhase("auth");
    const result = await login(email, password);

    if (result.ok) {
      const rejectWrongAccountType = (message: string) => {
        logout();
        setLoading(false);
        setLoginPhase("idle");
        setLoginProgress("");
        setError(message);
      };

      const resolvedRole = (result.user?.role ?? "").toLowerCase();
      const isLaundryAdmin = resolvedRole.includes("laundryadmin");
      const isCourier = resolvedRole.includes("courier");
      const isAdmin = resolvedRole.includes("admin");
      const isCustomer = !isLaundryAdmin && !isCourier && !isAdmin;

      if (accountType === "Customer" && !isCustomer) {
        rejectWrongAccountType(getNoAccountMessage("Customer"));
        return;
      }

      if (accountType === "LaundryAdmin" && !isLaundryAdmin) {
        rejectWrongAccountType(getNoAccountMessage("LaundryAdmin"));
        return;
      }

      if (accountType === "Courier" && !isCourier) {
        rejectWrongAccountType(getNoAccountMessage("Courier"));
        return;
      }

      if (isLaundryAdmin) {
        setLoginPhase("checking");
        setLoginProgress("Checking your laundry setup and verification status...");
        const nextPath = await resolveLaundryAdminLoginPath(
          result.requiresVerification,
          (needsVerification) => updateUser({ needsVerification }),
        );
        if (nextPath.startsWith("http")) {
          window.location.href = nextPath;
        } else {
          router.replace(nextPath);
        }
        return;
      }

      router.replace(resolvePostLoginPath(result.user?.role, from));
      return;
    }

    setLoading(false);
    setLoginPhase("idle");
    setLoginProgress("");

    // Better error messages based on backend response
    let errorMessage = result.message ?? "Invalid email or password. Please try again.";

    // Normalize common backend error messages
    if (errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("incorrect")) {
      errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
    } else if (errorMessage.toLowerCase().includes("not found") || errorMessage.toLowerCase().includes("no user")) {
      errorMessage = "No account found with this email. Would you like to create a new account?";
    } else if (errorMessage.toLowerCase().includes("not confirmed") || errorMessage.toLowerCase().includes("verify")) {
      errorMessage = "Please verify your email address before signing in. Check your inbox for the verification code.";
    } else if (errorMessage.toLowerCase().includes("locked") || errorMessage.toLowerCase().includes("blocked")) {
      errorMessage = "Your account has been temporarily locked. Please try again later or contact support.";
    }

    setError(errorMessage);
  };

  const handleSocial = async (provider: string, credential: string) => {
    if (accountType === "LaundryAdmin") {
      setError(
        "Laundry owners should sign in with email so the Laundry Admin setup and verification flow stays correct.",
      );
      return;
    }

    setError("");
    setSocialLoad(provider);
    const result = await socialLogin(provider, credential);
    setSocialLoad("");

    if (result.ok) {
      router.replace(resolvePostLoginPath(result.user?.role, from));
      return;
    }

    setError(result.message ?? "Social sign-in is not available right now.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex" dir="ltr">
      {/* ── Left: Form ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1D6076]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#EBA050]/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[420px] mx-auto relative z-10">
          {/* Back */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            onClick={() => router.back()}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-10 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} strokeWidth={2} />
            </div>
            <span className="font-medium">Back</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-gray-500 text-[15px] mb-8">
              Sign in to your Nadeef account
            </p>
          </motion.div>

          {/* Account type toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SegmentedControl
              value={accountType}
              onChange={(v) => { setAccountType(v); setError(""); }}
            />
          </motion.div>

          {/* Laundry admin hint */}
          {accountType === "LaundryAdmin" && (
            <p className="text-xs text-gray-500 mt-3 mb-1">
              Laundry owners sign in with email to keep the verification flow correct.
              New here?{" "}
              <Link href="/signup?role=LaundryAdmin" className="text-[#1D6076] font-medium hover:underline">
                Register your laundry
              </Link>
            </p>
          )}

          {accountType === "Courier" && (
            <p className="text-xs text-gray-500 mt-3 mb-1">
              Couriers sign in here with their regular account.
              New here?{" "}
              <Link href="/signup?role=Courier" className="text-[#1D6076] font-medium hover:underline">
                Create a courier account
              </Link>
            </p>
          )}

          {/* Error */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex items-start gap-3 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl px-4 py-3.5 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={14} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-700 text-sm leading-snug font-medium">{error}</p>
                  {error === getNoAccountMessage("LaundryAdmin") && accountType === "LaundryAdmin" && (
                    <motion.button
                      type="button"
                      onClick={() => { setAccountType("Customer"); setError(""); }}
                      whileHover={{ x: 2 }}
                      className="mt-2 text-sm text-[#1D6076] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Switch to Customer login
                    </motion.button>
                  )}
                  {error === getNoAccountMessage("Courier") && accountType === "Courier" && (
                    <motion.button
                      type="button"
                      onClick={() => { setAccountType("Customer"); setError(""); }}
                      whileHover={{ x: 2 }}
                      className="mt-2 text-sm text-[#1D6076] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Switch to Customer login
                    </motion.button>
                  )}
                  {error === getNoAccountMessage("Customer") && accountType === "Customer" && (
                    <motion.button
                      type="button"
                      onClick={() => setError("")}
                      whileHover={{ x: 2 }}
                      className="mt-2 text-sm text-[#1D6076] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Try another account type
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social (Customer only) */}
          <AnimatePresence mode="wait">
            {accountType === "Customer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                {socialLoad === "google" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 bg-gray-50/50"
                  >
                    <Loader2 size={18} className="animate-spin" />
                    Signing in with Google…
                  </motion.div>
                ) : (
                  <GoogleSignInButton
                    disabled={loading}
                    text="continue_with"
                    onCredential={(credential) => handleSocial("google", credential)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">
              {accountType === "Customer" ? "or sign in with email" : "sign in with email"}
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleLogin}
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <motion.div
                className="relative group"
                whileTap={{ scale: errors.email ? 1 : 0.995 }}
              >
                <motion.div
                  animate={errors.email ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c5c] transition-colors duration-300" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`w-full border-2 rounded-xl px-4 py-3.5 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.email
                        ? "border-red-400 focus:ring-red-100 focus:border-red-500 bg-red-50/30"
                        : "border-gray-200 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 hover:border-gray-300 bg-white"
                      }`}
                  />
                  <AnimatePresence>
                    {email && !errors.email && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <Check size={16} className="text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="text-red-500 text-xs mt-2 flex items-center gap-1.5 font-medium"
                  >
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <AlertCircle size={14} />
                    </motion.div>
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75, duration: 0.5, type: "spring", stiffness: 100 }}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link
                  href={`/forgot-password?email=${encodeURIComponent(email)}`}
                  className="text-xs text-[#0f4c5c] hover:text-[#0a3440] font-semibold hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <motion.div
                className="relative group"
                whileTap={{ scale: errors.password ? 1 : 0.995 }}
              >
                <motion.div
                  animate={errors.password ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0f4c5c] transition-colors duration-300" />
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`w-full border-2 rounded-xl px-4 py-3.5 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.password
                        ? "border-red-400 focus:ring-red-100 focus:border-red-500 bg-red-50/30"
                        : "border-gray-200 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/10 hover:border-gray-300 bg-white"
                      }`}
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    whileHover={{ scale: 1.1, rotate: showPwd ? -15 : 15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f4c5c] p-1.5 rounded-lg hover:bg-[#0f4c5c]/10 transition-all duration-200"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showPwd ? "eyeoff" : "eye"}
                        initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                      >
                        {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              </motion.div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="text-red-500 text-xs mt-2 flex items-center gap-1.5 font-medium"
                  >
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <AlertCircle size={14} />
                    </motion.div>
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 100 }}
              className="relative"
            >
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative overflow-hidden w-full py-4 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-xl shadow-[#0f4c5c]/30 hover:shadow-2xl hover:shadow-[#0f4c5c]/40"
              >
                {/* Shimmer effect */}
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
                      <span>{loginProgress || (loginPhase === "checking" ? "Checking setup…" : "Signing in…")}</span>
                    </motion.div>
                    ) : accountType === "LaundryAdmin" ? (
                      <motion.div
                        key="laundry"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 relative z-10"
                      >
                        <Store size={18} />
                        <span>Sign In as Laundry Owner</span>
                      </motion.div>
                    ) : accountType === "Courier" ? (
                      <motion.div
                        key="courier"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 relative z-10"
                      >
                        <Truck size={18} />
                        <span>Sign In as Courier</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="signin"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative z-10"
                    >
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            <AnimatePresence>
              {loading && loginProgress && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-[#1D6076]/70 text-center font-medium"
                >
                  {loginProgress}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Footer */}
          <p className="mt-8 text-sm text-gray-500 text-center">
            {accountType === "LaundryAdmin" ? (
              <>
                New laundry owner?{" "}
                <Link href="/signup?role=LaundryAdmin" className="text-[#1D6076] font-medium hover:underline">
                  Create an account
                </Link>
              </>
            ) : accountType === "Courier" ? (
              <>
                Need a courier account?{" "}
                <Link href="/signup?role=Courier" className="text-[#1D6076] font-medium hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#1D6076] font-medium hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </div>
      </motion.div>

      {/* ── Right: Brand panel ── */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-[#1D6076] to-[#164d5f] relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -60, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Nadeef</span>
        </motion.div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={accountType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-[36px] font-bold text-white leading-tight mb-4">
                {accountType === "LaundryAdmin" ? (
                  <>Manage your laundry,<br />all in one place.</>
                ) : accountType === "Courier" ? (
                  <>Deliver orders,<br />stay in motion.</>
                ) : (
                  <>Clean clothes,<br />zero hassle.</>
                )}
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-10 max-w-sm">
                {accountType === "LaundryAdmin"
                  ? "Track orders, manage services, and grow your business with Nadeef."
                  : accountType === "Courier"
                    ? "Use the regular login and signup flow, then head straight to your courier dashboard."
                  : "Browse verified laundries, schedule pickups, and get fresh clothes delivered to your door."}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-8">
            {[["500+", "Orders"], ["50+", "Laundries"], ["4.9", "Rating"]].map(([v, l], i) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="cursor-default"
              >
                <p className="text-white font-bold text-2xl">{v}</p>
                <p className="text-white/50 text-sm">{l}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-white/30 text-xs relative z-10"
        >
          © {new Date().getFullYear()} Nadeef. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
