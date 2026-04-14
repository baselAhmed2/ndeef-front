"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { startVerificationSession } from "../../lib/laundry-admin-client";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [clicked, setClicked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const host = typeof window !== "undefined" ? window.location.origin : "";
      const callback = `${host}/laundry-admin/verify-status`;
      
      const res = await startVerificationSession(callback);
      if (res?.url) {
         window.location.href = res.url;
      } else {
         throw new Error("No URL returned");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      setLoading(false);
      alert("Failed to start verification. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="ltr">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1D6076]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EBA050]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white p-8 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/40 rounded-[2.5rem] relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-[#1D6076]/10 to-[#1D6076]/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[#1D6076]/10 shadow-inner">
          <ShieldCheck size={44} className="text-[#1D6076]" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-[28px] font-black text-gray-900 mb-3 tracking-tight">
          Verify your Identity
        </h1>
        
        <p className="text-gray-500 mb-8 leading-relaxed text-[15px]">
          We need to verify your identity to ensure the security of our platform and protect your business.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleStartVerification}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-[#1D6076]/20 disabled:opacity-70 disabled:hover:translate-y-0"
            style={{ background: "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)" }}
          >
            {loading ? (
               <>
                 <Loader2 size={18} className="animate-spin" strokeWidth={2.5} /> 
                 Connecting to Didit...
               </>
            ) : (
               <>
                 Verify with Didit <ArrowRight size={18} strokeWidth={2.5} />
               </>
            )}
          </button>
          <div className="py-2 border-[1.5px] border-transparent">
             <p className="text-xs text-gray-400">
               You will be securely redirected, and automatically returned here upon completion.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
