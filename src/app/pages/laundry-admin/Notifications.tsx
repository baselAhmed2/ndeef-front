"use client";

import { useEffect, useState } from "react";
import {
  clearReadLaundryNotifications,
  deleteLaundryNotification,
  getLaundryNotifications,
  markAllLaundryNotificationsRead,
  markLaundryNotificationRead,
} from "@/app/lib/laundry-admin-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  ShoppingBag,
  CreditCard,
  Star,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  Filter,
  X,
} from "lucide-react";

type NotifType = "order" | "payment" | "review" | "alert" | "system";
type NotifFilter = "All" | "Unread" | "order" | "payment" | "review" | "alert" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  { id: "n1", type: "order", title: "New Order Received", message: "Order ORD-1025 has been placed by David Kim for Dry Cleaning (3 items).", time: "2 min ago", read: false },
  { id: "n2", type: "payment", title: "Payment Confirmed", message: "Payment of $95.00 received for Order ORD-1023 via Credit Card.", time: "15 min ago", read: false },
  { id: "n3", type: "review", title: "New Review Posted", message: "Sarah Johnson left a 5-star review: \"Amazing service, very fast and professional!\"", time: "1h ago", read: false },
  { id: "n4", type: "order", title: "Order Ready for Pickup", message: "Order ORD-1021 is ready and awaiting delivery confirmation.", time: "2h ago", read: true },
  { id: "n5", type: "alert", title: "Low Capacity Warning", message: "You have reached 90% of today's maximum order capacity (27/30 orders).", time: "3h ago", read: true },
  { id: "n6", type: "payment", title: "Refund Processed", message: "A refund of $28.00 was issued for Order ORD-1018 (Cancelled).", time: "5h ago", read: true },
  { id: "n7", type: "system", title: "System Maintenance", message: "Scheduled maintenance will occur tonight at 2:00 AM for 30 minutes.", time: "8h ago", read: true },
  { id: "n8", type: "order", title: "Order Delivered", message: "Order ORD-1019 has been marked as delivered by the driver.", time: "Yesterday", read: true },
  { id: "n9", type: "review", title: "New Review Posted", message: "Fatima Al-Amin rated your service 4 stars. Check the feedback.", time: "Yesterday", read: true },
  { id: "n10", type: "alert", title: "New Customer Registered", message: "Carlos Gomez has created a new account and placed their first order.", time: "2 days ago", read: true },
];

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order: { icon: ShoppingBag, color: "#1D5B70", bg: "#f0f9ff", label: "Order" },
  payment: { icon: CreditCard, color: "#22c55e", bg: "#f0fdf4", label: "Payment" },
  review: { icon: Star, color: "#EBA050", bg: "#fff7ed", label: "Review" },
  alert: { icon: AlertCircle, color: "#ef4444", bg: "#fef2f2", label: "Alert" },
  system: { icon: Info, color: "#8b5cf6", bg: "#f5f3ff", label: "System" },
};

const filterOptions: NotifFilter[] = ["All", "Unread", "order", "payment", "review", "alert", "system"];

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotifFilter>("All");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getLaundryNotifications();
        if (data.length > 0) {
          setNotifications(data as Notification[]);
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    }
    loadNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.read;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    markAllLaundryNotificationsRead().catch(console.error);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    markLaundryNotificationRead(id).catch(console.error);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const dismiss = (id: string) => {
    deleteLaundryNotification(id).catch(console.error);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    clearReadLaundryNotifications().catch(console.error);
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900 font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: "#EBA050" }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs mt-0.5">{notifications.length} total notifications</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-red-500 border border-red-100 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap capitalize transition-all ${
              activeFilter === f ? "text-white" : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
            style={activeFilter === f ? { backgroundColor: "#1D5B70" } : {}}
          >
            {f !== "All" && f !== "Unread" && typeConfig[f as NotifType]
              ? (() => {
                  const Icon = typeConfig[f as NotifType].icon;
                  return <Icon className="w-3 h-3" />;
                })()
              : f === "Unread"
              ? <Bell className="w-3 h-3" />
              : <Filter className="w-3 h-3" />}
            {f === "All" ? "All" : f === "Unread" ? `Unread (${unreadCount})` : typeConfig[f as NotifType]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <Bell className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No notifications here</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const cfg = typeConfig[notif.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => markRead(notif.id)}
                  className={`relative flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    !notif.read
                      ? "bg-white border-[#1D5B70]/20 shadow-sm"
                      : "bg-white border-gray-100 hover:bg-gray-50/60"
                  }`}
                >
                  {/* Unread indicator */}
                  {!notif.read && (
                    <div
                      className="absolute left-4 top-4 w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#EBA050" }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${notif.read ? "text-gray-700" : "text-gray-900"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      {!notif.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

