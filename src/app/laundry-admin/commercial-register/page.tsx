"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, UploadCloud, Loader2, Info } from "lucide-react";
import { uploadCommercialRegister } from "../../lib/laundry-admin-client";

export default function CommercialRegisterUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      
      await uploadCommercialRegister(formData);
      
      // Successfully uploaded
      router.replace("/laundry-admin");
    } catch (err) {
      console.error(err);
      setError("Failed to upload document. Please try a different file.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6 relative" dir="ltr">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 text-center border border-gray-100 shadow-xl shadow-gray-200/40 rounded-[2.5rem]">
        
        <div className="w-20 h-20 bg-blue-50/80 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
          <FileCheck2 size={36} className="text-[#1D6076]" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Commercial Register</h1>
        <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
          Your identity is verified! As a Laundry Admin, please upload your commercial register certificate to complete activation.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6 flex items-start gap-2 text-left">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="relative mb-6">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full flex items-center justify-center gap-3 px-4 py-5 rounded-2xl border-2 border-dashed transition-all ${
              file ? "border-[#1D6076] bg-[#1D6076]/5" : "border-gray-200 hover:border-[#1D6076]/50 bg-gray-50"
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center text-center">
                <FileCheck2 size={24} className="text-[#1D6076] mx-auto mb-2" />
                <span className="text-sm font-semibold text-[#1D6076] break-all">{file.name}</span>
                <span className="text-xs text-[#1D6076]/70 mt-1">Click to change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud size={28} className="text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">Browse Local Files</span>
                <span className="text-xs text-gray-400 mt-1">PDF only — max 10MB</span>
              </div>
            )}
          </button>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-md disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #1D6076 0%, #2a7a94 100%)" }}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Uploading...
            </>
          ) : (
            "Complete Setup"
          )}
        </button>

      </div>
    </div>
  );
}
