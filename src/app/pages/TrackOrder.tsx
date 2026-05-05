import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  ShieldCheck,
  Sparkles,
  MessageCircleWarning,
  RotateCcw,
  Navigation,
  Route,
  UserRound,
  Radar,
} from "lucide-react";
import {
  ApiError,
  BackendOrderTrackDto,
  UiOrder,
  cancelOrderRequest,
  getOrderByIdRequest,
  mapBackendStatusToUiStatus,
  mapOrderDtoToUiOrder,
  statusConfig,
  statusOrder,
  trackOrderRequest,
  UiOrderStatus,
} from "@/app/lib/api";
import { useAuth } from "../context/AuthContext";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";

type FlowState = "loading" | "invalid" | "not_found" | "success";

const StatusIcon: Record<UiOrderStatus, React.ElementType> = {
  pending_confirmation: Clock,
  accepted: CheckCircle2,
  washing: Sparkles,
  ready_for_pickup: Package,
  picked_up: Truck,
  delivered: ShieldCheck,
  cancelled: XCircle,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEta(iso?: string | null) {
  if (!iso) return "Not available yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not available yet";

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0) return "Any moment now";
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function buildMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildMapsCoordsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function extractCoordinates(value?: string | null) {
  if (!value) return null;

  const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

function buildMapsUrlFromAddress(value?: string | null) {
  const coords = extractCoordinates(value);
  if (coords) {
    return buildMapsCoordsUrl(coords.lat, coords.lng);
  }

  return buildMapsSearchUrl(value || "");
}

function formatAddressForDisplay(value?: string | null) {
  if (!value) return "Address not available";

  const coords = extractCoordinates(value);
  if (!coords) return value;

  if (/location selected from map/i.test(value)) {
    return `Pinned map location (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`;
  }

  if (/location at/i.test(value)) {
    return `Location at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
  }

  return value;
}

function TimelineStep({
  status,
  currentStatus,
  isLast,
}: {
  status: UiOrderStatus;
  currentStatus: UiOrderStatus;
  isLast: boolean;
}) {
  const cfg = statusConfig[status];
  const Icon = StatusIcon[status];
  const currentIdx = statusOrder.indexOf(currentStatus);
  const stepIdx = statusOrder.indexOf(status);
  const isDone = stepIdx <= currentIdx && currentStatus !== "cancelled";
  const isActive = status === currentStatus && currentStatus !== "cancelled";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isActive ? "ring-4 ring-offset-1" : ""}`}
          style={
            isDone || isActive
              ? {
                  backgroundColor: cfg.bg,
                  color: cfg.color,
                  ...(isActive ? { ringColor: `${cfg.color}30` } : {}),
                }
              : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
          }
        >
          <Icon size={15} strokeWidth={2} />
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-1 min-h-[28px]"
            style={{
              backgroundColor: isDone && !isActive ? cfg.color : "#e5e7eb",
              opacity: isDone ? 0.35 : 1,
            }}
          />
        )}
      </div>

      <div className="flex-1 pb-5">
        <p
          className="text-sm font-medium mb-0.5"
          style={{ color: isDone || isActive ? cfg.color : "#9ca3af" }}
        >
          {cfg.label}
        </p>
        {isActive && (
          <p className="text-xs text-gray-500 leading-relaxed">{cfg.description}</p>
        )}
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [track, setTrack] = useState<BackendOrderTrackDto | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState("");

  const loadOrder = useCallback(async (silent = false) => {
    if (!user?.token || !id) return;

    try {
      if (!silent) {
        setFlowState("loading");
      }
      const [orderResponse, trackResponse] = await Promise.all([
        getOrderByIdRequest(user.token, id),
        trackOrderRequest(user.token, id),
      ]);

      setOrder(mapOrderDtoToUiOrder(orderResponse));
      setTrack(trackResponse);
      setFlowState("success");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setFlowState("not_found");
        return;
      }

      setFlowState("invalid");
    }
  }, [id, user?.token]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace(`/login?from=${encodeURIComponent(`/track-order/${id}`)}`);
    }
  }, [id, isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    if (isAuthReady && isLoggedIn) {
      void loadOrder();
    }
  }, [isAuthReady, isLoggedIn, loadOrder]);

  useAutoRefresh(() => {
    if (!isAuthReady || !isLoggedIn || isCancelling || isSubmittingComplaint) return;
    return loadOrder(true);
  }, { enabled: isAuthReady && isLoggedIn && Boolean(id), intervalMs: 8000 });

  useEffect(() => {
    if (searchParams?.get("notice") === "placed") {
      router.replace(`/track-order/${id}`);
    }
  }, [id, router, searchParams]);

  const currentStatus = useMemo<UiOrderStatus>(() => {
    if (track?.status) return mapBackendStatusToUiStatus(track.status);
    return order?.status ?? "pending_confirmation";
  }, [order?.status, track?.status]);

  const cfg = statusConfig[currentStatus];
  const canCancelOrder = order?.status === "pending_confirmation";
  const canReportDeliveredIssue = currentStatus === "delivered";
  const courierLat =
    typeof track?.courierLatitude === "number" ? track.courierLatitude : null;
  const courierLng =
    typeof track?.courierLongitude === "number" ? track.courierLongitude : null;
  const hasCourierLocation = courierLat !== null && courierLng !== null;
  const driverAssigned =
    currentStatus === "picked_up" ||
    currentStatus === "delivered" ||
    hasCourierLocation;
  const driverStageLabel =
    currentStatus === "delivered"
      ? "Delivered successfully"
      : currentStatus === "picked_up"
        ? "Driver is on the way"
        : currentStatus === "ready_for_pickup"
          ? "Assigning a driver"
          : currentStatus === "accepted" || currentStatus === "washing"
            ? "Laundry is preparing your order"
            : currentStatus === "cancelled"
              ? "Delivery cancelled"
              : "Waiting for confirmation";
  const trackingSummary = hasCourierLocation
    ? "Live courier location is available now."
    : currentStatus === "delivered"
      ? "This order has been delivered successfully. Live tracking is no longer needed."
    : currentStatus === "picked_up"
      ? "Your order is on the way. Live location will appear as soon as it becomes available."
      : currentStatus === "ready_for_pickup"
        ? "Your order is ready and waiting for courier pickup."
        : "Delivery updates will appear here as your order moves forward.";
  const destinationCoords = extractCoordinates(order?.deliveryAddress);
  const laundryCoords = extractCoordinates(track?.laundryAddress);
  const scheduledDeliveryLabel =
    track?.deliveryTime || order?.deliveryAt
      ? formatDate(track?.deliveryTime ?? order?.deliveryAt ?? "")
      : currentStatus === "delivered"
        ? "Delivered"
        : "Not scheduled";
  const deliveryEtaLabel =
    currentStatus === "delivered"
      ? "Delivered"
      : formatEta(track?.estimatedDeliveryTime);
  const deliveryEtaHint =
    currentStatus === "delivered"
      ? `Completed ${formatDate(order.deliveryAt ?? order.updatedAt)}`
      : track?.estimatedDeliveryTime
        ? formatDate(track.estimatedDeliveryTime)
        : "Waiting for courier updates";
  const liveTrackingLabel =
    hasCourierLocation ? "Available" : currentStatus === "delivered" ? "Completed" : "Unavailable";
  const liveTrackingHint =
    hasCourierLocation
      ? "Live courier location is ready"
      : currentStatus === "delivered"
        ? "Courier tracking ended after delivery"
        : "Waiting for live location updates";
  const courierSnapshotTitle =
    hasCourierLocation
      ? "Courier location captured"
      : currentStatus === "delivered"
        ? "Delivery completed"
        : "Location not available yet";
  const courierSnapshotHint =
    hasCourierLocation
      ? `${courierLat?.toFixed(5)}, ${courierLng?.toFixed(5)}`
      : currentStatus === "delivered"
        ? "Live courier location is no longer tracked after delivery."
        : "Live courier position will appear here once it is available.";

  const submitComplaint = async () => {
    if (!user?.token || !order) return;

    const details = complaintText.trim();
    if (details.length < 8) {
      setComplaintError("Please enter a bit more detail so the backend can accept the complaint.");
      return;
    }

    try {
      setIsSubmittingComplaint(true);
      setComplaintError("");
      setComplaintSuccess("");

      const response = await fetch("/api/backend/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          message: `complaint order ${order.id}: ${details}`,
          history: [],
        }),
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => "");
        throw new Error(body || `Complaint request failed (${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let aggregated = "";
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataIndex = part.indexOf("data:");
          if (dataIndex === -1) continue;

          let data = part.slice(dataIndex + 5);
          if (data.startsWith(" ")) data = data.slice(1);

          if (data.trim() === "[DONE]") {
            done = true;
            break;
          }

          aggregated += data;
        }
      }

      if (!aggregated.toLowerCase().includes("complaint") && !aggregated.includes("شكوى")) {
        throw new Error("The backend did not confirm complaint submission.");
      }

      setComplaintSuccess("Your complaint was submitted successfully. The laundry and support team were notified.");
      setShowComplaintModal(false);
      setComplaintText("");
    } catch (error) {
      setComplaintError(error instanceof Error ? error.message : "Failed to submit complaint.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!user?.token || !order) return;

    try {
      setIsCancelling(true);
      await cancelOrderRequest(user.token, order.id);
      setShowCancelModal(false);
      router.push("/orders?notice=cancelled");
    } catch {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  if (!isAuthReady || !isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="ltr">
      <div className="bg-white px-4 md:px-8 py-4 border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-1 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ArrowLeft size={22} className="text-gray-800" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900 text-lg">Track Order</h1>
            {order && <p className="text-xs text-gray-400">Order #{order.id}</p>}
          </div>
        </div>
      </div>

      {flowState === "loading" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 size={30} className="text-[#1D6076] animate-spin" strokeWidth={1.5} />
          <p className="text-gray-400 text-sm">Fetching order...</p>
        </div>
      )}

      {flowState === "invalid" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={34} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Invalid Request</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs">
            We couldn&apos;t load this order from the backend.
          </p>
          <Link
            href="/orders"
            className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all"
          >
            My Orders
          </Link>
        </div>
      )}

      {flowState === "not_found" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={34} className="text-red-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl text-gray-900 mb-3">Order Not Found</h2>
          <p className="text-gray-500 text-sm mb-7 max-w-xs">
            We couldn&apos;t find this order for your current account.
          </p>
          <Link
            href="/orders"
            className="bg-[#1D6076] text-white px-8 py-3.5 rounded-2xl text-sm font-medium hover:bg-[#2a7a94] transition-all"
          >
            My Orders
          </Link>
        </div>
      )}

      {flowState === "success" && order && (
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-5 space-y-4 pb-10">
          <div
            className="rounded-2xl p-5 shadow-sm border"
            style={{ backgroundColor: cfg.bg, borderColor: `${cfg.color}20` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                {(() => {
                  const Icon = StatusIcon[currentStatus];
                  return <Icon size={22} style={{ color: cfg.color }} strokeWidth={1.8} />;
                })()}
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-semibold tracking-wider mb-1"
                  style={{ color: cfg.color }}
                >
                  CURRENT STATUS
                </p>
                <h2 className="text-gray-900 text-lg">{cfg.label}</h2>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {cfg.description}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 mt-4 pt-3 border-t"
              style={{ borderColor: `${cfg.color}20` }}
            >
              <Clock size={12} style={{ color: cfg.color }} strokeWidth={2} />
              <p className="text-xs" style={{ color: cfg.color }}>
                Last updated {timeAgo(order.updatedAt)} · {formatDate(order.updatedAt)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">
              TRACKING TIMELINE
            </p>
            {([...statusOrder, "cancelled"] as UiOrderStatus[])
              .filter((status) => status !== "cancelled" || currentStatus === "cancelled")
              .map((status, index, list) => (
                <TimelineStep
                  key={status}
                  status={status}
                  currentStatus={currentStatus}
                  isLast={index === list.length - 1}
                />
              ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0">
                {hasCourierLocation ? (
                  <Radar size={20} className="text-[#1D6076]" strokeWidth={2} />
                ) : (
                  <UserRound size={20} className="text-[#1D6076]" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 tracking-wider mb-1">
                  DELIVERY TRACKING
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-gray-900 text-base">
                    {driverAssigned ? "Courier update" : "Courier not assigned yet"}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: hasCourierLocation ? "#ecfeff" : cfg.bg,
                      color: hasCourierLocation ? "#0f766e" : cfg.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: hasCourierLocation ? "#14b8a6" : cfg.color,
                      }}
                    />
                    {driverStageLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {trackingSummary}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-1">
                  Delivery ETA
                </p>
                <p className="text-sm font-semibold text-gray-900">{deliveryEtaLabel}</p>
                <p className="text-xs text-gray-500 mt-1">{deliveryEtaHint}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-1">
                  Scheduled Delivery
                </p>
                <p className="text-sm font-semibold text-gray-900">{scheduledDeliveryLabel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Customer delivery window
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 mb-1">
                  Live Tracking
                </p>
                <p className="text-sm font-semibold text-gray-900">{liveTrackingLabel}</p>
                <p className="text-xs text-gray-500 mt-1">{liveTrackingHint}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-[#f7fbfd] to-[#f8fafc] p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Route size={16} className="text-[#1D6076]" strokeWidth={2} />
                  <p className="text-sm font-semibold text-gray-900">Courier route snapshot</p>
                </div>
                {hasCourierLocation && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Live coordinates
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EBA050]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Package size={16} className="text-[#EBA050]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">From laundry</p>
                    <p className="text-sm font-medium text-gray-900">{track?.laundryName || order.laundryName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatAddressForDisplay(track?.laundryAddress)}
                    </p>
                    {laundryCoords && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {laundryCoords.lat.toFixed(5)}, {laundryCoords.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-dashed border-gray-200 h-6" />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1D6076]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Truck size={16} className="text-[#1D6076]" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Courier position</p>
                    <p className="text-sm font-medium text-gray-900">{courierSnapshotTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{courierSnapshotHint}</p>
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-dashed border-gray-200 h-6" />

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Navigation size={16} className="text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Destination</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatAddressForDisplay(order.deliveryAddress)}
                    </p>
                    {destinationCoords && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        {destinationCoords.lat.toFixed(6)}, {destinationCoords.lng.toFixed(6)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">Delivery address on file</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                {hasCourierLocation ? (
                  <a
                    href={buildMapsCoordsUrl(courierLat, courierLng)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1D6076] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a7a94]"
                  >
                    <Radar size={16} strokeWidth={2} />
                    Open courier location
                  </a>
                ) : (
                  <div className="flex-1 rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                    Live courier map will appear here automatically once coordinates are available.
                  </div>
                )}

                <a
                  href={buildMapsUrlFromAddress(order.deliveryAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1D6076] border border-[#1D6076]/20 transition hover:bg-[#1D6076]/5"
                >
                  <MapPin size={16} strokeWidth={2} />
                  Open destination
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-4">
              ORDER DETAILS
            </p>
            <div className="space-y-3">
              {[
                { label: "Laundry", value: order.laundryName },
                { label: "Service", value: order.serviceName },
                { label: "Items", value: `${order.itemCount} ${order.serviceUnit}` },
                { label: "Pickup", value: `${order.pickupDate}, ${order.pickupTime}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm text-gray-900 font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-semibold text-[#1D6076]">
                  {order.total} EGP
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3">
              ADDRESSES
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EBA050]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-[#EBA050]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Pickup Address</p>
                  <p className="text-sm text-gray-800">{order.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#1D6076]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-[#1D6076]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                  <p className="text-sm text-gray-800">{order.deliveryAddress}</p>
                </div>
              </div>
              {track?.laundryAddress && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Package size={14} className="text-emerald-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Laundry Address</p>
                    <p className="text-sm text-gray-800">{track.laundryAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {canReportDeliveredIssue && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <div className="mb-4 rounded-2xl border border-[#1D6076]/10 bg-[#1D6076]/5 p-4">
                <p className="text-sm font-semibold text-gray-900">Rate this laundry</p>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Your order is delivered. You can now rate the laundry and leave feedback about the service.
                </p>
                <button
                  onClick={() => router.push(`/rate-order/${order.id}`)}
                  className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#1D6076] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a7a94]"
                >
                  Rate Laundry
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <RotateCcw size={18} className="text-amber-600" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Complaint or return request</p>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                    The backend supports post-delivery complaints. It does not expose a separate return endpoint, so return issues are sent as a complaint for follow-up.
                  </p>
                </div>
              </div>

              {complaintSuccess && (
                <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {complaintSuccess}
                </div>
              )}

              {complaintError && !showComplaintModal && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {complaintError}
                </div>
              )}

              <button
                onClick={() => {
                  setComplaintError("");
                  setComplaintSuccess("");
                  setShowComplaintModal(true);
                }}
                className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Report complaint / request return
              </button>
            </div>
          )}

          {canCancelOrder && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full bg-red-50 text-red-600 py-3.5 rounded-2xl text-sm font-medium hover:bg-red-100 transition-all"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-xl">
            <h2 className="text-lg text-gray-900 mb-2">Cancel this order?</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              The current backend only allows cancellation while the order is still pending confirmation.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-all"
                disabled={isCancelling}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-70"
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <MessageCircleWarning size={18} className="text-amber-600" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg text-gray-900">Report issue with delivered order</h2>
                <p className="text-xs text-gray-400">Order #{order?.id ?? ""}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Your message will be sent to the backend complaint flow and routed to the laundry admin and support team.
            </p>

            <textarea
              value={complaintText}
              onChange={(event) => setComplaintText(event.target.value)}
              placeholder="Describe the issue or return reason..."
              className="min-h-32 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#1D6076] focus:bg-white"
            />

            {complaintError && (
              <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {complaintError}
              </div>
            )}

            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setShowComplaintModal(false)}
                disabled={isSubmittingComplaint}
                className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={submitComplaint}
                disabled={isSubmittingComplaint}
                className="flex-1 rounded-2xl bg-[#1D6076] py-3 text-sm font-medium text-white transition hover:bg-[#2a7a94] disabled:opacity-70"
              >
                {isSubmittingComplaint ? "Submitting..." : "Send complaint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
