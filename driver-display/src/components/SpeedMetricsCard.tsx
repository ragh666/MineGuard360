import React from "react";
import { Gauge, ArrowDownCircle, Disc } from "lucide-react";

interface SpeedMetricsCardProps {
  speedMps: number | null;
  recommendedSpeedKmh: number;
  brakeApplied: boolean | null;
  brakeCommand: boolean;
  throttlePercent: number | null;
}

export const SpeedMetricsCard: React.FC<SpeedMetricsCardProps> = ({
  speedMps,
  recommendedSpeedKmh,
  brakeApplied,
  brakeCommand,
  throttlePercent,
}) => {
  const currentSpeedKmh = speedMps !== null ? Math.round(speedMps * 3.6) : null;
  const isSpeeding = currentSpeedKmh !== null && currentSpeedKmh > recommendedSpeedKmh;

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 flex flex-col justify-between shadow-lg">
      <div className="flex items-center justify-between text-gray-400 mb-2">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <Gauge className="w-4 h-4 text-blue-400" /> Vehicle Speed Control
        </span>
        {brakeCommand && (
          <span className="flex items-center gap-1 text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
            <Disc className="w-3.5 h-3.5 animate-spin" /> BRAKE COMMAND ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 my-2">
        {/* Current Speed */}
        <div className="bg-black/40 p-4 rounded-lg border border-white/5 flex flex-col justify-center">
          <span className="text-xs uppercase text-gray-400 font-semibold">Current Speed</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white">
              {currentSpeedKmh !== null ? currentSpeedKmh : "--"}
            </span>
            <span className="text-sm font-semibold text-gray-400">km/h</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono mt-1">
            ({speedMps !== null ? speedMps.toFixed(1) : "--"} m/s)
          </span>
        </div>

        {/* Recommended Speed */}
        <div
          className={`p-4 rounded-lg border flex flex-col justify-center transition-colors ${
            isSpeeding
              ? "bg-red-950/40 border-red-500/50 text-red-300"
              : "bg-black/40 border-white/5 text-emerald-400"
          }`}
        >
          <span className="text-xs uppercase text-gray-400 font-semibold flex items-center justify-between">
            Recommended Limit
            {isSpeeding && <ArrowDownCircle className="w-4 h-4 text-red-400" />}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl md:text-5xl font-black font-mono tracking-tight">
              {recommendedSpeedKmh}
            </span>
            <span className="text-sm font-semibold text-gray-400">km/h</span>
          </div>
          <span className="text-[11px] opacity-75 font-mono mt-1">
            {isSpeeding ? "REDUCE SPEED IMMEDIATELY" : "Target Speed Limit"}
          </span>
        </div>
      </div>

      {/* Throttle & Brake Feedback Footer */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Throttle:</span>
          <div className="w-20 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, throttlePercent ?? 0))}%` }}
            />
          </div>
          <span className="text-gray-300 font-bold">{throttlePercent ?? 0}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Actuator:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              brakeApplied || brakeCommand
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {brakeCommand ? "ENGAGED" : brakeApplied ? "MANUAL BRAKE" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
};
