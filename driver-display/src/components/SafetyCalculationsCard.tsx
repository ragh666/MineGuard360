import React from "react";
import { CalculatedSafetyData } from "../data/types";
import { Calculator, ShieldAlert, Timer } from "lucide-react";

interface SafetyCalculationsCardProps {
  calculated: CalculatedSafetyData;
}

export const SafetyCalculationsCard: React.FC<SafetyCalculationsCardProps> = ({ calculated }) => {
  const {
    ttcSeconds,
    ttcStatus,
    reactionDistanceM,
    brakingDistanceM,
    requiredStoppingDistanceM,
    availableDistanceM,
    stoppingDistanceMarginM,
    closingVelocityMps,
  } = calculated;

  const isMarginCritical = stoppingDistanceMarginM !== null && stoppingDistanceMarginM < 0;

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 flex flex-col justify-between shadow-lg">
      <div className="flex items-center justify-between text-gray-400 mb-2">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <Calculator className="w-4 h-4 text-emerald-400" /> Calculated Safety Metrics
        </span>
        <span className="text-[11px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
          Deterministic Pure Output
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-2">
        {/* Time To Collision (TTC) */}
        <div className="bg-black/40 p-3.5 rounded-lg border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-gray-400 font-semibold flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-400" /> TTC
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {closingVelocityMps !== null ? `${closingVelocityMps.toFixed(1)} m/s closing` : "--"}
            </span>
          </div>
          <div className="mt-1">
            {ttcStatus === "VALID" && ttcSeconds !== null ? (
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-3xl font-black font-mono tracking-tight ${
                    ttcSeconds < 2
                      ? "text-red-400"
                      : ttcSeconds < 4
                      ? "text-orange-400"
                      : ttcSeconds < 6
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {ttcSeconds.toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-gray-400">sec</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {ttcStatus === "NO_CLOSING" ? "NO CLOSING" : "UNKNOWN"}
              </span>
            )}
          </div>
        </div>

        {/* Stopping Distance Margin */}
        <div
          className={`p-3.5 rounded-lg border ${
            isMarginCritical
              ? "bg-red-950/40 border-red-500/60 text-red-300 animate-pulse"
              : "bg-black/40 border-white/5 text-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold flex items-center gap-1">
              {isMarginCritical && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />} Margin
            </span>
            <span className="text-[10px] font-mono opacity-80">
              {isMarginCritical ? "INSUFFICIENT" : "SAFE"}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono tracking-tight">
              {stoppingDistanceMarginM !== null ? `${stoppingDistanceMarginM > 0 ? "+" : ""}${stoppingDistanceMarginM}` : "--"}
            </span>
            <span className="text-xs font-semibold text-gray-400">m</span>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1.5 text-xs font-mono">
        <div className="flex justify-between text-gray-300">
          <span className="text-gray-400">Available Distance (D_avail):</span>
          <span className="font-bold text-blue-300">
            {availableDistanceM !== null ? `${availableDistanceM} m` : "--"}
          </span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span className="text-gray-400">Required Stopping (D_req):</span>
          <span className="font-bold text-amber-300">
            {requiredStoppingDistanceM !== null ? `${requiredStoppingDistanceM} m` : "--"}
          </span>
        </div>
        <div className="border-t border-white/10 pt-1.5 grid grid-cols-2 text-[11px] text-gray-400">
          <div>Reaction (D_rxn): <span className="text-gray-200">{reactionDistanceM ?? "--"} m</span></div>
          <div>Braking (D_brake): <span className="text-gray-200">{brakingDistanceM ?? "--"} m</span></div>
        </div>
      </div>
    </div>
  );
};
