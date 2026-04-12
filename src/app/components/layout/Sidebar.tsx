"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Users,
  ShieldAlert,
  Wallet,
  BarChart3,
  Bell,
  X,
  LogOut,
  Settings,
  HelpCircle,
  WashingMachine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/admin-api";
import { BASE_URL, getAuthHeaders } from "../../services/api";
import type { LaundryRecord } from "../../types/admin";

type NavItemConfig = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badgeKey?: "verifications" | "fraud" | "notifications";
};

type SidebarBadgeCounts = {
  verifications: number;
  fraud: number;
  notifications: number;
};

type NotificationDto = {
  id: number;
  isRead: boolean;
};

type FraudAlertDto = {
  id: number;
};

const mainNav: NavItemConfig[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Store, label: "Laundries", path: "/admin/laundries" },
  { icon: ShieldAlert, label: "Verifications", path: "/admin/verifications", badgeKey: "verifications" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: ShieldAlert, label: "Fraud Monitor", path: "/admin/fraud", badgeKey: "fraud" },
  { icon: Wallet, label: "Commissions", path: "/admin/commissions" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications", badgeKey: "notifications" },
];

const bottomNav: NavItemConfig[] = [
  { icon: Settings, label: "Settings", path: "/admin/settings" },
  { icon: HelpCircle, label: "Help Center", path: "/admin/help" },
];

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (val: boolean) => void }) {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuth();
  const [badges, setBadges] = useState<SidebarBadgeCounts>({
    verifications: 0,
    fraud: 0,
    notifications: 0,
  });

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSidebarCounts() {
      try {
        const [laundriesResponse, notificationsResponse, fraudResponse] = await Promise.all([
          apiRequest<LaundryRecord[]>("/admin/laundries"),
          apiRequest<{ data?: NotificationDto[] } | NotificationDto[]>("/notifications?pageSize=50"),
          fetch(`${BASE_URL}/fraud/alerts`, {
            headers: getAuthHeaders(),
            cache: "no-store",
          }),
        ]);

        const notifications = Array.isArray(notificationsResponse)
          ? notificationsResponse
          : notificationsResponse.data || [];

        let fraudAlerts: FraudAlertDto[] = [];
        if (fraudResponse.ok) {
          fraudAlerts = (await fraudResponse.json()) as FraudAlertDto[];
        }

        if (!isMounted) return;

        setBadges({
          verifications: laundriesResponse.filter((laundry) => laundry.status === "Inactive").length,
          notifications: notifications.filter((notification) => !notification.isRead).length,
          fraud: fraudAlerts.length,
        });
      } catch (error) {
        console.error("Failed to load sidebar badges", error);
      }
    }

    loadSidebarCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderNavItem = (item: NavItemConfig) => {
    const active = isActive(item.path);
    const badgeValue = item.badgeKey ? badges[item.badgeKey] : 0;

    return (
      <Link key={item.path} href={item.path} onClick={() => setOpen(false)}>
        <motion.div
          whileHover={{ x: 4 }}
          transition={{ duration: 0.15 }}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
            active
              ? "bg-white/20 text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          {active && (
            <motion.div
              layoutId="admin-active-pill"
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            />
          )}
          <item.icon className="w-5 h-5 shrink-0 relative z-10" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10">
            {item.label}
          </span>
          {badgeValue > 0 && (
            <span className="relative z-10 min-w-[20px] h-5 ml-auto flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 bg-white/20 text-white">
              {badgeValue}
            </span>
          )}
          {active && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
              style={{ backgroundColor: "#EBA050" }}
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col overflow-hidden shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
      style={{ backgroundColor: "#1D5B70" }}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ backgroundColor: "#EBA050" }}
          >
            <WashingMachine className="w-5 h-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
              Ndeef
            </span>
            <p className="text-white/50 text-[10px] leading-none mt-0.5 whitespace-nowrap">
              Super Admin
            </p>
          </div>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {mainNav.map(renderNavItem)}
      </nav>

      <div className="py-3 px-2 space-y-1 border-t border-white/10">
        {bottomNav.map(renderNavItem)}
        <button
          onClick={() => {
            logout();
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
            Logout
          </span>
        </button>
      </div>

      <AnimatePresence>
        {user && (
          <div className="px-2 pb-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${user.firstName} ${user.lastName}`.trim() || "Admin User")}&background=1D5B70&color=fff&size=80`}
                alt="Admin"
                className="w-9 h-9 rounded-lg object-cover shadow-sm"
              />
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold text-white truncate">
                  {`${user.firstName} ${user.lastName}`.trim()}
                </h4>
                <p className="text-[11px] text-white/50">
                  {user.role || "Super Admin"}
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
}
