"use client";

import { useState, useEffect } from "react";
import { getOrderById, updateOrderStatus } from "@/app/lib/laundry-admin-client";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  Package,
  Truck,
  XCircle,
  Printer,
  MessageSquare,
  AlertTriangle,
  X,
  CheckCheck,
} from "lucide-react";

const orderData: Record<string, {
  id: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  service: string;
  status: string;
  date: string;
  estimatedReady: string;
  items: { name: string; qty: number; price: number }[];
  notes: string;
  timeline: { label: string; time: string; done: boolean; active?: boolean }[];
}> = {
  "ORD-1024": {
    id: "ORD-1024",
    customer: "Sarah Johnson",
    phone: "+1 555-0101",
    email: "sarah.j@email.com",
    address: "123 Oak Street, Apt 4B, New York, NY 10001",
    service: "Wash & Fold",
    status: "Delivered",
    date: "Apr 7, 2026 — 09:15 AM",
    estimatedReady: "Apr 8, 2026 — 02:00 PM",
    items: [
      { name: "Shirts", qty: 3, price: 9.0 },
      { name: "Pants", qty: 2, price: 10.0 },
      { name: "Undergarments (bag)", qty: 1, price: 8.0 },
    ],
    notes: "Please use fragrance-free detergent.",
    timeline: [
      { label: "Order Placed", time: "Apr 7 – 09:15 AM", done: true },
      { label: "Pickup Confirmed", time: "Apr 7 – 10:00 AM", done: true },
      { label: "Laundry Received", time: "Apr 7 – 11:30 AM", done: true },
      { label: "Processing", time: "Apr 7 – 01:00 PM", done: true },
      { label: "Ready for Delivery", time: "Apr 8 – 10:00 AM", done: true },
      { label: "Delivered", time: "Apr 8 – 01:45 PM", done: true },
    ],
  },
  "ORD-1023": {
    id: "ORD-1023",
    customer: "Mohammed Al-Rashid",
    phone: "+966 555-0102",
    email: "m.alrashid@email.com",
    address: "45 Palm Avenue, Villa 7, Riyadh, KSA",
    service: "Dry Cleaning",
    status: "Ready",
    date: "Apr 7, 2026 — 08:30 AM",
    estimatedReady: "Apr 8, 2026 — 06:00 PM",
    items: [
      { name: "Suits", qty: 2, price: 35.0 },
      { name: "Dress Shirts", qty: 3, price: 15.0 },
    ],
    notes: "Handle with extra care — premium fabric.",
    timeline: [
      { label: "Order Placed", time: "Apr 7 – 08:30 AM", done: true },
      { label: "Pickup Confirmed", time: "Apr 7 – 09:15 AM", done: true },
      { label: "Laundry Received", time: "Apr 7 – 10:00 AM", done: true },
      { label: "Processing", time: "Apr 7 – 12:00 PM", done: true },
      { label: "Ready for Delivery", time: "Apr 8 – 09:30 AM", done: true, active: true },
      { label: "Delivered", time: "Pending", done: false },
    ],
  },
};

const defaultOrder = orderData["ORD-1024"];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  Delivered: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  Processing: { color: "#1D5B70", bg: "#f0f9ff", icon: Loader2 },
  Pending: { color: "#EBA050", bg: "#fff7ed", icon: Clock },
  Ready: { color: "#8b5cf6", bg: "#f5f3ff", icon: Package },
  Cancelled: { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
};

export function OrderDetailsNew() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const initialOrder = (id && orderData[id]) ? orderData[id] : { ...defaultOrder, id: id || "ORD-????" };

  const [order, setOrder] = useState<any>(initialOrder);
  const [currentStatus, setCurrentStatus] = useState(initialOrder.status);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [smsToast, setSmsToast] = useState(false);
  const [printToast, setPrintToast] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadOrder() {
      try {
        const data = await getOrderById(id);
        if (data) {
          setOrder(data);
          setCurrentStatus(data.status || initialOrder.status);
          if (data.status === "Cancelled") setCancelled(true);
        }
      } catch (err) {
        console.error("Failed to load order", err);
      }
    }
    loadOrder();
  }, [id, initialOrder.status]);

  const cfg = statusConfig[currentStatus] ?? statusConfig["Pending"];
  const StatusIcon = cfg.icon;

  const handleMarkReady = async () => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(order.id, "Ready");
      setCurrentStatus("Ready");
      setOrder((prev: any) => ({ ...prev, status: "Ready" }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendSms = () => {
    setSmsToast(true);
    setTimeout(() => setSmsToast(false), 3000);
  };

  const handlePrint = () => {
    setPrintToast(true);
    setTimeout(() => setPrintToast(false), 2000);
    window.print();
  };

  const handleCancelConfirm = async () => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(order.id, "Cancelled");
      setCancelled(true);
      setCurrentStatus("Cancelled");
      setOrder((prev: any) => ({ ...prev, status: "Cancelled" }));
      setShowCancelModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const subtotal = order.items.reduce((acc: number, item: any) => acc + item.qty * item.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="p-6 space-y-5">
      {/* SMS Toast */}
      <AnimatePresence>
        {smsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-xl rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCheck className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">SMS Sent!</p>
              <p className="text-xs text-gray-400">Update sent to {order.customer}</p>
            </div>
            <button onClick={() => setSmsToast(false)} className="ml-2 text-gray-300 hover:text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Toast */}
      <AnimatePresence>
        {printToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-blue-200 shadow-xl rounded-2xl px-4 py-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Printer className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Printing...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCancelModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cancel Order?</h3>
                  <p className="text-xs text-gray-400">{order.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Are you sure you want to cancel this order? This action cannot be undone and the customer will be notified.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Cancel Order"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back + Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={() => router.push("/laundry-admin/orders")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleSendSms}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#EBA050" }}
          >
            <MessageSquare className="w-4 h-4" /> Contact Customer
          </button>
        </div>
      </motion.div>

      {/* Order ID + Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">{order.id}</h2>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {order.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Placed on {order.date}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Estimated Ready</p>
            <p className="text-sm font-semibold text-gray-700">{order.estimatedReady}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 mr-1">Update Status:</span>
          {["Processing", "Ready", "Delivered", "Cancelled"].map((s: any) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.96 }}
              disabled={isUpdating}
              onClick={() => s === "Cancelled" ? setShowCancelModal(true) : setCurrentStatus(s)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                currentStatus === s
                  ? "text-white border-transparent"
                  : "text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={currentStatus === s ? { backgroundColor: statusConfig[s as keyof typeof statusConfig]?.color } : {}}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
              <p className="text-xs text-gray-400 mt-0.5">{order.service} · {order.items.reduce((a: number, i: any) => a + i.qty, 0)} items total</p>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {item.qty}×
                    </div>
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${(item.qty * item.price).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 bg-gray-50/50 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (10%)</span><span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span style={{ color: "#1D5B70" }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {order.notes && (
              <div className="px-5 py-3.5 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer Notes</p>
                <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
              </div>
            )}
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Order Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {order.timeline.map((step: any, i: number) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                      style={{
                        backgroundColor: step.done ? (step.active ? "#EBA050" : "#1D5B70") : "white",
                        borderColor: step.done ? (step.active ? "#EBA050" : "#1D5B70") : "#e2e8f0",
                      }}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`text-sm font-medium ${step.done ? "text-gray-900" : "text-gray-400"}`}>
                        {step.label}
                        {step.active && (
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EBA050" }}>
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: "#1D5B70" }}
              >
                {order.customer[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{order.customer}</p>
                <p className="text-xs text-gray-400">Regular Customer</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{order.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700 break-all">{order.email}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{order.address}</span>
              </div>
            </div>
          </motion.div>

          {/* Service Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Service Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service Type</span>
                <span className="font-medium text-gray-800">{order.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Items</span>
                <span className="font-medium text-gray-800">{order.items.reduce((a: number, i: any) => a + i.qty, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-800">Credit Card</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleMarkReady}
                disabled={currentStatus === "Ready" || currentStatus === "Delivered" || currentStatus === "Cancelled" || isUpdating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: currentStatus === "Ready" ? "#22c55e" : "#1D5B70" }}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentStatus === "Ready" ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />)}
                {currentStatus === "Ready" ? "Order is Ready ✓" : (isUpdating ? "Updating..." : "Mark as Ready")}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSendSms}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#EBA050" }}
              >
                <MessageSquare className="w-4 h-4" /> Send SMS Update
              </motion.button>
              {!cancelled ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Cancel Order
                </motion.button>
              ) : (
                <div className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-400 bg-gray-50">
                  <XCircle className="w-4 h-4" /> Order Cancelled
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
