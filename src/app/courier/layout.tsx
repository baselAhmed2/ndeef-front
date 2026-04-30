"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutList,
  Wallet,
  User,
  WashingMachine,
  Wifi,
  WifiOff,
  Bell,
  ChevronLeft,
  ChevronRight,
  Truck,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { ReactNode } from "react";
import { getCourierActiveRun, getCourierProfile, getCourierTodayStats, updateCourierStatus } from "@/app/lib/courier-client";
import { useAuth } from "@/app/context/AuthContext";
import { DashboardAccessGuard } from "@/app/components/auth/DashboardAccessGuard";

const NAV_ITEMS = [
  {
    path: "/courier",
    label: "My Orders",
    description: "View & manage orders",
    icon: LayoutList,
    exact: true,
  },
  {
    path: "/courier/active",
    label: "Active Delivery",
    description: "Current delivery in progress",
    icon: Truck,
  },
  {
    path: "/courier/earnings",
    label: "Earnings",
    description: "Income & statistics",
    icon: Wallet,
  },
  {
    path: "/courier/profile",
    label: "My Profile",
    description: "Settings & availability",
    icon: User,
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function CourierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthReady, isLoggedIn, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [profileName, setProfileName] = useState("Courier");
  const [profileAvatar, setProfileAvatar] = useState("CU");
  const [profileRating, setProfileRating] = useState(0);
  const [profileOrders, setProfileOrders] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeRunLabel, setActiveRunLabel] = useState("");
  const role = user?.role ?? "";
  const isCourier = isLoggedIn && role.toLowerCase().includes("courier");

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn || !isCourier) return;

    let ignore = false;

    async function loadLayoutData() {
      try {
        const [profile, todayStats, activeRun] = await Promise.all([
          getCourierProfile(),
          getCourierTodayStats().catch(() => null),
          getCourierActiveRun().catch(() => null),
        ]);

        if (ignore) return;

        setAvailable(profile.isOnline);
        setProfileName(profile.name || "Courier");
        setProfileAvatar(profile.avatar || initials(profile.name || "Courier"));
        setProfileRating(profile.rating);
        setProfileOrders(profile.totalOrders);
        setUnreadNotifications(profile.unreadNotifications ?? 0);

        if (activeRun) {
          setActiveRunLabel(`${activeRun.totalStops}-stop run · ${activeRun.stopsDone} of ${activeRun.totalStops} done`);
        } else if (todayStats && todayStats.inTransit > 0) {
          setActiveRunLabel(`${todayStats.inTransit} deliveries in transit`);
        } else {
          setActiveRunLabel("");
        }
      } catch {
        if (ignore) return;
      }
    }

    loadLayoutData();
    return () => {
      ignore = true;
    };
  }, [isAuthReady, isCourier, isLoggedIn]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname?.startsWith(path) ?? false;
  };

  const currentNav = NAV_ITEMS.find((item) => (item.exact ? pathname === item.path : pathname?.startsWith(item.path)));

  const handleToggleAvailability = async () => {
    if (!isCourier) return;
    const nextValue = !available;
    setLoadingStatus(true);
    try {
      await updateCourierStatus(nextValue);
      setAvailable(nextValue);
    } catch {
      return;
    } finally {
      setLoadingStatus(false);
    }
  };

  const renderSidebarContent = (isMobile = false) => {
    const isExpanded = isMobile || sidebarOpen;
    return (
      <>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EBA050" }}>
              <WashingMachine className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }} className="ml-3 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">Ndeef Courier</p>
                  <p className="text-white/40 text-[10px] whitespace-nowrap">Delivery App</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!isMobile && (
            <button onClick={() => setSidebarOpen((value) => !value)} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {isMobile && (
            <button onClick={() => setMobileMenuOpen(false)} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-3 py-3 border-b border-white/10 shrink-0">
          <button onClick={handleToggleAvailability} disabled={loadingStatus} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${available ? "bg-green-500/20" : "bg-white/5"}`}>
            {available ? <Wifi className="w-4 h-4 text-green-400 shrink-0" /> : <WifiOff className="w-4 h-4 text-white/30 shrink-0" />}
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-bold ${available ? "text-green-300" : "text-white/40"}`}>
                    {available ? "Online — accepting orders" : "Offline"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {loadingStatus ? (
              <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
            ) : (
              isExpanded && (
                <div className={`w-8 h-4 rounded-full transition-colors shrink-0 flex items-center px-0.5 ${available ? "bg-green-400 justify-end" : "bg-white/20 justify-start"}`}>
                  <div className="w-3 h-3 rounded-full bg-white shadow" />
                </div>
              )
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group ${active ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/8 hover:text-white/80"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? "bg-white/20" : "group-hover:bg-white/10"}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                        <p className={`text-sm font-semibold whitespace-nowrap ${active ? "text-white" : ""}`}>{item.label}</p>
                        <p className="text-[10px] text-white/40 whitespace-nowrap">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {active && isExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 shrink-0">
          <button onClick={() => router.push("/courier/profile")} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/10 transition-all">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: "#EBA050" }}>
              {profileAvatar}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-white whitespace-nowrap">{profileName}</p>
                  <p className="text-[10px] text-white/40">★ {profileRating.toFixed(1)} · {profileOrders} orders</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </>
    );
  };

  return (
    <DashboardAccessGuard allowedRoles={["courier"]} loginRoleHint="Courier">
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
      <AnimatePresence>
        {mobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" />}
      </AnimatePresence>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[280px] flex flex-col h-screen shrink-0 overflow-hidden shadow-2xl z-50 lg:hidden" style={{ backgroundColor: "#1D5B70" }}>
            {renderSidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside animate={{ width: sidebarOpen ? 260 : 72 }} transition={{ duration: 0.28, ease: "easeInOut" }} className="hidden lg:flex flex-col h-screen shrink-0 overflow-hidden shadow-xl z-20 relative" style={{ backgroundColor: "#1D5B70" }}>
        {renderSidebarContent(false)}
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-100 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-gray-900 font-bold leading-tight">{currentNav?.label ?? "Courier App"}</h1>
              <p className="text-gray-400 text-[10px] leading-tight">{currentNav?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                <Bell className="w-4 h-4" />
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1" style={{ backgroundColor: "#EBA050" }}>
                  {unreadNotifications}
                </span>
              )}
            </div>
            <button onClick={() => router.push("/courier/profile")} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: "#EBA050" }}>
              {profileAvatar}
            </button>
          </div>
        </header>

        <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100 shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-gray-900 font-bold">{currentNav?.label ?? "Courier App"}</h1>
            <p className="text-gray-400 text-xs">{currentNav?.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeRunLabel && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-semibold text-purple-700">{activeRunLabel}</span>
              </div>
            )}
            <div className="relative">
              <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                <Bell className="w-4 h-4" />
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1" style={{ backgroundColor: "#EBA050" }}>
                  {unreadNotifications}
                </span>
              )}
            </div>
            <button onClick={() => router.push("/courier/profile")} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all border border-gray-100">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#EBA050" }}>
                {profileAvatar}
              </div>
              <span className="text-sm font-semibold text-gray-700">{profileName.split(" ")[0] || "Courier"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 relative">
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 safe-area-pb">
          <div className="flex items-center h-16">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <Link key={item.path} href={item.path} className="flex-1">
                  <div className="flex flex-col items-center justify-center gap-1 py-2">
                    <div className="relative">
                      {active && <motion.div layoutId="mobile-nav-bg" className="absolute -inset-2 rounded-xl" style={{ backgroundColor: "#1D5B70" }} transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />}
                      <item.icon className="w-5 h-5 relative z-10 transition-colors duration-200" style={{ color: active ? "white" : "#94a3b8" }} />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: active ? "#1D5B70" : "#94a3b8" }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      </div>
    </DashboardAccessGuard>
  );
}
