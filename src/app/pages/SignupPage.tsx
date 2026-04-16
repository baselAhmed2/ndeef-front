"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Check,
  Store,
} from "lucide-react";
import MapPicker from "../components/MapPicker";
import { useAuth, SignupData } from "../context/AuthContext";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import {
  clearPendingLaundryOnboarding,
  savePendingLaundryOnboarding,
  type PendingLaundryOnboarding,
} from "../lib/laundry-onboarding";
import { saveLaundryProfile, startVerificationSession } from "../lib/laundry-admin-client";

type AccountType = "Customer" | "LaundryAdmin";

// Elegant Royal Teal Color

function StepIndicator({ current, total }: { current: number; total: number }) {
  const steps = ["Account Info", "Contact & Location"];

  return (
    <div className="mb-8">
      <div className="relative mb-6">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] rounded-full"
          />
        </div>
      </div>

      <div className="flex items-start justify-between">
        {steps.map((label, i) => {
          const isCompleted = i < current;
          const isActive = i === current;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex flex-col items-center gap-2 flex-1"
            >
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-300 ${isCompleted
                    ? "bg-gradient-to-br from-[#0f4c5c] to-[#2d6b7a] text-white shadow-lg shadow-[#0f4c5c]/30"
                    : isActive
                      ? "bg-gradient-to-br from-[#0f4c5c] to-[#2d6b7a] text-white ring-4 ring-[#0f4c5c]/20 shadow-xl shadow-[#0f4c5c]/25"
                      : "bg-gray-100 text-gray-400"
                  }`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              <span className={`text-xs font-medium text-center transition-colors ${isActive ? "text-[#0f4c5c]" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}>
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  valid,
  icon: Icon,
  suffix,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  valid?: boolean;
  icon: React.ElementType;
  suffix?: React.ReactNode;
}) {
  const touched = value.length > 0;
  const showCheck = valid && touched && !error;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative group">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border rounded-xl px-4 py-3.5 pl-10 ${suffix ? "pr-10" : showCheck ? "pr-10" : ""
            } text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${error
              ? "border-red-300 focus:ring-red-200 focus:border-red-300"
              : showCheck
                ? "border-green-300 focus:ring-green-200 focus:border-green-300"
                : "border-gray-200 focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/15 hover:border-gray-300"
            }`}
        />
        <Icon
          size={16}
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-400" : showCheck ? "text-green-500" : "text-gray-400 group-focus-within:text-[#0f4c5c]"
            }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
        {showCheck && !suffix && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Check size={16} className="text-green-500" />
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-red-500 text-xs mt-1.5 flex items-center gap-1"
          >
            <AlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
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
              ? "text-[#0f4c5c]"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          {value === key && (
            <motion.div
              layoutId="activeSignupTab"
              className="absolute inset-0 bg-white rounded-xl shadow-md shadow-black/5"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Icon size={16} className={value === key ? "text-[#0f4c5c]" : ""} />
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
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
      <p className="text-red-700 text-sm leading-snug font-medium">{message}</p>
    </motion.div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isLong = password.length >= 6;
  const isStrong = isLong && hasLetter && hasNumber;
  const isFair = isLong && !isStrong;

  const level = isStrong ? 3 : isFair ? 2 : password.length >= 3 ? 1 : 0;
  const label = isStrong ? "Strong" : isFair ? "Fair" : password.length >= 3 ? "Weak" : "";
  const color = isStrong ? "bg-emerald-500" : isFair ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex items-center gap-1 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            backgroundColor: i <= level ? undefined : "#e5e7eb",
            scale: i <= level ? 1 : 0.95
          }}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= level ? color : "bg-gray-200"}`}
        />
      ))}
      {label && <span className="text-xs text-gray-400 ml-2 font-medium">{label}</span>}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, socialLogin } = useAuth();
  const initialRole = searchParams?.get("role");

  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<AccountType>(
    initialRole === "LaundryAdmin" ? "LaundryAdmin" : "Customer",
  );
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [laundryName, setLaundryName] = useState("");
  const [laundryAddress, setLaundryAddress] = useState("");
  const [latitude, setLatitude] = useState(30.0444);
  const [longitude, setLongitude] = useState(31.2357);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFieldValid = (field: string, value: string): boolean => {
    switch (field) {
      case "firstName": return value.trim().length >= 2;
      case "lastName": return value.trim().length >= 2;
      case "email": return /\S+@\S+\.\S+/.test(value);
      case "password": return value.length >= 6 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
      case "phone": return /^[+]?20?\s*1[0-2|5]\s*\d{8}$|^0?1[0-2|5]\s*\d{8}$/.test(value.replace(/\s/g, ""));
      case "laundryName": return value.trim().length >= 3 && /[A-Za-z\u0600-\u06FF]/.test(value);
      default: return true;
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(value)) return "Enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Must be at least 6 characters";
        if (!/[A-Za-z]/.test(value)) return "Must include a letter";
        if (!/[0-9]/.test(value)) return "Must include a number";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!/^\+?20?\s*1[0-2|5]\s*\d{8}$|^0?1[0-2|5]\s*\d{8}$/.test(value.replace(/\s/g, ""))) {
          return "Enter a valid Egyptian phone number (e.g., +20 1XX XXX XXXX or 01XX XXX XXXX)";
        }
        return "";
      case "laundryName":
        if (!value.trim()) return "Laundry name is required";
        if (value.trim().length < 3) return "Must be at least 3 characters";
        if (!/[A-Za-z\u0600-\u06FF]/.test(value)) return "Must contain at least one letter";
        return "";
      default: return "";
    }
  };

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    const fnErr = validateField("firstName", firstName);
    if (fnErr) nextErrors.firstName = fnErr;
    const lnErr = validateField("lastName", lastName);
    if (lnErr) nextErrors.lastName = lnErr;
    const emErr = validateField("email", email);
    if (emErr) nextErrors.email = emErr;
    const pwErr = validateField("password", password);
    if (pwErr) nextErrors.password = pwErr;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    const phoneErr = validateField("phone", phone);
    if (phoneErr) nextErrors.phone = phoneErr;

    if (accountType === "LaundryAdmin") {
      const lnErr = validateField("laundryName", laundryName);
      if (lnErr) nextErrors.laundryName = lnErr;
      if (!laundryAddress.trim()) nextErrors.laundryAddress = "Laundry address is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const finishLaundryOnboarding = async (data: PendingLaundryOnboarding) => {
    try {
      await saveLaundryProfile({
        laundryName: data.laundryName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      clearPendingLaundryOnboarding();
      router.replace("/laundry-admin");
    } catch (error) {
      console.error("Failed to complete laundry onboarding", error);
      router.replace("/laundry-admin");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, submit: "" }));

    const signupData: SignupData = {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      role: accountType,
    };

    const laundryData: PendingLaundryOnboarding | null =
      accountType === "LaundryAdmin"
        ? {
          laundryName: laundryName.trim(),
          address: laundryAddress.trim(),
          latitude: latitude,
          longitude: longitude,
        }
        : null;

    const result = await signup(signupData);
    setLoading(false);

    if (!result.ok) {
      setErrors((prev) => ({
        ...prev,
        submit: result.message ?? "Unable to create your account.",
      }));
      return;
    }

    if (accountType === "LaundryAdmin") {
      try {
        if (laundryData) {
          await saveLaundryProfile({
            laundryName: laundryData.laundryName,
            address: laundryData.address,
            latitude: laundryData.latitude,
            longitude: laundryData.longitude,
          });
          clearPendingLaundryOnboarding();
        }
        const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
        const session = await startVerificationSession(redirectUrl);
        window.location.href = session.url;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not start identity verification.";
        setErrors((prev) => ({
          ...prev,
          submit: message,
        }));
      }
      return;
    }

    if (laundryData) {
      savePendingLaundryOnboarding(laundryData);
    } else {
      clearPendingLaundryOnboarding();
    }

    if (result.requiresVerification) {
      // For other users, redirect to email verification
      router.push(
        `/verify-email?email=${encodeURIComponent(result.email ?? email)}&role=${accountType}`,
      );
      return;
    }

    if (accountType === "LaundryAdmin" && laundryData) {
      await finishLaundryOnboarding(laundryData);
      return;
    }

    router.replace("/");
  };

  const handleSocial = async (provider: string, credential: string) => {
    if (accountType === "LaundryAdmin") {
      setErrors((prev) => ({
        ...prev,
        submit:
          "Laundry owners should sign up with email so we can create a Laundry Admin account and continue to verification.",
      }));
      return;
    }

    setSocialLoad(provider);
    const result = await socialLogin(provider, credential);
    setSocialLoad("");

    if (result.ok) {
      router.replace("/");
      return;
    }

    setErrors((prev) => ({
      ...prev,
      submit: result.message ?? "Social sign-up is not available right now.",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex" dir="ltr">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0f4c5c]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#c9a227]/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[420px] mx-auto relative z-10">
          {/* Header with Back */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                <ArrowLeft size={16} strokeWidth={2} />
              </div>
              <span>{step === 0 ? "Back" : "Step " + step}</span>
            </motion.button>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-medium text-gray-400"
            >
              Step {step + 1} of 3
            </motion.span>
          </div>

          {/* Step 0 - Account Type Selection */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[32px] font-bold text-gray-900 tracking-tight mb-2"
              >
                Create account
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-[15px] mb-8"
              >
                Join Nadeef for free.{" "}
                <Link href="/login" className="text-[#0f4c5c] font-semibold hover:underline transition-colors">
                  Already have an account?
                </Link>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SegmentedControl value={accountType} onChange={setAccountType} />
              </motion.div>

              <AnimatePresence mode="wait">
                {accountType === "LaundryAdmin" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-gray-500 mt-3"
                  >
                    Laundry owners sign up with email so we can register the account as Laundry Admin and continue to verification.
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {accountType === "Customer" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    {socialLoad === "google" ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-500 bg-gray-50/50"
                      >
                        <Loader2 size={18} className="animate-spin" />
                        Signing up with Google…
                      </motion.div>
                    ) : (
                      <GoogleSignInButton
                        disabled={loading}
                        text="signup_with"
                        onCredential={(credential) => handleSocial("google", credential)}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 my-6"
              >
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs">
                  {accountType === "Customer" ? "or sign up with email" : "sign up with email"}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => setStep(1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-lg shadow-[#0f4c5c]/25"
              >
                {accountType === "LaundryAdmin" ? "Register Laundry Owner" : "Sign up with Email"}
                <ArrowRight size={18} />
              </motion.button>

              <InlineError message={errors.submit} />
            </motion.div>
          )}

          {/* Step 1 - Personal Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <StepIndicator current={0} total={2} />

              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">
                  {accountType === "LaundryAdmin"
                    ? "Create your account"
                    : "Let's get started"}
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {accountType === "LaundryAdmin"
                    ? "Enter your details to register as a laundry owner. We'll verify your business next."
                    : "Enter your details to create your customer account."}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="First name"
                    placeholder="Basel"
                    value={firstName}
                    onChange={(v) => {
                      setFirstName(v);
                      const err = v.length > 0 ? validateField("firstName", v) : "";
                      setErrors((p) => ({ ...p, firstName: err }));
                    }}
                    error={errors.firstName}
                    valid={isFieldValid("firstName", firstName)}
                    icon={User}
                  />
                  <InputField
                    label="Last name"
                    placeholder="Ahmed"
                    value={lastName}
                    onChange={(v) => {
                      setLastName(v);
                      const err = v.length > 0 ? validateField("lastName", v) : "";
                      setErrors((p) => ({ ...p, lastName: err }));
                    }}
                    error={errors.lastName}
                    valid={isFieldValid("lastName", lastName)}
                    icon={User}
                  />
                </div>
                <InputField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    const err = v.length > 0 ? validateField("email", v) : "";
                    setErrors((p) => ({ ...p, email: err }));
                  }}
                  error={errors.email}
                  valid={isFieldValid("email", email)}
                  icon={Mail}
                />
                <InputField
                  label="Create password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    const err = v.length > 0 ? validateField("password", v) : "";
                    setErrors((p) => ({ ...p, password: err }));
                  }}
                  error={errors.password}
                  valid={isFieldValid("password", password)}
                  icon={Lock}
                  suffix={
                    <motion.button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showPwd ? "eyeoff" : "eye"}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </motion.div>
                      </AnimatePresence>
                    </motion.button>
                  }
                />
                {password.length > 0 && !errors.password && (
                  <PasswordStrength password={password} />
                )}
              </div>

              <motion.button
                onClick={() => {
                  if (validateStep1()) {
                    setErrors({});
                    setStep(2);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-8 py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-lg shadow-[#0f4c5c]/25"
              >
                Continue to next step
                <ArrowRight size={18} />
              </motion.button>

              <InlineError message={errors.submit} />
            </motion.div>
          )}

          {/* Step 2 - Contact & Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <StepIndicator current={1} total={2} />

              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900 tracking-tight mb-2">
                  {accountType === "LaundryAdmin"
                    ? "Add your laundry details"
                    : "One more step"}
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {accountType === "LaundryAdmin"
                    ? "Enter your contact information and select your laundry location on the map."
                    : "Add your phone number so we can reach you about your orders."}
                </p>
              </div>

              <div className="space-y-4">
                <InputField
                  label="Phone number"
                  type="tel"
                  placeholder="+20 1XX XXX XXXX"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    const err = v.length > 0 ? validateField("phone", v) : "";
                    setErrors((p) => ({ ...p, phone: err }));
                  }}
                  error={errors.phone}
                  valid={isFieldValid("phone", phone)}
                  icon={Phone}
                />

                {accountType === "Customer" ? (
                  <InputField
                    label="Home address (optional)"
                    placeholder="Street, City"
                    value={address}
                    onChange={setAddress}
                    icon={MapPin}
                  />
                ) : (
                  <>
                    <InputField
                      label="Laundry name"
                      placeholder="Ndeef Laundry"
                      value={laundryName}
                      onChange={(v) => {
                        setLaundryName(v);
                        const err = v.length > 0 ? validateField("laundryName", v) : "";
                        setErrors((p) => ({ ...p, laundryName: err }));
                      }}
                      error={errors.laundryName}
                      valid={isFieldValid("laundryName", laundryName)}
                      icon={Store}
                    />

                    {/* Map Picker for Laundry Location */}
                    <div className="border-t border-gray-100 pt-4 mt-2">
                      <MapPicker
                        onLocationSelect={(location) => {
                          setLaundryAddress(location.address);
                          setLatitude(location.latitude);
                          setLongitude(location.longitude);
                          setErrors((p) => ({ ...p, laundryAddress: "" }));
                        }}
                        initialAddress={laundryAddress}
                        initialLat={latitude}
                        initialLng={longitude}
                      />
                      {errors.laundryAddress && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {errors.laundryAddress}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <InlineError message={errors.submit} />

              <p className="text-xs text-gray-400 mt-4 leading-relaxed text-center">
                By creating an account you agree to our{" "}
                <span className="text-[#0f4c5c] cursor-pointer hover:underline font-medium">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-[#0f4c5c] cursor-pointer hover:underline font-medium">
                  Privacy Policy
                </span>
              </p>

              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full mt-6 py-3.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg ${accountType === "LaundryAdmin"
                    ? "bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-[#0f4c5c]/30"
                    : "bg-gradient-to-r from-[#0f4c5c] to-[#2d6b7a] hover:from-[#0a3440] hover:to-[#0f4c5c] shadow-[#0f4c5c]/30"
                  }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating your account…
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    {accountType === "LaundryAdmin"
                      ? "Complete Registration"
                      : "Create My Account"}
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-[#0f4c5c] to-[#0a3440] relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, -60, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#c9a227]/10 rounded-full blur-3xl"
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
                ) : (
                  <>Clean clothes,<br />zero hassle.</>
                )}
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-10 max-w-sm">
                {accountType === "LaundryAdmin"
                  ? "Track orders, manage services, and grow your business with Nadeef."
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
