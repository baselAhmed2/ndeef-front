import { LaundryAdminLayout } from "@/app/components/layout/LaundryAdminLayout";
import { DashboardAccessGuard } from "@/app/components/auth/DashboardAccessGuard";
import { VerificationGuard } from "@/app/components/auth/VerificationGuard";
import { LaundryNotificationProvider } from "@/app/context/LaundryNotificationContext";
import type { ReactNode } from "react";

export default function LaundrySectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardAccessGuard allowedRoles={["laundryadmin", "3"]} loginRoleHint="LaundryAdmin">
      <VerificationGuard>
        <LaundryNotificationProvider>
          <LaundryAdminLayout>{children}</LaundryAdminLayout>
        </LaundryNotificationProvider>
      </VerificationGuard>
    </DashboardAccessGuard>
  );
}


