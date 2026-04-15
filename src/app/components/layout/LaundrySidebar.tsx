"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/app/components/ui/use-mobile";
import { useAuth } from "@/app/context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  CalendarDays,
  Bell,
  CreditCard,
  ChevronLeft,
  WashingMachine,
  LogOut,
  Settings,
  X,
  AlertTriangle,
  Users,
  Truck,
  Headphones,
  BarChart3,
} from "lucide-react";

interface LaundrySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: "/laundry-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/laundry-admin/orders", label: "Orders", icon: ShoppingBag },
  { path: "/laundry-admin/services", label: "Services", icon: Sparkles },
  { path: "/laundry-admin/availability", label: "Availability", icon: CalendarDays },
  { path: "/laundry-admin/customers", label: "Customers", icon: Users },
  { path: "/laundry-admin/drivers", label: "Drivers", icon: Truck },
  { path: "/laundry-admin/notifications", label: "Notifications", icon: Bell },
  { path: "/laundry-admin/payments", label: "Payments", icon: CreditCard },
  { path: "/laundry-admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/laundry-admin/support", label: "Support", icon: Headphones },
];

export function LaundrySidebar({ collapsed: rawCollapsed, onToggle }: LaundrySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const collapsed = isMobile || rawCollapsed;
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentPath = pathname ?? "";

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return currentPath === path;
    return currentPath.startsWith(path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen shrink-0 overflow-hidden shadow-xl"
      style={{ backgroundColor: "#1D5B70" }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ backgroundColor: "#EBA050" }}
          >
            <WashingMachine className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
                  Ndeef
                </span>
                <p className="text-white/50 text-[10px] leading-none mt-0.5 whitespace-nowrap">
                  Laundry Admin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                transition={{ duration: 0.15 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${active
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                    transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                  />
                )}
                <item.icon className="w-5 h-5 shrink-0 relative z-10" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ backgroundColor: "#EBA050" }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="py-3 px-2 space-y-1 border-t border-white/10">
        <Link href="/laundry-admin/settings">
          <motion.div
            whileHover={{ x: collapsed ? 0 : 4 }}
            transition={{ duration: 0.15 }}
            className={`
              relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
              ${currentPath === "/laundry-admin/settings"
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/10"
              }
            `}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Logout</h3>
                  <p className="text-xs text-gray-400">Are you sure you want to logout?</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                You'll be logged out of your Ndeef admin account. Any unsaved changes will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { logout(); router.push("/"); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Logout
                </button>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow z-50"
          style={{ color: "#1D5B70" }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      )}
    </motion.aside>
  );
}
