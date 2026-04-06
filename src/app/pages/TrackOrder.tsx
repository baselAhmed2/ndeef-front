import { useEffect, useMemo, useState } from "react";
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
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthReady, isLoggedIn } = useAuth();

  const [flowState, setFlowState] = useState<FlowState>("loading");
  const [order, setOrder] = useState<UiOrder | null>(null);
  const [track, setTrack] = useState<BackendOrderTrackDto | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      router.replace(`/login?from=${encodeURIComponent(`/track-order/${id}`)}`);
    }
  }, [id, isAuthReady, isLoggedIn, router]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!user?.token || !id) return;

      try {
        setFlowState("loading");
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
    };

    if (isAuthReady && isLoggedIn) {
      loadOrder();
    }
  }, [id, isAuthReady, isLoggedIn, user?.token]);

  useEffect(() => {
    if (searchParams.get("notice") === "placed") {
      router.replace(`/track-order/${id}`);
    }
  }, [id, router, searchParams]);

  const currentStatus = useMemo<UiOrderStatus>(() => {
    if (track?.status) return mapBackendStatusToUiStatus(track.status);
    return order?.status ?? "pending_confirmation";
  }, [order?.status, track?.status]);

  const cfg = statusConfig[currentStatus];
  const canCancelOrder = order?.status === "pending_confirmation";

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
    </div>
  );
}
