import React, { useEffect, useState } from "react";
import { MineGuard360Brand } from "./MineGuard360Logo";

interface MineGuardSplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const MineGuardSplashScreen: React.FC<MineGuardSplashScreenProps> = ({
  onComplete,
  durationMs = 3000,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 300);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070b14] text-slate-100 font-sans select-none overflow-hidden transition-all duration-300 ${
        isFadingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Subtle Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="w-[260px] h-[260px] bg-cyan-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Centered MineGuard360 with Icon */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 transition-transform duration-500 hover:scale-105">
        <MineGuard360Brand size="xl" animated={true} />
      </div>
    </div>
  );
};
