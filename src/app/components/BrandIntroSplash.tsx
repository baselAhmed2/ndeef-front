"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import introSplash from "@/app/assets/intro-splash.jpeg";

const SPLASH_SESSION_KEY = "ndeef_intro_splash_seen";
const SPLASH_VISIBLE_MS = 2200;
const SPLASH_EXIT_MS = 500;

export function BrandIntroSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsMounted(true);

    const hasSeenSplash = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
    if (hasSeenSplash) return;

    setIsVisible(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const hideTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      setIsVisible(false);
    }, SPLASH_VISIBLE_MS);

    const unlockTimer = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
    }, SPLASH_VISIBLE_MS + SPLASH_EXIT_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(unlockTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-[100000] overflow-hidden bg-[#081f27]"
        >
          {/* CSS gradient bg — no blurred full-screen image to save WebView GPU tile memory */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(160deg, #0d3040 0%, #081f27 50%, #0a2533 100%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(235,160,80,0.07), transparent 60%)" }}
          />

          <div className="relative flex h-full items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[460px]"
            >
              <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <div className="relative aspect-square">
                  <Image
                    src={introSplash}
                    alt="Nazeef intro artwork"
                    fill
                    priority
                    sizes="(max-width: 768px) 80vw, 460px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/72 via-slate-950/16 to-transparent px-6 pb-6 pt-16 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
                      Nazeef
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Fresh care, right from the first second.
                    </h2>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
