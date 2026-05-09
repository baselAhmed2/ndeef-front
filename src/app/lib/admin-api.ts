import { getStoredAuthToken } from "@/app/lib/auth-storage";

const FALLBACK_API_BASE_URL = "/api/backend";
const API_BASE_STORAGE_KEY = "nadeef_admin_api_base_url";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestInit = RequestInit & {
  suppressErrorLog?: boolean;
};

function resolveApiBaseUrl() {
  // In the browser we always prefer the local Next.js proxy so requests
  // share the app's origin/session and avoid cross-origin fetch failures.
  if (typeof window !== "undefined") {
    const storedValue = window.localStorage.getItem(API_BASE_STORAGE_KEY)?.trim();
    const clientBase =
      storedValue && storedValue.startsWith("/") ? storedValue : FALLBACK_API_BASE_URL;
    return clientBase.replace(/\/+$/, "");
  }

  const envValue = process.env.NEXT_PUBLIC_API_BASE_URL;
  return (envValue?.trim() || FALLBACK_API_BASE_URL).replace(/\/+$/, "");
}

function getToken() {
  return getStoredAuthToken();
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { suppressErrorLog = false, ...requestInit } = init;
  const headers = new Headers(requestInit.headers);
  headers.set("Accept", "application/json");

  if (requestInit.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      ...requestInit,
      cache: requestInit.cache ?? "no-store",
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Network error while calling ${path}: ${error.message}`
        : `Network error while calling ${path}.`;
    throw new ApiError(message, 0);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let errorBody: any = null;

    try {
      // Clone the response to read the body without consuming it
      const clonedResponse = response.clone();
      errorBody = await clonedResponse.text();

      // Try to parse as JSON
      const payload = JSON.parse(errorBody) as { message?: string; Message?: string; title?: string; detail?: string; stackTrace?: string };
      message = payload.Message || payload.message || payload.title || payload.detail || message;
    } catch {
      // Not JSON, use text if available
      if (errorBody) {
        message = `${message}: ${errorBody.substring(0, 500)}`;
      }
    }

    if (!suppressErrorLog) {
      console.error(`[API Error] ${response.status}:`, {
        url: response.url,
        method: init.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        requestBody: init.body ? String(init.body).substring(0, 500) : undefined,
        responseBody: errorBody?.substring(0, 1000),
        message,
      });
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText.trim()) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
}

// Super Admin: Get all laundry admin commission payments
export async function getAllLaundryCommissions(): Promise<Array<{
  laundryId: string;
  laundryName: string;
  ownerName: string;
  totalRevenue: number;
  commissionRate: number;
  commissionDue: number;
  commissionPaid: number;
  lastPaymentDate: string | null;
  paymentStatus: "paid" | "pending" | "overdue";
  paymentHistory: Array<{
    id: string;
    amount: number;
    date: string;
    method: "kashier" | "cash" | "bank_transfer";
    status: "completed" | "pending" | "failed";
  }>;
}>> {
  const payload = await apiRequest<Array<{
    laundryId: number;
    laundryName: string;
    adminId?: string;
    adminName?: string;
    adminPhone?: string;
    totalRevenue: number;
    commissionRate: number;
    commissionPaid: number;
    commissionDue: number;
    status: string;
    pendingPaymentsCount?: number;
  }>>("/admin/laundries/commission-status");

  return payload.map((entry) => ({
    laundryId: String(entry.laundryId),
    laundryName: entry.laundryName,
    ownerName: entry.adminName ?? "Laundry admin",
    totalRevenue: Number(entry.totalRevenue ?? 0),
    commissionRate: Number(entry.commissionRate ?? 0),
    commissionDue: Number(entry.commissionDue ?? 0),
    commissionPaid: Number(entry.commissionPaid ?? 0),
    lastPaymentDate: null,
    paymentStatus:
      Number(entry.commissionDue ?? 0) <= 0
        ? "paid"
        : Number(entry.pendingPaymentsCount ?? 0) > 0
          ? "overdue"
          : "pending",
    paymentHistory: [],
  }));
}

// Super Admin: Get commission payment details for a specific laundry
export async function getLaundryCommissionDetails(laundryId: string): Promise<{
  laundryId: string;
  laundryName: string;
  ownerName: string;
  email: string;
  phone: string;
  totalRevenue: number;
  commissionRate: number;
  commissionDue: number;
  commissionPaid: number;
  remainingBalance: number;
  lastPaymentDate: string | null;
  paymentStatus: "paid" | "pending" | "overdue";
  ordersCount: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    date: string;
    method: "kashier" | "cash" | "bank_transfer";
    status: "completed" | "pending" | "failed";
    reference?: string;
  }>;
}> {
  const laundries = await getAllLaundryCommissions();
  const match = laundries.find((entry) => entry.laundryId === laundryId);

  if (!match) {
    throw new ApiError("Laundry commission details were not found.", 404);
  }

  return {
    laundryId: match.laundryId,
    laundryName: match.laundryName,
    ownerName: match.ownerName,
    email: "",
    phone: "",
    totalRevenue: match.totalRevenue,
    commissionRate: match.commissionRate,
    commissionDue: match.commissionDue,
    commissionPaid: match.commissionPaid,
    remainingBalance: Math.max(match.commissionDue - match.commissionPaid, 0),
    lastPaymentDate: match.lastPaymentDate,
    paymentStatus: match.paymentStatus,
    ordersCount: 0,
    paymentHistory: [],
  };
}

// Super Admin: Record manual commission payment (cash/bank transfer)
export async function recordCommissionPayment(laundryId: string, payment: {
  amount: number;
  method: "cash" | "bank_transfer";
  reference?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; paymentId: string }> {
  throw new ApiError(
    "Manual commission payments are not exposed by the current backend endpoints yet.",
    501,
  );
}

// Super Admin: Send payment reminder to laundry admin
export async function sendPaymentReminder(laundryId: string): Promise<{ success: boolean; message: string }> {
  throw new ApiError(
    `Payment reminders are not exposed by the current backend for laundry ${laundryId}.`,
    501,
  );
}
