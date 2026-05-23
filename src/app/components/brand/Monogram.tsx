"use client";

const NAZEEF_LOGO_SRC = "/nazeef-logo.png";
interface MonogramProps {
  variant?: "navy" | "light" | "orange";
  size?: number;
  className?: string;
  useImage?: boolean;
}

export function Monogram({
  variant = "orange",
  size = 36,
  className = "",
  useImage = true,
}: MonogramProps) {
  // Styling configurations for the 3 distinct brand variants
  const variantStyles = {
    orange: {
      svgBg: "bg-white dark:bg-[#0e2030]",
      border: "border-2 border-[#EBA050]/40 dark:border-[#EBA050]/70",
      textColor: "text-[#EBA050]",
      shadow: "shadow-sm dark:shadow-[0_0_0_1px_rgba(235,160,80,0.25)]",
    },
    navy: {
      svgBg: "bg-[#1D6076] dark:bg-[#4AA8C0]",
      border: "border border-[#1D6076]/20 dark:border-[#4AA8C0]/30",
      textColor: "text-white",
      shadow: "shadow-sm",
    },
    light: {
      svgBg: "bg-white/15 backdrop-blur-sm",
      border: "border border-white/25",
      textColor: "text-white",
      shadow: "shadow-none",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 transition-all select-none overflow-hidden ${style.svgBg} ${style.border} ${style.shadow} ${className}`}
      style={{ width: size, height: size }}
    >
      {useImage ? (
        <img
          src={NAZEEF_LOGO_SRC}
          alt="Nazeef Brand Logo"
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          <text
            x="50%"
            y="52%"
            dominantBaseline="middle"
            textAnchor="middle"
            className={`${style.textColor} font-bold`}
            style={{
              fontFamily: "'Outfit', 'Cinzel', 'Times New Roman', serif",
              fontWeight: 800,
              fontSize: "64px",
              letterSpacing: "-0.05em",
            }}
          >
            N
          </text>
        </svg>
      )}
    </div>
  );
}
