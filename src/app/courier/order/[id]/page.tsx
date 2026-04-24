"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Phone, Package, CheckCircle2, Truck, XCircle,
  Clock, Shirt, Wind, Droplets, Loader2, MessageCircle, Navigation,
  AlertTriangle, ChevronDown, ExternalLink, CreditCard, Banknote,
} from "lucide-react";

type OrderStatus = "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";

interface OrderData {
  id: string; customer: string; avatar: string; phone: string; service: string;
  serviceIcon: React.ElementType; items: { name: string; qty: number }[];
  pickupAddress: string; pickupArea: string; deliveryAddress: string;
  deliveryArea: string; distance: string; eta: string; amount: number;
  notes: string; status: OrderStatus; urgent: boolean; laundry: string;
  laundryPhone: string; paid: boolean;
}

const ORDER_MAP: Record<string, OrderData> = {
  o1: {
    id: "o1", customer: "Sara Khaled", avatar: "SK", phone: "+20 101 555 7788",
    service: "Wash & Fold", serviceIcon: Droplets,
    items: [{ name: "T-Shirts", qty: 3 }, { name: "Jeans", qty: 1 }, { name: "Towel", qty: 1 }],
    pickupAddress: "12 El-Nasr St., Apt 4B", pickupArea: "Maadi, Cairo",
    deliveryAddress: "7 26th July Corridor", deliveryArea: "Zamalek, Cairo",
    distance: "4.2 km", eta: "18 min", amount: 85,
    notes: "Please ring doorbell twice. Leave with security if no answer.",
    status: "pending", urgent: true, laundry: "Ndeef Main Branch", laundryPhone: "+20 100 000 1234", paid: true,
  },
  o2: {
    id: "o2", customer: "Mahmoud Ali", avatar: "MA", phone: "+20 112 333 4455",
    service: "Dry Cleaning", serviceIcon: Wind,
    items: [{ name: "Suit Jacket", qty: 1 }, { name: "Trousers", qty: 2 }],
    pickupAddress: "55 El-Orouba Rd.", pickupArea: "Heliopolis, Cairo",
    deliveryAddress: "14 Abbas El-Akkad", deliveryArea: "Nasr City, Cairo",
    distance: "2.8 km", eta: "12 min", amount: 120, notes: "",
    status: "pending", urgent: false, laundry: "Ndeef Main Branch", laundryPhone: "+20 100 000 1234", paid: false,
  },
  o3: {
    id: "o3", customer: "Nadia Hassan", avatar: "NH", phone: "+20 100 777 9900",
    service: "Ironing", serviceIcon: Shirt,
    items: [{ name: "Shirts", qty: 5 }, { name: "Trousers", qty: 2 }, { name: "Dress", qty: 1 }],
    pickupAddress: "3 Tahrir Sq. St.", pickupArea: "Dokki, Cairo",
    deliveryAddress: "18 Sudan St.", deliveryArea: "Mohandessin, Cairo",
    distance: "1.5 km", eta: "7 min", amount: 55, notes: "Handle dress with care — silk.",
    status: "accepted", urgent: false, laundry: "Ndeef Main Branch", laundryPhone: "+20 100 000 1234", paid: false,
  },
  o4: {
    id: "o4", customer: "Tarek Fawzy", avatar: "TF", phone: "+20 115 888 6622",
    service: "Wash & Fold", serviceIcon: Droplets,
    items: [{ name: "Bedsheets", qty: 2 }, { name: "Pillowcases", qty: 2 }],
    pickupAddress: "El-Rehab City, Gate 3", pickupArea: "New Cairo",
    deliveryAddress: "Villa 12, Street 9", deliveryArea: "Fifth Settlement, Cairo",
    distance: "6.1 km", eta: "25 min", amount: 70, notes: "",
    status: "picked_up", urgent: false, laundry: "Ndeef Main Branch", laundryPhone: "+20 100 000 1234", paid: true,
  },
};

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "pending", label: "New", desc: "Waiting for you" },
  { key: "accepted", label: "Accepted", desc: "Head to laundry" },
  { key: "picked_up", label: "Picked Up", desc: "On your way" },
  { key: "delivered", label: "Delivered", desc: "Done!" },
];

const CANCEL_REASONS = [
  "Customer unreachable", "Wrong address", "Customer refused delivery", "Package damaged", "Other",
];

function StatusStepper({ current }: { current: OrderStatus }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                style={{ backgroundColor: done ? "#1D5B70" : active ? "white" : "#f1f5f9", borderColor: done || active ? "#1D5B70" : "#e2e8f0" }}>
                {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="text-xs font-bold" style={{ color: active ? "#1D5B70" : "#94a3b8" }}>{i + 1}</span>}
              </div>
              <p className="text-[10px] font-bold mt-1 whitespace-nowrap" style={{ color: done || active ? "#1D5B70" : "#94a3b8" }}>{step.label}</p>
              <p className="text-[9px] text-gray-400 whitespace-nowrap">{step.desc}</p>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 mt-[-18px] rounded-full transition-all" style={{ backgroundColor: i < idx ? "#1D5B70" : "#e2e8f0" }} />}
          </div>
        );
      })}
    </div>
  );
}

function CancelSheet({ onClose, onConfirm }: { onClose: () => void; onConfirm: (r: string) => void }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
        className="relative bg-white z-10 w-full lg:max-w-md lg:rounded-3xl rounded-t-3xl pt-3 pb-8 px-5">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 lg:hidden" />
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div><h3 className="text-gray-900 font-bold">Cancel this order?</h3><p className="text-xs text-gray-400">Please select a reason</p></div>
        </div>
        <div className="space-y-2 my-4">
          {CANCEL_REASONS.map((r) => (
            <button key={r} onClick={() => setSelected(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${selected === r ? "border-red-300 bg-red-50 text-red-700" : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === r ? "border-red-500" : "border-gray-300"}`}>
                {selected === r && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </div>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">Keep Order</button>
          <button onClick={() => selected && onConfirm(selected)} disabled={!selected} className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-red-600 transition-all">
            <XCircle className="w-4 h-4" />Cancel Order
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MapStrip({ order }: { order: OrderData }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height: 140, backgroundColor: "#dde9e4" }}>
      <svg width="100%" height="100%" className="absolute inset-0" style={{ opacity: 0.15 }}>
        <defs><pattern id="mapgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1D5B70" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#mapgrid)" />
        <line x1="0" y1="45%" x2="100%" y2="55%" stroke="#1D5B70" strokeWidth="8" opacity="0.25" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#1D5B70" strokeWidth="5" opacity="0.2" />
      </svg>
      <svg className="absolute inset-0 w-full h-full"><line x1="20%" y1="50%" x2="78%" y2="44%" stroke="#1D5B70" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" /></svg>
      <div className="absolute flex flex-col items-center gap-1" style={{ left: "18%", top: "44%", transform: "translate(-50%,-100%)" }}>
        <div className="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center" style={{ backgroundColor: "#1D5B70" }}><Package className="w-3.5 h-3.5 text-white" /></div>
        <div className="bg-white rounded-lg px-2 py-0.5 shadow text-[9px] font-bold text-gray-700 whitespace-nowrap">{order.pickupArea}</div>
      </div>
      <div className="absolute flex flex-col items-center gap-1" style={{ left: "78%", top: "40%", transform: "translate(-50%,-100%)" }}>
        <div className="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center" style={{ backgroundColor: "#EBA050" }}><Navigation className="w-3.5 h-3.5 text-white" /></div>
        <div className="bg-white rounded-lg px-2 py-0.5 shadow text-[9px] font-bold text-gray-700 whitespace-nowrap">{order.deliveryArea}</div>
      </div>
      <button className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-lg" style={{ backgroundColor: "#1D5B70" }}>
        <Navigation className="w-3.5 h-3.5" />Open Maps<ExternalLink className="w-3 h-3 opacity-70" />
      </button>
      <div className="absolute left-3 bottom-3 flex items-center gap-1 bg-white rounded-xl px-2.5 py-1.5 shadow text-xs font-bold text-gray-700">
        <MapPin className="w-3.5 h-3.5" style={{ color: "#1D5B70" }} />{order.distance}
        {order.eta !== "—" && <><span className="text-gray-300 mx-1">·</span><Clock className="w-3.5 h-3.5 text-amber-500" />{order.eta}</>}
      </div>
    </div>
  );
}

function PaymentSection({ paid, amount }: { paid: boolean; amount: number }) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${paid ? "border-green-200 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${paid ? "bg-green-100" : "bg-amber-100"}`}>
        {paid ? <CreditCard className="w-5 h-5 text-green-700 shrink-0" /> : <Banknote className="w-5 h-5 text-amber-700 shrink-0" />}
        <span className={`font-bold text-sm ${paid ? "text-green-800" : "text-amber-800"}`}>{paid ? "Paid Online — No Collection Needed" : "Cash on Delivery"}</span>
      </div>
      <div className="px-4 py-3">
        {paid ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Payment already processed</p>
              <p className="text-xs text-green-600 mt-0.5">The customer paid <span className="font-bold">EGP {amount}</span> online (Visa/Mastercard). You don't need to collect anything — just hand over the order and confirm delivery.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">Collect <span className="text-amber-700 text-base">EGP {amount}</span> from the customer</p>
              <p className="text-xs text-amber-700 mt-0.5">The customer will pay in cash. Make sure to collect the full amount before handing over the order. If they can't pay, do not leave the items.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourierOrderDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const order = ORDER_MAP[id ?? "o1"];
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showItems, setShowItems] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Package className="w-12 h-12 text-gray-200" />
        <p className="text-gray-400">Order not found</p>
        <button onClick={() => router.push("/courier")} className="text-sm font-semibold" style={{ color: "#1D5B70" }}>← Back to orders</button>
      </div>
    );
  }

  const ServiceIcon = order.serviceIcon;
  const delivered = status === "delivered";
  const cancelled = status === "cancelled";
  const done = delivered || cancelled;

  type ActionCfg = { label: string; sublabel: string; icon: React.ElementType; nextStatus: OrderStatus; color: string } | null;
  const ACTION: ActionCfg =
    status === "pending" ? { label: "Accept Order", sublabel: "Confirm you will pick this up", icon: CheckCircle2, nextStatus: "accepted", color: "#1D5B70" }
    : status === "accepted" ? { label: "I've Picked It Up", sublabel: "Items collected from laundry", icon: Truck, nextStatus: "picked_up", color: "#7c3aed" }
    : status === "picked_up" ? { label: "Mark as Delivered", sublabel: "Confirm delivery to customer", icon: CheckCircle2, nextStatus: "delivered", color: "#16a34a" }
    : null;

  const handleAction = async () => {
    if (!ACTION) return;
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setStatus(ACTION.nextStatus);
    setActionLoading(false);
  };

  const handleCancel = async (_reason: string) => {
    setShowCancel(false);
    setActionLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setStatus("cancelled");
    setActionLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto p-4 lg:p-6">
      <button onClick={() => router.push("/courier")} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to orders
      </button>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Order #{order.id.toUpperCase()}</h1>
          <p className="text-gray-400 text-sm">{order.service} · {order.items.length} item types</p>
        </div>
        <div className="flex items-center gap-2">
          {!order.paid && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-300"><Banknote className="w-4 h-4" />Cash</span>}
          {order.urgent && <span className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl bg-red-100 text-red-600"><AlertTriangle className="w-4 h-4" />Urgent</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <PaymentSection paid={order.paid} amount={order.amount} />
          
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Order Progress</p>
            <StatusStepper current={done ? (delivered ? "delivered" : "picked_up") : status} />
            {done && (
              <div className={`mt-4 rounded-xl px-4 py-3 flex items-center gap-3 ${delivered ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                {delivered ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <div>
                  <p className={`text-sm font-bold ${delivered ? "text-green-700" : "text-red-700"}`}>{delivered ? "Delivered successfully!" : "Order was cancelled"}</p>
                  <p className="text-xs text-gray-400">{delivered ? "Customer has been notified. Well done!" : "This order has been cancelled."}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Customer</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: "#1D5B70" }}>{order.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{order.customer}</p>
                <p className="text-sm text-gray-400 font-mono">{order.phone}</p>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${order.phone}`} className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 border border-green-100 hover:bg-green-100 transition-all"><Phone className="w-4 h-4 text-green-600" /></a>
                <button className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all"><MessageCircle className="w-4 h-4 text-blue-500" /></button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowItems((v) => !v)} className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0f9ff" }}><ServiceIcon className="w-4 h-4" style={{ color: "#1D5B70" }} /></div>
                <div className="text-left"><p className="text-sm font-bold text-gray-800">{order.service}</p><p className="text-xs text-gray-400">Tap to see {order.items.length} item types</p></div>
              </div>
              <motion.div animate={{ rotate: showItems ? 180 : 0 }}><ChevronDown className="w-4 h-4 text-gray-400" /></motion.div>
            </button>
            <AnimatePresence>
              {showItems && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-sm font-bold text-gray-900 bg-white rounded-lg px-2 py-0.5 border border-gray-100">×{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {order.notes && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div><p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Delivery Note</p><p className="text-sm text-amber-800">{order.notes}</p></div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Route</p>
            <MapStrip order={order} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#1D5B70" }} /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pick up</span></div>
                <p className="text-sm font-bold text-gray-800">{order.pickupArea}</p><p className="text-xs text-gray-400 mt-0.5">{order.pickupAddress}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#EBA050" }} /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Deliver to</span></div>
                <p className="text-sm font-bold text-gray-800">{order.deliveryArea}</p><p className="text-xs text-gray-400 mt-0.5">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Laundry</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Truck className="w-5 h-5 text-blue-500" /></div>
              <div className="flex-1"><p className="text-sm font-bold text-gray-900">{order.laundry}</p><p className="text-xs text-gray-400 font-mono">{order.laundryPhone}</p></div>
              <a href={`tel:${order.laundryPhone}`} className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 border border-green-100 hover:bg-green-100 transition-all"><Phone className="w-4 h-4 text-green-600" /></a>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Your Earnings</p>
            <div className="flex items-baseline gap-1"><span className="text-3xl font-bold text-gray-900">EGP</span><span className="text-4xl font-bold" style={{ color: "#1D5B70" }}>{order.amount}</span></div>
            <p className="text-xs text-gray-400 mt-1">{order.paid ? "Customer paid online — no cash collection needed." : "Collect cash from customer upon delivery."}</p>
          </div>

          {!done && (
            <div className="space-y-2">
              {ACTION && (
                <button onClick={handleAction} disabled={actionLoading} className="w-full rounded-2xl text-white font-bold flex flex-col items-center justify-center gap-0.5 transition-all hover:opacity-90 disabled:opacity-50 py-4" style={{ backgroundColor: ACTION.color }}>
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><div className="flex items-center gap-2"><ACTION.icon className="w-5 h-5" /><span className="text-base">{ACTION.label}</span></div><span className="text-xs font-normal opacity-70">{ACTION.sublabel}</span></>}
                </button>
              )}
              <button onClick={() => setShowCancel(true)} className="w-full h-11 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
                <XCircle className="w-4 h-4" />Cancel this order
              </button>
            </div>
          )}
          {done && (
            <button onClick={() => router.push("/courier")} className="w-full h-12 rounded-2xl text-white font-semibold transition-all hover:opacity-90" style={{ backgroundColor: "#1D5B70" }}>← Back to orders</button>
          )}
        </div>
      </div>
      <AnimatePresence>{showCancel && <CancelSheet onClose={() => setShowCancel(false)} onConfirm={handleCancel} />}</AnimatePresence>
    </motion.div>
  );
}
