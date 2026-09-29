import React from "react";
import { CorridorStatus, CorridorType } from "../data/types";
import { Eye, ShieldAlert, CheckCircle2, HelpCircle } from "lucide-react";

interface CorridorOccupancyWidgetProps {
  corridor: CorridorType;
  corridorStatus: CorridorStatus;
  objectInCorridor: boolean;
  distanceM: number | null;
  edgeClearanceM: number | null;
}

export const CorridorOccupancyWidget: React.FC<CorridorOccupancyWidgetProps> = ({
  corridor,
  corridorStatus,
  objectInCorridor,
  distanceM,
  edgeClearanceM,
}) => {
  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between text-gray-400 mb-2">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <Eye className="w-4 h-4 text-cyan-400" /> Safe Corridor & Occupancy Grid
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
            corridorStatus === "CLEAR"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
              : corridorStatus === "BLOCKED"
              ? "bg-red-950 text-red-300 border border-red-500/40"
              : "bg-gray-800 text-gray-400"
          }`}
        >
          {corridorStatus === "CLEAR" && <CheckCircle2 className="w-3.5 h-3.5" />}
          {corridorStatus === "BLOCKED" && <ShieldAlert className="w-3.5 h-3.5" />}
          {corridorStatus === "UNKNOWN" && <HelpCircle className="w-3.5 h-3.5" />}
          {corridorStatus}
        </span>
      </div>

      {/* Visual Corridor Channels (LEFT | CENTER | RIGHT) */}
      <div className="my-3 grid grid-cols-3 gap-2">
        {(["LEFT", "CENTER", "RIGHT"] as CorridorType[]).map((ch) => {
          const isCurrentCorridor = corridor === ch;
          const isBlocked = isCurrentCorridor && objectInCorridor;

          return (
            <div
              key={ch}
              className={`p-3 rounded-lg border text-center transition-all ${
                isBlocked
                  ? "bg-red-950/80 border-red-500 text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : isCurrentCorridor
                  ? "bg-blue-950/60 border-blue-500 text-blue-200"
                  : "bg-black/30 border-white/5 text-gray-400"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">{ch} PATH</div>
              <div className="text-xs font-extrabold mt-1">
                {isBlocked
                  ? `HAZARD (${distanceM}m)`
                  : isCurrentCorridor
                  ? "CORRIDOR"
                  : "CLEAR"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Edge Clearance */}
      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
        <span className="text-gray-400">Highwall / Edge Clearance:</span>
        <span className="font-bold text-cyan-300">
          {edgeClearanceM !== null ? `${edgeClearanceM} m` : "--"}
        </span>
      </div>
    </div>
  );
};
