"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getProfile, setupProfile, startVerificationSession, uploadCommercialRegister } from "@/app/lib/laundry-admin-client";
import { LAUNDRY_ADMIN_DIDIT_SIGNUP_URL } from "@/app/lib/laundry-onboarding";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  ShoppingBag,
  CreditCard,
  Star,
  Globe,
  Moon,
  Save,
  CheckCircle2,
  Camera,
  Eye,
  EyeOff,
  AlertCircle,
  WashingMachine,
  ShieldCheck,
  FileCheck2,
  UploadCloud,
  Loader2,
} from "lucide-react";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative shrink-0 rounded-full transition-all duration-200"
      style={{
        width: 44,
        height: 24,
        backgroundColor: value ? "#1D5B70" : "#e2e8f0",
      }}
    >
      <div
        className="absolute top-0.5 rounded-full bg-white shadow transition-all duration-200"
        style={{ width: 20, height: 20, left: value ? 22 : 2 }}
      />
    </button>
  );
}

export function Settings() {
  const searchParams = useSearchParams();
  const onboardingMode = searchParams.get("onboarding") === "1";
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "preferences">(
    "profile"
  );

  const [profile, setProfile] = useState({
    name: "Ahmad Hassan",
    email: "admin@ndeef.com",
    phone: "+20 10 1234 5678",
    laundryName: "Ndeef Laundry",
    address: "123 Main Street, Cairo, Egypt",
    latitude: 30.0444,
    longitude: 31.2357,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    orderReady: true,
    paymentReceived: true,
    newReview: true,
    systemAlerts: false,
    promotions: false,
    smsAlerts: true,
    emailDigest: false,
  });

  const [preferences, setPreferences] = useState({
    language: "English",
    currency: "EGP",
    darkMode: false,
    compactView: false,
    autoConfirmOrders: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProf() {
      try {
        const data = await getProfile().catch(() => null);
        if (data) setProfile((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    loadProf();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await setupProfile(profile);
      if (onboardingMode) {
        window.location.href = LAUNDRY_ADMIN_DIDIT_SIGNUP_URL;
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [commRegFile, setCommRegFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleYakeenVerification = async () => {
    try {
      setVerifying(true);
      const res = await startVerificationSession();
      if (res?.url) window.location.href = res.url;
    } catch (e) {
      console.error(e);
      setTimeout(() => setVerifying(false), 2000);
    }
  };

  const handleUploadRegister = async () => {
    if (!commRegFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", commRegFile);
      await uploadCommercialRegister(formData);
      setCommRegFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "preferences" as const, label: "Preferences", icon: Globe },
  ];

  return (
    <div className="p-6 space-y-5 w-full">
      {onboardingMode && (
        <div className="rounded-2xl border border-[#1D5B70]/15 bg-[#1D5B70]/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-[#1D5B70]">
            Complete your laundry registration
          </h3>
          <p className="text-xs text-[#1D5B70]/80 mt-1 leading-relaxed">
            Save your laundry details first. After saving, we will continue automatically to Didit for identity verification.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-gray-900 font-semibold">Settings</h2>
          <p className="text-gray-400 text-xs mt-0.5">Manage your account and preferences</p>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: saved ? "#22c55e" : "#1D5B70" }}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : saved ? "Changes Saved!" : onboardingMode ? "Save and Continue to Didit" : "Save Changes"}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Avatar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Profile Picture</h3>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
                    style={{ backgroundColor: "#1D5B70" }}
                  >
                    A
                  </div>
                  <button
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all"
                    style={{ color: "#1D5B70" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Laundry Admin</p>
                  <button className="mt-2 text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Laundry Name
                  </label>
                  <div className="relative">
                    <WashingMachine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={profile.laundryName}
                      onChange={(e) => setProfile({ ...profile, laundryName: e.target.value })}
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Laundry Address
                  </label>
                  <input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={profile.latitude}
                    onChange={(e) => setProfile({ ...profile, latitude: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={profile.longitude}
                    onChange={(e) => setProfile({ ...profile, longitude: Number(e.target.value) })}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                  />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full h-10 pl-9 pr-10 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        placeholder="New password"
                        className="w-full h-10 pl-9 pr-10 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                    />
                  </div>
                </div>
                {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                  <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Passwords do not match
                  </div>
                )}
              </div>
            </div>

            {/* Account Verification */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50" />
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Account Verification</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Connect to official registers to unlock all features.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yakeen / Absher */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Yakeen / Absher</h4>
                    <p className="text-xs text-gray-400 mb-4">Official digital identity verification</p>
                  </div>
                  <button 
                    onClick={handleYakeenVerification}
                    disabled={verifying}
                    className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {verifying ? "Redirecting..." : "Verify Identity"}
                  </button>
                </div>

                {/* Commercial Register */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">Commercial Register</h4>
                    <p className="text-xs text-gray-400 mb-4">Upload your CR certificate</p>
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => setCommRegFile(e.target.files?.[0] || null)}
                    />
                    {!commRegFile ? (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" /> Select PDF/Image
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 bg-white border border-gray-200 h-9 px-3 rounded-lg flex items-center">
                          <span className="text-xs text-gray-600 truncate">{commRegFile.name}</span>
                        </div>
                        <button 
                          onClick={handleUploadRegister}
                          disabled={uploading}
                          className="h-9 px-3 shrink-0 flex items-center justify-center text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {uploading ? "..." : <FileCheck2 className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Push Notifications</h3>
              <p className="text-xs text-gray-400 mb-5">Choose what updates you want to receive</p>
              <div className="space-y-4">
                {[
                  {
                    key: "newOrder" as const,
                    label: "New Order Received",
                    desc: "Get notified when a customer places a new order",
                    icon: ShoppingBag,
                    color: "#1D5B70",
                    bg: "#f0f9ff",
                  },
                  {
                    key: "orderReady" as const,
                    label: "Order Ready",
                    desc: "When an order is ready for delivery",
                    icon: CheckCircle2,
                    color: "#22c55e",
                    bg: "#f0fdf4",
                  },
                  {
                    key: "paymentReceived" as const,
                    label: "Payment Received",
                    desc: "When a customer completes a payment",
                    icon: CreditCard,
                    color: "#22c55e",
                    bg: "#f0fdf4",
                  },
                  {
                    key: "newReview" as const,
                    label: "New Review",
                    desc: "When a customer leaves a review",
                    icon: Star,
                    color: "#EBA050",
                    bg: "#fff7ed",
                  },
                  {
                    key: "systemAlerts" as const,
                    label: "System Alerts",
                    desc: "Important system and maintenance updates",
                    icon: AlertCircle,
                    color: "#ef4444",
                    bg: "#fef2f2",
                  },
                  {
                    key: "promotions" as const,
                    label: "Platform Promotions",
                    desc: "Offers and updates from Ndeef platform",
                    icon: Bell,
                    color: "#8b5cf6",
                    bg: "#f5f3ff",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: item.bg }}
                        >
                          <Icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        value={notifications[item.key]}
                        onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Other Channels</h3>
              <p className="text-xs text-gray-400 mb-5">Receive notifications via other methods</p>
              <div className="space-y-4">
                {[
                  {
                    key: "smsAlerts" as const,
                    label: "SMS Alerts",
                    desc: "Receive critical notifications via SMS",
                    icon: Phone,
                  },
                  {
                    key: "emailDigest" as const,
                    label: "Weekly Email Digest",
                    desc: "Get a weekly summary of your orders and revenue",
                    icon: Mail,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        value={notifications[item.key]}
                        onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Regional Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Currency
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20 bg-white"
                  >
                    <option>EGP</option>
                    <option>USD</option>
                    <option>SAR</option>
                    <option>AED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Display & Behavior</h3>
              <p className="text-xs text-gray-400 mb-5">Customize how the app looks and works</p>
              <div className="space-y-4">
                {[
                  {
                    key: "darkMode" as const,
                    label: "Dark Mode",
                    desc: "Switch to a darker color theme",
                    icon: Moon,
                  },
                  {
                    key: "compactView" as const,
                    label: "Compact View",
                    desc: "Show more items with reduced spacing",
                    icon: Globe,
                  },
                  {
                    key: "autoConfirmOrders" as const,
                    label: "Auto-Confirm Orders",
                    desc: "Automatically accept incoming orders",
                    icon: CheckCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        value={preferences[item.key]}
                        onChange={(v) => setPreferences((prev) => ({ ...prev, [item.key]: v }))}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-red-100 p-6">
              <h3 className="font-semibold text-red-600 mb-1">Danger Zone</h3>
              <p className="text-xs text-gray-400 mb-4">These actions are irreversible</p>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 text-sm text-red-500 hover:bg-red-50 transition-all">
                  <span>Delete All Order History</span>
                  <AlertCircle className="w-4 h-4" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-100 text-sm text-red-600 font-medium hover:bg-red-50 transition-all">
                  <span>Delete Account</span>
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

