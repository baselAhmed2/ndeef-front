"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, ExternalLink, RefreshCcw, CheckCircle2 } from "lucide-react";
import { startVerificationSession, getVerificationStatus } from "../../lib/laundry-admin-client";

type Stage = "idle" | "starting" | "waiting" | "checking" | "done";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const checkStatus = async (manualClick = false) => {
    try {
      setStage("checking");
      const data = await getVerificationStatus();

      if (data.isIdentityVerified) {
        setStage("done");
        stopPolling();

        const isLaundryAdmin =
          data.role.toLowerCase().includes("laundryadmin") ||
          data.role.toLowerCase().includes("admin");

        setTimeout(() => {
          if (isLaundryAdmin && !data.commercialRegisterDocumentUrl) {
            router.replace("/laundry-admin/commercial-register");
          } else {
            router.replace("/laundry-admin");
          }
        }, 1200);
      } else if (manualClick) {
        // User confirmed they finished Didit — go forward
        router.replace("/laundry-admin/commercial-register");
      } else {
        setStage("waiting");
      }
    } catch {
      if (manualClick) {
        // /verification/status not deployed yet — go forward anyway
        router.replace("/laundry-admin/commercial-register");
      } else {
        setStage("waiting");
      }
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(() => {
      checkStatus();
    }, 5000);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleStartVerification = async () => {
    try {
      setStage("starting");
      setError("");

      const host = typeof window !== "undefined" ? window.location.origin : "";
      const callback = `${host}/laundry-admin/verify-status`;

      const res = await startVerificationSession(callback);
      if (!res?.url) throw new Error("No URL returned");

      // Open Didit in a NEW TAB — keeps current page alive for polling
      window.open(res.url, "_blank", "noopener,noreferrer");

      setStage("waiting");
      startPolling();
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to start verification. Please try again.");
      setStage("idle");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden"
      dir="ltr"
    >
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1D6076]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EBA050]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white p-8 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/40 rounded-[2.5rem] relative z-10">

        {/* Icon */}
        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border shadow-inner transition-all duration-500 ${
          stage === "done"
            ? "bg-green-50 border-green-200"
            : "bg-gradient-to-br from-[#1D6076]/10 to-[#1D6076]/5 border-[#1D6076]/10"
        }`}>
          {stage === "done" ? (
            <CheckCircle2 size={44} className="text-green-500" strokeWidth={1.5} />
          ) : (
            <ShieldCheck size={44} className="text-[#1D6076]" strokeWidth={1.5} />
          )}
        </div>

        {/* ── IDLE: Initial state ── */}
        {stage === "idle" && (
          <>
            <h1 className="text-[28px] font-black text-gray-900 mb-3 tracking-tight">
              Verify your Identity
            </h1>
            <p className="text-gray-500 mb-8 leading-relaxed text-[15px]">
              We need to verify your identity to ensure the security of our platform and protect your business.
            </p>
            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-2xl px-4 py-3">{error}</p>
            )}
            <button
              onClick={handleStartVerification}
              className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-[#1D6076]/20"
              style={{ background: "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)" }}
            >
              Verify with Didit <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* ── STARTING ── */}
        {stage === "starting" && (
          <>
            <h1 className="text-[28px] font-black text-gray-900 mb-3 tracking-tight">
              Opening Didit...
            </h1>
            <p className="text-gray-500 mb-8 text-[15px]">
              Connecting to the verification service.
            </p>
            <div className="flex justify-center">
              <Loader2 size={36} className="text-[#1D6076] animate-spin" />
            </div>
          </>
        )}

        {/* ── WAITING / CHECKING ── */}
        {(stage === "waiting" || stage === "checking") && (
          <>
            <h1 className="text-[28px] font-black text-gray-900 mb-3 tracking-tight">
              Complete Verification
            </h1>
            <p className="text-gray-500 mb-2 leading-relaxed text-[15px]">
              Didit has opened in a <strong>new tab</strong>. Complete your identity verification there.
            </p>
            <p className="text-gray-400 text-xs mb-8">
              This page checks your status automatically every 5 seconds.
            </p>

            {/* Auto-poll indicator */}
            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-[#1D6076]">
              <Loader2 size={16} className="animate-spin" />
              {stage === "checking" ? "Checking status..." : "Waiting for verification..."}
            </div>

            <div className="space-y-3">
              {/* Manual check */}
              <button
                onClick={() => checkStatus(true)}
                disabled={stage === "checking"}
                className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-[#1D6076]/20 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)" }}
              >
                <RefreshCcw size={16} strokeWidth={2.5} />
                I've completed verification
              </button>

              {/* Re-open Didit */}
              <button
                onClick={handleStartVerification}
                className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-50 hover:border-gray-300"
              >
                <ExternalLink size={14} />
                Re-open Didit tab
              </button>
            </div>
          </>
        )}

        {/* ── DONE ── */}
        {stage === "done" && (
          <>
            <h1 className="text-[28px] font-black text-gray-900 mb-3 tracking-tight">
              Identity Verified!
            </h1>
            <p className="text-gray-500 text-[15px] mb-4">
              Redirecting you to the next step...
            </p>
            <div className="flex justify-center">
              <Loader2 size={24} className="text-[#1D6076] animate-spin" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
