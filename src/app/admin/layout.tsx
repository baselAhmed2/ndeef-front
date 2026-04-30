import { AdminLayout } from "@/app/components/layout/AdminLayout";
import { DashboardAccessGuard } from "@/app/components/auth/DashboardAccessGuard";
import type { ReactNode } from "react";

export default function AdminSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAccessGuard allowedRoles={["admin", "superadmin"]}>
      <AdminLayout>{children}</AdminLayout>
    </DashboardAccessGuard>
  );
}
