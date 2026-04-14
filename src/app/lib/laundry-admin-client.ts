import { apiRequest } from "./admin-api";

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

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
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
    case "Dry Cleaning":
      return "DryCleaning";
    case "Ironing":
      return "Iron";
    case "Special Care":
      return "Specialty";
    default:
      return "Wash";
  }
}

function fromServiceCategory(category: string) {
  switch (category) {
    case "DryCleaning":
      return "Dry Cleaning";
    case "Iron":
      return "Ironing";
    case "Specialty":
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
  topServices: Array<{ name: string; orders: number; revenue: number; growth: number }>;
  stats?: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  };
}

export async function getDashboardSummary(): Promise<Partial<DashboardSummary>> {
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
}

export async function getRevenueWeekly(): Promise<Array<{ day: string; revenue: number; orders: number }>> {
  const points = await apiRequest<Array<{ label: string; revenue: number; orders: number }>>(
    "/laundry-admin/revenue/weekly",
  );
  return points.map((point) => ({
    day: point.label,
    revenue: point.revenue,
    orders: point.orders,
  }));
}

export async function getRevenueMonthly(
  year: number,
): Promise<Array<{ month: string; revenue: number; orders: number }>> {
  const points = await apiRequest<Array<{ label: string; revenue: number; orders: number }>>(
    `/laundry-admin/revenue/monthly?year=${year}`,
  );
  return points.map((point) => ({
    month: point.label,
    revenue: point.revenue,
    orders: point.orders,
  }));
}

export async function getIncomingOrders(): Promise<any[]> {
  try {
    const orders = await apiRequest<
      Array<{
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
      }>
    >("/laundry-admin/orders/incoming");
    return orders.map((order) => ({
      id: String(order.id),
      customer: order.customerName,
      phone: order.customerPhone,
      service: order.items.map((item) => item.serviceName).join(", ") || "Laundry Service",
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      amount: order.totalPrice,
      status: toFrontendOrderStatus(order.status),
      date: formatDate(order.createdAt, { month: "short", day: "numeric", year: "numeric" }),
      time: formatDate(order.createdAt, { hour: "numeric", minute: "2-digit" }),
      address: order.deliveryLocation || order.pickupLocation,
      pickupAddress: order.pickupLocation,
      deliveryAddress: order.deliveryLocation,
      createdAt: order.createdAt,
      pickupTime: order.pickupTime,
      rawStatus: order.status,
      rawItems: order.items,
    }));
  } catch (err) {
    console.warn("Failed incoming orders", err);
    return [];
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
    service: order.items.map((item) => item.serviceName).join(", ") || "Laundry Service",
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
      { label: "Order Placed", time: formatDateTime(order.createdAt), done: true },
      {
        label: "Processing",
        time: frontendStatus === "Pending" ? "Pending" : formatDateTime(order.pickupTime),
        done: frontendStatus !== "Pending",
        active: frontendStatus === "Processing",
      },
      {
        label: "Ready for Pickup",
        time: ["Ready", "Delivered"].includes(frontendStatus) ? formatDateTime(order.pickupTime) : "Pending",
        done: ["Ready", "Delivered"].includes(frontendStatus),
        active: frontendStatus === "Ready",
      },
      {
        label: "Delivered",
        time: frontendStatus === "Delivered" ? formatDateTime(order.pickupTime) : "Pending",
        done: frontendStatus === "Delivered",
        active: frontendStatus === "Delivered",
      },
    ],
  };
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await apiRequest(`/laundry-admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ newStatus: toBackendOrderStatus(status) })
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

export async function getServices(): Promise<ServiceDTO[]> {
  const services = await apiRequest<
    Array<{ id: number; serviceName: string; category: string; price: number; isAvailable: boolean }>
  >("/laundry-admin/services");

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
}

export async function createService(data: Partial<ServiceDTO>): Promise<ServiceDTO> {
  const created = await apiRequest<{
    id?: number;
    serviceName?: string;
    category?: string;
    price?: number;
    isAvailable?: boolean;
  }>("/laundry-admin/services", {
    method: "POST",
    body: JSON.stringify({
      serviceName: data.name,
      category: toServiceCategory(data.category ?? ""),
      price: data.price ?? 0,
    }),
  });

  return {
    id: String(created.id ?? ""),
    name: created.serviceName ?? data.name ?? "",
    description: data.description ?? "",
    price: created.price ?? data.price ?? 0,
    unit: data.unit ?? "per piece",
    category: fromServiceCategory(created.category ?? toServiceCategory(data.category ?? "")),
    active: created.isAvailable ?? data.active ?? true,
    popular: data.popular ?? false,
    orders: 0,
    rating: 0,
  };
}

export async function updateService(id: string, data: Partial<ServiceDTO>): Promise<ServiceDTO> {
  await apiRequest(`/laundry-admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      serviceName: data.name,
      category: data.category ? toServiceCategory(data.category) : undefined,
      price: data.price,
      isAvailable: data.active,
    })
  });
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    price: data.price ?? 0,
    unit: data.unit ?? "per piece",
    category: data.category ?? "Washing",
    active: data.active ?? true,
    popular: data.popular ?? false,
    orders: data.orders ?? 0,
    rating: data.rating ?? 0,
  };
}

export async function deleteService(id: string): Promise<void> {
  await apiRequest(`/laundry-admin/services/${id}`, {
    method: "DELETE"
  });
}

export async function uploadServiceImage(formData: FormData): Promise<{ url: string }> {
  // apiRequest defaults to application/json if body is present, so let's use custom fetch for FormData
  const { getStoredAuthToken } = await import("@/app/lib/auth-storage");
  const token = getStoredAuthToken();
  const res = await fetch("/api/backend/laundry-admin/upload-image", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!res.ok) throw new Error("Failed to upload image");
  const payload = await res.json();
  return { url: payload.ImageUrl ?? payload.imageUrl ?? payload.url ?? "" };
}

export async function suggestPrice(serviceDetails: any): Promise<{ suggestedPrice: number }> {
  const query = new URLSearchParams({
    ...serviceDetails,
    category: toServiceCategory(serviceDetails.category ?? ""),
  }).toString();
  const payload = await apiRequest<any>(`/laundry-admin/suggest-price?${query}`);
  return { suggestedPrice: payload?.suggestedPrice ?? payload?.price ?? 0 };
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
  const payload = await apiRequest<{ days: Array<{ dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }> }>(
    "/laundry-admin/availability/schedule",
  );

  const schedule = {} as WeeklySchedule;
  for (const dayName of DAY_NAMES.slice(1).concat(DAY_NAMES[0])) {
    schedule[dayName] = { enabled: false, slots: [{ start: "08:00", end: "20:00", id: `${dayName}-0` }] };
  }

  payload.days.forEach((day) => {
    const dayName = DAY_NAMES[day.dayOfWeek];
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
  });

  return schedule;
}

export async function updateSchedule(data: WeeklySchedule): Promise<void> {
  const days = (Object.entries(data) as Array<[string, DaySchedule]>).map(([name, value]) => {
    const dayIndex = DAY_NAMES.indexOf(name as (typeof DAY_NAMES)[number]);
    const firstSlot = value.slots[0] ?? { start: "08:00", end: "20:00" };
    return {
      dayOfWeek: dayIndex,
      isOpen: value.enabled,
      openTime: clockToTimeSpan(firstSlot.start),
      closeTime: clockToTimeSpan(firstSlot.end),
    };
  });

  await apiRequest("/laundry-admin/availability/schedule", {
    method: "PUT",
    body: JSON.stringify({ days })
  });
}

export async function getCapacity(): Promise<any> {
  const payload = await apiRequest<{ maxOrdersPerDay: number; leadTimeHours: number }>(
    "/laundry-admin/availability/capacity",
  );
  return {
    maxOrders: payload.maxOrdersPerDay,
    leadTime: payload.leadTimeHours,
  };
}

export async function updateCapacity(data: any): Promise<void> {
  await apiRequest("/laundry-admin/availability/capacity", {
    method: "PUT",
    body: JSON.stringify({
      maxOrdersPerDay: data.maxOrders,
      leadTimeHours: data.leadTime,
    })
  });
}

export async function getClosedDates(): Promise<any[]> {
  const dates = await apiRequest<Array<{ id: number; date: string; reason?: string }>>(
    "/laundry-admin/availability/closed-dates",
  );
  return dates.map((item) => ({
    id: String(item.id),
    date: formatDate(item.date, { month: "short", day: "numeric", year: "numeric" }),
    name: item.reason || "Closed",
    rawDate: item.date,
  }));
}

export async function addClosedDate(data: any): Promise<any> {
  return await apiRequest("/laundry-admin/availability/closed-dates", {
    method: "POST",
    body: JSON.stringify({
      date: data.rawDate ?? data.date,
      reason: data.name ?? data.reason,
    })
  });
}

export async function removeClosedDate(id: string): Promise<void> {
  await apiRequest(`/laundry-admin/availability/closed-dates/${id}`, {
    method: "DELETE"
  });
}

// ---------------------------------------------------------
// Payments & Commission
// ---------------------------------------------------------

export async function getCommissionSummary(): Promise<{ totalRevenue: number; commissionDue: number; rate: number; commissionPaid: number; status: string }> {
  const payload = await apiRequest<{
    totalRevenue: number;
    commissionRate: number;
    commissionPaid: number;
    commissionDue: number;
    status: string;
  }>("/laundry-admin/commission/summary");

  return {
    totalRevenue: payload.totalRevenue,
    commissionDue: payload.commissionDue,
    rate: payload.commissionRate,
    commissionPaid: payload.commissionPaid,
    status: payload.status,
  };
}

export async function initiateKashier(amount: number, laundryId?: number): Promise<{ url: string }> {
  const resolvedLaundryId = laundryId ?? (await getProfile()).laundryId;
  const payload = await apiRequest<any>("/laundry-admin/commission/kashier/initiate", {
    method: "POST",
    body: JSON.stringify({ amount, currency: "EGP", laundryId: resolvedLaundryId })
  });
  return { url: payload?.sessionUrl ?? payload?.url ?? "" };
}

export async function getPayments(): Promise<any[]> {
  const payments = await apiRequest<
    Array<{
      paymentId: string;
      orderId: number;
      customerName: string;
      serviceName: string;
      method: string;
      date: string;
      amount: number;
      status: "Paid" | "Pending" | "Refunded";
    }>
  >("/laundry-admin/payments");

  return payments.map((payment) => ({
    id: payment.paymentId,
    orderId: String(payment.orderId),
    customer: payment.customerName,
    method: payment.method,
    amount: payment.amount,
    status: payment.status,
    date: formatDate(payment.date, { month: "short", day: "numeric", year: "numeric" }),
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
    })
  });
}

export async function getComplaints(): Promise<any[]> {
  const complaints = await apiRequest<
    Array<{
      id: number;
      orderId: number;
      customerName: string;
      details: string;
      status: string;
      createdAt: string;
    }>
  >("/laundry-admin/complaints");

  return complaints.map((complaint) => ({
    id: String(complaint.id),
    orderId: complaint.orderId ? String(complaint.orderId) : undefined,
    customerName: complaint.customerName,
    subject: complaint.details,
    description: complaint.details,
    status:
      complaint.status === "InProgress"
        ? "In Progress"
        : complaint.status === "Resolved"
          ? "Resolved"
          : "Open",
    date: formatDate(complaint.createdAt, { month: "short", day: "numeric", year: "numeric" }),
  }));
}

// ---------------------------------------------------------
// Analytics & Verification
// ---------------------------------------------------------
export async function getExternalAnalytics(): Promise<any> {
  const analytics = await apiRequest<{
    totalRevenue: number;
    totalOrders: number;
    todayOrders: number;
    activeOrders: number;
    averageRating: number;
    mostRequestedService: string;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  }>("/analytics/laundry");

  return {
    activeUsers: analytics.activeOrders,
    conversionRate: `${analytics.averageRating.toFixed(1)} / 5`,
    avgOrderValue: analytics.totalOrders > 0 ? Math.round(analytics.totalRevenue / analytics.totalOrders) : 0,
    monthlyActive: analytics.todayOrders,
    history: analytics.monthlyRevenue.map((item) => ({
      name: item.month,
      visitors: item.revenue,
      orders: 0,
    })),
    totalOrders: analytics.totalOrders,
    mostRequestedService: analytics.mostRequestedService,
  };
}
export async function getForecast(): Promise<any> {
  const forecast = await apiRequest<{
    expectedOrdersNextWeek: number;
    expectedRevenueNextWeek: number;
    demandLevel: string;
    insights?: string;
    dailyBreakdown: Array<{ day: string; expectedOrders: number }>;
  }>("/analytics/forecast");

  return forecast.dailyBreakdown.map((day) => ({
    month: day.day,
    prediction: day.expectedOrders,
    confidence: [Math.max(day.expectedOrders - 2, 0), day.expectedOrders + 2],
  }));
}

export async function startVerificationSession(callbackUrl: string = "/laundry-admin/settings"): Promise<any> {
  const encodedCallback = encodeURIComponent(callbackUrl);
  const payload = await apiRequest<any>(`/verification/session?callbackUrl=${encodedCallback}`, {
    method: "POST",
  });

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return {
        ...parsed,
        url:
          parsed?.url ??
          parsed?.session_url ??
          parsed?.sessionUrl ??
          parsed?.redirect_url ??
          "",
      };
    } catch {
      return { url: payload };
    }
  }

  return {
    ...payload,
    url:
      payload?.url ??
      payload?.session_url ??
      payload?.sessionUrl ??
      payload?.redirect_url ??
      "",
  };
}

export async function getVerificationStatus(): Promise<{
  isIdentityVerified: boolean;
  role: string;
  adminApprovalStatus: string;
  commercialRegisterDocumentUrl: string | null;
}> {
  const payload = await apiRequest<any>("/verification/status");
  return {
    isIdentityVerified: payload.IsIdentityVerified ?? payload.isIdentityVerified ?? false,
    role: payload.Role ?? payload.role ?? "",
    adminApprovalStatus: payload.AdminApprovalStatus ?? payload.adminApprovalStatus ?? "",
    commercialRegisterDocumentUrl: payload.CommercialRegisterDocumentUrl ?? payload.commercialRegisterDocumentUrl ?? null,
  };
}

export async function uploadCommercialRegister(formData: FormData): Promise<any> {
  const { getStoredAuthToken } = await import("@/app/lib/auth-storage");
  const token = getStoredAuthToken();
  const res = await fetch("/api/backend/verification/commercial-register", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  if (!res.ok) throw new Error("Failed to upload register");
  return res.json();
}

export async function getLaundryNotifications(): Promise<any[]> {
  const notifications = await apiRequest<
    Array<{
      id: number;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string;
    }>
  >("/notifications");

  const now = Date.now();
  return notifications.map((notification) => ({
    id: String(notification.id),
    title: notification.title,
    message: notification.message,
    type:
      notification.type === "PaymentSuccess"
        ? "payment"
        : notification.type?.includes("Order")
          ? "order"
          : notification.type === "Promotion"
            ? "system"
            : "alert",
    time: formatDate(notification.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    read: notification.isRead,
    createdAt: notification.createdAt,
    isRecent: now - new Date(notification.createdAt).getTime() < 86400000,
  }));
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
