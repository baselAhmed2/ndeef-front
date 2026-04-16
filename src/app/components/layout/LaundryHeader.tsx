"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, User, Settings, LogOut, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/app/context/AuthContext";
import { getLaundryUnreadNotificationCount } from "@/app/lib/laundry-admin-client";

const LOCAL_PROFILE_PHOTO_KEY = "nadeef_laundry_profile_photo";

function normalizeDisplayValue(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
    return "";
  }
  return trimmed;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/laundry-admin": { title: "Dashboard", subtitle: "Welcome back, Ahmad" },
  "/laundry-admin/orders": { title: "Orders", subtitle: "Manage and track all laundry orders" },
  "/laundry-admin/services": { title: "Services", subtitle: "Manage your laundry service offerings" },
  "/laundry-admin/availability": { title: "Availability", subtitle: "Set your working hours and schedule" },
  "/laundry-admin/customers": { title: "Customers", subtitle: "Customer history from backend orders" },
  "/laundry-admin/drivers": { title: "Drivers", subtitle: "Assign and manage laundry couriers" },
  "/laundry-admin/notifications": { title: "Notifications", subtitle: "Stay updated with latest alerts" },
  "/laundry-admin/payments": { title: "Payments", subtitle: "Track revenue and payment history" },
  "/laundry-admin/analytics": { title: "Analytics", subtitle: "Revenue, order insights, and demand forecast" },
  "/laundry-admin/support": { title: "Support", subtitle: "Review customer complaints" },
  "/laundry-admin/settings": { title: "Settings", subtitle: "Manage your account and preferences" },
};

interface LaundryHeaderProps {
  notificationCount?: number;
}

export function LaundryHeader({ notificationCount = 0 }: LaundryHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      try {
        const count = await getLaundryUnreadNotificationCount();
        if (active) setUnreadCount(count);
      } catch (error) {
        console.error("Failed to load laundry notification count", error);
        if (active) setUnreadCount(0);
      }
    }

    void loadUnreadCount();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncPhoto = () => {
      setProfilePhoto(window.localStorage.getItem(LOCAL_PROFILE_PHOTO_KEY) ?? "");
    };

    syncPhoto();
    window.addEventListener("storage", syncPhoto);
    window.addEventListener("focus", syncPhoto);

    return () => {
      window.removeEventListener("storage", syncPhoto);
      window.removeEventListener("focus", syncPhoto);
    };
  }, []);

  const currentPath = pathname ?? "";
  const pathKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((k) => currentPath === k || (k !== "/laundry-admin" && currentPath.startsWith(k)));

  const pageInfo = pageTitles[pathKey ?? "/laundry-admin"] ?? { title: "Ndeef Admin", subtitle: "" };
  const displayName =
    normalizeDisplayValue(user?.name) ||
    normalizeDisplayValue(user?.email).split("@")[0] ||
    "Laundry Admin";
  const displayEmail = normalizeDisplayValue(user?.email) || "Laundry Admin";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || displayEmail[0]?.toUpperCase() || "L";
  const pageSubtitle =
    currentPath === "/laundry-admin"
      ? `Welcome back, ${displayName}`
      : pageInfo.subtitle;

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shrink-0">
        {/* Left: Page Title */}
        <div>
          <h1 className="text-gray-900 font-semibold text-base leading-tight">{pageInfo.title}</h1>
          <p className="text-gray-400 text-xs mt-0.5">{pageSubtitle}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <AnimatePresence>
            {showSearch ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => { setShowSearch(false); setSearchValue(""); }}
                  placeholder="Search orders, customers…"
                  className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
                />
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowSearch(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <button
            onClick={() => router.push("/laundry-admin/notifications")}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#EBA050" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: "#1D5B70" }}
                >
                  {initials}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-800 leading-tight">{displayName}</p>
                <p className="text-xs text-gray-400 leading-tight">{displayEmail}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${showUserMenu ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                  >
                    <div className="p-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                      <p className="text-xs text-gray-400">{displayEmail}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowUserMenu(false); router.push("/laundry-admin/settings"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <User className="w-4 h-4" /> Profile
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); router.push("/laundry-admin/settings"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Logout</h3>
                  <p className="text-xs text-gray-400">Are you sure you want to logout?</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                You'll be logged out of your Ndeef admin account. Any unsaved changes will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { logout(); router.push("/"); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
