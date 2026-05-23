"use client";

interface WordmarkProps {
  variant?: "navy" | "light" | "gold";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export function Wordmark({
  variant = "navy",
  size = "md",
  showTagline = false,
  className = "",
}: WordmarkProps) {
  // Brand color presets
  const colors = {
    navy: {
      text: "text-[#0d3d50]",
      tag: "text-[#EBA050]",
      line: "bg-[#EBA050]/40",
    },
    light: {
      text: "text-white",
      tag: "text-white/70",
      line: "bg-white/30",
    },
    gold: {
      text: "text-[#EBA050]",
      tag: "text-[#0d3d50]/70",
      line: "bg-[#0d3d50]/20",
    },
  };

  // Brand size scaling
  const sizes = {
    sm: {
      title: "text-[16px]",
      tag: "text-[8px]",
      gap: "gap-0.5",
      spacing: "tracking-[0.12em]",
    },
    md: {
      title: "text-[22px]",
      tag: "text-[10px]",
      gap: "gap-1",
      spacing: "tracking-[0.16em]",
    },
    lg: {
      title: "text-[32px]",
      tag: "text-[12px]",
      gap: "gap-1.5",
      spacing: "tracking-[0.2em]",
    },
    xl: {
      title: "text-[42px]",
      tag: "text-[14px]",
      gap: "gap-2",
      spacing: "tracking-[0.24em]",
    },
  };

  const color = colors[variant];
  const scale = sizes[size];

  return (
    <div className={`flex flex-col items-start ${scale.gap} select-none ${className}`}>
      <span
        className={`font-black ${color.text} ${scale.title} leading-none tracking-wider`}
        style={{
          fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
          fontWeight: 900,
        }}
      >
        NAZEEF
      </span>
      {showTagline && (
        <div className="flex items-center gap-1.5 w-full">
          <div className={`h-[1px] flex-1 ${color.line}`} />
          <span
            className={`font-bold ${color.tag} ${scale.tag} ${scale.spacing} whitespace-nowrap uppercase`}
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
              fontWeight: 700,
            }}
          >
            LAUNDRY MADE SIMPLE
          </span>
          <div className={`h-[1px] flex-1 ${color.line}`} />
        </div>
      )}
    </div>
  );
}
