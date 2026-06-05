"use client";

import { TopNav } from "@/app/components/TopNav";
import NdeefPageLoader from "@/app/components/NdeefPageLoader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { usePreferences } from "@/app/context/PreferencesContext";
import { useEffect } from "react";
import { ReactNode } from "react";
import { Suspense } from "react";
import { AppMotionShell } from "@/app/components/AppMotionShell";

function AuthPageLoader() {
  return (
    <NdeefPageLoader
      title="Loading page"
      subtitle="Checking your session and preparing the screen..."
      accent="teal"
    />
  );
}

function AppLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, isAuthReady, user } = useAuth();
  const { isDark } = usePreferences();
  const authPaths = ["/login", "/signup"];
  const currentPath = pathname ?? "/";
  const fromParam = searchParams?.get("from");
  const isAuthPage = authPaths.includes(currentPath);
  const isPaymentCallbackPage =
    currentPath.startsWith("/payment/callback") ||
    currentPath.startsWith("/payment/admin-callback");
  const isWalletChargeReturnPage =
    currentPath.startsWith("/wallet") && Boolean(searchParams?.get("status"));
  
  const role = user?.role || "";
  const isLaundryAdmin = isLoggedIn && role.toLowerCase().includes("laundryadmin");
  const isCourier = isLoggedIn && role.toLowerCase().includes("courier");

  useEffect(() => {
    if (!isAuthReady) return;

    if (isLaundryAdmin) {
      if (!currentPath.startsWith("/laundry-admin") && !isPaymentCallbackPage && !isWalletChargeReturnPage) {
        // Only redirect if NOT specifically requested a different user page via 'from' (rare for admin)
        if (!fromParam || fromParam === "/" || fromParam === currentPath) {
          router.replace("/laundry-admin");
        }
      }
      return;
    }

    // Redirect couriers
    if (isCourier) {
      if (!currentPath.startsWith("/courier") && !isPaymentCallbackPage && !isWalletChargeReturnPage) {
        if (!fromParam || fromParam === "/" || fromParam === currentPath) {
          router.replace("/courier");
        }
      }
      return;
    }

    // Redirect logged-in customers if they try to access login/signup pages
    if (isLoggedIn && !isLaundryAdmin && !isCourier && isAuthPage) {
      router.replace("/");
      return;
    }
  }, [currentPath, fromParam, isAuthReady, isCourier, isLaundryAdmin, isLoggedIn, isAuthPage, isPaymentCallbackPage, isWalletChargeReturnPage, router]);

  if (!isAuthReady) {
    return <AuthPageLoader />;
  }

  // AGGRESSIVE: If you are an admin in a user section, show NOTHING but the white loader
  // This kills the flicker of the Home page or TopNav instantly.
  if (isLaundryAdmin && !currentPath.startsWith("/laundry-admin") && !isPaymentCallbackPage && !isWalletChargeReturnPage) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-gray-100 border-t-[#1D5B70] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#1D5B70] tracking-widest uppercase opacity-80">Nazeef Admin</p>
        </div>
      </div>
    );
  }

  if (isCourier && !currentPath.startsWith("/courier") && !isPaymentCallbackPage && !isWalletChargeReturnPage) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-gray-100 border-t-[#EBA050] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#EBA050] tracking-widest uppercase opacity-80">Nazeef Courier</p>
        </div>
      </div>
    );
  }

  const shouldShowTopNav =
    (!isAuthPage || !!fromParam) &&
    !isLaundryAdmin &&
    !isCourier &&
    !isPaymentCallbackPage;

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#071923]" : "bg-[#f5f5f5]"}`}>
      {shouldShowTopNav && <TopNav />}
      <AppMotionShell>{children}</AppMotionShell>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthPageLoader />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
