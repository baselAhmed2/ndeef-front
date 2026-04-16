"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { shouldBypassVerificationInDev } from "@/app/lib/verification-dev";

interface VerificationGuardProps {
  children: React.ReactNode;
}

export function VerificationGuard({ children }: VerificationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isAuthReady } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    if (shouldBypassVerificationInDev()) {
      setIsChecking(false);
      return;
    }

    // Not logged in - let the auth context handle redirect to login
    if (!isLoggedIn || !user) {
      setIsChecking(false);
      return;
    }

    // Check if user is LaundryAdmin and needs verification
    const isLaundryAdmin = user.role === "LaundryAdmin" || user.role === "2";
    const needsVerification = user.needsVerification;

    // Current path is verification page - allow access
    const isVerificationPage = pathname?.startsWith("/laundry-admin/verification");

    if (isLaundryAdmin && needsVerification && !isVerificationPage) {
      // Redirect to verification page
      router.push("/laundry-admin/verification");
      return;
    }

    setIsChecking(false);
  }, [isAuthReady, isLoggedIn, user, pathname, router]);

  if (!isAuthReady || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
