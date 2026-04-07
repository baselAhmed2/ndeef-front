import { motion } from "motion/react";
import { useState, useEffect, type MouseEvent } from "react";
import {
  Bell,
  Check,
  CheckCircle,
  CreditCard,
  Gift,
  LoaderCircle,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import { apiRequest, ApiError } from "../../lib/admin-api";
import type { NotificationRecord, PaginatedResult } from "../../types/admin";

// Map backend NotificationType enum to UI config
function getUiConfig(type: number) {
  switch (type) {
    case 1:
      return { icon: ShoppingBag, color: "bg-[#1D6076]/10 text-[#1D6076]", label: "Order Created" };
    case 2:
      return { icon: ShieldAlert, color: "bg-amber-50 text-amber-600", label: "Order Confirmed" };
    case 3:
      return { icon: CheckCircle, color: "bg-emerald-50 text-emerald-600", label: "Order Delivered" };
    case 4:
      return { icon: CreditCard, color: "bg-[#EBA050]/10 text-[#EBA050]", label: "Payment Success" };
    case 5:
      return { icon: Gift, color: "bg-fuchsia-50 text-fuchsia-600", label: "Promotion" };
    default:
      return { icon: Bell, color: "bg-blue-50 text-blue-600", label: "Notification" };
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
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearingRead, setIsClearingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void loadNotifications(1, filter, false);
  }, [filter]);

  const loadNotifications = async (
    nextPage = 1,
    nextFilter: "all" | "unread" | "read" = filter,
    append = false,
  ) => {
    try {
      if (append) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const query = new URLSearchParams({
        PageIndex: String(nextPage),
        PageSize: "20",
      });

      if (nextFilter === "unread") {
        query.set("IsRead", "false");
      }

      if (nextFilter === "read") {
        query.set("IsRead", "true");
      }

      const res = await apiRequest<PaginatedResult<NotificationRecord>>(`/notifications?${query.toString()}`);
      setItems((current) => (append ? [...current, ...res.data] : res.data));
      setPageIndex(res.pageIndex);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const markAllRead = async () => {
    try {
      setIsMarkingAll(true);
      setError(null);
      await apiRequest("/notifications/mark-all-read", { method: "PUT" });
      setItems((current) => current.map((notification) => ({ ...notification, isRead: true })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to mark notifications as read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const clearReadNotifications = async () => {
    try {
      setIsClearingRead(true);
      setError(null);
      await apiRequest("/notifications/clear-all", { method: "DELETE" });
      if (filter === "read") {
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
        setPageIndex(1);
      } else {
        setItems((current) => current.filter((notification) => !notification.isRead));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to clear read notifications.");
    } finally {
      setIsClearingRead(false);
    }
  };

  const markRead = async (id: number) => {
    const note = items.find((notification) => notification.id === id);
    if (note?.isRead) return;

    setItems((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PUT" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to mark notification as read.");
      setItems((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: false } : notification,
        ),
      );
    }
  };

  const deleteNotification = async (id: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      setError(null);
      await apiRequest(`/notifications/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((notification) => notification.id !== id));
      setTotalCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete notification.");
    }
  };

  const unreadCount = items.filter((notification) => !notification.isRead).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle size={32} className="animate-spin text-[#2A5C66]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount > 0
              ? `${totalCount} notifications loaded${unreadCount > 0 ? `, ${unreadCount} unread on this page` : ""}`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={clearReadNotifications}
            disabled={isClearingRead}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-70"
          >
            {isClearingRead ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Clear Read
          </button>
          <button
            onClick={markAllRead}
            disabled={isMarkingAll}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-70"
          >
            {isMarkingAll ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
            Mark All Read
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "read", label: "Read" },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key as "all" | "unread" | "read")} className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all", filter === f.key ? "bg-[#1D6076] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50")}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
            <Bell size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No notifications found.</p>
          </div>
        ) : (
          items.map((n) => {
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
                    <p className="mt-1 text-[11px] font-medium text-slate-400">{ui.label}</p>
                    <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
                      <Clock size={10} />
                      <span>{formatTimeAgo(n.createdAt)}</span>
                      {n.orderId ? (
                        <>
                          <span>|</span>
                          <span>Order #{n.orderId}</span>
                        </>
                      ) : null}
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

      {pageIndex < totalPages ? (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => void loadNotifications(pageIndex + 1, filter, true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-70"
          >
            {isRefreshing ? <LoaderCircle size={14} className="animate-spin" /> : null}
            Load More
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
