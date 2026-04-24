import { ApiError, apiRequest } from "./admin-api";
import { readPendingLaundryOnboarding } from "./laundry-onboarding";

type BackendOrderStatus =
  | "PendingConfirmation"
  | "Accepted"
  | "Washing"
  | "ReadyForPickup"
  | "PickedUp"
  | "Delivered"
  | "Cancelled";

type FrontendOrderStatus =
  | "Pending"
  | "Processing"
  | "Ready"
  | "Delivered"
  | "Cancelled";

type BackendIncomingOrder = {
  id: number;
  customerName: string;
  customerPhone?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  pickupTime?: string | Date | null;
  status: string;
  totalPrice: number;
  createdAt: string;
  items?: Array<{
    serviceName?: string | null;
    quantity?: number | null;
    subtotal?: number | null;
  }> | null;
};

type BackendRecentOrder = {
  id: number;
  orderNumber?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  items?: number | null;
  total?: number | null;
  status?: string | null;
  createdAt?: string | null;
};

type LaundryNotificationType =
  | "order"
  | "payment"
  | "review"
  | "alert"
  | "system";

type BackendNotification = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  type?: string | number | null;
  isRead?: boolean | null;
  createdAt?: string | null;
  orderId?: number | string | null;
};

type NotificationsResponse =
  | BackendNotification[]
  | {
    data?: BackendNotification[] | null;
    pageIndex?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
  };

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function unwrapArray<T>(
  payload: T[] | { data?: T[] | null } | null | undefined,
): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function formatDateTime(value: string | Date) {
  return formatDate(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toFrontendOrderStatus(status: string): FrontendOrderStatus {
  switch (status) {
    case "Accepted":
    case "Washing":
    case "PickedUp":
      return "Processing";
    case "ReadyForPickup":
      return "Ready";
    case "Delivered":
      return "Delivered";
    case "Cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function toBackendOrderStatus(status: string): BackendOrderStatus {
  switch (status) {
    case "Pending":
      return "PendingConfirmation";
    case "Processing":
      return "Washing";
    case "Ready":
      return "ReadyForPickup";
    case "Delivered":
      return "Delivered";
    case "Cancelled":
      return "Cancelled";
    default:
      return "Accepted";
  }
}

function toServiceCategory(category: string) {
  switch (category) {
    case "Washing":
    case "Wash":
    case "1":
      return "Wash";
    case "Dry Cleaning":
    case "DryCleaning":
    case "2":
      return "DryCleaning";
    case "Ironing":
    case "Iron":
    case "3":
      return "Iron";
    case "Special Care":
    case "Specialty":
    case "4":
      return "Specialty";
    default:
      return "Wash";
  }
}

function fromServiceCategory(category: string | number | null | undefined) {
  switch (String(category ?? "")) {
    case "Wash":
    case "1":
      return "Washing";
    case "DryCleaning":
    case "2":
      return "Dry Cleaning";
    case "Iron":
    case "3":
      return "Ironing";
    case "Specialty":
    case "4":
      return "Special Care";
    default:
      return "Washing";
  }
}

function timeSpanToClock(value: string) {
  return value.slice(0, 5);
}

function clockToTimeSpan(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

// ---------------------------------------------------------
// Dashboard
// ---------------------------------------------------------

export interface DashboardSummary {
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  topServices: Array<{
    name: string;
    orders: number;
    revenue: number;
    growth: number;
  }>;
  stats?: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  };
}

export async function getDashboardSummary(): Promise<
  Partial<DashboardSummary>
> {
  try {
    const summary = await apiRequest<{
      totalOrders: number;
      pendingOrders: number;
      inProgressOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
    }>("/laundry-admin/dashboard/summary");

    return {
      stats: summary,
      orderStatusData: [
        { name: "Pending", value: summary.pendingOrders, color: "#EBA050" },
        { name: "Processing", value: summary.inProgressOrders, color: "#1D5B70" },
        { name: "Delivered", value: summary.completedOrders, color: "#22c55e" },
        { name: "Cancelled", value: summary.cancelledOrders, color: "#ef4444" },
      ],
    };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500) {
      console.warn("Falling back to empty dashboard summary after backend failure", {
        status: error.status,
        message: error.message,
      });
      return {
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          inProgressOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
        },
        orderStatusData: [
          { name: "Pending", value: 0, color: "#EBA050" },
          { name: "Processing", value: 0, color: "#1D5B70" },
          { name: "Delivered", value: 0, color: "#22c55e" },
          { name: "Cancelled", value: 0, color: "#ef4444" },
        ],
      };
    }

    throw error;
  }
}

export async function getRevenueWeekly(): Promise<
  Array<{ day: string; revenue: number; orders: number }>
> {
  const payload = await apiRequest<
    | Array<{ label: string; revenue: number; orders: number }>
    | {
      data?: Array<{ label: string; revenue: number; orders: number }> | null;
    }
  >("/laundry-admin/revenue/weekly");
  const points = unwrapArray(payload);
  return points.map((point) => ({
    day: point.label,
    revenue: point.revenue,
    orders: point.orders,
  }));
}

export async function getRevenueMonthly(
  year: number,
): Promise<Array<{ month: string; revenue: number; orders: number }>> {
  try {
    const payload = await apiRequest<
      | Array<{ label: string; revenue: number; orders: number }>
      | {
        data?: Array<{ label: string; revenue: number; orders: number }> | null;
      }
    >(`/laundry-admin/revenue/monthly?year=${year}`);
    const points = unwrapArray(payload);
    return points.map((point) => ({
      month: point.label,
      revenue: point.revenue,
      orders: point.orders,
    }));
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500) {
      console.warn("Falling back to empty monthly revenue after backend failure", {
        status: error.status,
        message: error.message,
      });
      return [];
    }

    throw error;
  }
}

export async function getIncomingOrders(): Promise<any[]> {
  try {
    const payload = await apiRequest<
      Array<BackendIncomingOrder> | { data?: BackendIncomingOrder[] | null }
    >("/laundry-admin/orders/incoming", { suppressErrorLog: true });
    const orders = unwrapArray(payload);
    return orders.map(mapIncomingOrder);
  } catch (err) {
    try {
      const recentPayload = await apiRequest<
        Array<BackendRecentOrder> | { data?: BackendRecentOrder[] | null }
      >("/laundry-admin/orders/recent", { suppressErrorLog: true });
      return unwrapArray(recentPayload).map(mapRecentOrder);
    } catch (fallbackErr) {
      console.warn("Failed to load laundry orders", {
        primary: err,
        fallback: fallbackErr,
      });
      return [];
    }
  }
}

// ---------------------------------------------------------
// Orders
// ---------------------------------------------------------

export async function getOrderById(id: string): Promise<any> {
  const order = await apiRequest<{
    id: number;
    customerName: string;
    customerPhone: string;
    pickupLocation: string;
    deliveryLocation: string;
    pickupTime: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    items: Array<{ serviceName: string; quantity: number; subtotal: number }>;
  }>(`/laundry-admin/orders/${id}`);

  const frontendStatus = toFrontendOrderStatus(order.status);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: String(order.id),
    customer: order.customerName,
    phone: order.customerPhone,
    email: "",
    address: order.deliveryLocation || order.pickupLocation,
    pickupAddress: order.pickupLocation,
    deliveryAddress: order.deliveryLocation,
    service:
      order.items.map((item) => item.serviceName).join(", ") ||
      "Laundry Service",
    status: frontendStatus,
    date: formatDateTime(order.createdAt),
    estimatedReady: formatDateTime(order.pickupTime),
    items: order.items.map((item) => ({
      name: item.serviceName,
      qty: item.quantity,
      price: item.quantity > 0 ? item.subtotal / item.quantity : item.subtotal,
      subtotal: item.subtotal,
    })),
    notes: "",
    paymentStatus: "Pending",
    paymentMethod: "Unknown",
    rawStatus: order.status,
    totalPrice: order.totalPrice,
    totalItems,
    timeline: [
      {
        label: "Order Placed",
        time: formatDateTime(order.createdAt),
        done: true,
      },
      {
        label: "Processing",
        time:
          frontendStatus === "Pending"
            ? "Pending"
            : formatDateTime(order.pickupTime),
        done: frontendStatus !== "Pending",
        active: frontendStatus === "Processing",
      },
      {
        label: "Ready for Pickup",
        time: ["Ready", "Delivered"].includes(frontendStatus)
          ? formatDateTime(order.pickupTime)
          : "Pending",
        done: ["Ready", "Delivered"].includes(frontendStatus),
        active: frontendStatus === "Ready",
      },
      {
        label: "Delivered",
        time:
          frontendStatus === "Delivered"
            ? formatDateTime(order.pickupTime)
            : "Pending",
        done: frontendStatus === "Delivered",
        active: frontendStatus === "Delivered",
      },
    ],
  };
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<void> {
  await apiRequest(`/laundry-admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ newStatus: toBackendOrderStatus(status) }),
  });
}

// ---------------------------------------------------------
// Services
// ---------------------------------------------------------
export interface ServiceDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  active: boolean;
  popular: boolean;
  icon?: any; // Will be mapped to Lucide component in the UI
  orders: number;
  rating: number;
}

function isMissingLaundryError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.message.toLowerCase().includes("no laundry is linked to this account")
  );
}

async function restoreMissingLaundryProfile() {
  const pendingLaundry = readPendingLaundryOnboarding();
  if (!pendingLaundry) return false;

  await saveLaundryProfile({
    laundryName: pendingLaundry.laundryName,
    address: pendingLaundry.address,
    latitude: pendingLaundry.latitude,
    longitude: pendingLaundry.longitude,
  });

  return true;
}

async function withLaundryRecovery<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isMissingLaundryError(error) && (await restoreMissingLaundryProfile())) {
      return action();
    }

    throw error;
  }
}

export async function ensureLaundryProfileFromPendingOnboarding(): Promise<boolean> {
  return restoreMissingLaundryProfile();
}

export async function getServices(): Promise<ServiceDTO[]> {
  try {
    const payload = await apiRequest<
      | Array<{
        id: number;
        serviceName: string;
        category: string;
        price: number;
        isAvailable: boolean;
      }>
      | {
        data?: Array<{
          id: number;
          serviceName: string;
          category: string;
          price: number;
          isAvailable: boolean;
        }> | null;
      }
    >("/laundry-admin/services");
    const services = unwrapArray(payload);

    return services.map((service) => ({
      id: String(service.id),
      name: service.serviceName,
      description: "",
      price: service.price,
      unit: "per piece",
      category: fromServiceCategory(service.category),
      active: service.isAvailable,
      popular: false,
      orders: 0,
      rating: 0,
    }));
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500) {
      console.warn(
        "Falling back to an empty service catalog after backend failure",
        {
          status: error.status,
          message: error.message,
        },
      );
      return [];
    }

    throw error;
  }
}

export async function createService(
  data: Partial<ServiceDTO>,
): Promise<ServiceDTO> {
  const requestBody = {
    serviceName: data.name,
    category: toServiceCategory(data.category ?? ""),
    price: data.price ?? 0,
    isAvailable: data.active ?? true,
  };

  let created: {
    id?: number;
    serviceName?: string;
    category?: string;
    price?: number;
    isAvailable?: boolean;
  };

  try {
    created = await apiRequest<{
      id?: number;
      serviceName?: string;
      category?: string;
      price?: number;
      isAvailable?: boolean;
    }>("/laundry-admin/services", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    if (isMissingLaundryError(error) && (await restoreMissingLaundryProfile())) {
      created = await apiRequest<{
        id?: number;
        serviceName?: string;
        category?: string;
        price?: number;
        isAvailable?: boolean;
      }>("/laundry-admin/services", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
    } else {
      throw error;
    }
  }

  return {
    id: String(created.id ?? ""),
    name: created.serviceName ?? data.name ?? "",
    description: data.description ?? "",
    price: created.price ?? data.price ?? 0,
    unit: data.unit ?? "per piece",
    category: fromServiceCategory(
      created.category ?? toServiceCategory(data.category ?? ""),
    ),
    active: created.isAvailable ?? data.active ?? true,
    popular: data.popular ?? false,
    orders: 0,
    rating: 0,
  };
}

export async function updateService(
  id: string,
  data: Partial<ServiceDTO>,
): Promise<ServiceDTO> {
  // Build body with only the fields that were actually provided
  // Avoids sending price=undefined (stripped by JSON.stringify) or invalid values
  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.serviceName = data.name;
  if (data.category !== undefined) body.category = toServiceCategory(data.category);
  if (data.price !== undefined && data.price > 0) body.price = data.price;
  if (data.active !== undefined) body.isAvailable = data.active;

  // Send update to backend and parse the response
  const updated = await apiRequest<{
    id?: number;
    serviceName?: string;
    category?: string;
    price?: number;
    isAvailable?: boolean;
  }>(`/laundry-admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  // Return merged data - use backend response if available, otherwise fall back to input
  return {
    id: String(updated?.id ?? id),
    name: updated?.serviceName ?? data.name ?? "",
    description: data.description ?? "",
    price: updated?.price ?? data.price ?? 0,
    unit: data.unit ?? "per piece",
    category: fromServiceCategory(updated?.category ?? toServiceCategory(data.category ?? "")),
    active: updated?.isAvailable ?? data.active ?? true,
    popular: data.popular ?? false,
    orders: data.orders ?? 0,
    rating: data.rating ?? 0,
  };
}

export async function deleteService(id: string): Promise<void> {
  await apiRequest(`/laundry-admin/services/${id}`, {
    method: "DELETE",
  });
}

export async function uploadServiceImage(
  formData: FormData,
): Promise<{ url: string }> {
  // apiRequest defaults to application/json if body is present, so let's use custom fetch for FormData
  const { getStoredAuthToken } = await import("@/app/lib/auth-storage");
  const token = getStoredAuthToken();
  const res = await fetch("/api/backend/laundry-admin/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let message = "Failed to upload image";
    try {
      const text = await res.text();
      if (text) {
        try {
          const payload = JSON.parse(text) as { Message?: string; message?: string; title?: string };
          message = payload.Message ?? payload.message ?? payload.title ?? text;
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore read errors and keep fallback message
    }
    throw new Error(message);
  }
  const payload = await res.json();
  return { url: payload.ImageUrl ?? payload.imageUrl ?? payload.url ?? "" };
}

export async function suggestPrice(
  serviceDetails: any,
): Promise<{ suggestedPrice: number; reasoning?: string }> {
  const query = new URLSearchParams({
    ...serviceDetails,
    category: toServiceCategory(serviceDetails.category ?? ""),
  }).toString();
  const payload = await apiRequest<any>(
    `/laundry-admin/suggest-price?${query}`,
  );
  return {
    suggestedPrice:
      payload?.suggestedPrice ??
      payload?.recommendedPrice ??
      payload?.price ??
      0,
    reasoning: payload?.reasoning,
  };
}

// ---------------------------------------------------------
// Availability
// ---------------------------------------------------------
export interface DaySchedule {
  enabled: boolean;
  slots: Array<{ start: string; end: string; id: string }>;
}
export type WeeklySchedule = Record<string, DaySchedule>;

export async function getSchedule(): Promise<WeeklySchedule> {
  const payload = await withLaundryRecovery(() =>
    apiRequest<{
      days: Array<{
        dayOfWeek: number;
        isOpen: boolean;
        openTime: string;
        closeTime: string;
      }>;
    }>("/laundry-admin/availability/schedule"),
  );

  const schedule = {} as WeeklySchedule;
  for (const dayName of DAY_NAMES.slice(1).concat(DAY_NAMES[0])) {
    schedule[dayName] = {
      enabled: false,
      slots: [{ start: "08:00", end: "20:00", id: `${dayName}-0` }],
    };
  }

  payload.days?.forEach((day) => {
    const dayName = DAY_NAMES[day.dayOfWeek];
    if (dayName) {
      schedule[dayName] = {
        enabled: day.isOpen,
        slots: [
          {
            start: timeSpanToClock(day.openTime),
            end: timeSpanToClock(day.closeTime),
            id: `${dayName}-0`,
          },
        ],
      };
    }
  });

  return schedule;
}

export async function updateSchedule(data: WeeklySchedule): Promise<void> {
  const days = (Object.entries(data) as Array<[string, DaySchedule]>).map(
    ([name, value]) => {
      const dayIndex = DAY_NAMES.indexOf(name as (typeof DAY_NAMES)[number]);
      const firstSlot = value.slots[0] ?? { start: "08:00", end: "20:00" };
      return {
        dayOfWeek: dayIndex,
        isOpen: value.enabled,
        openTime: clockToTimeSpan(firstSlot.start),
        closeTime: clockToTimeSpan(firstSlot.end),
      };
    },
  );

  await withLaundryRecovery(() =>
    apiRequest("/laundry-admin/availability/schedule", {
      method: "PUT",
      body: JSON.stringify({ days }),
    }),
  );
}

export async function getCapacity(): Promise<any> {
  const payload = await withLaundryRecovery(() =>
    apiRequest<{
      maxOrdersPerDay?: number;
      leadTimeHours?: number;
      data?: { maxOrdersPerDay?: number; leadTimeHours?: number } | null;
    }>("/laundry-admin/availability/capacity"),
  );
  const capacity = payload.data ?? payload;
  return {
    maxOrders: capacity?.maxOrdersPerDay ?? 0,
    leadTime: capacity?.leadTimeHours ?? 0,
  };
}

export async function updateCapacity(data: any): Promise<void> {
  await withLaundryRecovery(() =>
    apiRequest("/laundry-admin/availability/capacity", {
      method: "PUT",
      body: JSON.stringify({
        maxOrdersPerDay: data.maxOrders,
        leadTimeHours: data.leadTime,
      }),
    }),
  );
}

export async function getClosedDates(): Promise<any[]> {
  const payload = await withLaundryRecovery(() =>
    apiRequest<
      | Array<{ id: number; date: string; reason?: string }>
      | { data?: Array<{ id: number; date: string; reason?: string }> | null }
    >("/laundry-admin/availability/closed-dates"),
  );
  const dates = unwrapArray(payload);
  return dates.map((item) => ({
    id: String(item.id),
    date: formatDate(item.date, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    name: item.reason || "Closed",
    rawDate: item.date,
  }));
}

export async function addClosedDate(data: any): Promise<any> {
  const normalizedDate =
    typeof data.rawDate === "string" && data.rawDate
      ? data.rawDate
      : typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
        ? new Date(`${data.date}T00:00:00`).toISOString()
        : data.date;

  return withLaundryRecovery(() =>
    apiRequest("/laundry-admin/availability/closed-dates", {
      method: "POST",
      body: JSON.stringify({
        date: normalizedDate,
        reason: data.name ?? data.reason,
      }),
    }),
  );
}

export async function removeClosedDate(id: string): Promise<void> {
  await withLaundryRecovery(() =>
    apiRequest(`/laundry-admin/availability/closed-dates/${id}`, {
      method: "DELETE",
    }),
  );
}

// ---------------------------------------------------------
// Payments & Commission
// ---------------------------------------------------------

export async function getCommissionSummary(): Promise<{
  totalRevenue: number;
  commissionDue: number;
  rate: number;
  commissionPaid: number;
  status: string;
}> {
  const payload = await apiRequest<{
    totalRevenue?: number;
    commissionRate?: number;
    commissionPaid?: number;
    commissionDue?: number;
    status?: string;
    data?: {
      totalRevenue?: number;
      commissionRate?: number;
      commissionPaid?: number;
      commissionDue?: number;
      status?: string;
    } | null;
  }>("/laundry-admin/commission/summary");
  const summary = payload.data ?? payload;

  return {
    totalRevenue: summary?.totalRevenue ?? 0,
    commissionDue: summary?.commissionDue ?? 0,
    rate: summary?.commissionRate ?? 0,
    commissionPaid: summary?.commissionPaid ?? 0,
    status: summary?.status ?? "Pending",
  };
}

export async function initiateKashier(
  amount: number,
  laundryId?: number,
): Promise<{ url: string }> {
  const resolvedLaundryId = laundryId ?? (await getProfile()).laundryId;
  const payload = await apiRequest<any>(
    "/laundry-admin/commission/kashier/initiate",
    {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "EGP",
        laundryId: resolvedLaundryId,
      }),
    },
  );
  return { url: payload?.sessionUrl ?? payload?.url ?? "" };
}

export async function getPayments(): Promise<any[]> {
  const payload = await apiRequest<
    | Array<{
      paymentId: string;
      orderId: number;
      customerName: string;
      serviceName: string;
      method: string;
      date: string;
      amount: number;
      status: "Paid" | "Pending" | "Refunded";
    }>
    | {
      data?: Array<{
        paymentId: string;
        orderId: number;
        customerName: string;
        serviceName: string;
        method: string;
        date: string;
        amount: number;
        status: "Paid" | "Pending" | "Refunded";
      }> | null;
    }
  >("/laundry-admin/payments");
  const payments = unwrapArray(payload);

  return payments.map((payment) => ({
    id: payment.paymentId,
    orderId: String(payment.orderId),
    customer: payment.customerName,
    method: payment.method,
    amount: payment.amount,
    status: payment.status,
    date: formatDate(payment.date, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    service: payment.serviceName,
  }));
}

// ---------------------------------------------------------
// Profile & Setup
// ---------------------------------------------------------

export async function getProfile(): Promise<any> {
  const profile = await apiRequest<{
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    status: string;
    availability: string;
    imageUrl?: string;
    averageRating: number;
    totalReviews: number;
    createdAt: string;
  }>("/laundry-admin/profile");

  return {
    id: profile.id,
    laundryId: profile.id,
    laundryName: profile.name,
    name: profile.name,
    address: profile.address,
    latitude: profile.latitude,
    longitude: profile.longitude,
    imageUrl: profile.imageUrl,
    status: profile.status,
    availability: profile.availability,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
  };
}

export async function setupProfile(data: any): Promise<void> {
  await apiRequest("/laundry-admin/setup", {
    method: "POST",
    body: JSON.stringify({
      name: data.laundryName ?? data.name,
      address: data.address,
      latitude: Number(data.latitude ?? 0),
      longitude: Number(data.longitude ?? 0),
      imageUrl: data.imageUrl ?? null,
    }),
  });
}

export async function updateLaundryProfile(data: any): Promise<void> {
  await apiRequest("/laundry-admin/profile", {
    method: "PUT",
    body: JSON.stringify({
      name: data.laundryName ?? data.name,
      address: data.address,
      latitude: Number(data.latitude ?? 0),
      longitude: Number(data.longitude ?? 0),
    }),
  });
}

export async function saveLaundryProfile(data: any): Promise<void> {
  try {
    await updateLaundryProfile(data);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.message.toLowerCase().includes("no laundry is linked to this account") ||
        error.message.toLowerCase().includes("you already have a laundry registered to this account"))
    ) {
      await setupProfile(data);
      return;
    }

    throw error;
  }
}

// ---------------------------------------------------------
// Couriers
// ---------------------------------------------------------

export interface LaundryCourierDTO {
  courierId: string;
  name: string;
  phoneNumber: string;
  isAvailable: boolean;
  completedOrdersCount: number;
  cancellationCount: number;
  laundryId?: number | null;
  laundryName?: string | null;
}

export async function getLaundryCouriers(): Promise<LaundryCourierDTO[]> {
  const payload = await apiRequest<
    LaundryCourierDTO[] | { data?: LaundryCourierDTO[] | null }
  >("/laundry-admin/couriers");
  return unwrapArray(payload);
}

export async function assignCourier(phoneNumber: string): Promise<void> {
  await apiRequest("/laundry-admin/couriers/assign", {
    method: "POST",
    body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
  });
}

export async function unassignCourier(courierId: string): Promise<void> {
  await apiRequest(
    `/laundry-admin/couriers/${encodeURIComponent(courierId)}/unassign`,
    {
      method: "DELETE",
    },
  );
}

export async function getComplaints(): Promise<any[]> {
  const payload = await apiRequest<
    | Array<{
      id: number;
      orderId: number;
      customerName: string;
      customerPhone?: string;
      customerEmail?: string;
      details: string;
      status: string;
      createdAt: string;
    }>
    | {
      data?: Array<{
        id: number;
        orderId: number;
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        details: string;
        status: string;
        createdAt: string;
      }> | null;
    }
  >("/laundry-admin/complaints");
  const complaints = unwrapArray(payload);

  return complaints.map((complaint) => ({
    id: String(complaint.id),
    orderId: complaint.orderId ? String(complaint.orderId) : undefined,
    customerName: complaint.customerName || "Unknown customer",
    customerPhone: complaint.customerPhone ?? "",
    customerEmail: complaint.customerEmail ?? "",
    subject: complaint.details || "Customer complaint",
    description: complaint.details || "No complaint details provided.",
    status: mapComplaintStatusToUiStatus(complaint.status),
    date: formatDate(complaint.createdAt, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
}

function mapComplaintStatusToUiStatus(status: string | null | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "inprogress" || normalized === "in progress" || normalized === "2") {
    return "In Progress";
  }

  if (normalized === "resolved" || normalized === "3") {
    return "Resolved";
  }

  return "Open";
}

function toComplaintStatus(status: string) {
  switch (status) {
    case "In Progress":
    case "InProgress":
    case "2":
      return "InProgress";
    case "Resolved":
    case "3":
      return "Resolved";
    case "Rejected":
    case "4":
      return "Rejected";
    default:
      return "Open";
  }
}

export async function updateComplaintStatus(
  id: string,
  status: string,
): Promise<void> {
  await apiRequest(`/laundry-admin/complaints/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status: toComplaintStatus(status),
    }),
  });
}

// ---------------------------------------------------------
// Analytics & Verification
// ---------------------------------------------------------
export async function getExternalAnalytics(): Promise<any> {
  let analytics: {
    totalRevenue: number;
    totalOrders: number;
    todayOrders: number;
    activeOrders: number;
    averageRating: number;
    mostRequestedService: string;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  };

  try {
    analytics = await apiRequest<{
      totalRevenue: number;
      totalOrders: number;
      todayOrders: number;
      activeOrders: number;
      averageRating: number;
      mostRequestedService: string;
      monthlyRevenue: Array<{ month: string; revenue: number }>;
    }>("/analytics/laundry");
  } catch (error) {
    if (isMissingLaundryError(error) && (await restoreMissingLaundryProfile())) {
      analytics = await apiRequest<{
        totalRevenue: number;
        totalOrders: number;
        todayOrders: number;
        activeOrders: number;
        averageRating: number;
        mostRequestedService: string;
        monthlyRevenue: Array<{ month: string; revenue: number }>;
      }>("/analytics/laundry");
    } else if (error instanceof ApiError) {
      console.warn("Falling back to empty analytics after backend failure", {
        status: error.status,
        message: error.message,
      });
      analytics = {
        totalRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        activeOrders: 0,
        averageRating: 0,
        mostRequestedService: "",
        monthlyRevenue: [],
      };
    } else {
      throw error;
    }
  }

  return {
    activeOrders: analytics.activeOrders ?? 0,
    averageRating: `${(analytics.averageRating ?? 0).toFixed(1)} / 5`,
    avgOrderValue:
      analytics.totalOrders > 0
        ? Math.round(analytics.totalRevenue / analytics.totalOrders)
        : 0,
    todayOrders: analytics.todayOrders ?? 0,
    totalRevenue: analytics.totalRevenue ?? 0,
    history: (analytics.monthlyRevenue ?? []).map((item) => ({
      name: item.month,
      revenue: item.revenue,
    })),
    totalOrders: analytics.totalOrders ?? 0,
    mostRequestedService: analytics.mostRequestedService ?? "",
  };
}
export async function getForecast(): Promise<any> {
  try {
    const forecast = await apiRequest<{
      expectedOrdersNextWeek: number;
      expectedRevenueNextWeek: number;
      demandLevel: string;
      insights?: string;
      dailyBreakdown: Array<{ day: string; expectedOrders: number }>;
    }>("/analytics/forecast");

    return {
      expectedOrdersNextWeek: forecast.expectedOrdersNextWeek,
      expectedRevenueNextWeek: forecast.expectedRevenueNextWeek,
      demandLevel: forecast.demandLevel,
      insights: forecast.insights,
      dailyBreakdown: (forecast.dailyBreakdown ?? []).map((day) => ({
        day: day.day,
        expectedOrders: day.expectedOrders,
      })),
    };
  } catch (error) {
    if (isMissingLaundryError(error) && (await restoreMissingLaundryProfile())) {
      return getForecast();
    }

    if (error instanceof ApiError) {
      console.warn("Falling back to empty demand forecast after backend failure", {
        status: error.status,
        message: error.message,
      });
      return {
        expectedOrdersNextWeek: 0,
        expectedRevenueNextWeek: 0,
        demandLevel: "Unknown",
        insights: "Forecast is unavailable right now.",
        dailyBreakdown: [],
      };
    }

    throw error;
  }
}

export async function startVerificationSession(
  callbackUrl?: string,
): Promise<{ url: string }> {
  const resolvedCallback =
    callbackUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/laundry-admin/verification/success`
      : undefined);

  try {
    const payload = await apiRequest<any>("/verification/create-session", {
      method: "POST",
      body: JSON.stringify({
        redirectUrl: resolvedCallback,
      }),
    });
    const url =
      typeof payload === "string"
        ? payload
        : (payload?.url ??
          payload?.Url ??
          payload?.sessionUrl ??
          payload?.verificationUrl);
    if (!url) {
      throw new ApiError("Verification session was created without a redirect URL.");
    }
    return { url };
  } catch (error) {
    console.error("Failed to create Didit verification session", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create Didit verification session.");
  }
}

function toFrontendNotificationType(
  type: string | number | null | undefined,
): LaundryNotificationType {
  const normalized = String(type ?? "").toLowerCase();

  if (normalized.includes("payment") || normalized === "4") return "payment";
  if (normalized.includes("review")) return "review";
  if (
    normalized.includes("promotion") ||
    normalized.includes("system") ||
    normalized === "5"
  )
    return "system";
  if (normalized.includes("alert") || normalized.includes("warning"))
    return "alert";
  if (normalized.includes("order") || ["1", "2", "3"].includes(normalized))
    return "order";

  return "alert";
}

function unwrapNotifications(
  payload: NotificationsResponse,
): BackendNotification[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function mapIncomingOrder(order: BackendIncomingOrder) {
  const items = order.items ?? [];
  const createdAt = order.createdAt || new Date().toISOString();

  return {
    id: String(order.id),
    customer: order.customerName || "Unknown customer",
    phone: order.customerPhone ?? "",
    service:
      items
        .map((item) => item.serviceName)
        .filter(Boolean)
        .join(", ") || "Laundry Service",
    items: items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    amount: Number(order.totalPrice ?? 0),
    status: toFrontendOrderStatus(order.status),
    date: formatDate(createdAt, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: formatDate(createdAt, { hour: "numeric", minute: "2-digit" }),
    address: order.deliveryLocation || order.pickupLocation || "",
    pickupAddress: order.pickupLocation ?? "",
    deliveryAddress: order.deliveryLocation ?? "",
    createdAt,
    pickupTime: order.pickupTime ?? "",
    rawStatus: order.status,
    rawItems: items,
  };
}

function mapRecentOrder(order: BackendRecentOrder) {
  const createdAt = order.createdAt || new Date().toISOString();
  const status = order.status ?? "PendingConfirmation";

  return {
    id: String(order.id),
    customer: order.customerName || "Unknown customer",
    phone: "",
    service: order.serviceName || "Laundry Service",
    items: Number(order.items ?? 0),
    amount: Number(order.total ?? 0),
    status: toFrontendOrderStatus(status),
    date: formatDate(createdAt, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: formatDate(createdAt, { hour: "numeric", minute: "2-digit" }),
    address: "",
    pickupAddress: "",
    deliveryAddress: "",
    createdAt,
    pickupTime: "",
    rawStatus: status,
    rawItems: [],
  };
}

export async function uploadCommercialRegister(
  formData: FormData,
): Promise<any> {
  const { getStoredAuthToken } = await import("@/app/lib/auth-storage");
  const token = getStoredAuthToken();
  const res = await fetch("/api/backend/verification/commercial-register", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload register");
  return res.json();
}

export async function getVerificationStatus(): Promise<{
  isIdentityVerified: boolean;
  role: string;
  commercialRegisterDocumentUrl: string | null;
}> {
  const status = await apiRequest<any>("/verification/status");
  return {
    isIdentityVerified: Boolean(status.isIdentityVerified ?? status.isVerified),
    role: status.role ?? "",
    commercialRegisterDocumentUrl: status.commercialRegisterDocumentUrl ?? null,
  };
}

export async function getLaundryNotifications(): Promise<any[]> {
  const payload = await apiRequest<NotificationsResponse>(
    "/notifications?PageIndex=1&PageSize=50",
  );
  const notifications = unwrapNotifications(payload);

  const now = Date.now();
  return notifications.map((notification) => ({
    id: String(notification.id),
    title: notification.title ?? "Notification",
    message: notification.message ?? "",
    type: toFrontendNotificationType(notification.type),
    orderId: notification.orderId ?? null,
    time: notification.createdAt
      ? formatDate(notification.createdAt, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
      : "",
    read: Boolean(notification.isRead),
    createdAt: notification.createdAt ?? "",
    isRecent: notification.createdAt
      ? now - new Date(notification.createdAt).getTime() < 86400000
      : false,
  }));
}

export async function getLaundryUnreadNotificationCount(): Promise<number> {
  const payload = await apiRequest<{
    unreadCount?: number;
    UnreadCount?: number;
  }>("/notifications/count");
  return Number(payload.unreadCount ?? payload.UnreadCount ?? 0);
}

export async function markLaundryNotificationRead(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllLaundryNotificationsRead(): Promise<void> {
  await apiRequest("/notifications/mark-all-read", { method: "PUT" });
}

export async function deleteLaundryNotification(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}`, { method: "DELETE" });
}

export async function clearReadLaundryNotifications(): Promise<void> {
  await apiRequest("/notifications/clear-all", { method: "DELETE" });
}
