import { laundries } from '../data/laundries';

import { BACKEND_PROXY_BASE } from "@/app/lib/backend-url";

const ENABLE_MOCK_LAUNDRY_FALLBACK = false;
const LAUNDRY_RATING_UPDATED_EVENT = "nadeef:laundry-rating-updated";
const LAUNDRY_RATING_CACHE_KEY = "nadeef:laundry-rating-cache";

function getMockBackendLaundries(): BackendLaundryDto[] {
  return laundries.map(l => ({
    id: parseInt(l.id),
    name: l.name,
    address: l.address,
    latitude: 30.0444, // Dummy coords
    longitude: 31.2357,
    status: l.status === 'active' ? 'Active' : 'Inactive',
    availability: l.isAvailable ? 'Open' : 'Closed',
    averageRating: l.rating,
    totalReviews: l.reviews,
    services: l.services.map((s, idx) => ({
      id: parseInt(l.id) * 100 + idx,
      serviceName: s.name,
      category: s.category === 'wash' ? 'Wash' : s.category === 'dry_clean' ? 'DryCleaning' : s.category === 'iron' ? 'Iron' : 'Specialty',
      price: s.price,
      isAvailable: s.available
    }))
  }));
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface AuthUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  token: string | null;
  avatarUrl?: string | null;
  needsVerification?: boolean; // true if user needs identity verification
  backendOrigin?: string;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  requiresVerification?: boolean;
  user?: AuthUser;
  email?: string;
}

export interface BackendUserDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  token: string | null;
  needsVerification?: boolean;
}

export interface BackendUserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface BackendAddressDto {
  id: number;
  type: string;
  label: string;
  street: string;
  apt: string | null;
  city: string;
  area: string;
  instructions: string | null;
  isDefault: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface WalletPaymentResponse {
  paymentUrl?: string;
  checkoutUrl?: string;
  [key: string]: unknown;
}

export interface BackendWalletHistoryItemDto {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string | null;
  paymentUrl?: string | null;
}

export interface BackendServiceDto {
  id: number;
  serviceName: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export interface BackendLaundryDto {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  availability: string;
  averageRating: number;
  totalReviews: number;
  services: BackendServiceDto[];
}

export interface BackendOrderItemDto {
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BackendBundleItemDto {
  id: string;
  serviceId: number;
  serviceName: string;
  serviceCategory: string | number;
  quantity: number;
  allowedItemCategory?: string | number | null;
}

export interface BackendBundleDto {
  id: string;
  name: string;
  description?: string | null;
  bundlePrice: number;
  originalPrice: number;
  savingsAmount?: number;
  savingsPercentage?: number;
  status: string | number;
  ownerType: string | number;
  laundryId?: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  displayOrder?: number | null;
  bundleItems?: BackendBundleItemDto[] | null;
  createdByAdminId?: string | null;
  createdAt?: string | null;
}

export interface BackendBundleOrderMetadataDto {
  bundleId: string;
  bundleName: string;
  bundlePrice: number;
  originalPrice: number;
  savingsAmount: number;
  purchasedAt: string;
}

export interface BackendPaymentDto {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string | null;
  paymentUrl?: string | null;
}

export interface BackendOrderDto {
  id: number;
  status: string;
  totalPrice: number;
  pickupTime: string;
  deliveryTime: string | null;
  pickupLocation: string;
  deliveryLocation: string;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  laundryId?: number | null;
  laundryName: string;
  items: BackendOrderItemDto[];
  payment: BackendPaymentDto | null;
  bundleOrderMetadata?: BackendBundleOrderMetadataDto | null;
}

export interface BackendOrderTrackDto {
  orderId: number;
  status: string;
  laundryName: string;
  laundryAddress: string;
  pickupTime: string;
  deliveryTime: string | null;
  estimatedDeliveryTime: string | null;
  courierLatitude: number | null;
  courierLongitude: number | null;
  courierId?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  courierAvatar?: string | null;
}

export interface BackendOrderReviewCheckDto {
  hasRating: boolean;
  rating?: number | null;
  comment?: string | null;
  HasRating?: boolean;
  Rating?: number | null;
  Comment?: string | null;
}

export interface BackendReviewDto {
  id: number;
  orderId: number;
  laundryId: number;
  laundryName?: string | null;
  customerName?: string | null;
  rating: number;
  comment?: string | null;
  tags?: string[] | null;
  createdAt: string;
  Id?: number;
  OrderId?: number;
  LaundryId?: number;
  LaundryName?: string | null;
  CustomerName?: string | null;
  Rating?: number;
  Comment?: string | null;
  Tags?: string[] | null;
  CreatedAt?: string;
}

export interface BackendRatingSummaryDto {
  averageRating: number;
  totalReviews: number;
  starCounts?: Record<string, number> | null;
  AverageRating?: number;
  TotalReviews?: number;
  StarCounts?: Record<string, number> | null;
}

export interface BackendUserStatsDto {
  completedOrders: number;
  activeOrders: number;
  totalSpent: number;
  points: number;
  savedAddresses: number;
  favoriteLaundries: number;
}

export interface BackendUserPaymentMethodDto {
  id: number;
  type: string | number;
  cardLast4: string;
  cardBrand: string | number;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  createdAt: string;
}

export interface BackendFavoriteLaundryDto {
  id: number;
  laundryId: number;
  laundryName: string;
  laundryAddress: string;
  averageRating: number;
  addedAt: string;
}

export interface BackendPointTransactionDto {
  id: number;
  points: number;
  type: string | number;
  description: string;
  orderId?: number | null;
  createdAt: string;
}

export interface BackendUserPointsDto {
  totalPoints: number;
  history: BackendPointTransactionDto[];
}

export interface BackendUserSettingsDto {
  language: string | number;
  currency: string | number;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  showProfile: boolean;
  shareData: boolean;
}

export interface PaginatedResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

type CollectionResponse<T> =
  | T[]
  | PaginatedResponse<T>
  | {
      data?: T[] | null;
      Data?: T[] | null;
      items?: T[] | null;
      Items?: T[] | null;
    };

export interface UiServiceItem {
  id: string;
  name: string;
  category: "wash" | "dry_clean" | "iron" | "specialty";
  price: number;
  unit: string;
  available: boolean;
  turnaround?: string;
}

export interface UiLaundry {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  distance: number;
  distanceLabel: string;
  status: "active" | "inactive";
  isAvailable: boolean;
  address: string;
  services: UiServiceItem[];
  latitude: number;
  longitude: number;
  availability: string;
}

export interface UiBundleItem {
  id: string;
  serviceId: number;
  serviceName: string;
  category: string;
  quantity: number;
  allowedCategory?: string | null;
}

export interface UiBundle {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number;
  savingsAmount: number;
  savingsPercentage: number;
  status: string;
  ownerType: string;
  laundryId?: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  items: UiBundleItem[];
}

export interface UiBundleOrderMetadata {
  bundleId: string;
  bundleName: string;
  bundlePrice: number;
  originalPrice: number;
  savingsAmount: number;
  purchasedAt: string;
}

export interface LaundryRatingSnapshot {
  laundryId?: number | null;
  laundryName?: string | null;
  averageRating: number;
  totalReviews: number;
}

export type UiOrderStatus =
  | "pending_confirmation"
  | "accepted"
  | "washing"
  | "ready_for_pickup"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface UiOrder {
  id: string;
  status: UiOrderStatus;
  total: number;
  pickupAt: string;
  deliveryAt: string | null;
  pickupDate: string;
  pickupTime: string;
  pickupAddress: string;
  deliveryAddress: string;
  laundryId?: number | null;
  laundryName: string;
  serviceName: string;
  serviceUnit: string;
  itemCount: number;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  cancellationReason: string | null;
  bundleMetadata?: UiBundleOrderMetadata | null;
}

export interface VerifyEmailResponse {
  token: string;
}

export const categoryLabels: Record<string, string> = {
  wash: "Washing",
  iron: "Ironing",
  dry_clean: "Dry Cleaning",
  specialty: "Special Care",
};

export const categoryOrder = ["wash", "iron", "dry_clean", "specialty"];

function normalizeBundleCategory(value: string | number | null | undefined) {
  switch (String(value ?? "").toLowerCase()) {
    case "wash":
    case "washing":
    case "1":
      return "Wash";
    case "drycleaning":
    case "dry cleaning":
    case "2":
      return "Dry Cleaning";
    case "iron":
    case "ironing":
    case "3":
      return "Ironing";
    case "specialty":
    case "special care":
    case "4":
      return "Special Care";
    default:
      return String(value ?? "Wash");
  }
}

export const statusOrder: UiOrderStatus[] = [
  "pending_confirmation",
  "accepted",
  "washing",
  "ready_for_pickup",
  "picked_up",
  "delivered",
];

function readLaundryRatingCache(): Record<string, LaundryRatingSnapshot> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LAUNDRY_RATING_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LaundryRatingSnapshot>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeLaundryRatingCacheKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function writeLaundryRatingCache(snapshot: LaundryRatingSnapshot) {
  if (typeof window === "undefined") return;

  const cache = readLaundryRatingCache();
  if (typeof snapshot.laundryId === "number" && snapshot.laundryId > 0) {
    cache[String(snapshot.laundryId)] = snapshot;
  }
  if (snapshot.laundryName?.trim()) {
    cache[`name:${normalizeLaundryRatingCacheKey(snapshot.laundryName)}`] = snapshot;
  }
  window.localStorage.setItem(LAUNDRY_RATING_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedLaundryRating(
  laundryId?: string | number | null,
  laundryName?: string | null,
) {
  const cache = readLaundryRatingCache();

  if (
    (typeof laundryId === "number" && Number.isFinite(laundryId)) ||
    (typeof laundryId === "string" && laundryId.trim())
  ) {
    const byId = cache[String(laundryId)];
    if (byId) return byId;
  }

  if (laundryName?.trim()) {
    return cache[`name:${normalizeLaundryRatingCacheKey(laundryName)}`] ?? null;
  }

  return null;
}

export function applyLaundryRatingSnapshot(
  laundry: UiLaundry,
  snapshot?: LaundryRatingSnapshot | null,
): UiLaundry {
  if (!snapshot) return laundry;

  const matchesId =
    typeof snapshot.laundryId === "number" && Number(laundry.id) === snapshot.laundryId;
  const matchesName =
    typeof snapshot.laundryName === "string" &&
    normalizeLaundryRatingCacheKey(laundry.name) ===
      normalizeLaundryRatingCacheKey(snapshot.laundryName);

  if (!matchesId && !matchesName) return laundry;

  return {
    ...laundry,
    rating: snapshot.averageRating,
    reviews: snapshot.totalReviews,
  };
}

export function applyCachedLaundryRatings(laundries: UiLaundry[]) {
  return laundries.map((laundry) =>
    applyLaundryRatingSnapshot(
      laundry,
      getCachedLaundryRating(laundry.id, laundry.name),
    ),
  );
}

export function announceLaundryRatingUpdated(snapshot: LaundryRatingSnapshot) {
  writeLaundryRatingCache(snapshot);
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<LaundryRatingSnapshot>(LAUNDRY_RATING_UPDATED_EVENT, {
      detail: snapshot,
    }),
  );
}

export function subscribeLaundryRatingUpdates(
  listener: (snapshot: LaundryRatingSnapshot) => void,
) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<LaundryRatingSnapshot>;
    if (customEvent.detail) listener(customEvent.detail);
  };

  window.addEventListener(LAUNDRY_RATING_UPDATED_EVENT, handler as EventListener);
  return () =>
    window.removeEventListener(LAUNDRY_RATING_UPDATED_EVENT, handler as EventListener);
}

export const statusConfig: Record<
  UiOrderStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  pending_confirmation: {
    label: "Pending Confirmation",
    color: "#EBA050",
    bg: "#FFF7ED",
    description: "Waiting for the laundry to accept your order.",
  },
  accepted: {
    label: "Accepted",
    color: "#1D6076",
    bg: "#EFF8FB",
    description:
      "The laundry has accepted your order and is preparing for pickup.",
  },
  washing: {
    label: "Being Washed",
    color: "#2a7a94",
    bg: "#E8F4F8",
    description: "Your items are currently being cleaned.",
  },
  ready_for_pickup: {
    label: "Ready for Delivery",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your items are clean and ready. A driver is being assigned.",
  },
  picked_up: {
    label: "On the Way",
    color: "#7c3aed",
    bg: "#F5F3FF",
    description: "Your items have been picked up and are on their way to you.",
  },
  delivered: {
    label: "Delivered",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your order has been delivered successfully.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "#FEF2F2",
    description: "This order has been cancelled.",
  },
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80",
];

function getErrorMessage(data: unknown, fallback = "Request failed.") {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.message === "string") return record.message;
    if (typeof record.Message === "string") return record.Message;
    if (typeof record.title === "string") return record.title;

    const errors = record.errors;
    if (errors && typeof errors === "object") {
      const first = Object.values(errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
  }

  return fallback;
}

function summarizeErrorPayload(data: unknown) {
  if (!data) return null;
  if (typeof data === "string") return data.substring(0, 800);

  try {
    return JSON.stringify(data).substring(0, 800);
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_PROXY_BASE}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Network error while calling ${path}: ${error.message}`
        : `Network error while calling ${path}.`;
    throw new ApiError(message, 0, null);
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = getErrorMessage(
      data,
      `Request failed with status ${response.status}.`,
    );

    console.error("[API Error]", {
      path,
      status: response.status,
      statusText: response.statusText,
      requestBody:
        typeof init?.body === "string" ? init.body.substring(0, 800) : undefined,
      responseBody: summarizeErrorPayload(data),
      message,
    });

    throw new ApiError(
      message,
      response.status,
      data,
    );
  }

  return data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function unwrapCollection<T>(payload: CollectionResponse<T> | null | undefined): T[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("Data" in payload && Array.isArray(payload.Data)) return payload.Data;
  if ("items" in payload && Array.isArray(payload.items)) return payload.items;
  if ("Items" in payload && Array.isArray(payload.Items)) return payload.Items;

  return [];
}

function normalizeBase64(input: string) {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}

function parseJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = atob(normalizeBase64(payload));
    return JSON.parse(decoded) as Record<string, string>;
  } catch {
    return null;
  }
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || parts[0] || "";
  return { firstName, lastName };
}

export function mapUserDtoToAuthUser(user: BackendUserDto): AuthUser {
  const { firstName, lastName } = splitName(user.name);
  return {
    id: user.id,
    name: user.name,
    firstName,
    lastName,
    email: user.email,
    phone: user.phoneNumber ?? "",
    role: user.role,
    token: user.token,
    avatarUrl: null,
    needsVerification: user.needsVerification,
  };
}

export function mapTokenToAuthUser(
  token: string,
  fallback?: Partial<AuthUser>,
): AuthUser {
  const payload = parseJwtPayload(token);
  const name = payload?.Name ?? payload?.name ?? fallback?.name ?? "Nadeef User";
  const email = payload?.email ?? fallback?.email ?? "";
  const role = payload?.role ?? fallback?.role ?? "";
  const id = payload?.uid ?? payload?.sub ?? fallback?.id ?? "";
  const { firstName, lastName } = splitName(name);

  return {
    id,
    name,
    firstName,
    lastName,
    email,
    phone: fallback?.phone ?? "",
    role,
    token,
    avatarUrl: fallback?.avatarUrl ?? null,
  };
}

function toUiCategory(category: string): UiServiceItem["category"] {
  switch (category) {
    case "Wash":
      return "wash";
    case "DryCleaning":
      return "dry_clean";
    case "Iron":
      return "iron";
    default:
      return "specialty";
  }
}

function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
    Math.cos(toRadians(toLat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDeliveryTime(distanceKm: number) {
  const minutes = Math.max(45, Math.round(distanceKm * 20 + 40));
  if (minutes < 60) return `${minutes} mins`;
  return `${(minutes / 60).toFixed(1)} hours`;
}

export function mapLaundryDtoToUiLaundry(
  laundry: BackendLaundryDto,
  coords?: { lat: number; lng: number },
): UiLaundry {
  const distance = coords
    ? haversineDistanceKm(
      coords.lat,
      coords.lng,
      Number(laundry.latitude),
      Number(laundry.longitude),
    )
    : 0;

  return {
    id: String(laundry.id),
    name: laundry.name,
    image: PLACEHOLDER_IMAGES[laundry.id % PLACEHOLDER_IMAGES.length],
    rating: Number(laundry.averageRating ?? 0),
    reviews: Number(laundry.totalReviews ?? 0),
    deliveryTime: estimateDeliveryTime(distance || 1.5),
    distance,
    distanceLabel: coords ? `${distance.toFixed(1)} km` : "Nearby",
    status: laundry.status === "Active" ? "active" : "inactive",
    isAvailable: laundry.availability === "Open",
    address: laundry.address,
    latitude: Number(laundry.latitude),
    longitude: Number(laundry.longitude),
    availability: laundry.availability,
    services: (laundry.services ?? []).map((service) => ({
      id: String(service.id),
      name: service.serviceName,
      category: toUiCategory(service.category),
      price: Number(service.price),
      unit: "per item",
      available: service.isAvailable,
    })),
  };
}

export function mapBackendStatusToUiStatus(status: string): UiOrderStatus {
  switch (status) {
    case "PendingConfirmation":
      return "pending_confirmation";
    case "Accepted":
      return "accepted";
    case "Washing":
      return "washing";
    case "ReadyForPickup":
      return "ready_for_pickup";
    case "PickedUp":
      return "picked_up";
    case "Delivered":
      return "delivered";
    default:
      return "cancelled";
  }
}

function mapBackendPaymentStatus(
  status?: string | null,
): UiOrder["paymentStatus"] {
  switch (status) {
    case "Paid":
      return "paid";
    case "Failed":
      return "failed";
    default:
      return "pending";
  }
}

function formatRelativeDate(dateIso: string) {
  const target = new Date(dateIso);
  const now = new Date();
  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mapBundleDtoToUiBundle(bundle: BackendBundleDto): UiBundle {
  return {
    id: String(bundle.id),
    name: bundle.name,
    description: bundle.description ?? null,
    price: Number(bundle.bundlePrice ?? 0),
    originalPrice: Number(bundle.originalPrice ?? 0),
    savingsAmount: Number(
      bundle.savingsAmount ??
        Number(bundle.originalPrice ?? 0) - Number(bundle.bundlePrice ?? 0),
    ),
    savingsPercentage: Number(bundle.savingsPercentage ?? 0),
    status: String(bundle.status ?? ""),
    ownerType: String(bundle.ownerType ?? ""),
    laundryId: bundle.laundryId ?? null,
    startDate: bundle.startDate ?? null,
    expiryDate: bundle.expiryDate ?? null,
    imageUrl: bundle.imageUrl ?? null,
    displayOrder: Number(bundle.displayOrder ?? 0),
    items: (bundle.bundleItems ?? []).map((item) => ({
      id: String(item.id),
      serviceId: Number(item.serviceId),
      serviceName: item.serviceName,
      category: normalizeBundleCategory(item.serviceCategory),
      quantity: Number(item.quantity ?? 0),
      allowedCategory:
        item.allowedItemCategory !== null && item.allowedItemCategory !== undefined
          ? normalizeBundleCategory(item.allowedItemCategory)
          : null,
    })),
  };
}

export function mapOrderDtoToUiOrder(order: BackendOrderDto): UiOrder {
  const itemCount = order.items.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0,
  );
  const firstItem = order.items[0];

  return {
    id: String(order.id),
    status: mapBackendStatusToUiStatus(order.status),
    total: Number(order.totalPrice ?? 0),
    pickupAt: order.pickupTime,
    deliveryAt: order.deliveryTime,
    pickupDate: formatRelativeDate(order.pickupTime),
    pickupTime: formatTime(order.pickupTime),
    pickupAddress: order.pickupLocation,
    deliveryAddress: order.deliveryLocation,
    laundryId: order.laundryId ?? null,
    laundryName: order.laundryName,
    serviceName:
      order.items.length <= 1
        ? firstItem?.serviceName ?? "Laundry Service"
        : `${order.items.length} services`,
    serviceUnit: itemCount === 1 ? "item" : "items",
    itemCount,
    paymentStatus: mapBackendPaymentStatus(order.payment?.paymentStatus),
    createdAt: order.createdAt,
    updatedAt: order.payment?.paymentDate ?? order.createdAt,
    notes: order.notes,
    cancellationReason: order.cancellationReason,
    bundleMetadata: order.bundleOrderMetadata
      ? {
          bundleId: String(order.bundleOrderMetadata.bundleId),
          bundleName: order.bundleOrderMetadata.bundleName,
          bundlePrice: Number(order.bundleOrderMetadata.bundlePrice ?? 0),
          originalPrice: Number(order.bundleOrderMetadata.originalPrice ?? 0),
          savingsAmount: Number(order.bundleOrderMetadata.savingsAmount ?? 0),
          purchasedAt: order.bundleOrderMetadata.purchasedAt,
        }
      : null,
  };
}

export async function loginRequest(email: string, password: string) {
  return request<BackendUserDto>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function googleLoginRequest(idToken: string) {
  return request<BackendUserDto>("/Auth/google-login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function facebookLoginRequest(accessToken: string) {
  return request<BackendUserDto>("/Auth/facebook-login", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "Customer" | "LaundryAdmin" | "Courier";
}) {
  return request<BackendUserDto>("/Auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmailRequest(email: string, otpCode: string) {
  return request<VerifyEmailResponse>("/Auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, otpCode }),
  });
}

export async function forgotPasswordRequest(email: string) {
  return request<{ message?: string; Message?: string }>("/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(
  email: string,
  otpCode: string,
  newPassword: string,
) {
  return request<{ message?: string; Message?: string }>("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otpCode, newPassword }),
  });
}

export async function getUserProfileRequest(token: string) {
  return request<BackendUserProfileDto>("/User/profile", undefined, token);
}

export async function uploadUserAvatarRequest(token: string, formData: FormData) {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${BACKEND_PROXY_BASE}/User/avatar`, {
    method: "POST",
    body: formData,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}.`),
      response.status,
      data,
    );
  }

  return data as { avatarUrl?: string; AvatarUrl?: string };
}

export async function updateUserProfileRequest(
  token: string,
  payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  },
) {
  return request<BackendUserProfileDto>(
    "/User/profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getUserAddressesRequest(token: string) {
  return request<BackendAddressDto[]>("/User/addresses", undefined, token);
}

export async function deleteUserAddressRequest(token: string, addressId: number) {
  return request<{ message?: string; Message?: string }>(
    `/User/addresses/${addressId}`,
    { method: "DELETE" },
    token,
  );
}

export async function setDefaultUserAddressRequest(token: string, addressId: number) {
  return request<{ message?: string; Message?: string }>(
    `/User/addresses/${addressId}/set-default`,
    { method: "PUT" },
    token,
  );
}

export async function addUserAddressRequest(
  token: string,
  payload: {
    type: string;
    label: string;
    street: string;
    apt?: string | null;
    city: string;
    area: string;
    instructions?: string | null;
    isDefault?: boolean;
  },
) {
  return request<BackendAddressDto>(
    "/User/addresses",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateUserAddressRequest(
  token: string,
  addressId: number,
  payload: {
    type: string;
    label: string;
    street: string;
    apt?: string | null;
    city: string;
    area: string;
    instructions?: string | null;
    isDefault?: boolean;
  },
) {
  return request<BackendAddressDto>(
    `/User/addresses/${addressId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function payOrderWithCashRequest(
  token: string,
  orderId: number,
  amount: number,
) {
  return request<{ message?: string; Message?: string }>(
    `/wallet/pay/cash/${orderId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
    token,
  );
}

export async function payOrderWithMobileWalletRequest(
  token: string,
  orderId: number,
  amount: number,
) {
  return request<WalletPaymentResponse>(
    `/wallet/pay/mobile-wallet/${orderId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
    token,
  );
}

export async function chargeWalletRequest(token: string, amount: number) {
  return request<WalletPaymentResponse>(
    "/wallet/charge",
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
    token,
  );
}

export async function getPaymentHistoryRequest(token: string) {
  return request<BackendWalletHistoryItemDto[]>("/Payments/history", undefined, token);
}

export async function getOrderPaymentRequest(token: string, orderId: string | number) {
  return request<BackendPaymentDto>(`/Orders/${orderId}/payment`, undefined, token);
}

export async function getUserStatsRequest(token: string) {
  return request<BackendUserStatsDto>("/User/stats", undefined, token);
}

export async function getUserPaymentMethodsRequest(token: string) {
  return request<BackendUserPaymentMethodDto[]>("/User/payment-methods", undefined, token);
}

export async function addUserPaymentMethodRequest(
  token: string,
  payload: {
    type: string;
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    isDefault?: boolean;
  },
) {
  return request<BackendUserPaymentMethodDto>(
    "/User/payment-methods",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteUserPaymentMethodRequest(token: string, paymentMethodId: number) {
  return request<{ message?: string; Message?: string }>(
    `/User/payment-methods/${paymentMethodId}`,
    { method: "DELETE" },
    token,
  );
}

export async function setDefaultUserPaymentMethodRequest(token: string, paymentMethodId: number) {
  return request<{ message?: string; Message?: string }>(
    `/User/payment-methods/${paymentMethodId}/set-default`,
    { method: "PUT" },
    token,
  );
}

export async function getUserFavoritesRequest(token: string) {
  return request<BackendFavoriteLaundryDto[]>("/User/favorites", undefined, token);
}

export async function addUserFavoriteRequest(token: string, laundryId: number) {
  return request<{ message?: string; Message?: string }>(
    "/User/favorites",
    {
      method: "POST",
      body: JSON.stringify(laundryId),
    },
    token,
  );
}

export async function removeUserFavoriteRequest(token: string, laundryId: number) {
  return request<{ message?: string; Message?: string }>(
    `/User/favorites/${laundryId}`,
    { method: "DELETE" },
    token,
  );
}

export async function getUserPointsRequest(token: string) {
  return request<BackendUserPointsDto>("/User/points", undefined, token);
}

export async function redeemUserPointsRequest(
  token: string,
  payload: { points: number; rewardId: string },
) {
  return request<{ message?: string; Message?: string }>(
    "/User/points/redeem",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getUserSettingsRequest(token: string) {
  return request<BackendUserSettingsDto>("/User/settings", undefined, token);
}

export async function updateUserSettingsRequest(
  token: string,
  payload: Partial<BackendUserSettingsDto>,
) {
  return request<BackendUserSettingsDto>(
    "/User/settings",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function changePasswordRequest(
  token: string,
  payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
) {
  return request<{ message?: string; Message?: string }>(
    "/User/change-password",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteAccountRequest(
  token: string,
  payload: { password: string; reason?: string },
) {
  return request<{ message?: string; Message?: string }>(
    "/User/account",
    {
      method: "DELETE",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getLaundriesRequest(params?: {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  availability?: string;
  minRating?: number;
  sortBy?: string;
}) {
  const query = new URLSearchParams();
  if (params?.pageIndex) query.set("PageIndex", String(params.pageIndex));
  if (params?.pageSize) query.set("PageSize", String(params.pageSize));
  if (params?.search) query.set("Search", params.search);
  if (params?.availability) query.set("Availability", params.availability);
  if (params?.minRating) query.set("MinRating", String(params.minRating));
  if (params?.sortBy) query.set("SortBy", params.sortBy);

  try {
    const response = await request<PaginatedResponse<BackendLaundryDto>>(
      `/Laundries${query.toString() ? `?${query.toString()}` : ""}`,
    );
    if (
      ENABLE_MOCK_LAUNDRY_FALLBACK &&
      (!response || !response.data || response.data.length === 0)
    ) {
      return {
        pageIndex: params?.pageIndex || 1,
        pageSize: params?.pageSize || 50,
        totalCount: getMockBackendLaundries().length,
        totalPages: 1,
        data: getMockBackendLaundries()
      };
    }
    return response;
  } catch (error) {
    if (!ENABLE_MOCK_LAUNDRY_FALLBACK) {
      throw error;
    }
    return {
      pageIndex: params?.pageIndex || 1,
      pageSize: params?.pageSize || 50,
      totalCount: getMockBackendLaundries().length,
      totalPages: 1,
      data: getMockBackendLaundries()
    };
  }
}

export async function searchLaundriesRequest(params: {
  q?: string;
  lat: number;
  lng: number;
  radius?: number;
  pageIndex?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  query.set("Lat", String(params.lat));
  query.set("Lng", String(params.lng));
  if (params.q) query.set("Q", params.q);
  if (params.radius) query.set("Radius", String(params.radius));
  if (params.pageIndex) query.set("PageIndex", String(params.pageIndex));
  if (params.pageSize) query.set("PageSize", String(params.pageSize));

  try {
    const response = await request<PaginatedResponse<BackendLaundryDto>>(
      `/Laundries/search?${query.toString()}`,
    );
    if (
      ENABLE_MOCK_LAUNDRY_FALLBACK &&
      (!response || !response.data || response.data.length === 0)
    ) {
      return {
        pageIndex: params?.pageIndex || 1,
        pageSize: params?.pageSize || 50,
        totalCount: getMockBackendLaundries().length,
        totalPages: 1,
        data: getMockBackendLaundries()
      };
    }
    return response;
  } catch (error) {
    if (!ENABLE_MOCK_LAUNDRY_FALLBACK) {
      throw error;
    }
    return {
      pageIndex: params?.pageIndex || 1,
      pageSize: params?.pageSize || 50,
      totalCount: getMockBackendLaundries().length,
      totalPages: 1,
      data: getMockBackendLaundries()
    };
  }
}

export async function getLaundryRequest(id: string | number) {
  try {
    return await request<BackendLaundryDto>(`/Laundries/${id}`);
  } catch (error) {
    if (!ENABLE_MOCK_LAUNDRY_FALLBACK) {
      throw error;
    }
    const mock = getMockBackendLaundries().find(l => String(l.id) === String(id));
    if (mock) return mock;
    throw error;
  }
}

export async function getLaundryBundlesRequest(laundryId: string | number) {
  const response = await request<CollectionResponse<BackendBundleDto>>(
    `/Bundles/laundry/${laundryId}`,
  );
  return unwrapCollection(response).map(mapBundleDtoToUiBundle);
}

export async function getBundleByIdRequest(bundleId: string) {
  const response = await request<BackendBundleDto>(`/Bundles/${bundleId}`);
  return mapBundleDtoToUiBundle(response);
}

export async function getLaundryServicesRequest(id: string | number) {
  try {
    const res = await request<BackendServiceDto[]>(`/Laundries/${id}/services`);
    if (ENABLE_MOCK_LAUNDRY_FALLBACK && (!res || res.length === 0)) {
      const mock = getMockBackendLaundries().find(l => String(l.id) === String(id));
      if (mock) return mock.services;
    }
    return res;
  } catch (error) {
    if (!ENABLE_MOCK_LAUNDRY_FALLBACK) {
      throw error;
    }
    const mock = getMockBackendLaundries().find(l => String(l.id) === String(id));
    if (mock) return mock.services;
    throw error;
  }
}

export async function getLaundryReviewsRequest(id: string | number) {
  const response = await request<CollectionResponse<BackendReviewDto>>(
    `/Laundries/${id}/reviews`,
  );
  return unwrapCollection(response);
}

export async function getLaundryRatingSummaryRequest(id: string | number) {
  return request<BackendRatingSummaryDto>(`/Laundries/${id}/rating-summary`);
}

export async function placeBundleOrderRequest(
  token: string,
  payload: {
    bundleId: string;
    laundryId: number;
    userAddressId: number;
    selectedItems: Array<{ bundleItemId: string; serviceId: number; quantity: number }>;
    useWalletBalance?: boolean;
    redeemPoints?: number | null;
    scheduledPickupTime?: string | null;
  },
) {
  return request<BackendOrderDto>(
    "/Bundles/order",
    {
      method: "POST",
      body: JSON.stringify({
        bundleId: payload.bundleId,
        laundryId: Number(payload.laundryId),
        userAddressId: Number(payload.userAddressId),
        selectedItems: payload.selectedItems.map((item) => ({
          bundleItemId: item.bundleItemId,
          serviceId: Number(item.serviceId),
          quantity: Number(item.quantity),
        })),
        useWalletBalance: Boolean(payload.useWalletBalance),
        redeemPoints:
          payload.redeemPoints !== null && payload.redeemPoints !== undefined
            ? Number(payload.redeemPoints)
            : null,
        scheduledPickupTime: payload.scheduledPickupTime
          ? new Date(payload.scheduledPickupTime).toISOString()
          : null,
      }),
    },
    token,
  );
}

export async function getBundleOrderMetadataRequest(
  token: string,
  orderId: string | number,
) {
  return request<BackendBundleOrderMetadataDto>(
    `/Bundles/orders/${orderId}/metadata`,
    undefined,
    token,
  );
}

export async function calculatePriceRequest(
  token: string,
  payload: {
    laundryId: number;
    items: { serviceId: number; quantity: number }[];
    couponCode?: string | null;
  },
) {
  const normalizedPayload = {
    laundryId: Number(payload.laundryId),
    items: (payload.items ?? []).map((item) => ({
      serviceId: Number(item.serviceId),
      quantity: Number(item.quantity),
    })),
    couponCode: payload.couponCode?.trim() || null,
  };

  return request<{ totalPrice: number; items: BackendOrderItemDto[] }>(
    "/Orders/calculate-price",
    {
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    },
    token,
  );
}

export async function placeOrderRequest(
  token: string,
  payload: {
    laundryId: number;
    items: { serviceId: number; quantity: number }[];
    pickupTime: string;
    deliveryTime: string | null;
    pickupLocation: string;
    deliveryLocation: string;
    notes?: string | null;
    couponCode?: string | null;
  },
) {
  const normalizedPayload = {
    laundryId: Number(payload.laundryId),
    pickupLocation: payload.pickupLocation.trim().substring(0, 249),
    deliveryLocation: payload.deliveryLocation.trim().substring(0, 249),
    pickupTime: new Date(payload.pickupTime).toISOString(),
    deliveryTime: payload.deliveryTime
      ? new Date(payload.deliveryTime).toISOString()
      : null,
    notes: payload.notes?.trim() || null,
    couponCode: payload.couponCode?.trim() || null,
    items: (payload.items ?? []).map((item) => ({
      serviceId: Number(item.serviceId),
      quantity: Number(item.quantity),
    })),
  };

  return request<BackendOrderDto>(
    "/Orders",
    {
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    },
    token,
  );
}

export async function getOrdersRequest(
  token: string,
  pageIndex = 1,
  pageSize = 100,
) {
  return request<PaginatedResponse<BackendOrderDto>>(
    `/Orders?PageIndex=${pageIndex}&PageSize=${pageSize}`,
    undefined,
    token,
  );
}

export async function getOrderByIdRequest(token: string, id: string | number) {
  return request<BackendOrderDto>(`/Orders/${id}`, undefined, token);
}

export async function trackOrderRequest(token: string, id: string | number) {
  return request<BackendOrderTrackDto>(`/Orders/${id}/track`, undefined, token);
}

export async function checkOrderReviewRequest(token: string, orderId: string | number) {
  return request<BackendOrderReviewCheckDto>(`/Reviews/order/${orderId}`, undefined, token);
}

export async function addReviewRequest(
  token: string,
  payload: {
    orderId: number;
    laundryId: number;
    rating: number;
    tags?: string[];
    comment?: string | null;
  },
) {
  return request<BackendReviewDto>(
    "/Reviews",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function cancelOrderRequest(
  token: string,
  id: string | number,
  cancellationReason?: string,
) {
  return request<{ message: string }>(
    `/Orders/${id}/cancel`,
    {
      method: "PUT",
      body: JSON.stringify({
        cancellationReason: cancellationReason ?? "Cancelled by customer",
      }),
    },
    token,
  );
}

export async function processPaymentRequest(
  token: string,
  payload: {
    orderId: number;
    amount: number;
    paymentMethod: "CreditCard" | "MobilePayment" | "Cash";
  },
) {
  return request<BackendPaymentDto>(
    "/Payments/process",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

// ── Payout Profile ─────────────────────────────────────────────────────────

export enum PayoutTransferMethod {
  BankAccount = 1,
  MobileWallet = 2,
  Card = 3,
  OctoCard = 4,
}

export enum PayoutTransferType {
  Standard = 1,
  Instant = 2,
}

export interface UpsertPayoutProfileRequest {
  transferMethod: PayoutTransferMethod;
  transferType?: PayoutTransferType | null;
  recipientFullName: string;
  recipientMobileNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  cardNumber?: string | null;
  nationalId?: string | null;
}

export async function getPayoutProfile(token: string) {
  return request<UpsertPayoutProfileRequest>("/laundry-admin/payout-profile", { method: "GET" }, token);
}

export async function upsertPayoutProfile(token: string, payload: UpsertPayoutProfileRequest) {
  return request<UpsertPayoutProfileRequest>(
    "/laundry-admin/payout-profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}
