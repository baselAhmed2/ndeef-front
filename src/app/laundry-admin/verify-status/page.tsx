"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { getVerificationStatus } from "../../lib/laundry-admin-client";

export default function VerifyStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "waiting" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const checkStatus = async () => {
    try {
      const data = await getVerificationStatus();
      
      if (data.isIdentityVerified) {
        const isLaundryAdmin = data.role.toLowerCase().includes("laundryadmin") || data.role.toLowerCase().includes("admin");
        
        if (isLaundryAdmin && !data.commercialRegisterDocumentUrl) {
          router.replace("/laundry-admin/commercial-register");
          return;
        }
        
        setStatus("ready");
        setTimeout(() => {
          router.replace("/laundry-admin");
        }, 1500);
      } else {
        setStatus("waiting");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Failed to check verification status.");
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="ltr">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/40 rounded-[2.5rem] relative z-10">
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50/80 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={36} className="text-[#1D6076] animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Checking Status</h1>
            <p className="text-gray-500 text-sm">Validating your identity verification with Didit...</p>
          </div>
        )}

        {status === "waiting" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={36} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Verification Pending</h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              We are still waiting for your identity check to be confirmed. This might take a few moments.
            </p>
            <button 
              onClick={() => {
                setStatus("loading");
                checkStatus();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#1D6076] text-white font-semibold text-sm transition-all hover:opacity-90 shadow-lg shadow-[#1D6076]/20"
            >
              Check Again
            </button>
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Successfully Verified!</h1>
            <p className="text-gray-500 text-sm">Redirecting you to the dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={36} className="text-red-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Status Error</h1>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button 
              onClick={() => {
                setStatus("loading");
                checkStatus();
              }}
              className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm transition-all hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
