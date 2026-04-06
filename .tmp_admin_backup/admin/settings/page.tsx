"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 bg-[#2A5C66]/10 text-[#2A5C66] rounded-2xl flex items-center justify-center mb-4">
        <Settings size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      <p className="text-slate-500 max-w-sm">
        This page is under construction. System settings will be accessible here soon.
      </p>
    </div>
  );
}
