import React from "react";
import { FinalAction, SafetyState } from "../data/types";
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldX, Octagon } from "lucide-react";

interface SafetyBannerProps {
  safetyState: SafetyState;
  finalAction: FinalAction;
  reason: string;
  deterministicPriority: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  safetyState,
  finalAction,
  reason,
  deterministicPriority,
}) => {
  const getBannerConfig = () => {
    switch (safetyState) {
      case "SAFE":
        return {
          bg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
          badgeBg: "bg-emerald-500 text-black",
          icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
          pulse: "",
        };
      case "CAUTION":
        return {
          bg: "bg-amber-950/80 border-amber-500/50 text-amber-300",
          badgeBg: "bg-amber-500 text-black",
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
          pulse: "",
        };
      case "WARNING":
        return {
          bg: "bg-orange-950/80 border-orange-500/50 text-orange-300",
          badgeBg: "bg-orange-500 text-black",
          icon: <AlertTriangle className="w-8 h-8 text-orange-400 animate-bounce" />,
          pulse: "",
        };
      case "CRITICAL":
        return {
          bg: "bg-red-950/90 border-red-500 text-red-200",
          badgeBg: "bg-red-600 text-white font-bold",
          icon: <ShieldAlert className="w-9 h-9 text-red-400 animate-pulse" />,
          pulse: "animate-pulse border-2 border-red-500",
        };
      case "EMERGENCY":
        return {
          bg: "bg-red-900 border-2 border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]",
          badgeBg: "bg-red-500 text-white font-black animate-ping",
          icon: <Octagon className="w-10 h-10 text-white animate-spin" />,
          pulse: "animate-emergency",
        };
      case "FAULT":
        return {
          bg: "bg-purple-950/90 border-purple-500 text-purple-200",
          badgeBg: "bg-purple-600 text-white",
          icon: <ShieldX className="w-8 h-8 text-purple-400" />,
          pulse: "",
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div
      className={`w-full p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${config.bg} ${config.pulse}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Status Block */}
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-black/40">{config.icon}</div>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-black tracking-wider uppercase">
                {safetyState}
              </span>
              <span
                className={`px-3 py-1 text-xs md:text-sm font-extrabold rounded-md uppercase tracking-wide ${config.badgeBg}`}
              >
                ACTION: {finalAction.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90 font-medium">{reason}</p>
          </div>
        </div>

        {/* Right Priority Badge */}
        <div className="self-end md:self-center text-right bg-black/40 px-3 py-2 rounded-lg border border-white/10">
          <div className="text-[10px] uppercase font-bold text-gray-400">
            Engine Rule Evaluation
          </div>
          <div className="text-xs font-mono font-semibold text-blue-300">
            {deterministicPriority}
          </div>
        </div>
      </div>
    </div>
  );
};
