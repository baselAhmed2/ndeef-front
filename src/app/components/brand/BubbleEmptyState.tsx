"use client";

import { motion } from "framer-motion";
import { Monogram } from "./Monogram";

interface BubbleEmptyStateProps {
  title?: string;
  subtitle?: string;
}

export function BubbleEmptyState({
  title = "All clear here!",
  subtitle = "No active orders waiting right now.",
}: BubbleEmptyStateProps) {
  // Generate random coordinate data for 6 floating bubbles in the background
  const bubbles = [
    { id: 1, x: -40, y: 10, size: 24, delay: 0 },
    { id: 2, x: 50, y: -20, size: 16, delay: 0.5 },
    { id: 3, x: -30, y: -50, size: 20, delay: 1.2 },
    { id: 4, x: 40, y: 40, size: 12, delay: 0.8 },
    { id: 5, x: -60, y: 30, size: 18, delay: 1.5 },
    { id: 6, x: 60, y: -40, size: 22, delay: 0.3 },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center relative overflow-hidden select-none w-full max-w-sm mx-auto">
      {/* Animated Floating Bubbles background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            animate={{
              y: [0, -15, 0],
              x: [0, Math.random() * 6 - 3, 0],
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4 + bubble.id % 2,
              repeat: Infinity,
              delay: bubble.delay,
              ease: "easeInOut",
            }}
            className="absolute rounded-full bg-[#EBA050]/20 border border-[#EBA050]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
            style={{
              width: bubble.size,
              height: bubble.size,
              left: `calc(50% + ${bubble.x}px)`,
              top: `calc(50% + ${bubble.y}px)`,
            }}
          />
        ))}
      </div>

      {/* Center Monogram with pulsing aura */}
      <div className="relative z-10 mb-6">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-[#EBA050]/14 blur-xl"
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <Monogram variant="orange" size={72} />
        </motion.div>
      </div>

      {/* Typography */}
      <h3 className="relative z-10 text-base font-bold text-gray-800 tracking-tight">
        {title}
      </h3>
      <p className="relative z-10 mt-1.5 text-xs text-gray-400 max-w-[240px] leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
