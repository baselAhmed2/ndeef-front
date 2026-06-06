import { getStoredAuthToken } from "@/app/lib/auth-storage";
import { type UpsertPayoutProfileRequest } from "@/app/lib/api";

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

function getSafeErrorMessage(status?: number) {
  switch (status) {
    case 0:
      return "Unable to connect right now. Please check your connection and try again.";
    case 400:
      return "The request could not be completed. Please review the entered data and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested data could not be found.";
    case 409:
      return "This action could not be completed because the data has changed. Please refresh and try again.";
    case 422:
      return "Some of the submitted data is invalid. Please review it and try again.";
    case 429:
      return "Too many requests were sent. Please wait a moment and try again.";
    default:
      if (typeof status === "number" && status >= 500) {
        return "A server error occurred. Please try again in a moment.";
      }
      return "Something went wrong. Please try again.";
  }
}

function looksSensitiveMessage(value: string) {
  const normalized = value.toLowerCase();
  return [
    "/api/",
    "stack trace",
    "stacktrace",
    "exception",
    " at system.",
    " at microsoft.",
    " at lambda_method",
    "select ",
    "insert ",
    "update ",
    "bearer ",
  ].some((token) => normalized.includes(token));
}

function sanitizeUserMessage(value: string | undefined, status?: number) {
  if (!value) return getSafeErrorMessage(status);
  return looksSensitiveMessage(value) ? getSafeErrorMessage(status) : value;
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
    if (!suppressErrorLog) {
      console.error("[API Network Error]", {
        path,
        method: init.method || "GET",
        error: error instanceof Error ? error.message : "Unknown network error",
      });
    }

    throw new ApiError(getSafeErrorMessage(0), 0);
  }

  if (!response.ok) {
    let message = getSafeErrorMessage(response.status);
    let errorBody: any = null;

    try {
      // Clone the response to read the body without consuming it
      const clonedResponse = response.clone();
      errorBody = await clonedResponse.text();

      // Try to parse as JSON
      const payload = JSON.parse(errorBody) as { message?: string; Message?: string; title?: string; detail?: string; stackTrace?: string };
      message = sanitizeUserMessage(
        payload.Message || payload.message || payload.title,
        response.status,
      );
    } catch {
      // Keep the user-facing message generic even when the backend returns raw text.
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

export interface LaundryPayoutRecord {
  id: number;
  amount: number;
  status: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  processedAt: string;
  createdBy?: string | null;
}

// Super Admin: Process payout to laundry
export async function recordCommissionPayment(laundryId: string, payment: {
  amount: number;
  method: "cash" | "bank_transfer";
  reference?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  payoutId: string;
  processedAmount: number;
  remainingAvailableBalance: number;
  processedAt: string;
  message: string;
}> {
  return await apiRequest<{
    success: boolean;
    payoutId: string;
    processedAmount: number;
    remainingAvailableBalance: number;
    processedAt: string;
    message: string;
  }>(`/admin/laundries/${laundryId}/payouts/process`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

// Super Admin: Send payout reminder to laundry admin
export async function sendPaymentReminder(laundryId: string): Promise<{ success: boolean; message: string }> {
  return await apiRequest<{ success: boolean; message: string }>(`/admin/laundries/${laundryId}/payouts/reminder`, {
    method: "POST",
  });
}

export async function getLaundryPayouts(laundryId: number | string): Promise<LaundryPayoutRecord[]> {
  try {
    return await apiRequest<LaundryPayoutRecord[]>(`/admin/laundries/${laundryId}/payouts`, {
      suppressErrorLog: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export interface LaundryBillingInfo {
  laundryId: number;
  laundryName: string;
  adminName: string;
  adminEmail: string;
  
  // Payout Profile details
  transferMethod: string;
  transferType?: string | null;
  recipientFullName: string;
  recipientMobileNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  cardNumber?: string | null;
  nationalId?: string | null;

  // Wallet details
  totalEarnings: number;
  availableBalance: number;
  payoutableAmount?: number;
  pendingCommission: number;
  debtCeiling: number;
  walletStatus: string;
  lastPayoutDate?: string | null;
}

// Super Admin: Get laundry billing profile and wallet details
export async function getLaundryBillingInfo(laundryId: number | string): Promise<LaundryBillingInfo> {
  return await apiRequest<LaundryBillingInfo>(`/admin/laundries/${laundryId}/billing`);
}

// Super Admin: Get user's laundry billing profile and wallet details (for LaundryAdmin users)
export async function getUserLaundryBillingInfo(userId: string): Promise<LaundryBillingInfo> {
  return await apiRequest<LaundryBillingInfo>(`/admin/users/${userId}/laundry-billing`);
}

// Super Admin: Get laundry payout profile details
export async function getLaundryPayoutProfile(laundryId: number | string): Promise<UpsertPayoutProfileRequest> {
  return await apiRequest<UpsertPayoutProfileRequest>(`/admin/laundries/${laundryId}/payout-profile`);
}

// Super Admin: Update laundry payout profile details
export async function upsertLaundryPayoutProfile(laundryId: number | string, payload: UpsertPayoutProfileRequest): Promise<{ message: string }> {
  return await apiRequest<{ message: string }>(`/admin/laundries/${laundryId}/payout-profile`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
