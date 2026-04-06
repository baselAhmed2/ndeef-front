import { getStoredAuthToken } from "@/app/lib/auth-storage";

// When running on the browser, use the local Next.js rewrite proxy. When running on the server, hit the backend directly.
export const BASE_URL = typeof window !== "undefined" ? "/api/backend" : "https://ndeefapp.runasp.net/api";

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  token: string;
}

// Response from Paymob wallet payment
export interface PaymobPaymentResult {
  paymentKey: string;
  paymentUrl: string;
  paymobOrderId: string;
}

// Payment history item
export interface PaymentDto {
  id: number;
  amount: number;
  paymentStatus: string;  // "Pending" | "Paid" | "Failed"
  paymentMethod: string;  // "Cash" | "CreditCard" | "Wallet" | "MobilePayment"
  paymentDate: string | null;
}

export interface ApiResult<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
}

/** Get JWT token from localStorage (same keys as AuthContext + legacy session) */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = getStoredAuthToken();
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google-login
 * Sends the Google ID token to the backend for validation.
 * Backend verifies with Google, auto-registers if new user, returns JWT.
 */
export async function googleLogin(idToken: string): Promise<ApiResult<BackendUser>> {
  const res = await fetch(`${BASE_URL}/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const json = await res.json();

  if (!res.ok || json.isSuccess === false) {
    return { isSuccess: false, error: json.error ?? "Google login failed" };
  }

  return { isSuccess: true, data: json.data ?? json };
}

/** POST /api/auth/login */
export async function emailLogin(
  email: string,
  password: string
): Promise<ApiResult<BackendUser>> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok || json.isSuccess === false) {
      let errorMsg = json.error ?? json.Message ?? json.message;
      if (json.errors) {
        errorMsg = Object.values(json.errors).flat().join(", ");
      }
      return { isSuccess: false, error: errorMsg ?? json.title ?? `Login failed: ${JSON.stringify(json)}` };
    }
    return { isSuccess: true, data: json.data ?? json };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { isSuccess: false, error: `Network error: ${message}` };
  }
}

/** POST /api/auth/register */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: number;
}): Promise<ApiResult<BackendUser>> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, role: data.role ?? 1 }),
  });

  const json = await res.json();
  if (!res.ok || json.isSuccess === false) {
    let errorMsg = json.error ?? json.Message ?? json.message;
    if (json.errors) {
      errorMsg = Object.values(json.errors).flat().join(", ");
    }
    return { isSuccess: false, error: errorMsg ?? json.title ?? "Registration failed" };
  }
  return { isSuccess: true, data: json.data ?? json };
}

/** POST /api/auth/verify-email */
export async function verifyOtp(
  email: string,
  otpCode: string
): Promise<ApiResult<string>> {
  const res = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode }),
  });

  const json = await res.json();
  if (!res.ok || json.isSuccess === false) {
    return { isSuccess: false, error: json.error ?? "OTP verification failed" };
  }
  return { isSuccess: true, data: json.data ?? json };
}

/** POST /api/auth/forgot-password */
export async function forgotPasswordApi(email: string): Promise<ApiResult<string>> {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const json = await res.json();
  if (!res.ok || json.isSuccess === false) {
    return { isSuccess: false, error: json.error ?? json.message ?? json.Message ?? "Failed to request code" };
  }
  return { isSuccess: true, data: json.message ?? json.Message ?? "OTP sent successfully" };
}

/** POST /api/auth/reset-password */
export async function resetPasswordApi(email: string, otpCode: string, newPassword: string): Promise<ApiResult<string>> {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode, newPassword }),
  });

  const json = await res.json();
  if (!res.ok || json.isSuccess === false) {
    return { isSuccess: false, error: json.error ?? json.message ?? json.Message ?? "Failed to reset password" };
  }
  return { isSuccess: true, data: json.message ?? json.Message ?? "Password reset successfully" };
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface BackendOrderDto {
  id: number;
  status: string;
  totalPrice: number;
  pickupTime: string;
  pickupLocation: string;
  deliveryLocation: string;
  laundryName: string;
}

/**
 * POST /api/orders
 * Creates a new order in the backend and returns the real order ID.
 */
export async function placeOrder(data: {
  laundryId: number;
  serviceId: number;
  quantity: number;
  pickupTime: string;      // ISO8601
  pickupLocation: string;
  deliveryLocation: string;
  notes?: string;
}): Promise<ApiResult<BackendOrderDto>> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      laundryId: data.laundryId,
      items: [{ serviceId: data.serviceId, quantity: data.quantity }],
      pickupTime: data.pickupTime,
      pickupLocation: data.pickupLocation,
      deliveryLocation: data.deliveryLocation,
      notes: data.notes ?? null,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    return { isSuccess: false, error: json.message ?? "Failed to place order" };
  }
  return { isSuccess: true, data: json };
}

// ── Payment (Paymob) ──────────────────────────────────────────────────────────

/**
 * POST /api/wallet/pay/mobile-wallet/{orderId}
 * Calls Paymob, returns a PaymentUrl to redirect the user to.
 * The user completes payment on Paymob's hosted page.
 */
export async function payWithMobileWallet(
  orderId: number,
  amount: number
): Promise<ApiResult<PaymobPaymentResult>> {
  const res = await fetch(`${BASE_URL}/wallet/pay/mobile-wallet/${orderId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount }),
  });

  const json = await res.json();
  if (!res.ok) {
    return { isSuccess: false, error: json.message ?? "Mobile wallet payment failed" };
  }
  return { isSuccess: true, data: json };
}

/**
 * POST /api/wallet/pay/cash/{orderId}
 * Registers a cash-on-delivery payment (no redirect needed).
 */
export async function payWithCash(
  orderId: number,
  amount: number
): Promise<ApiResult<{ message: string }>> {
  const res = await fetch(`${BASE_URL}/wallet/pay/cash/${orderId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount }),
  });

  const json = await res.json();
  if (!res.ok) {
    return { isSuccess: false, error: json.message ?? "Cash payment failed" };
  }
  return { isSuccess: true, data: json };
}

/**
 * GET /api/payments/history
 * Returns the user's payment history.
 */
export async function getPaymentHistory(): Promise<ApiResult<PaymentDto[]>> {
  const res = await fetch(`${BASE_URL}/payments/history`, {
    headers: getAuthHeaders(),
  });

  const json = await res.json();
  if (!res.ok) {
    return { isSuccess: false, error: "Could not load payment history" };
  }
  return { isSuccess: true, data: json };
}
