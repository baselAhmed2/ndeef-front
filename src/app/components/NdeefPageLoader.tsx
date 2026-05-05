"use client";

import { motion } from "framer-motion";

type NdeefPageLoaderProps = {
  title?: string;
  subtitle?: string;
  accent?: "teal" | "amber" | "slate";
  fullScreen?: boolean;
};

const accentMap = {
  teal: {
    ring: "border-t-[#1D6076]",
    dot: "bg-[#1D6076]",
    text: "text-[#1D6076]",
    glow: "from-[#1D6076]/12 via-[#1D6076]/6 to-transparent",
  },
  amber: {
    ring: "border-t-[#EBA050]",
    dot: "bg-[#EBA050]",
    text: "text-[#EBA050]",
    glow: "from-[#EBA050]/14 via-[#EBA050]/7 to-transparent",
  },
  slate: {
    ring: "border-t-slate-700 dark:border-t-slate-200",
    dot: "bg-slate-700 dark:bg-slate-200",
    text: "text-slate-700 dark:text-slate-200",
    glow: "from-slate-500/10 via-slate-400/5 to-transparent",
  },
} as const;

export default function NdeefPageLoader({
  title = "Loading page",
  subtitle = "Preparing everything for you...",
  accent = "teal",
  fullScreen = true,
}: NdeefPageLoaderProps) {
  const palette = accentMap[accent];

  return (
    <div
      className={`${fullScreen ? "fixed inset-0 z-[99999]" : "min-h-screen"} flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(29,96,118,0.10),_transparent_30%),linear-gradient(180deg,#f8fbfd_0%,#ffffff_50%,#f3f7fa_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(29,96,118,0.14),_transparent_28%),linear-gradient(180deg,#07131f_0%,#0b1725_100%)]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${palette.glow}`} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.25, repeat: Infinity, ease: "linear" }}
            className={`h-16 w-16 rounded-[22px] border-[3px] border-slate-200 dark:border-slate-700 ${palette.ring}`}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.22, 0.55, 0.22] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-[22px] ${palette.dot} blur-xl`}
          />
          <div className="absolute inset-[18px] rounded-xl bg-white/85 dark:bg-slate-900/80 backdrop-blur flex items-center justify-center shadow-sm">
            <span className={`text-lg font-bold ${palette.text}`}>N</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>

        <div className="mt-5 flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              animate={{ opacity: [0.28, 1, 0.28], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: index * 0.15 }}
              className={`h-2.5 w-2.5 rounded-full ${palette.dot}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
