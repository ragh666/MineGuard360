import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export const MineGuard360Icon: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 40,
  className = "",
  animated = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient radar pulse ring */}
      {animated && (
        <span
          className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping opacity-30"
          style={{ animationDuration: "2.4s" }}
        />
      )}

      {/* Main Vector Badge */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.45)]"
      >
        <defs>
          <linearGradient id="mgShieldGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="mgRingGrad" x1="0" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="mgCoreGrad" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer 360° Circular Radar Track */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#mgRingGrad)"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeOpacity="0.65"
        />

        {/* 360 Degree Cardinal Degree Tick Marks */}
        <line x1="50" y1="4" x2="50" y2="9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="91" x2="50" y2="96" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="50" x2="9" y2="50" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
        <line x1="91" y1="50" x2="96" y2="50" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />

        {/* Secondary 360 Concentric Arc */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeOpacity="0.25"
        />

        {/* Rotating 360 Radar Sweep Cone (Subtle) */}
        {animated && (
          <path
            d="M50 50 L86 34 A42 42 0 0 0 50 8 Z"
            fill="url(#mgRingGrad)"
            opacity="0.18"
            className="origin-center animate-spin"
            style={{ animationDuration: "3s" }}
          />
        )}

        {/* High-Tech Hexagonal Shield Profile */}
        <path
          d="M50 16 L78 28 C78 54 66 72 50 84 C34 72 22 54 22 28 Z"
          fill="#0f172a"
          stroke="url(#mgShieldGrad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Inner Shield Inlay */}
        <path
          d="M50 22 L72 32 C72 52 62 67 50 77 C38 67 28 52 28 32 Z"
          fill="url(#mgCoreGrad)"
          fillOpacity="0.15"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />

        {/* 360 Crosshair Reticle */}
        <line x1="50" y1="30" x2="50" y2="70" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="32" y1="50" x2="68" y2="50" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Central Mining Safety Hub Node */}
        <circle cx="50" cy="50" r="8" fill="url(#mgCoreGrad)" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />
      </svg>
    </div>
  );
};

export const MineGuard360Brand: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  showText = true,
  animated = true,
}) => {
  const iconSizes = {
    sm: 28,
    md: 38,
    lg: 64,
    xl: 96,
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-3xl",
    xl: "text-5xl",
  };

  const badgeSizes = {
    sm: "text-[9px] px-1.5 py-0.2",
    md: "text-[11px] px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
    xl: "text-base px-3 py-1.5",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <MineGuard360Icon size={iconSizes[size]} animated={animated} />
      {showText && (
        <div className="flex items-center tracking-tight font-black">
          <span
            className={`font-mono uppercase tracking-wider bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent ${textSizes[size]}`}
          >
            MINEGUARD
          </span>
          <span
            className={`ml-1.5 rounded-md font-mono font-black uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] ${badgeSizes[size]}`}
          >
            360
          </span>
        </div>
      )}
    </div>
  );
};
