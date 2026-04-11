"use client";

import { motion, AnimatePresence } from "motion/react";
import { TopNav } from "@/app/components/TopNav";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { ReactNode } from "react";
import { Suspense } from "react";

function resolveDefaultPathForRole(role?: string) {
  const normalizedRole = (role ?? "").toLowerCase();
  if (normalizedRole.includes("laundryadmin")) return "/laundry-admin";
  if (normalizedRole.includes("admin")) return "/admin";
  return "/";
}

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: [0.42, 0, 1, 1] as const },
  },
};

function AppLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isAuthReady, user } = useAuth();
  const authPaths = ["/login", "/signup"];
  const isAuthPage = authPaths.includes(pathname);
  
  const role = user?.role || "";
  const isLaundryAdmin = isLoggedIn && role.toLowerCase().includes("laundryadmin");

  useEffect(() => {
    if (!isAuthReady) return;

    // Redirect admins from auth pages or user sections
    if (isLaundryAdmin) {
      if (!pathname.startsWith("/laundry-admin")) {
        // Only redirect if NOT specifically requested a different user page via 'from' (rare for admin)
        const from = searchParams.get("from");
        if (!from || from === "/" || from === pathname) {
          router.replace("/laundry-admin");
        }
      }
      return;
    }
  }, [isAuthPage, isAuthReady, isLoggedIn, isLaundryAdmin, pathname, router, searchParams]);

  if (!isAuthReady) {
    return null;
  }

  // AGGRESSIVE: If you are an admin in a user section, show NOTHING but the white loader
  // This kills the flicker of the Home page or TopNav instantly.
  if (isLaundryAdmin && !pathname.startsWith("/laundry-admin")) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-gray-100 border-t-[#1D5B70] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#1D5B70] tracking-widest uppercase opacity-80">Ndeef Admin</p>
        </div>
      </div>
    );
  }

  const shouldShowTopNav = (!isAuthPage || !!searchParams.get("from")) && !isLaundryAdmin;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {shouldShowTopNav && <TopNav />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
