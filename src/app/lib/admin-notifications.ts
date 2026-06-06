type NotificationLike = {
  id?: number | null;
  title?: string | null;
  message?: string | null;
  type?: number | string | null;
  isRead?: boolean | null;
  orderId?: number | null;
  OrderId?: number | null;
};

export function isAdminVisibleNotification(notification: NotificationLike) {
  const rawType = notification.type;
  const normalizedType =
    typeof rawType === "number" ? rawType : Number.parseInt(String(rawType ?? ""), 10);

  if ([1, 2, 3].includes(normalizedType)) {
    return false;
  }

  const hasOrderId =
    typeof notification.orderId === "number" || typeof notification.OrderId === "number";
  const text = `${notification.title ?? ""} ${notification.message ?? ""}`.toLowerCase();

  const isOrderStatusNotification =
    hasOrderId &&
    [
      "order",
      "status",
      "confirmed",
      "picked",
      "pickup",
      "processing",
      "ready",
      "delivered",
      "cancelled",
      "assigned",
      "courier",
    ].some((token) => text.includes(token));

  return !isOrderStatusNotification;
}
