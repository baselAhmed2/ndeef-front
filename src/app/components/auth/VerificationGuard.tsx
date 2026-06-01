"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { shouldBypassVerificationInDev } from "@/app/lib/verification-dev";
import { hasRecentLaundryVerificationMarker } from "@/app/lib/verification-state";

interface VerificationGuardProps {
  children: React.ReactNode;
}

export function VerificationGuard({ children }: VerificationGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isAuthReady, updateUser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  // Keep mutable values in refs so the effect doesn't re-trigger when they change
  const userRef = useRef(user);
  const updateUserRef = useRef(updateUser);
  const routerRef = useRef(router);
  userRef.current = user;
  updateUserRef.current = updateUser;
  routerRef.current = router;

  // Guard: run exactly once per (isAuthReady, isLoggedIn, pathname) change
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Reset guard when key stable deps change so a navigation re-checks
    hasCheckedRef.current = false;
  }, [isAuthReady, isLoggedIn, pathname]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (shouldBypassVerificationInDev()) {
      setIsChecking(false);
      return;
    }

    // Not logged in - let the auth context handle redirect to login
    if (!isLoggedIn || !userRef.current) {
      setIsChecking(false);
      return;
    }

    const currentUser = userRef.current;

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
      const hasFreshVerification = hasRecentLaundryVerificationMarker();

      try {
        const { getVerificationStatus } = await import("@/app/lib/laundry-admin-client");
        const status = await getVerificationStatus();
        if (ignore) return;

        const needsVerification = !status.isIdentityVerified && !hasFreshVerification;
        // Use ref to avoid adding updateUser to deps (would cause infinite loop)
        updateUserRef.current({ needsVerification });

        if (needsVerification && !isVerificationPage) {
          routerRef.current.push("/laundry-admin/verification");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        if (ignore) return;

        const httpStatus =
          typeof error === "object" && error !== null && "status" in error
            ? Number((error as { status?: number }).status)
            : null;

        // On 429 - don't redirect, just allow access and stop checking
        if (httpStatus === 429) {
          setIsChecking(false);
          return;
        }

        const shouldForceVerification =
          !hasFreshVerification &&
          Boolean(currentUser.needsVerification) &&
          (httpStatus === 401 || httpStatus === 403);

        if (shouldForceVerification && !isVerificationPage) {
          updateUserRef.current({ needsVerification: true });
          routerRef.current.push("/laundry-admin/verification");
          return;
        }

        setIsChecking(false);
      }
    }

    checkVerificationStatus();

    return () => {
      ignore = true;
    };
  // Only stable primitives — unstable values (user, updateUser, router) read via refs
  }, [isAuthReady, isLoggedIn, pathname]);

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
