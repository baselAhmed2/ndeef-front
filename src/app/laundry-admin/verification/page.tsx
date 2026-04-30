"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { getVerificationStatus, startVerificationSession } from "@/app/lib/laundry-admin-client";

export default function VerificationPage() {
  const router = useRouter();
  const { user, isLoggedIn, isAuthReady, updateUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isLoggedIn || !user) {
      router.push("/login?redirect=/laundry-admin/verification");
      return;
    }

    const currentUser = user;
    const normalizedRole = (currentUser.role ?? "").trim().toLowerCase().replace(/\s+/g, "");

    if (normalizedRole !== "laundryadmin" && normalizedRole !== "3") {
      router.push("/");
      return;
    }

    async function redirectToDidit() {
      try {
        const status = await getVerificationStatus();
        const needsVerification = !status.isIdentityVerified;
        updateUser({ needsVerification });

        if (!needsVerification) {
          router.replace("/laundry-admin");
          return;
        }

        const redirectUrl = `${window.location.origin}/laundry-admin/verification/success`;
        const session = await startVerificationSession(redirectUrl);
        window.location.href = session.url;
      } catch (err) {
        if (currentUser.needsVerification === false) {
          router.replace("/laundry-admin");
          return;
        }

        const message = err instanceof Error ? err.message : "Could not start verification.";
        setError(message);
      }
    }

    redirectToDidit();
  }, [isLoggedIn, isAuthReady, user, router, updateUser]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#1D5B70]/10 text-[#1D5B70]">
          {error ? <ShieldCheck className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
        <h2 className="text-xl font-black text-gray-950">
          {error ? "Verification could not start" : "Preparing identity verification"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {error || "You will be redirected to the secure Didit verification page in a moment."}
        </p>
        {error && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl bg-[#1D5B70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17495a]"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
