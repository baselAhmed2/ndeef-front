"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import { getOrderById, updateOrderStatus } from "@/app/lib/laundry-admin-client";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  subtotal?: number;
}

interface AdminOrder {
  id: string;
  customer: string;
  phone: string;
  address: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  service: string;
  status: string;
  date: string;
  estimatedReady: string;
  items: OrderItem[];
  notes?: string;
  totalPrice?: number;
  timeline?: Array<{ label: string; time: string; done: boolean; active?: boolean }>;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Delivered: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  Processing: { color: "#1D5B70", bg: "#f0f9ff", icon: Loader2 },
  Pending: { color: "#EBA050", bg: "#fff7ed", icon: Clock },
  Ready: { color: "#8b5cf6", bg: "#f5f3ff", icon: Package },
  Cancelled: { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
};

const statusActions = ["Processing", "Ready", "Delivered", "Cancelled"];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 2,
});

export function OrderDetailsNew() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      if (!id) {
        setError("Missing order id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setOrder(await getOrderById(id));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load order.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      setError("");
      await updateOrderStatus(order.id, status);
      setOrder({ ...order, status });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update order.";
      setError(message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#1D5B70]" />
        <span className="text-sm font-medium text-gray-500">Loading order...</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/laundry-admin/orders")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const cfg = statusConfig[order.status] ?? statusConfig.Pending;
  const StatusIcon = cfg.icon;
  const subtotal = order.items.reduce(
    (sum, item) => sum + (item.subtotal ?? item.qty * item.price),
    0,
  );
  const total = order.totalPrice ?? subtotal;

  return (
    <div className="space-y-5 p-6">
      <button
        onClick={() => router.push("/laundry-admin/orders")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{order.id}</h2>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">Placed on {order.date}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400">Estimated Ready</p>
            <p className="text-sm font-semibold text-gray-700">{order.estimatedReady}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-4">
          <span className="mr-1 text-xs font-medium text-gray-500">Update Status:</span>
          {statusActions.map((status) => (
            <button
              key={status}
              disabled={updating || order.status === status}
              onClick={() => handleStatusChange(status)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                order.status === status
                  ? "border-transparent text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={
                order.status === status
                  ? { backgroundColor: statusConfig[status]?.color ?? "#1D5B70" }
                  : {}
              }
            >
              {updating && order.status !== status ? "Updating..." : status}
            </button>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-50 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
              <p className="mt-0.5 text-xs text-gray-400">{order.service}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                        {item.qty}x
                      </div>
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {currency.format(item.subtotal ?? item.qty * item.price)}
                      </p>
                      <p className="text-xs text-gray-400">{currency.format(item.price)} each</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-400">No item details available</div>
              )}
            </div>
            <div className="space-y-2 bg-gray-50/50 px-5 py-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                <span>Total</span>
                <span className="text-[#1D5B70]">{currency.format(total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Order Timeline</h3>
            {order.timeline?.length ? (
              <div className="space-y-4">
                {order.timeline.map((step, index) => (
                  <div key={`${step.label}-${index}`} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: step.done ? "#1D5B70" : "#f1f5f9" }}
                    >
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.label}</p>
                      <p className="text-xs text-gray-400">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No timeline details available</p>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Customer Details</h3>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D5B70] text-lg font-bold text-white">
                {order.customer[0] ?? "C"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.customer}</p>
                <p className="text-xs text-gray-400">Backend customer</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-700">{order.phone || "N/A"}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-700">{order.address || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="mb-4 font-semibold text-gray-900">Delivery</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pickup</p>
                <p className="mt-1 text-gray-700">{order.pickupAddress || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Delivery</p>
                <p className="mt-1 text-gray-700">{order.deliveryAddress || order.address || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#EBA050]" />
              <div>
                <h3 className="font-semibold text-gray-900">Status Sync</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Status updates are sent directly to the backend order endpoint.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStatusChange("Ready")}
            disabled={updating || order.status === "Ready" || order.status === "Delivered"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1D5B70] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#17495a] disabled:opacity-50"
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Mark as Ready
          </button>
        </aside>
      </div>
    </div>
  );
}
