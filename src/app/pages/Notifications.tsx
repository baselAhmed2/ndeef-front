"use client";

import { useEffect, useState } from "react";
import { Bell, Package, CheckCircle, Truck, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { useNotifications } from "@/app/context/NotificationContext";


const iconMap = {
  package: Package,
  check: CheckCircle,
  truck: Truck,
  bell: Bell,
};

const colorConfig = {
  package: { bg: "bg-sky-50 dark:bg-sky-950/20", text: "text-sky-600 dark:text-sky-400", border: "border-sky-100/50" },
  check: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100/50" },
  truck: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100/50" },
  bell: { bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-100/50" },
};

export default function Notifications() {
  const { notifications, unreadCount, loading, loadNotifications, markAllRead } = useNotifications();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      setError(null);
      await markAllRead();
    } catch (err) {
      console.error(err);
      setError("Failed to mark notifications as read.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] pb-20">
      <TopBar title="Notifications" showSearch={false} />

      {/* Header Stats */}
      <div className="bg-white px-5 py-4 border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            You have <span className="font-bold text-[#1D6076] bg-[#1D6076]/10 px-2 py-0.5 rounded-full text-xs">{unreadCount}</span> new updates
          </p>
          <button
            onClick={() => void handleMarkAllRead()}
            className="text-xs text-[#1D6076] font-semibold bg-[#1D6076]/5 hover:bg-[#1D6076]/10 active:scale-95 transition-all duration-200 px-3 py-1.5 rounded-lg"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 py-5 space-y-3.5">
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-600 backdrop-blur-sm">
            {error}
          </div>
        )}

        {loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="mb-3 animate-spin text-[#1D6076]" size={28} />
            <p className="text-sm font-medium">Loading inbox...</p>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-slate-400 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Bell className="opacity-40" size={26} />
            </div>
            <p className="text-sm font-semibold text-slate-800">Your inbox is clear</p>
            <p className="text-xs text-slate-400 mt-1">We'll alert you here when status changes!</p>
          </div>
        )}

        {notifications.map((notification) => {
          const Icon = iconMap[notification.icon];
          const color = colorConfig[notification.icon];

          return (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] border transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:scale-[0.99] ${
                !notification.read
                  ? "border-[#1D6076]/30 bg-gradient-to-br from-white to-[#1D6076]/[0.01]"
                  : "border-slate-100"
              }`}
            >
              <Link
                href={notification.orderId ? `/orders` : "#"}
                className="flex items-start gap-4 p-4.5 hover:bg-slate-50/60 transition-colors"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${color.bg} ${color.text} border ${color.border} flex items-center justify-center shrink-0 shadow-inner`}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-bold text-sm text-slate-800 tracking-tight leading-tight">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400">{notification.time}</span>
                      {!notification.read && (
                        <span className="w-2.5 h-2.5 bg-[#1D6076] rounded-full ring-4 ring-[#1D6076]/10 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-0.5">
                    {notification.message}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* WhatsApp & SMS Info */}
      <div className="px-5 mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1D6076] to-[#24708a] rounded-2xl p-5 text-white shadow-[0_8px_20px_rgba(29,96,118,0.15)]">
          {/* Subtle Decorative Circle */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <MessageSquare size={18} strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-base tracking-tight">WhatsApp & SMS Live Updates</h3>
          </div>
          <p className="text-xs opacity-90 mb-4 leading-relaxed font-medium">
            Get instant notifications about your orders delivered straight to your WhatsApp and SMS chat threads!
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5">
              <CheckCircle size={14} strokeWidth={2.5} className="text-emerald-300" />
              <span className="text-[10px] font-bold">WhatsApp Active</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5">
              <CheckCircle size={14} strokeWidth={2.5} className="text-emerald-300" />
              <span className="text-[10px] font-bold">SMS Active</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
