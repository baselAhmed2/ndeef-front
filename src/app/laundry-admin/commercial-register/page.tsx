"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { getVerificationStatus } from "@/app/lib/laundry-admin-client";

type ScreenState = "loading" | "verified" | "needs_verification" | "error";

export default function CommercialRegisterUploadPage() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const status = await getVerificationStatus();
        if (!active) return;

        if (status.isIdentityVerified) {
          setState("verified");
          return;
        }

        setState("needs_verification");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load verification status.");
        setState("error");
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/70 flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-[2rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#1D6076]/10 text-[#1D6076]">
          {state === "loading" ? (
            <Loader2 size={34} className="animate-spin" strokeWidth={1.7} />
          ) : state === "error" ? (
            <AlertCircle size={34} strokeWidth={1.7} />
          ) : (
            <ShieldCheck size={34} strokeWidth={1.7} />
          )}
        </div>

        <h1 className="text-center text-2xl font-black text-gray-900">
          Laundry Admin Verification
        </h1>
        <p className="mt-3 text-center text-sm leading-7 text-gray-500">
          The current backend does not expose a separate commercial-register upload endpoint.
          This screen now follows the real verification flow that already exists in the project.
        </p>

        {state === "loading" && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
            Checking your verification status...
          </div>
        )}

        {state === "verified" && (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-6">
            <p className="text-sm font-semibold text-emerald-800">
              Your identity is already verified.
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              You can continue to the laundry dashboard. If commercial-register approval is needed later,
              it has to be supported by a backend endpoint first.
            </p>
            <button
              onClick={() => router.replace("/laundry-admin")}
              className="mt-5 w-full rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174d5f]"
            >
              Open Laundry Dashboard
            </button>
          </div>
        )}

        {state === "needs_verification" && (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-6">
            <p className="text-sm font-semibold text-amber-800">
              Identity verification is still required.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-700">
              Continue with the official verification flow first. After the backend exposes a commercial-register endpoint,
              this page can be expanded again without changing the backend contract.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/laundry-admin/verification"
                className="flex-1 rounded-2xl bg-[#1D6076] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#174d5f]"
              >
                Continue Verification
              </Link>
              <Link
                href="/laundry-admin"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-6">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 w-full rounded-2xl bg-[#1D6076] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174d5f]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
