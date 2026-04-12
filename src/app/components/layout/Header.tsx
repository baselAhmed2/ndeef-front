"use client";

import { Bell, Search, Menu, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiRequest } from "../../lib/admin-api";

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Dashboard", subtitle: "Monitor the Ndeef platform from one place" },
  "/admin/laundries": { title: "Laundries", subtitle: "Review laundry partners and operational status" },
  "/admin/verifications": { title: "Verifications", subtitle: "Approve and track pending partner checks" },
  "/admin/users": { title: "Users", subtitle: "Manage customers, couriers, and admins" },
  "/admin/fraud": { title: "Fraud Monitor", subtitle: "Inspect suspicious activity and alerts" },
  "/admin/commissions": { title: "Commissions", subtitle: "Track payouts, dues, and platform revenue" },
  "/admin/analytics": { title: "Analytics", subtitle: "Understand growth, usage, and performance" },
  "/admin/notifications": { title: "Notifications", subtitle: "Stay on top of platform-wide alerts" },
  "/admin/settings": { title: "Settings", subtitle: "Configure admin preferences and controls" },
  "/admin/help": { title: "Help Center", subtitle: "Access support and operational guidance" },
};

export function Header({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? "/admin";
  const [notes, setNotes] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await apiRequest<any>("/notifications?pageSize=5");
        const list = Array.isArray(res) ? res : res.data || [];
        setNotes(list);
        setUnreadCount(list.filter((n: any) => !n.isRead).length);
      } catch (err) {
        console.error("Failed to load header notifications", err);
      }
    }
    fetchNotes();
  }, []);

  const pathKey = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || (key !== "/admin" && pathname.startsWith(key)));

  const pageInfo = pageTitles[pathKey ?? "/admin"];

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100 shrink-0" dir="ltr">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-gray-900 font-semibold text-base leading-tight">{pageInfo.title}</h1>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {showSearch ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden hidden sm:block"
            >
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => {
                  setShowSearch(false);
                  setSearchValue("");
                }}
                placeholder="Search laundries, users..."
                className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#1D5B70] focus:ring-2 focus:ring-[#1D5B70]/20"
              />
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowSearch(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all hidden sm:flex"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: "#EBA050" }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                >
                  <div className="p-3.5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: "#1D5B70", backgroundColor: "#f0f9ff" }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
                    {notes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">No recent notifications</div>
                    ) : (
                      notes.slice(0, 5).map((n) => (
                        <div key={n.id} className="flex gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-[#1D5B70]">
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-gray-700 truncate">{n.title}</p>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{formatTimeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#EBA050] shrink-0 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2.5 border-t border-gray-100 text-center">
                    <Link href="/admin/notifications" onClick={() => setShowNotifications(false)} className="text-[12px] font-semibold hover:underline block w-full" style={{ color: "#1D5B70" }}>
                      View All
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
              style={{ backgroundColor: "#1D5B70" }}
            >
              {(user?.firstName?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {user ? `${user.firstName} ${user.lastName}`.trim() : "Admin User"}
              </p>
              <p className="text-xs text-gray-400 leading-tight">{user?.role || "Super Admin"}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${showUserMenu ? "rotate-180" : ""}`} />
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
                    <p className="text-sm font-semibold text-gray-800">
                      {user ? `${user.firstName} ${user.lastName}`.trim() : "Admin User"}
                    </p>
                    <p className="text-xs text-gray-400">{user?.role || "Super Admin"}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <Link
                      href="/admin/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        window.location.href = "/";
                      }}
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
  );
}
