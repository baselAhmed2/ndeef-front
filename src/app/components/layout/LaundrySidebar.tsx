"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import clsx from "clsx";
import {
  LayoutDashboard,
  ClipboardList,
  Tags,
  Users,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  X,
  LogOut,
  MapPin
} from "lucide-react";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/laundry-admin" },
  { icon: ClipboardList, label: "Orders", path: "/laundry-admin/orders", badge: 12 },
  { icon: Tags, label: "Services & Pricing", path: "/laundry-admin/services" },
  { icon: Users, label: "Customers", path: "/laundry-admin/customers" },
  { icon: MapPin, label: "Delivery Drivers", path: "/laundry-admin/drivers" },
  { icon: BarChart3, label: "Analytics", path: "/laundry-admin/analytics" },
];

const bottomNav = [
  { icon: Bell, label: "Notifications", path: "/laundry-admin/notifications", badge: 2 },
  { icon: Settings, label: "Settings", path: "/laundry-admin/settings" },
  { icon: HelpCircle, label: "Support", path: "/laundry-admin/support" },
];

export function LaundrySidebar({ open, setOpen }: { open: boolean; setOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/laundry-admin") return pathname === "/laundry-admin";
    return pathname.startsWith(path);
  };

  const NavItem = ({ item }: { item: (typeof mainNav)[0] }) => {
    const active = isActive(item.path);
    return (
      <Link
        href={item.path}
        onClick={() => setOpen(false)}
        className={clsx(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
          active
            ? "text-white"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
        )}
      >
        {active && (
          <motion.div
            layoutId="laundry-sidebar-active"
            className="absolute inset-0 bg-gradient-to-r from-[#EBA050] to-[#EBA050]/90 rounded-xl shadow-lg shadow-[#EBA050]/25"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        <item.icon
          size={18}
          strokeWidth={2}
          className={clsx(
            "relative z-10 transition-colors",
            active ? "text-white" : "text-slate-400 group-hover:text-[#EBA050]"
          )}
        />
        <span className="relative z-10 flex-1">{item.label}</span>
        {item.badge && (
          <span
            className={clsx(
              "relative z-10 min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5",
              active ? "bg-white/20 text-white" : "bg-[#EBA050]/10 text-[#EBA050]"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: open ? "0%" : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-white/95 backdrop-blur-xl border-r border-slate-100/80 flex flex-col lg:static lg:translate-x-0 transition-transform duration-300",
          !open && "-translate-x-full lg:translate-x-0"
        )}
        dir="ltr"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[72px] px-5 border-b border-slate-100/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EBA050] to-[#ffb86b] flex items-center justify-center text-white font-bold text-base shadow-lg shadow-[#EBA050]/20">
              L
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">Clean & Care</h1>
              <p className="text-[10px] font-semibold text-[#1D6076] tracking-widest uppercase mt-0.5">Laundry Partner</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Management</p>
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          <div className="!mt-6">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">System</p>
            {bottomNav.map((item) => (
               <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        {/* Laundry Profile */}
        <div className="p-3 border-t border-slate-100/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100/50">
            <div className="w-9 h-9 rounded-lg bg-slate-200 overflow-hidden shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=200&auto=format&fit=crop"
                alt="Laundry"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-semibold text-slate-800 truncate">Manager</h4>
              <p className="text-[11px] text-slate-400">Jeddah Branch</p>
            </div>
            <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </motion.aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  );
}
