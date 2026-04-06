import { LaundryAdminLayout } from "@/app/components/layout/LaundryAdminLayout";
import type { ReactNode } from "react";

export default function LaundrySectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <LaundryAdminLayout>{children}</LaundryAdminLayout>;
}
