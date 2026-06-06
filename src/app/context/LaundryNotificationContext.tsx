"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "@/app/context/AuthContext";
import { BACKEND_ORIGIN } from "@/app/lib/backend-url";
import { toast } from "sonner";
import {
  getLaundryNotifications,
  getLaundryUnreadNotificationCount,
  markLaundryNotificationRead,
  markAllLaundryNotificationsRead,
  deleteLaundryNotification,
  clearReadLaundryNotifications,
} from "@/app/lib/laundry-admin-client";

type NotifType = "order" | "payment" | "review" | "alert" | "system";
type HubConnectionLike = {
  on: (eventName: string, callback: (payload: unknown) => void) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};
type SignalRModuleLike = {
  HubConnectionBuilder: new () => {
    withUrl: (
      url: string,
      options: {
        accessTokenFactory: () => string;
        transport?: unknown;
        skipNegotiation?: boolean;
      },
    ) => SignalRModuleLike["HubConnectionBuilder"]["prototype"];
    withAutomaticReconnect: () => SignalRModuleLike["HubConnectionBuilder"]["prototype"];
    configureLogging: (level: unknown) => SignalRModuleLike["HubConnectionBuilder"]["prototype"];
    build: () => HubConnectionLike;
  };
  HttpTransportType: {
    WebSockets: unknown;
  };
  LogLevel: {
    Warning: unknown;
  };
};

export interface LaundryNotification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  createdAt: string;
  orderId?: number | null;
  isRecent?: boolean;
}

interface LaundryNotificationContextType {
  notifications: LaundryNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications: (silent?: boolean) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearRead: () => Promise<void>;
}

const LaundryNotificationContext =
  createContext<LaundryNotificationContextType | null>(null);

function toFrontendNotificationType(type: string | number | null | undefined): NotifType {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized.includes("payment") || normalized === "4") return "payment";
  if (normalized.includes("review")) return "review";
  if (normalized.includes("promotion") || normalized.includes("system") || normalized === "5")
    return "system";
  if (normalized.includes("alert") || normalized.includes("warning")) return "alert";
  if (normalized.includes("order") || ["1", "2", "3"].includes(normalized)) return "order";
  return "alert";
}

export function LaundryNotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<LaundryNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<HubConnectionLike | null>(null);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!isLoggedIn || !user?.token) return;

    try {
      if (!silent) setLoading(true);
      setError(null);

      const [data, count] = await Promise.all([
        getLaundryNotifications(),
        getLaundryUnreadNotificationCount(),
      ]);

      setNotifications(data as LaundryNotification[]);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setError("Failed to load notifications.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isLoggedIn, user?.token]);

  // Initial load
  useEffect(() => {
    if (isLoggedIn && user?.token) {
      void loadNotifications(false);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isLoggedIn, user?.token, loadNotifications]);

  // Establish SignalR Hub Connection
  useEffect(() => {
    if (!isLoggedIn || !user?.token) {
      if (connection) {
        void connection.stop().then(() => setConnection(null));
      }
      return;
    }

    let isCancelled = false;
    let conn: HubConnectionLike | null = null;

    const startRealtimeNotifications = async () => {
      try {
        const signalR = (await import("@microsoft/signalr")) as SignalRModuleLike;
        if (isCancelled) return;

        const hubUrl = `${BACKEND_ORIGIN}/notifications-hub`;
        const builtConnection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: () => user.token ?? "",
            // Skip negotiate so the websocket connects to a single backend instance.
            transport: signalR.HttpTransportType.WebSockets,
            skipNegotiation: true,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.Warning)
          .build();
        conn = builtConnection;

        builtConnection.on("ReceiveNotification", (newNotif: unknown) => {
          const payload = (newNotif ?? {}) as Record<string, unknown>;

          const formattedNotif: LaundryNotification = {
            id: String(payload.id ?? payload.Id ?? Math.random()),
            title: String(payload.title ?? payload.Title ?? "New Alert"),
            message: String(payload.message ?? payload.Message ?? ""),
            type: toFrontendNotificationType((payload.type ?? payload.Type) as string | number | null | undefined),
            time: "now",
            read: Boolean(payload.isRead ?? payload.IsRead ?? false),
            createdAt: String(payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString()),
            orderId: Number(payload.orderId ?? payload.OrderId ?? 0) || null,
          };

          setNotifications((prev) => [formattedNotif, ...prev]);
          setUnreadCount((c) => c + 1);

          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
            audio.volume = 0.3;
            void audio.play();
          } catch {
            // Ignore audio playback error
          }

          toast.info(formattedNotif.title, {
            description: formattedNotif.message,
            action: {
              label: "View",
              onClick: () => {
                window.location.href = "/laundry-admin/notifications";
              },
            },
          });
        });

        await builtConnection.start();
        if (isCancelled) {
          await builtConnection.stop();
          return;
        }

        console.log("SignalR Connection established for Laundry Notifications");
        setConnection(conn);
      } catch (err: unknown) {
        console.warn("Realtime notifications unavailable, falling back to polling.", err);
      }
    };

    void startRealtimeNotifications();

    return () => {
      isCancelled = true;
      if (conn) {
        void conn.stop();
      }
    };
  }, [isLoggedIn, user?.token]);

  const markRead = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await markLaundryNotificationRead(id);
    } catch (err) {
      console.error(err);
      setError("Failed to mark notification as read.");
      // Rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      setUnreadCount((c) => c + 1);
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    const unreadLength = notifications.filter((n) => !n.read).length;
    if (unreadLength === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await markAllLaundryNotificationsRead();
    } catch (err) {
      console.error(err);
      setError("Failed to mark all as read.");
      void loadNotifications(true);
    }
  }, [notifications, loadNotifications]);

  const dismiss = useCallback(async (id: string) => {
    const originalNotifications = notifications;
    const isUnread = !notifications.find((n) => n.id === id)?.read;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (isUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    try {
      await deleteLaundryNotification(id);
    } catch (err) {
      console.error(err);
      setError("Failed to delete notification.");
      setNotifications(originalNotifications);
      if (isUnread) {
        setUnreadCount((c) => c + 1);
      }
    }
  }, [notifications]);

  const clearRead = useCallback(async () => {
    const originalNotifications = notifications;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !n.read));

    try {
      await clearReadLaundryNotifications();
    } catch (err) {
      console.error(err);
      setError("Failed to clear read notifications.");
      setNotifications(originalNotifications);
    }
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      loadNotifications,
      markRead,
      markAllRead,
      dismiss,
      clearRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      loadNotifications,
      markRead,
      markAllRead,
      dismiss,
      clearRead,
    ]
  );

  return (
    <LaundryNotificationContext.Provider value={value}>
      {children}
    </LaundryNotificationContext.Provider>
  );
}

export function useLaundryNotifications() {
  const ctx = useContext(LaundryNotificationContext);
  if (!ctx) {
    throw new Error(
      "useLaundryNotifications must be used within a LaundryNotificationProvider"
    );
  }
  return ctx;
}
