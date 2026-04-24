"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star, Package, Clock, CheckCircle2, XCircle, MapPin, Bell,
  ChevronRight, Shield, LogOut, Wifi, WifiOff, Phone, Truck,
  TrendingUp, Edit3, User,
} from "lucide-react";

export default function CourierProfilePage() {
  const [available, setAvailable] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [locationOn, setLocationOn] = useState(true);

  const handleToggle = async () => {
    setTogglingAvail(true);
    await new Promise((r) => setTimeout(r, 600));
    setAvailable((v) => !v);
    setTogglingAvail(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="mb-2">
        <h1 className="text-gray-900 font-bold text-xl">My Profile</h1>
        <p className="text-gray-400 text-sm">Manage your availability and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile card */}
          <div className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg"
            style={{ background: "linear-gradient(145deg, #1D5B70 0%, #2a7a9a 100%)" }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white" style={{ transform: "translate(30%,-30%)" }} />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20"
                    style={{ backgroundColor: "#EBA050" }}>KM</div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white transition-colors ${available ? "bg-green-400" : "bg-gray-400"}`} />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">Khaled Mansour</p>
                  <p className="text-white/60 text-xs font-mono">+20 101 234 5678</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                <Edit3 className="w-4 h-4 text-white/70" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mb-4 relative z-10">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4" fill={s <= 4 ? "#EBA050" : "none"} stroke={s <= 4 ? "#EBA050" : "rgba(255,255,255,0.3)"} />
              ))}
              <span className="text-white/70 text-sm ml-1">4.8 rating</span>
            </div>
            <div className="grid grid-cols-3 gap-2 relative z-10">
              {[{ v: 142, l: "Delivered" }, { v: "97.9%", l: "Completion" }, { v: "412h", l: "Active" }].map((s) => (
                <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="font-bold text-sm">{s.v}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Availability</p>
            <button onClick={handleToggle} disabled={togglingAvail}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${available ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${available ? "bg-green-100" : "bg-gray-100"}`}>
                {available ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-bold ${available ? "text-green-700" : "text-gray-600"}`}>
                  {available ? "Online — accepting orders" : "Offline — not receiving orders"}
                </p>
                <p className="text-xs text-gray-400">{available ? "You'll get new assignments" : "Tap to go online"}</p>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${available ? "bg-green-400" : "bg-gray-300"}`}>
                <motion.div layout transition={{ type: "spring", stiffness: 600, damping: 35 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                  style={{ left: available ? "calc(100% - 1.375rem)" : "0.125rem" }} />
              </div>
            </button>
          </div>

          {/* Assigned laundry */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Assigned Laundry</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Ndeef Main Branch</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">Maadi, Cairo</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600">Active</span>
              </div>
            </div>
            <a href="tel:+201000001234"
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <Phone className="w-4 h-4" />Call Laundry Admin
            </a>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="font-bold text-gray-800 mb-4">Performance Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Completed", value: 142, icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
                { label: "Cancelled", value: 3, icon: XCircle, color: "#ef4444", bg: "#fef2f2" },
                { label: "Hours", value: "412h", icon: Clock, color: "#1D5B70", bg: "#f0f9ff" },
                { label: "This Month", value: "EGP 7.2k", icon: TrendingUp, color: "#EBA050", bg: "#fff7ed" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 border text-center" style={{ backgroundColor: s.bg, borderColor: s.bg }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "white" }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[
                { label: "Completion Rate", value: "97.9%", pct: "97.9%", color: "#22c55e", note: "142 delivered out of 145 orders" },
                { label: "Customer Rating", value: "4.8 / 5.0", pct: "96%", color: "#EBA050", note: null },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: item.pct }}
                      transition={{ duration: 1.2, delay: 0.3 }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  {item.note && <p className="text-xs text-gray-400 mt-1">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-800">Preferences</p>
            </div>
            {[
              { icon: Bell, label: "Order Notifications", desc: "Get alerted for new assignments", color: "#3b82f6", bg: "#eff6ff", value: notifOn, toggle: () => setNotifOn((v) => !v) },
              { icon: MapPin, label: "Location Sharing", desc: "Share your location during deliveries", color: "#7c3aed", bg: "#f5f3ff", value: locationOn, toggle: () => setLocationOn((v) => !v) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button onClick={item.toggle}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${item.value ? "bg-[#1D5B70]" : "bg-gray-200"}`}>
                  <motion.div layout transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                    style={{ left: item.value ? "calc(100% - 1.375rem)" : "0.125rem" }} />
                </button>
              </div>
            ))}
            {[
              { icon: Package, label: "Order History", desc: "All past deliveries", color: "#1D5B70", bg: "#f0f9ff" },
              { icon: Shield, label: "Privacy & Security", desc: "Manage your data", color: "#0891b2", bg: "#f0f9ff" },
              { icon: User, label: "Account Settings", desc: "Edit personal info", color: "#6b7280", bg: "#f9fafb" },
            ].map((item) => (
              <button key={item.label}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
}
