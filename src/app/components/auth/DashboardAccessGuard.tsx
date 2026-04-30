"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface DashboardAccessGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  loginRoleHint?: string;
}

function normalizeRole(role: string) {
  return role.trim().toLowerCase().replace(/\s+/g, "");
}

export function DashboardAccessGuard({
  children,
  allowedRoles,
  loginRoleHint,
}: DashboardAccessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthReady, isLoggedIn, user } = useAuth();

  const normalizedUserRole = normalizeRole(user?.role ?? "");
  const hasAllowedRole = allowedRoles.some((role) => normalizedUserRole === normalizeRole(role));

  useEffect(() => {
    if (!isAuthReady) return;

    const baseLoginUrl = loginRoleHint
      ? `/login?role=${encodeURIComponent(loginRoleHint)}&from=${encodeURIComponent(pathname ?? "/")}`
      : `/login?from=${encodeURIComponent(pathname ?? "/")}`;

    if (!isLoggedIn || !user) {
      router.replace(baseLoginUrl);
      return;
    }

    if (!hasAllowedRole) {
      router.replace(baseLoginUrl);
    }
  }, [hasAllowedRole, isAuthReady, isLoggedIn, loginRoleHint, pathname, router, user]);

  if (!isAuthReady || !isLoggedIn || !user || !hasAllowedRole) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-100 border-t-[#1D5B70]" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1D5B70] opacity-80">
            Checking access
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
