import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth, SignupData } from "../context/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import {
  clearPendingLaundryOnboarding,
  savePendingLaundryOnboarding,
  type PendingLaundryOnboarding,
} from "../lib/laundry-onboarding";
import {
  setupProfile,
} from "../lib/laundry-admin-client";

const SIDE_IMG =
  "https://images.unsplash.com/photo-1711783059489-8a0da5564785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

type AccountType = "Customer" | "LaundryAdmin";

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < current
                  ? "bg-[#1D6076] text-white"
                  : i === current
                    ? "bg-[#1D6076] text-white ring-4 ring-[#1D6076]/20"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={`h-0.5 w-8 rounded-full transition-all ${
                  i < current ? "bg-[#1D6076]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Step {current + 1} of {total}
      </span>
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
  icon: Icon,
  suffix,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon: React.ElementType;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-gray-50 border rounded-2xl px-4 py-3.5 pl-11 ${
            suffix ? "pr-11" : ""
          } text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
            error
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:border-[#1D6076] focus:ring-[#1D6076]/20"
          }`}
        />
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          strokeWidth={2}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

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

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-4 flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle
        size={16}
        className="text-red-500 shrink-0"
        strokeWidth={2}
      />
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, socialLogin } = useAuth();
  const initialRole = searchParams.get("role");

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
  const [latitude, setLatitude] = useState("30.0444");
  const [longitude, setLongitude] = useState("31.2357");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Invalid email address";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {};
    if (!phone.trim()) nextErrors.phone = "Phone number is required";

    if (accountType === "LaundryAdmin") {
      if (!laundryName.trim()) nextErrors.laundryName = "Laundry name is required";
      if (!laundryAddress.trim()) nextErrors.laundryAddress = "Laundry address is required";
      if (!latitude.trim() || Number.isNaN(Number(latitude))) {
        nextErrors.latitude = "Valid latitude is required";
      }
      if (!longitude.trim() || Number.isNaN(Number(longitude))) {
        nextErrors.longitude = "Valid longitude is required";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const finishLaundryOnboarding = async (data: PendingLaundryOnboarding) => {
    try {
      await setupProfile({
        laundryName: data.laundryName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      clearPendingLaundryOnboarding();
      router.replace("/laundry-admin/verify");
    } catch (error) {
      console.error("Failed to complete laundry onboarding", error);
      router.replace("/laundry-admin/verify");
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
            latitude: Number(latitude),
            longitude: Number(longitude),
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

    if (laundryData) {
      savePendingLaundryOnboarding(laundryData);
    } else {
      clearPendingLaundryOnboarding();
    }

    if (result.requiresVerification) {
      const next =
        accountType === "LaundryAdmin"
          ? `&next=${encodeURIComponent("/laundry-admin/settings?onboarding=1")}`
          : "";
      router.push(
        `/verify-email?email=${encodeURIComponent(result.email ?? email)}&role=${accountType}${next}`,
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
    <div className="min-h-[calc(100vh-64px)] bg-white flex" dir="ltr">
      <div className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-12 max-w-xl mx-auto w-full lg:max-w-none">
        <div className="max-w-md w-full mx-auto">
          <button
            onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm mb-8 transition-colors group"
          >
            <ArrowLeft
              size={16}
              strokeWidth={2}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            {step === 0 ? "Back" : "Previous step"}
          </button>

          {step === 0 && (
            <>
              <h1
                className="text-3xl text-gray-900 mb-1.5"
                style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Create account
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Join Nadeef for free.{" "}
                <Link
                  href="/login"
                  className="text-[#1D6076] font-medium hover:underline"
                >
                  Already have an account?
                </Link>
              </p>

              <div className="space-y-3 mb-6">
                <AccountTypeCard
                  active={accountType === "Customer"}
                  title="I am a customer"
                  description="Order laundry services, track deliveries, and manage your household laundry."
                  icon={User}
                  onClick={() => setAccountType("Customer")}
                />
                <AccountTypeCard
                  active={accountType === "LaundryAdmin"}
                  title="I own a laundry"
                  description="Create your laundry account, register your branch details, then continue to Didit verification."
                  icon={Store}
                  onClick={() => setAccountType("LaundryAdmin")}
                />
              </div>

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
                      text="signup_with"
                      onCredential={(credential) =>
                        handleSocial("google", credential)
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-[#1D6076]/15 bg-[#1D6076]/5 px-4 py-3">
                  <p className="text-xs text-[#1D6076] leading-relaxed">
                    Laundry owners use email sign-up so we can register the account
                    as <span className="font-semibold">Laundry Admin</span> and continue to Didit.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-gray-400 text-xs font-medium">
                  {accountType === "Customer" ? "or" : "continue"}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)",
                }}
              >
                {accountType === "LaundryAdmin"
                  ? "Register Laundry Owner"
                  : "Sign up with Email"}
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <InlineError message={errors.submit} />
            </>
          )}

          {step === 1 && (
            <>
              <StepIndicator current={0} total={2} />
              <h1
                className="text-2xl text-gray-900 mb-1.5"
                style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {accountType === "LaundryAdmin"
                  ? "Create your laundry owner account"
                  : "Let's get started!"}
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {accountType === "LaundryAdmin"
                  ? "We will create your Laundry Admin account first, then link your laundry details in the next step."
                  : "Fill in your basic info to create your account."}
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="First name"
                    placeholder="Basel"
                    value={firstName}
                    onChange={(v) => {
                      setFirstName(v);
                      setErrors((p) => ({ ...p, firstName: "" }));
                    }}
                    error={errors.firstName}
                    icon={User}
                  />
                  <InputField
                    label="Last name"
                    placeholder="Ahmed"
                    value={lastName}
                    onChange={(v) => {
                      setLastName(v);
                      setErrors((p) => ({ ...p, lastName: "" }));
                    }}
                    error={errors.lastName}
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
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  error={errors.email}
                  icon={Mail}
                />
                <InputField
                  label="Create password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  error={errors.password}
                  icon={Lock}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? (
                        <EyeOff size={16} strokeWidth={2} />
                      ) : (
                        <Eye size={16} strokeWidth={2} />
                      )}
                    </button>
                  }
                />
              </div>

              <button
                onClick={() => {
                  if (validateStep1()) {
                    setErrors({});
                    setStep(2);
                  }
                }}
                className="w-full mt-6 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)",
                }}
              >
                Continue
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <InlineError message={errors.submit} />
            </>
          )}

          {step === 2 && (
            <>
              <StepIndicator current={1} total={2} />
              <h1
                className="text-2xl text-gray-900 mb-1.5"
                style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                {accountType === "LaundryAdmin"
                  ? "Add contact and laundry details"
                  : "Almost done!"}
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                {accountType === "LaundryAdmin"
                  ? "We will use these details to register your laundry and send you straight to Didit after verification."
                  : "Add your contact details for smooth delivery."}
              </p>

              <div className="space-y-4">
                <InputField
                  label="Phone number"
                  type="tel"
                  placeholder="+20 1XX XXX XXXX"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    setErrors((p) => ({ ...p, phone: "" }));
                  }}
                  error={errors.phone}
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
                        setErrors((p) => ({ ...p, laundryName: "" }));
                      }}
                      error={errors.laundryName}
                      icon={Store}
                    />
                    <InputField
                      label="Laundry address"
                      placeholder="Street, City"
                      value={laundryAddress}
                      onChange={(v) => {
                        setLaundryAddress(v);
                        setErrors((p) => ({ ...p, laundryAddress: "" }));
                      }}
                      error={errors.laundryAddress}
                      icon={MapPin}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Latitude"
                        placeholder="30.0444"
                        value={latitude}
                        onChange={(v) => {
                          setLatitude(v);
                          setErrors((p) => ({ ...p, latitude: "" }));
                        }}
                        error={errors.latitude}
                        icon={MapPin}
                      />
                      <InputField
                        label="Longitude"
                        placeholder="31.2357"
                        value={longitude}
                        onChange={(v) => {
                          setLongitude(v);
                          setErrors((p) => ({ ...p, longitude: "" }));
                        }}
                        error={errors.longitude}
                        icon={MapPin}
                      />
                    </div>
                  </>
                )}
              </div>

              <InlineError message={errors.submit} />

              <p className="text-xs text-gray-400 mt-4 leading-relaxed text-center">
                By creating an account you agree to our{" "}
                <span className="text-[#1D6076] cursor-pointer hover:underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-[#1D6076] cursor-pointer hover:underline">
                  Privacy Policy
                </span>
              </p>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-5 py-4 rounded-2xl text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all disabled:opacity-70"
                style={{
                  background:
                    accountType === "LaundryAdmin"
                      ? "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)"
                      : "linear-gradient(135deg, #EBA050 0%, #d4832a 100%)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" strokeWidth={2} />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    {accountType === "LaundryAdmin"
                      ? "Create Account and Continue to Didit"
                      : "Create My Account"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background:
            accountType === "LaundryAdmin"
              ? "linear-gradient(135deg, #1D6076 0%, #0d3d50 100%)"
              : "linear-gradient(135deg, #EBA050 0%, #d4832a 100%)",
        }}
      >
        <ImageWithFallback
          src={SIDE_IMG}
          alt="Happy customer"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              accountType === "LaundryAdmin"
                ? "linear-gradient(to bottom right, rgba(29,96,118,0.82), rgba(13,61,80,0.9))"
                : "linear-gradient(to bottom right, rgba(235,160,80,0.8), rgba(212,131,42,0.9))",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-14 py-16 max-w-lg">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xl font-black flex items-center justify-center mb-6">
            {accountType === "LaundryAdmin" ? "LA" : "ND"}
          </div>
          <h2
            className="text-4xl text-white mb-5"
            style={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {accountType === "LaundryAdmin" ? (
              <>
                Grow your laundry
                <br />
                with Ndeef.
              </>
            ) : (
              <>
                Don&apos;t let laundry
                <br />
                slow you down.
              </>
            )}
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            {accountType === "LaundryAdmin"
              ? "Create your laundry owner account, register your branch details, and complete identity verification with Didit to go live."
              : "Join Ndeef and discover a smarter way to manage your laundry - schedule pickups, track orders, and get fresh clothes delivered."}
          </p>
          <div className="space-y-3">
            {(accountType === "LaundryAdmin"
              ? [
                  "Register your laundry branch details",
                  "Complete Didit identity verification",
                  "Start receiving orders on Ndeef",
                ]
              : [
                  "Browse verified local laundries",
                  "Transparent pricing, no surprises",
                  "Real-time order tracking",
                ]
            ).map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
