"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export function AppMotionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 24,
    mass: 0.2,
  });

  return (
    <>
      <div className="ndeef-ambient-shell pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="ndeef-ambient-orb ndeef-ambient-orb-one"
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [0, 36, -16, 0], y: [0, -28, 18, 0], scale: [1, 1.08, 0.96, 1] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="ndeef-ambient-orb ndeef-ambient-orb-two"
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [0, -30, 12, 0], y: [0, 24, -20, 0], scale: [1, 0.94, 1.06, 1] }
          }
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        <motion.div
          className="ndeef-ambient-orb ndeef-ambient-orb-three"
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [0, 18, -22, 0], y: [0, 32, -14, 0], scale: [1, 1.05, 0.92, 1] }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 2.4 }}
        />
      </div>

      <motion.div
        className="ndeef-scroll-progress fixed left-0 right-0 top-0 z-[70] h-[3px] origin-left"
        style={{ scaleX: progressScaleX }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(8px)" }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[1]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
