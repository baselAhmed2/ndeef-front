import { AdminLayout } from "@/app/components/layout/AdminLayout";
import type { ReactNode } from "react";

export default function AdminSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
