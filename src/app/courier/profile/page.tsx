"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Bell,
  LogOut,
  Wifi,
  WifiOff,
  Phone,
  Truck,
  TrendingUp,
  User,
  Loader2,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import {
  announceCourierNotificationCountUpdated,
  announceCourierProfileUpdated,
  getCourierEarnings,
  getCourierProfile,
  getCourierUnreadNotificationCount,
  subscribeCourierNotificationCountUpdates,
  subscribeCourierProfileUpdates,
  updateCourierProfileDetails,
  updateCourierStatus,
} from "@/app/lib/courier-client";
import { ApiError } from "@/app/lib/admin-api";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CourierProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCourierProfile>> | null>(null);
  const [earnings, setEarnings] = useState<Awaited<ReturnType<typeof getCourierEarnings>> | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [available, setAvailable] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyProfileSnapshot = (nextProfile: Awaited<ReturnType<typeof getCourierProfile>>) => {
    setProfile(nextProfile);
    setAvailable(nextProfile.isOnline);
    setProfileNameInput(nextProfile.name || "");
    setPhoneInput(nextProfile.phone || "");
  };

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const [result, earningsResult, unreadCount] = await Promise.all([
          getCourierProfile(),
          getCourierEarnings().catch(() => null),
          getCourierUnreadNotificationCount().catch(() => 0),
        ]);
        if (ignore) return;
        applyProfileSnapshot(result);
        setEarnings(earningsResult);
        setNotificationCount(unreadCount);
        announceCourierNotificationCountUpdated(unreadCount);
      } catch (loadError) {
        if (ignore) return;
        setError(loadError instanceof ApiError ? loadError.message : "Unable to load courier profile.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCourierProfileUpdates((nextProfile) => {
      applyProfileSnapshot(nextProfile);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCourierNotificationCountUpdates((count) => {
      setNotificationCount(count);
    });
    return unsubscribe;
  }, []);

  const handleToggle = async () => {
    const nextValue = !available;
    setTogglingAvail(true);
    setError("");
    try {
      await updateCourierStatus(nextValue);
      const refreshedProfile = await getCourierProfile();
      applyProfileSnapshot(refreshedProfile);
      announceCourierProfileUpdated(refreshedProfile);
    } catch (toggleError) {
      setError(toggleError instanceof ApiError ? toggleError.message : "Unable to update availability.");
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSavingProfile(true);
    setError("");
    try {
      const updated = await updateCourierProfileDetails({
        name: profileNameInput.trim(),
        phoneNumber: phoneInput.trim(),
      });
      applyProfileSnapshot(updated);
      announceCourierProfileUpdated(updated);
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : "Unable to update profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D5B70]" />
        <p className="text-sm text-gray-500 mt-3">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const avatarText = profile.avatar || initials(profile.name || "Courier");
  const performanceCards = [
    {
      label: "Completed",
      value: profile.totalOrders,
      icon: CheckCircle2,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "Cancelled",
      value: earnings?.cancelled ?? profile.performance?.cancelled ?? 0,
      icon: XCircle,
      color: "#ef4444",
      bg: "#fef2f2",
    },
    {
      label: "Hours Tracked",
      value: `${earnings?.hoursActive ?? 0}h`,
      icon: Clock,
      color: "#1D5B70",
      bg: "#f0f9ff",
    },
    {
      label: "This Week",
      value: `EGP ${Number(earnings?.totalEarned ?? 0).toFixed(1)}`,
      icon: TrendingUp,
      color: "#EBA050",
      bg: "#fff7ed",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="mb-2">
        <h1 className="text-gray-900 font-bold text-xl">My Profile</h1>
        <p className="text-gray-400 text-sm">Manage your availability and settings</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg" style={{ background: "linear-gradient(145deg, #1D5B70 0%, #2a7a9a 100%)" }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white" style={{ transform: "translate(30%,-30%)" }} />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20" style={{ backgroundColor: "#EBA050" }}>
                    {avatarText}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white transition-colors ${available ? "bg-green-400" : "bg-gray-400"}`} />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{profile.name}</p>
                  <p className="text-white/60 text-xs font-mono">{profile.phone || "No phone number"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-4 relative z-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4" fill={star <= Math.round(profile.rating) ? "#EBA050" : "none"} stroke={star <= Math.round(profile.rating) ? "#EBA050" : "rgba(255,255,255,0.3)"} />
              ))}
              <span className="text-white/70 text-sm ml-1">{profile.rating.toFixed(1)} rating</span>
            </div>
            <div className="grid grid-cols-3 gap-2 relative z-10">
              {[
                { v: profile.totalOrders, l: "Delivered" },
                { v: `${profile.completionRate.toFixed(1)}%`, l: "Completion" },
                { v: `${profile.activeHours}h`, l: "Active" },
              ].map((s) => (
                <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="font-bold text-sm">{s.v}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Availability</p>
            <button onClick={handleToggle} disabled={togglingAvail} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${available ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${available ? "bg-green-100" : "bg-gray-100"}`}>
                {available ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${available ? "text-green-700" : "text-gray-600"}`}>
                  {available ? "Online — accepting orders" : "Offline — not receiving orders"}
                </p>
                <p className="text-xs text-gray-400">{available ? "You'll get new assignments" : "Tap to go online"}</p>
              </div>
              {togglingAvail ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              ) : (
                <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${available ? "bg-green-400" : "bg-gray-300"}`}>
                  <motion.div layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow" style={{ left: available ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                </div>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Assigned Laundry</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{profile.assignedLaundry?.name || "No laundry assigned"}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">{profile.assignedLaundry?.address || "Not linked yet"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600">{profile.assignedLaundry?.status || "Inactive"}</span>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              Laundry assignment is managed by backend admin workflows.
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-bold text-gray-800">Account Details</p>
                <p className="text-xs text-gray-400">Update the courier profile fields supported by backend.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                backend
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-500">Full Name</span>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={profileNameInput}
                    onChange={(event) => setProfileNameInput(event.target.value)}
                    className="h-11 w-full bg-transparent text-sm text-gray-800 outline-none"
                    placeholder="Courier name"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-500">Phone Number</span>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    value={phoneInput}
                    onChange={(event) => setPhoneInput(event.target.value)}
                    className="h-11 w-full bg-transparent text-sm text-gray-800 outline-none"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D5B70] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gray-800">Performance Overview</p>
                <p className="text-xs text-gray-400">Only backend-backed courier metrics are shown here.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                backend
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {performanceCards.map((s) => (
                <div key={s.label} className="rounded-xl p-3 border text-center" style={{ backgroundColor: s.bg, borderColor: s.bg }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "white" }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Completion Rate",
                  value: `${(earnings?.completionRate ?? profile.completionRate).toFixed(1)}%`,
                  pct: `${earnings?.completionRate ?? profile.completionRate}%`,
                  color: "#22c55e",
                  note: `${profile.totalOrders} delivered orders so far`,
                },
                {
                  label: "Avg / Order",
                  value: `EGP ${Number(earnings?.avgPerOrder ?? 0).toFixed(1)}`,
                  pct: `${Math.max(8, Math.min(100, (Number(earnings?.avgPerOrder ?? 0) / Math.max(1, Number(earnings?.nextPayoutAmount ?? 1))) * 100))}%`,
                  color: "#EBA050",
                  note: earnings ? `Next payout: EGP ${earnings.nextPayoutAmount.toFixed(1)} on ${earnings.nextPayoutDate}` : null,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: item.pct }} transition={{ duration: 1.2, delay: 0.3 }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  {item.note && <p className="text-xs text-gray-400 mt-1">{item.note}</p>}
                </div>
              ))}
            </div>
            {(earnings?.hoursActive ?? 0) === 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Info className="mt-0.5 w-4 h-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  Backend is not tracking courier working hours yet, so this section shows `0h` until that data becomes available.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">Courier Tools</p>
            </div>
            {[
              {
                icon: Bell,
                label: "Notifications",
                desc:
                  notificationCount > 0
                    ? `${notificationCount} unread updates from backend`
                    : "No unread courier notifications right now",
                color: "#3b82f6",
                bg: "#eff6ff",
              },
              {
                icon: MapPin,
                label: "Location Sync",
                desc: "Your location is synced automatically while an active run is open.",
                color: "#7c3aed",
                bg: "#f5f3ff",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  backend
                </div>
              </div>
            ))}
            {[
              { icon: Package, label: "Order History", desc: "Open delivered courier orders", color: "#1D5B70", bg: "#f0f9ff", onClick: () => router.push("/courier?tab=done") },
              { icon: TrendingUp, label: "Earnings Summary", desc: "See your backend earnings breakdown", color: "#EBA050", bg: "#fff7ed", onClick: () => router.push("/courier/earnings") },
              { icon: Truck, label: "Active Run", desc: "Jump to your current delivery route", color: "#0891b2", bg: "#ecfeff", onClick: () => router.push("/courier/active") },
            ].map((item) => (
              <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 shrink-0">
                  Open
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>

          <button onClick={logout} className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
