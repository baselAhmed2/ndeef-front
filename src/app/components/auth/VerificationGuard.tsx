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
  const { user, isLoggedIn, isAuthReady, updateUser } = useAuth();
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

    const currentUser = user;

    // Check if user is LaundryAdmin and needs verification
    const normalizedRole = (currentUser.role ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const isLaundryAdmin = normalizedRole === "laundryadmin" || normalizedRole === "3";
    // Current path is verification page - allow access
    const isVerificationPage = pathname?.startsWith("/laundry-admin/verification");

    if (!isLaundryAdmin) {
      setIsChecking(false);
      return;
    }

    let ignore = false;

    async function checkVerificationStatus() {
      try {
        const { getVerificationStatus } = await import("@/app/lib/laundry-admin-client");
        const status = await getVerificationStatus();
        if (ignore) return;

        const needsVerification = !status.isIdentityVerified;
        updateUser({ needsVerification });

        if (needsVerification && !isVerificationPage) {
          router.push("/laundry-admin/verification");
          return;
        }

        setIsChecking(false);
      } catch {
        if (ignore) return;

        if (currentUser.needsVerification && !isVerificationPage) {
          router.push("/laundry-admin/verification");
          return;
        }

        setIsChecking(false);
      }
    }

    checkVerificationStatus();

    return () => {
      ignore = true;
    };
  }, [isAuthReady, isLoggedIn, pathname, router, updateUser, user]);

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
