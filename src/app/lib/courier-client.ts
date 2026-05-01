import { ApiError, apiRequest } from "./admin-api";

export type CourierOrderTab = "new" | "active" | "done";

export interface CourierOrdersResponse<T> {
  pageIndex?: number;
  pageSize?: number;
  count?: number;
  totalCount?: number;
  data?: T[];
  PageIndex?: number;
  PageSize?: number;
  TotalCount?: number;
  Data?: T[];
}

export interface CourierStatsDto {
  totalCompletedOrders?: number;
  totalCancellations?: number;
  totalEarnings?: number;
  todayEarnings?: number;
  weekEarnings?: number;
  monthEarnings?: number;
  completionRate?: number;
  TotalCompletedOrders?: number;
  TotalCancellations?: number;
  TotalEarnings?: number;
  TodayEarnings?: number;
  WeekEarnings?: number;
  MonthEarnings?: number;
  CompletionRate?: number;
}

export interface CourierOrderDto {
  id: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupTime: string;
  deliveryTime?: string | null;
  estimatedDeliveryTime?: string | null;
  status: string;
  totalPrice: number;
  notes?: string | null;
  customerName: string;
  customerPhone: string;
  laundryName: string;
  laundryAddress: string;
  laundryLatitude?: number | null;
  laundryLongitude?: number | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  courierLatitude?: number | null;
  courierLongitude?: number | null;
  isPaid?: boolean;
  itemsCount?: number;
  serviceName?: string;
  IsPaid?: boolean;
  ItemsCount?: number;
  ServiceName?: string;
}

export interface CourierOrderResponseDto {
  id: string;
  customer: string;
  service: string;
  itemsCount: number;
  pickupArea: string;
  dropArea: string;
  distance: string;
  eta: string;
  amount: number;
  status: string;
  isUrgent: boolean;
  createdAt: string;
  isPaid: boolean;
}

export interface CourierProfileResponseDto {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalOrders: number;
  completionRate: number;
  activeHours: number;
  isOnline: boolean;
  availability?: string;
  unreadNotifications: number;
  assignedLaundry?: {
    name: string;
    address: string;
    status: string;
  } | null;
  performance?: {
    completed: number;
    cancelled: number;
    hours: number;
    earningsThisMonth: string;
  } | null;
}

export interface CourierProfileDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
  isAvailable?: boolean;
  completedOrdersCount?: number;
  cancellationCount?: number;
  laundryId?: number | null;
  laundryName?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastLocationUpdate?: string | null;
  Name?: string;
  Email?: string;
  PhoneNumber?: string;
  IsAvailable?: boolean;
  CompletedOrdersCount?: number;
  CancellationCount?: number;
  LaundryId?: number | null;
  LaundryName?: string | null;
  CurrentLatitude?: number | null;
  CurrentLongitude?: number | null;
  LastLocationUpdate?: string | null;
}

export interface CourierTodayStatsDto {
  todaysOrders: number;
  inTransit: number;
  earnedToday: number;
  vsYesterdayPercentage: number;
}

export interface CourierActiveRunStopDto {
  stopNum: number;
  orderId: string;
  customer: string;
  phone: string;
  area: string;
  address: string;
  amount: number;
  items: number;
  service: string;
  etaFromNow: string;
  note: string;
  status: string;
  isUrgent: boolean;
  isPaid: boolean;
}

export interface CourierActiveRunResponseDto {
  runId: string;
  totalDistance: string;
  totalAmount: number;
  stopsDone: number;
  totalStops: number;
  earnedSoFar: number;
  remainingAmount: number;
  laundryName: string;
  totalItems: number;
  stops: CourierActiveRunStopDto[];
}

export interface CourierEarningsResponseDto {
  totalEarned: number;
  ordersDone: number;
  hoursActive: number;
  avgPerOrder: number;
  cancelled: number;
  completionRate: number;
  rating: number;
  topPercent: number;
  dailyEarnings: Array<{
    day: string;
    amount: number;
  }>;
  recentTransactions: Array<{
    customer: string;
    area: string;
    timeAgo: string;
    amount: string;
  }>;
  nextPayoutAmount: number;
  nextPayoutDate: string;
}

export interface CourierNotificationDto {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  orderId?: number | null;
  createdAt: string;
}

export interface CourierDashboardOrder {
  id: string;
  customer: string;
  phone: string;
  avatar: string;
  pickupArea: string;
  dropArea: string;
  pickupLocation: string;
  deliveryLocation: string;
  distance: string;
  eta: string;
  amount: number;
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  urgent: boolean;
  time: string;
  paid: boolean;
  service: string;
  items: number;
  notes: string;
  laundryName: string;
  laundryAddress: string;
}

export interface CourierOrderLocationPayload {
  currentLatitude: number;
  currentLongitude: number;
}

export interface CourierDeliveryHistoryDto {
  orderId: number;
  customerName: string;
  deliveryLocation: string;
  deliveredAt?: string | null;
  totalPrice: number;
  earningsFromOrder: number;
  finalStatus: string;
}

const COURIER_PROFILE_UPDATED_EVENT = "nadeef:courier-profile-updated";
const COURIER_NOTIFICATION_COUNT_UPDATED_EVENT = "nadeef:courier-notification-count-updated";

export const COURIER_EARNING_RATE = 0.1;

function parseNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function parseString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function unwrapResponseArray<T>(value: CourierOrdersResponse<T> | T[]) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value.data) ? value.data : Array.isArray(value.Data) ? value.Data : [];
}

function pickNumber(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in source) return parseNumber(source[key]);
  }
  return 0;
}

function pickString(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in source && typeof source[key] === "string") return String(source[key] ?? "");
  }
  return "";
}

function pickBoolean(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in source) return Boolean(source[key]);
  }
  return false;
}

async function withFallback<T>(request: () => Promise<T>, fallbackRequest: () => Promise<T>) {
  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return fallbackRequest();
  }
}

function normalizeCourierProfile(profile: CourierProfileResponseDto | CourierProfileDto): CourierProfileResponseDto {
  const raw = profile as Record<string, unknown>;
  if ("phone" in raw || "assignedLaundry" in raw || "performance" in raw) {
    const typed = profile as CourierProfileResponseDto;
    return {
      id: parseString(typed.id),
      name: typed.name || "Courier",
      phone: typed.phone || "",
      avatar: typed.avatar || initialsFromName(typed.name || "Courier"),
      rating: parseNumber(typed.rating),
      totalOrders: parseNumber(typed.totalOrders),
      completionRate: parseNumber(typed.completionRate),
      activeHours: parseNumber(typed.activeHours),
      isOnline: Boolean(typed.isOnline),
      availability: typed.availability || (typed.isOnline ? "online" : "offline"),
      unreadNotifications: parseNumber(typed.unreadNotifications),
      assignedLaundry: typed.assignedLaundry ?? null,
      performance: typed.performance ?? null,
    };
  }

  const name = pickString(raw, "name", "Name") || "Courier";
  const completed = pickNumber(raw, "completedOrdersCount", "CompletedOrdersCount");
  const cancelled = pickNumber(raw, "cancellationCount", "CancellationCount");
  const completionRate =
    completed + cancelled > 0 ? (completed / (completed + cancelled)) * 100 : 0;

  return {
    id: "",
    name,
    phone: pickString(raw, "phoneNumber", "PhoneNumber"),
    avatar: initialsFromName(name),
    rating: 0,
    totalOrders: completed,
    completionRate,
    activeHours: 0,
    isOnline: pickBoolean(raw, "isAvailable", "IsAvailable"),
    availability: pickBoolean(raw, "isAvailable", "IsAvailable") ? "online" : "offline",
    unreadNotifications: 0,
    assignedLaundry: pickString(raw, "laundryName", "LaundryName")
      ? {
          name: pickString(raw, "laundryName", "LaundryName"),
          address: "",
          status: pickNumber(raw, "laundryId", "LaundryId") > 0 ? "Active" : "Inactive",
        }
      : null,
    performance: {
      completed,
      cancelled,
      hours: 0,
      earningsThisMonth: "0",
    },
  };
}

function normalizeCourierTodayStats(stats: CourierTodayStatsDto | CourierStatsDto): CourierTodayStatsDto {
  const raw = stats as Record<string, unknown>;
  if ("todaysOrders" in raw || "inTransit" in raw || "earnedToday" in raw) {
    const typed = stats as CourierTodayStatsDto;
    return {
      todaysOrders: parseNumber(typed.todaysOrders),
      inTransit: parseNumber(typed.inTransit),
      earnedToday: parseNumber(typed.earnedToday),
      vsYesterdayPercentage: parseNumber(typed.vsYesterdayPercentage),
    };
  }

  return {
    todaysOrders: 0,
    inTransit: 0,
    earnedToday: pickNumber(raw, "todayEarnings", "TodayEarnings"),
    vsYesterdayPercentage: 0,
  };
}

function normalizeCourierEarnings(stats: CourierEarningsResponseDto | CourierStatsDto): CourierEarningsResponseDto {
  const raw = stats as Record<string, unknown>;
  if ("ordersDone" in raw || "dailyEarnings" in raw || "recentTransactions" in raw) {
    const typed = stats as CourierEarningsResponseDto;
    return {
      totalEarned: parseNumber(typed.totalEarned),
      ordersDone: parseNumber(typed.ordersDone),
      hoursActive: parseNumber(typed.hoursActive),
      avgPerOrder: parseNumber(typed.avgPerOrder),
      cancelled: parseNumber(typed.cancelled),
      completionRate: parseNumber(typed.completionRate),
      rating: parseNumber(typed.rating),
      topPercent: parseNumber(typed.topPercent),
      dailyEarnings: Array.isArray(typed.dailyEarnings) ? typed.dailyEarnings : [],
      recentTransactions: Array.isArray(typed.recentTransactions) ? typed.recentTransactions : [],
      nextPayoutAmount: parseNumber(typed.nextPayoutAmount),
      nextPayoutDate: typed.nextPayoutDate || "",
    };
  }

  const totalEarned = pickNumber(raw, "totalEarnings", "TotalEarnings");
  const ordersDone = pickNumber(raw, "totalCompletedOrders", "TotalCompletedOrders");
  const cancelled = pickNumber(raw, "totalCancellations", "TotalCancellations");
  const completionRate = pickNumber(raw, "completionRate", "CompletionRate");
  const avgPerOrder = ordersDone > 0 ? totalEarned / ordersDone : 0;

  return {
    totalEarned,
    ordersDone,
    hoursActive: 0,
    avgPerOrder,
    cancelled,
    completionRate,
    rating: 0,
    topPercent: 0,
    dailyEarnings: [],
    recentTransactions: [],
    nextPayoutAmount: totalEarned,
    nextPayoutDate: "",
  };
}

function normalizeCourierNotification(notification: CourierNotificationDto | Record<string, unknown>): CourierNotificationDto {
  const raw = notification as Record<string, unknown>;
  return {
    id: pickNumber(raw, "id", "Id"),
    title: pickString(raw, "title", "Title"),
    message: pickString(raw, "message", "Message"),
    isRead: pickBoolean(raw, "isRead", "IsRead"),
    orderId:
      "orderId" in raw || "OrderId" in raw
        ? pickNumber(raw, "orderId", "OrderId")
        : null,
    createdAt: pickString(raw, "createdAt", "CreatedAt"),
  };
}

function mapFilterToQuery(filter: CourierOrderTab) {
  switch (filter) {
    case "new":
      return 1;
    case "active":
      return 2;
    case "done":
      return 3;
    default:
      return 0;
  }
}

export function serviceIconKey(service: string) {
  const normalized = service.toLowerCase();
  if (normalized.includes("wash")) return "wash";
  if (normalized.includes("dry")) return "dry";
  if (normalized.includes("iron")) return "iron";
  return "package";
}

export function initialsFromName(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CU";
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function formatEtaTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(diffMinutes) < 1) return "Now";
  if (diffMinutes > 0) {
    if (diffMinutes < 60) return `${diffMinutes} min`;
    return `${Math.floor(diffMinutes / 60)} hr`;
  }

  return formatRelativeTime(value);
}

export function calculateCourierEarning(amount: number) {
  return Number((amount * COURIER_EARNING_RATE).toFixed(2));
}

export function announceCourierProfileUpdated(profile: CourierProfileResponseDto) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CourierProfileResponseDto>(COURIER_PROFILE_UPDATED_EVENT, {
      detail: profile,
    }),
  );
}

export function subscribeCourierProfileUpdates(
  listener: (profile: CourierProfileResponseDto) => void,
) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<CourierProfileResponseDto>;
    if (customEvent.detail) listener(customEvent.detail);
  };

  window.addEventListener(COURIER_PROFILE_UPDATED_EVENT, handler as EventListener);
  return () => window.removeEventListener(COURIER_PROFILE_UPDATED_EVENT, handler as EventListener);
}

export function announceCourierNotificationCountUpdated(count: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<number>(COURIER_NOTIFICATION_COUNT_UPDATED_EVENT, {
      detail: count,
    }),
  );
}

export function subscribeCourierNotificationCountUpdates(listener: (count: number) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<number>;
    if (typeof customEvent.detail === "number") listener(customEvent.detail);
  };

  window.addEventListener(COURIER_NOTIFICATION_COUNT_UPDATED_EVENT, handler as EventListener);
  return () => window.removeEventListener(COURIER_NOTIFICATION_COUNT_UPDATED_EVENT, handler as EventListener);
}

export function extractArea(location?: string | null) {
  if (!location) return "Unknown";
  return location.split(",")[0]?.trim() || location.trim() || "Unknown";
}

function normalizeCourierHistoryOrder(order: CourierDeliveryHistoryDto): CourierDashboardOrder {
  return {
    id: String(order.orderId),
    customer: order.customerName || "Customer",
    phone: "",
    avatar: initialsFromName(order.customerName || "Customer"),
    pickupArea: "Completed",
    dropArea: extractArea(order.deliveryLocation),
    pickupLocation: "",
    deliveryLocation: order.deliveryLocation || "",
    distance: "Completed",
    eta: "--",
    amount: parseNumber(order.totalPrice),
    status: mapCourierOrderStatus(order.finalStatus),
    urgent: false,
    time: formatRelativeTime(order.deliveredAt),
    paid: false,
    service: "Laundry Service",
    items: 0,
    notes: "",
    laundryName: "",
    laundryAddress: "",
  };
}

export function mapCourierOrderStatus(status: string): CourierDashboardOrder["status"] {
  const normalized = status.toLowerCase();
  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("picked")) return "picked_up";
  if (normalized.includes("ready") || normalized.includes("accepted")) return "accepted";
  if (normalized.includes("cancel")) return "cancelled";
  return "pending";
}

export function normalizeCourierOrder(order: CourierOrderDto | CourierOrderResponseDto): CourierDashboardOrder {
  if ("customer" in order) {
    return {
      id: String(order.id),
      customer: order.customer || "Customer",
      phone: "",
      avatar: initialsFromName(order.customer || "Customer"),
      pickupArea: order.pickupArea || "Unknown",
      dropArea: order.dropArea || "Unknown",
      pickupLocation: order.pickupArea || "",
      deliveryLocation: order.dropArea || "",
      distance: order.distance || "Assigned",
      eta: order.eta || "—",
      amount: parseNumber(order.amount),
      status: mapCourierOrderStatus(order.status),
      urgent: Boolean(order.isUrgent),
      time: formatRelativeTime(order.createdAt),
      paid: Boolean(order.isPaid),
      service: order.service || "Laundry Order",
      items: parseNumber(order.itemsCount),
      notes: "",
      laundryName: "",
      laundryAddress: "",
    };
  }

  const status = mapCourierOrderStatus(order.status);
  const amount = parseNumber(order.totalPrice);
  return {
    id: String(order.id),
    customer: order.customerName || "Customer",
    phone: order.customerPhone || "",
    avatar: initialsFromName(order.customerName || "Customer"),
    pickupArea: extractArea(order.pickupLocation),
    dropArea: extractArea(order.deliveryLocation),
    pickupLocation: order.pickupLocation || "",
    deliveryLocation: order.deliveryLocation || "",
    distance: order.courierLatitude != null && order.courierLongitude != null ? "Live" : "Assigned",
    eta: order.estimatedDeliveryTime ? formatRelativeTime(order.estimatedDeliveryTime) : "—",
    amount,
    status,
    urgent: false,
    time: formatRelativeTime(order.pickedUpAt || order.deliveredAt || order.pickupTime),
    paid: false,
    service: "Laundry Order",
    items: 0,
    notes: order.notes || "",
    laundryName: order.laundryName || "",
    laundryAddress: order.laundryAddress || "",
  };
}

function enrichLegacyCourierOrder(
  rawOrder: CourierOrderDto | CourierOrderResponseDto,
  normalizedOrder: CourierDashboardOrder,
) {
  if ("customer" in rawOrder) {
    return normalizedOrder;
  }

  const raw = rawOrder as unknown as Record<string, unknown>;
  return {
    ...normalizedOrder,
    eta: formatEtaTime(rawOrder.estimatedDeliveryTime),
    paid: pickBoolean(raw, "isPaid", "IsPaid"),
    service: pickString(raw, "serviceName", "ServiceName") || normalizedOrder.service,
    items: pickNumber(raw, "itemsCount", "ItemsCount"),
  };
}

export async function getCourierOrders(filter: CourierOrderTab = "new") {
  const query = new URLSearchParams({
    Filter: String(mapFilterToQuery(filter)),
    PageIndex: "1",
    PageSize: "50",
  });
  const response = await apiRequest<CourierOrdersResponse<CourierOrderDto | CourierOrderResponseDto> | Array<CourierOrderDto | CourierOrderResponseDto>>(
    `/courier/orders?${query.toString()}`,
    { suppressErrorLog: true },
  );
  const raw = Array.isArray(response) ? {} : response;
  return {
    ...raw,
    data: unwrapResponseArray(response).map((order) =>
      enrichLegacyCourierOrder(order, normalizeCourierOrder(order)),
    ),
  };
}

export async function getAllCourierOrders() {
  const [newOrders, activeOrders, doneOrders, historyResult] = await Promise.all([
    getCourierOrders("new"),
    getCourierOrders("active"),
    getCourierOrders("done"),
    getCourierDeliveryHistory().catch(() => null),
  ]);

  const merged = new Map<string, CourierDashboardOrder>();
  for (const result of [newOrders, activeOrders, doneOrders]) {
    for (const order of result.data ?? []) {
      merged.set(order.id, order);
    }
  }

  const historyOrders = historyResult
    ? Array.isArray(historyResult.data)
      ? historyResult.data
      : Array.isArray(historyResult.Data)
        ? historyResult.Data
        : []
    : [];

  for (const order of historyOrders.map(normalizeCourierHistoryOrder)) {
    merged.set(order.id, order);
  }

  return Array.from(merged.values());
}

export async function getCourierOrderById(orderId: string) {
  const orders = await getAllCourierOrders();
  return orders.find((order) => order.id === String(orderId)) ?? null;
}

export async function getCourierProfile() {
  const response = await withFallback<CourierProfileResponseDto | CourierProfileDto>(
    () =>
      apiRequest<CourierProfileResponseDto>("/driver/profile", {
        suppressErrorLog: true,
      }),
    () =>
      apiRequest<CourierProfileDto>("/courier/profile", {
        suppressErrorLog: true,
      }),
  );
  return normalizeCourierProfile(response);
}

export async function getCourierUnreadNotificationCount() {
  const response = await apiRequest<{ unreadCount?: number; UnreadCount?: number }>("/notifications/count", {
    suppressErrorLog: true,
  });
  return pickNumber(response as Record<string, unknown>, "unreadCount", "UnreadCount");
}

export async function getCourierUnreadNotifications() {
  const response = await apiRequest<Array<CourierNotificationDto | Record<string, unknown>>>("/notifications/unread", {
    suppressErrorLog: true,
  });
  return (Array.isArray(response) ? response : []).map((notification) =>
    normalizeCourierNotification(notification),
  );
}

export async function markAllCourierNotificationsRead() {
  return apiRequest<{ updatedCount?: number; UpdatedCount?: number }>("/notifications/mark-all-read", {
    method: "PUT",
    suppressErrorLog: true,
  });
}

export async function updateCourierProfileDetails(payload: {
  name?: string;
  phoneNumber?: string;
}) {
  const response = await apiRequest<CourierProfileDto>("/courier/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    suppressErrorLog: true,
  });
  return normalizeCourierProfile(response);
}

export async function updateCourierStatus(isOnline: boolean) {
  return withFallback<void>(
    () =>
      apiRequest<void>("/driver/status", {
        method: "PUT",
        body: JSON.stringify({ isOnline }),
        suppressErrorLog: true,
      }),
    () =>
      apiRequest<void>("/courier/profile", {
        method: "PUT",
        body: JSON.stringify({ isAvailable: isOnline }),
        suppressErrorLog: true,
      }),
  );
}

export async function getCourierTodayStats() {
  const response = await withFallback<CourierTodayStatsDto | CourierStatsDto>(
    () =>
      apiRequest<CourierTodayStatsDto>("/driver/stats/today", {
        suppressErrorLog: true,
      }),
    () =>
      apiRequest<CourierStatsDto>("/courier/stats", {
        suppressErrorLog: true,
      }),
  );
  return normalizeCourierTodayStats(response);
}

export async function getCourierActiveRun() {
  return apiRequest<CourierActiveRunResponseDto>("/driver/runs/active", {
    suppressErrorLog: true,
  });
}

export async function acceptCourierOrder(orderId: string | number) {
  const response = await apiRequest<CourierOrderDto | CourierOrderResponseDto>(`/courier/orders/${encodeURIComponent(String(orderId))}/accept`, {
    method: "PUT",
    suppressErrorLog: true,
  });
  return normalizeCourierOrder(response);
}

export async function confirmCourierPickup(
  orderId: string | number,
  payload: CourierOrderLocationPayload,
) {
  const response = await apiRequest<CourierOrderDto | CourierOrderResponseDto>(`/courier/orders/${encodeURIComponent(String(orderId))}/pickup`, {
    method: "PUT",
    body: JSON.stringify(payload),
    suppressErrorLog: true,
  });
  return normalizeCourierOrder(response);
}

export async function confirmCourierDelivery(
  orderId: string | number,
  payload: CourierOrderLocationPayload,
) {
  const response = await apiRequest<CourierOrderDto | CourierOrderResponseDto>(`/courier/orders/${encodeURIComponent(String(orderId))}/deliver`, {
    method: "PUT",
    body: JSON.stringify(payload),
    suppressErrorLog: true,
  });
  return normalizeCourierOrder(response);
}

export async function cancelCourierOrder(orderId: string | number, cancellationReason: string) {
  return apiRequest<{ message?: string }>(`/courier/orders/${encodeURIComponent(String(orderId))}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ cancellationReason }),
    suppressErrorLog: true,
  });
}

export async function deliverCourierRunStop(
  runId: string,
  orderId: string,
  cashCollected: boolean,
) {
  return apiRequest<void>(`/driver/runs/${encodeURIComponent(runId)}/stops/${encodeURIComponent(orderId)}/deliver`, {
    method: "PUT",
    body: JSON.stringify({
      cashCollected,
      actualDeliveryTime: new Date().toISOString(),
    }),
    suppressErrorLog: true,
  });
}

export async function getCourierEarnings() {
  const response = await withFallback<CourierEarningsResponseDto | CourierStatsDto>(
    () =>
      apiRequest<CourierEarningsResponseDto>("/driver/earnings", {
        suppressErrorLog: true,
      }),
    () =>
      apiRequest<CourierStatsDto>("/courier/stats", {
        suppressErrorLog: true,
      }),
  );
  return normalizeCourierEarnings(response);
}

export async function getCourierDeliveryHistory(pageIndex = 1, pageSize = 20) {
  const query = new URLSearchParams({
    pageIndex: String(pageIndex),
    pageSize: String(pageSize),
  });
  return apiRequest<{
    data?: CourierDeliveryHistoryDto[];
    Data?: CourierDeliveryHistoryDto[];
    totalCount?: number;
    TotalCount?: number;
  }>(`/courier/history?${query.toString()}`, {
    suppressErrorLog: true,
  });
}

export async function syncCourierLocation(
  lat: number,
  lng: number,
  heading = 0,
  speed = 0,
) {
  return withFallback<void>(
    () =>
      apiRequest<void>("/driver/location/sync", {
        method: "POST",
        body: JSON.stringify({ lat, lng, heading, speed }),
        suppressErrorLog: true,
      }),
    () =>
      apiRequest<void>("/courier/location", {
        method: "PUT",
        body: JSON.stringify({ latitude: lat, longitude: lng }),
        suppressErrorLog: true,
      }),
  );
}

export async function safeSyncCourierLocation(
  lat: number,
  lng: number,
  heading = 0,
  speed = 0,
) {
  try {
    await syncCourierLocation(lat, lng, heading, speed);
    return true;
  } catch (error) {
    if (error instanceof ApiError) return false;
    return false;
  }
}

export async function getCourierDeviceLocation(): Promise<CourierOrderLocationPayload> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return { currentLatitude: 0, currentLongitude: 0 };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          currentLatitude: position.coords.latitude,
          currentLongitude: position.coords.longitude,
        }),
      () => resolve({ currentLatitude: 0, currentLongitude: 0 }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}
