import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { getProfile } from "../lib/laundry-admin-client";
import { LAUNDRY_ADMIN_DIDIT_SIGNUP_URL } from "../lib/laundry-onboarding";

import sideImg from "../../assets/c3cadfc0d53d76910fffbccca80883d33cdb8d15.png";

const SIDE_IMG = sideImg;
type AccountType = "Customer" | "LaundryAdmin";

function AccountTypeCard({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all ${
        active
          ? "border-[#1D6076] bg-[#1D6076]/5 ring-2 ring-[#1D6076]/10"
          : "border-gray-200 bg-white hover:border-[#1D6076]/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            active ? "bg-[#1D6076] text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

function resolvePostLoginPath(role?: string, from?: string) {
  const normalizedRole = (role ?? "").toLowerCase();
  if (normalizedRole.includes("laundryadmin")) return "/laundry-admin";
  if (normalizedRole.includes("admin")) return "/admin";
  if (from && from !== "/") return from;
  return "/";
}

async function resolveLaundryAdminLoginPath() {
  try {
    await getProfile();
    return "/laundry-admin";
  } catch {
    return LAUNDRY_ADMIN_DIDIT_SIGNUP_URL;
  }
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, socialLogin } = useAuth();

  const from = searchParams.get("from") || "/";
  const initialRole = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState("");
  const [loginPhase, setLoginPhase] = useState<"idle" | "auth" | "checking">(
    "idle",
  );
  const [accountType, setAccountType] = useState<AccountType>(
    initialRole === "LaundryAdmin" ? "LaundryAdmin" : "Customer",
  );
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const resolvedRole = (result.user?.role ?? "").toLowerCase();
      const isLaundryAdmin = resolvedRole.includes("laundryadmin");

      if (accountType === "LaundryAdmin" && !isLaundryAdmin) {
        setLoading(false);
        setError(
          "This account is not registered as a laundry owner. Switch to customer login or use a Laundry Admin account.",
        );
        return;
      }

      if (isLaundryAdmin) {
        setLoginPhase("checking");
        const nextPath = await resolveLaundryAdminLoginPath();
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
    setError(result.message ?? "Invalid email or password. Please try again.");
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
    <div className="min-h-[calc(100vh-64px)] bg-white flex" dir="ltr">
      <motion.div
        className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 max-w-xl mx-auto w-full lg:max-w-none"
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-md w-full mx-auto">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <h1
              className="text-3xl text-gray-900 mb-1.5"
              style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              Welcome back!
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Sign in to your Ndeef account.{" "}
              <Link
                href={`/signup?role=${accountType}`}
                className="text-[#1D6076] font-medium hover:underline"
              >
                Create account
              </Link>
            </p>
          </motion.div>

          <div className="space-y-3 mb-6">
            <AccountTypeCard
              active={accountType === "Customer"}
              title="I am a customer"
              description="Login to place orders, track deliveries, and manage your laundry account."
              icon={User}
              onClick={() => {
                setAccountType("Customer");
                setError("");
              }}
            />
            <AccountTypeCard
              active={accountType === "LaundryAdmin"}
              title="I own a laundry"
              description="Login as Laundry Admin to manage your branch, continue setup, and go to Didit when needed."
              icon={Store}
              onClick={() => {
                setAccountType("LaundryAdmin");
                setError("");
              }}
            />
          </div>

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

          {accountType === "Customer" ? (
            <div className="space-y-3 mb-6">
              {socialLoad === "google" ? (
                <div className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-2xl py-3.5 text-sm font-medium text-gray-800 opacity-60">
                  <Loader2
                    size={18}
                    className="animate-spin text-gray-500"
                    strokeWidth={2}
                  />
                  Signing in with Google...
                </div>
              ) : (
                <GoogleSignInButton
                  disabled={loading}
                  text="continue_with"
                  onCredential={(credential) => handleSocial("google", credential)}
                />
              )}
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-[#1D6076]/15 bg-[#1D6076]/5 px-4 py-3">
              <p className="text-xs text-[#1D6076] leading-relaxed">
                Laundry owners use email login so the system keeps the Laundry Admin route and onboarding flow correct.
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-400 text-xs font-medium">
              {accountType === "Customer" ? "or" : "email login"}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-[#1D6076] hover:underline"
                  onClick={() =>
                    setError(
                      "Password reset is available in the backend, but this frontend screen is not wired yet.",
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                    errors.password
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
                  }`}
                />
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  strokeWidth={2}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPwd ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                  {loginPhase === "checking"
                    ? "Checking your laundry setup..."
                    : "Signing in..."}
                </>
              ) : accountType === "LaundryAdmin" ? (
                "Sign In as Laundry Owner"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-5 bg-[#1D6076]/5 rounded-2xl px-4 py-3">
            <p className="text-xs text-[#1D6076]/80 text-center">
              Use your real backend account credentials to sign in.
            </p>
          </div>
        </div>
      </motion.div>

      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background:
            accountType === "LaundryAdmin"
              ? "linear-gradient(135deg, #1D6076 0%, #0d3d50 100%)"
              : "linear-gradient(135deg, #1D6076 0%, #0d3d50 100%)",
        }}
      >
        <ImageWithFallback
          src={SIDE_IMG}
          alt="Laundry service"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D6076]/80 via-[#1D6076]/60 to-[#0d3d50]" />
        <div className="relative z-10 flex flex-col justify-center px-14 py-16 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <span className="text-white font-bold text-2xl">Nadeef</span>
          </div>
          <h2
            className="text-4xl text-white mb-5"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {accountType === "LaundryAdmin" ? (
              <>
                Manage your laundry,
                <br />
                all in one place.
              </>
            ) : (
              <>
                Clean clothes,
                <br />
                zero hassle.
              </>
            )}
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            {accountType === "LaundryAdmin"
              ? "Access Laundry Admin tools, finish onboarding, track branch operations, and continue to verification when required."
              : "Your neighborhood laundry, digitally connected. Browse, order, and receive - all from one smart platform."}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["500+", "Orders"],
              ["50+", "Laundries"],
              ["4.9+", "Rating"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-4 text-center border border-white/20"
              >
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-white/50 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
