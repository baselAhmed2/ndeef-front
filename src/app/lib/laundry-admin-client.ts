import { apiRequest } from "./admin-api";

// ---------------------------------------------------------
// Dashboard
// ---------------------------------------------------------

export interface DashboardSummary {
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  topServices: Array<{ name: string; orders: number; revenue: number; growth: number }>;
  stats?: any; 
}

export async function getDashboardSummary(): Promise<Partial<DashboardSummary>> {
  return await apiRequest<Partial<DashboardSummary>>("/laundry-admin/dashboard/summary");
}

export async function getRevenueWeekly(): Promise<any> {
  return await apiRequest("/laundry-admin/revenue/weekly");
}

export async function getRevenueMonthly(year: number): Promise<any> {
  return await apiRequest(`/laundry-admin/revenue/monthly?year=${year}`);
}

export async function getIncomingOrders(): Promise<any[]> {
  try {
    return await apiRequest<any[]>("/laundry-admin/orders/incoming");
  } catch (err) {
    console.warn("Failed incoming orders", err);
    return [];
  }
}

// ---------------------------------------------------------
// Orders
// ---------------------------------------------------------

export async function getOrderById(id: string): Promise<any> {
  return await apiRequest(`/laundry-admin/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  await apiRequest(`/laundry-admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
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
  return await apiRequest<ServiceDTO[]>("/laundry-admin/services");
}

export async function createService(data: Partial<ServiceDTO>): Promise<ServiceDTO> {
  return await apiRequest<ServiceDTO>("/laundry-admin/services", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateService(id: string, data: Partial<ServiceDTO>): Promise<ServiceDTO> {
  return await apiRequest<ServiceDTO>(`/laundry-admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
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
  return res.json();
}

export async function suggestPrice(serviceDetails: any): Promise<{ suggestedPrice: number }> {
  const query = new URLSearchParams(serviceDetails).toString();
  return await apiRequest(`/laundry-admin/suggest-price?${query}`);
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
  return await apiRequest<WeeklySchedule>("/laundry-admin/availability/schedule");
}

export async function updateSchedule(data: WeeklySchedule): Promise<void> {
  await apiRequest("/laundry-admin/availability/schedule", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function getCapacity(): Promise<any> {
  return await apiRequest("/laundry-admin/availability/capacity");
}

export async function updateCapacity(data: any): Promise<void> {
  await apiRequest("/laundry-admin/availability/capacity", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function getClosedDates(): Promise<any[]> {
  return await apiRequest<any[]>("/laundry-admin/availability/closed-dates");
}

export async function addClosedDate(data: any): Promise<any> {
  return await apiRequest("/laundry-admin/availability/closed-dates", {
    method: "POST",
    body: JSON.stringify(data)
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

export async function getCommissionSummary(): Promise<{ totalRevenue: number; commissionDue: number; rate: number }> {
  return await apiRequest("/laundry-admin/commission/summary");
}

export async function initiateKashier(amount: number): Promise<{ url: string }> {
  return await apiRequest("/laundry-admin/commission/kashier/initiate", {
    method: "POST",
    body: JSON.stringify({ amount })
  });
}

export async function getPayments(): Promise<any[]> {
  return await apiRequest<any[]>("/laundry-admin/payments");
}

// ---------------------------------------------------------
// Profile & Setup
// ---------------------------------------------------------

export async function getProfile(): Promise<any> {
  return await apiRequest("/laundry-admin/profile");
}

export async function setupProfile(data: any): Promise<void> {
  await apiRequest("/laundry-admin/setup", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getComplaints(): Promise<any[]> {
  return await apiRequest<any[]>("/laundry-admin/complaints");
}

// ---------------------------------------------------------
// Analytics & Verification
// ---------------------------------------------------------
export async function getExternalAnalytics(): Promise<any> {
  return await apiRequest("/analytics/laundry");
}
export async function getForecast(): Promise<any> {
  return await apiRequest("/analytics/forecast");
}

export async function startVerificationSession(): Promise<any> {
  return await apiRequest("/verification/session", {
    method: "POST",
    body: JSON.stringify({})
  });
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
