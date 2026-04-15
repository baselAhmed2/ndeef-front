import { LaundryAdminLayout } from "@/app/components/layout/LaundryAdminLayout";
import { VerificationGuard } from "@/app/components/auth/VerificationGuard";
import type { ReactNode } from "react";

export default function LaundrySectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VerificationGuard>
      <LaundryAdminLayout>{children}</LaundryAdminLayout>
    </VerificationGuard>
  );
}
