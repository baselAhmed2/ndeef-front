"use client";

import { Languages, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/app/context/PreferencesContext";

export function GlobalPreferenceFab() {
  const pathname = usePathname();
  const { isArabic, isDark, toggleLanguage, toggleTheme } = usePreferences();
  const isDashboardArea =
    pathname?.startsWith("/laundry-admin") || pathname?.startsWith("/admin");

  return (
    <div
      data-no-translate
      className={`ndeef-preferences-widget fixed z-[999] flex items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl ${
        isDashboardArea ? "bottom-4 right-4" : "bottom-4 left-4"
      }`}
      aria-label="Display preferences"
    >
      <motion.button
        type="button"
        onClick={toggleLanguage}
        whileTap={{ scale: 0.94 }}
        className="ndeef-preference-button group inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
        aria-label={isArabic ? "Switch to English" : "Switch to Arabic"}
        title={isArabic ? "Switch to English" : "Switch to Arabic"}
      >
        <Languages className="h-4 w-4 text-[#1D6076]" />
        <span>{isArabic ? "EN" : "AR"}</span>
      </motion.button>

      <div className="h-6 w-px bg-slate-200" />

      <motion.button
        type="button"
        onClick={toggleTheme}
        whileTap={{ scale: 0.94 }}
        className="ndeef-preference-button inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#1D6076]" />}
        <span>{isDark ? "Light" : "Dark"}</span>
      </motion.button>
    </div>
  );
}
