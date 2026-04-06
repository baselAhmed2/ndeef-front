import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  Bell, ShieldAlert, Store, DollarSign, CheckCircle,
  Trash2, Check, Clock
} from "lucide-react";
import clsx from "clsx";
import { apiRequest } from "../../lib/admin-api";

interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: number;
  isRead: boolean;
  createdAt: string;
}

// Map backend NotificationType enum to UI config
function getUiConfig(type: number) {
  // Assuming standard enums, fallback to system
  switch (type) {
    case 1: // e.g. System
      return { icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" };
    case 2: // e.g. Alert/Fraud
      return { icon: ShieldAlert, color: "bg-red-50 text-red-600" };
    case 3: // e.g. Payment/Revenue
      return { icon: DollarSign, color: "bg-[#EBA050]/10 text-[#EBA050]" };
    case 4: // e.g. Laundry
      return { icon: Store, color: "bg-[#1D6076]/10 text-[#1D6076]" };
    default:
      return { icon: Bell, color: "bg-blue-50 text-blue-600" };
  }
}

function formatTimeAgo(isoString: string) {
  const date = new Date(isoString);
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function AdminNotifications() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Pagination response: assuming it returns { data, count, page... } or just array. Let's handle both.
      const res = await apiRequest<any>("/notifications?pageSize=50");
      setItems(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/mark-all-read", { method: "PUT" });
      setItems(items.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed", err);
    }
  };

  const markRead = async (id: number) => {
    // Optimistic UI update
    const note = items.find(n => n.id === id);
    if (note?.isRead) return;

    setItems(items.map((n) => n.id === id ? { ...n, isRead: true } : n));
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PUT" });
    } catch (err) {
      console.error("Failed", err);
      // Revert if failed
      setItems(items.map((n) => n.id === id ? { ...n, isRead: false } : n));
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiRequest(`/notifications/${id}`, { method: "DELETE" });
      setItems(items.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed", err);
    }
  };

  const filtered = items.filter((n) => filter === "all" || (filter === "unread" && !n.isRead));
  const unreadCount = items.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5C66]"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50">
          <Check size={14} /> Mark All Read
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", filter === f.key ? "bg-[#1D6076] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
            <Bell size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No notifications found.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const ui = getUiConfig(n.type);
            const Icon = ui.icon;
            return (
              <motion.div
                key={n.id}
                layout
                onClick={() => markRead(n.id)}
                className={clsx(
                  "bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-sm group",
                  n.isRead ? "border-slate-100" : "border-[#1D6076]/20 bg-[#1D6076]/[0.02]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", ui.color)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-slate-800">{n.title}</h4>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#1D6076] shrink-0" />}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                      <Clock size={10} />
                      <span>{formatTimeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteNotification(n.id, e)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
