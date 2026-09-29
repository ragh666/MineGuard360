import React from "react";
import { CorridorStatus, CorridorType } from "../data/types";
import {
  OccupancyGridIcon,
  SafeCorridorIcon,
  HemmDumperIcon,
} from "./icons/MiningIcons";

interface CorridorOccupancyGridProps {
  corridor: CorridorType;
  corridorStatus: CorridorStatus;
  objectInCorridor: boolean;
  distanceM: number | null;
  edgeClearanceM: number | null;
}

export const CorridorOccupancyGrid: React.FC<CorridorOccupancyGridProps> = ({
  corridor,
  corridorStatus,
  objectInCorridor,
  distanceM,
  edgeClearanceM,
}) => {
  // Build a 5x5 grid matrix (Rows 0 to 4 from top to bottom, Cols 0 to 4 from left to right)
  // Vehicle fixed at Bottom-Center (Row 4, Col 2)
  const rows = 5;
  const cols = 5;

  // Determine active corridor column (0: far left, 1: left, 2: center, 3: right, 4: far right)
  let corridorCol = 2;
  if (corridor === "LEFT") corridorCol = 1;
  else if (corridor === "RIGHT") corridorCol = 3;

  // Map distance to grid row (distance 50m+ -> row 0, 30-49m -> row 1, 15-29m -> row 2, 1-14m -> row 3)
  let targetRow = -1;
  if (distanceM !== null && distanceM > 0) {
    if (distanceM >= 45) targetRow = 0;
    else if (distanceM >= 30) targetRow = 1;
    else if (distanceM >= 15) targetRow = 2;
    else targetRow = 3;
  }

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between text-gray-300 mb-3">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <OccupancyGridIcon className="w-5 h-5 text-blue-400" /> Relative Occupancy Grid
        </span>
        <span
          className={`text-xs font-extrabold px-2.5 py-0.5 rounded border uppercase flex items-center gap-1 ${
            corridorStatus === "CLEAR"
              ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
              : corridorStatus === "BLOCKED"
              ? "bg-red-950 text-red-300 border-red-500/50 animate-pulse"
              : "bg-hatched-fault text-white border-gray-600"
          }`}
        >
          <SafeCorridorIcon className="w-3.5 h-3.5" />
          {corridorStatus}
        </span>
      </div>

      {/* 5x5 Grid Visualization */}
      <div className="bg-black/60 p-3 rounded-xl border border-white/10 my-2">
        <div className="grid grid-cols-5 gap-1.5 aspect-square max-w-[240px] mx-auto">
          {Array.from({ length: rows }).map((_, rIdx) =>
            Array.from({ length: cols }).map((_, cIdx) => {
              const isVehicleCell = rIdx === 4 && cIdx === 2;
              const isCorridorPath = cIdx === corridorCol && rIdx < 4;
              const isTargetCell = rIdx === targetRow && cIdx === corridorCol;
              const isOccupiedCell = isTargetCell && objectInCorridor;
              const isUnknownState = corridorStatus === "UNKNOWN";

              let cellStyle = "bg-gray-800/40 border-gray-700/50 text-gray-500";
              if (isVehicleCell) {
                cellStyle = "bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.6)]";
              } else if (isOccupiedCell) {
                cellStyle = "bg-red-600 border-red-400 text-white font-bold animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]";
              } else if (isUnknownState) {
                cellStyle = "bg-hatched-fault border-gray-600 text-white";
              } else if (isCorridorPath) {
                cellStyle = "bg-blue-950/80 border-blue-500/60 text-blue-300";
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`rounded-md border flex items-center justify-center text-[10px] font-mono transition-all aspect-square ${cellStyle}`}
                >
                  {isVehicleCell ? (
                    <HemmDumperIcon className="w-6 h-6 text-white" />
                  ) : isOccupiedCell ? (
                    <span className="font-extrabold text-xs">!</span>
                  ) : isCorridorPath ? (
                    <span className="opacity-40">│</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-2 px-4">
          <span>LEFT (-5m)</span>
          <span className="text-blue-400 font-bold">VEHICLE ORIGIN (0,0)</span>
          <span>RIGHT (+5m)</span>
        </div>
      </div>

      {/* Footer Edge Clearance readout */}
      <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
        <span className="text-gray-400">Highwall Clearance:</span>
        <span className="font-bold text-cyan-300">
          {edgeClearanceM !== null ? `${edgeClearanceM} m` : "--"}
        </span>
      </div>
    </div>
  );
};
