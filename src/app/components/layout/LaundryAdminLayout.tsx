"use client";

import { useState, type ReactNode } from "react";
import { usePreferences } from "@/app/context/PreferencesContext";
import { LaundrySidebar } from "./LaundrySidebar";
import { LaundryHeader } from "./LaundryHeader";

export function LaundryAdminLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark } = usePreferences();

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "bg-[#071923]" : "bg-gray-50"}`}>
      <LaundrySidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <LaundryHeader />
        <main className={`flex-1 overflow-y-auto ${isDark ? "bg-[#071923]" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
