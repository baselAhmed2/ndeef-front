"use client";

import { Bell, Search, Menu, Command } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { apiRequest } from "../../lib/admin-api";

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function Header({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
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

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 flex items-center justify-between px-4 lg:px-6 shrink-0" dir="ltr">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search laundries, orders, users..."
            className="w-72 lg:w-80 bg-slate-50/80 border border-slate-200/60 text-slate-700 text-[13px] rounded-xl pl-9 pr-16 py-2 focus:ring-2 focus:ring-[#2A5C66]/10 focus:border-[#2A5C66]/30 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 text-slate-300">
            <Command size={12} />
            <span className="text-[10px] font-medium">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-700">Live</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold text-[#2A5C66] bg-[#2A5C66]/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
                    {notes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No recent notifications</div>
                    ) : (
                      notes.slice(0, 5).map((n) => (
                        <div key={n.id} className="flex gap-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 2 ? "bg-red-50 text-red-500" :
                            n.type === 1 ? "bg-emerald-50 text-emerald-500" :
                            "bg-blue-50 text-blue-500"
                          }`}>
                            <Bell size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-slate-700 truncate">{n.title}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-300 mt-1">{formatTimeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#2A5C66] shrink-0 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2.5 border-t border-slate-100 text-center">
                    <Link href="/admin/notifications" onClick={() => setShowNotifications(false)} className="text-[12px] font-semibold text-[#2A5C66] hover:underline block w-full">View All</Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Admin avatar */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-xl transition-colors">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user ? `${user.firstName} ${user.lastName}`.trim() : "Admin User")}&background=2A5C66&color=fff&size=64`}
              alt="Admin"
              className="w-8 h-8 rounded-lg shadow-sm"
            />
          </button>
          
          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 py-1"
                >
                  <button 
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      window.location.href = "/";
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
