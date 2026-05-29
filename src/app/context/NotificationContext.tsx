"use client";

import { useCallback, useMemo, useState } from "react";
import { apiRequest } from "@/app/lib/admin-api";

type NotificationIconKey = "package" | "check" | "truck" | "bell";

type BackendNotificationRecord = {
  id?: number;
  Id?: number;
  title?: string;
  Title?: string;
  message?: string;
  Message?: string;
  isRead?: boolean;
  IsRead?: boolean;
  orderId?: number | null;
  OrderId?: number | null;
  createdAt?: string;
  CreatedAt?: string;
  type?: string | null;
  Type?: string | null;
};

type BackendNotificationResult =
  | BackendNotificationRecord[]
  | {
      data?: BackendNotificationRecord[] | null;
      Data?: BackendNotificationRecord[] | null;
    };

export type AppNotification = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  orderId: number | null;
  time: string;
  icon: NotificationIconKey;
};

function unwrapNotifications(payload: BackendNotificationResult): BackendNotificationRecord[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.Data)) return payload.Data;
  return [];
}

function formatRelativeTime(value?: string) {
  if (!value) return "now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function inferIcon(notification: BackendNotificationRecord): NotificationIconKey {
  const text = `${notification.title ?? notification.Title ?? ""} ${notification.message ?? notification.Message ?? ""} ${notification.type ?? notification.Type ?? ""}`.toLowerCase();
  if (text.includes("deliver") || text.includes("courier") || text.includes("driver")) return "truck";
  if (text.includes("done") || text.includes("paid") || text.includes("success")) return "check";
  if (text.includes("order") || text.includes("pickup") || text.includes("laundry")) return "package";
  return "bell";
}

function normalizeNotification(notification: BackendNotificationRecord): AppNotification {
  const createdAt = notification.createdAt ?? notification.CreatedAt ?? "";
  return {
    id: Number(notification.id ?? notification.Id ?? 0),
    title: String(notification.title ?? notification.Title ?? "Notification"),
    message: String(notification.message ?? notification.Message ?? ""),
    read: Boolean(notification.isRead ?? notification.IsRead),
    orderId:
      notification.orderId !== undefined || notification.OrderId !== undefined
        ? Number(notification.orderId ?? notification.OrderId ?? 0)
        : null,
    time: formatRelativeTime(createdAt),
    icon: inferIcon(notification),
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<BackendNotificationResult>("/notifications?PageIndex=1&PageSize=50");
      setNotifications(unwrapNotifications(response).map(normalizeNotification));
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await apiRequest("/notifications/mark-all-read", { method: "PUT" });
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAllRead,
  };
}
