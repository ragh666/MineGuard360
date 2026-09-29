import React from "react";
import { RawFogLockData } from "../data/types";
import { Lock, Radio, Key, Users } from "lucide-react";

interface FogLockCardProps {
  fogLock: RawFogLockData;
  separationSafe: boolean | null;
}

export const FogLockCard: React.FC<FogLockCardProps> = ({ fogLock, separationSafe }) => {
  const { authorization, blockId, token, separationM, speedAdvisoryKmh } = fogLock;

  const getAuthBadge = () => {
    switch (authorization) {
      case "GRANT":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
      case "DENY":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "COMM_LOST":
        return "bg-amber-500/20 text-amber-300 border-amber-500/50";
      default:
        return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between text-gray-400 mb-2">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <Lock className="w-4 h-4 text-blue-400" /> FOG-LOCK Digital Authorization
        </span>
        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded border ${getAuthBadge()}`}>
          {authorization}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-2 text-xs">
        {/* Block ID & Speed Advisory */}
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Radio className="w-3.5 h-3.5 text-blue-400" /> Active Block:
          </div>
          <div className="text-base font-bold font-mono text-white">{blockId ?? "NONE"}</div>
          <div className="text-[11px] text-gray-400">
            Advisory Speed:{" "}
            <span className="text-amber-300 font-bold font-mono">
              {speedAdvisoryKmh !== null ? `${speedAdvisoryKmh} km/h` : "--"}
            </span>
          </div>
        </div>

        {/* Token Validation */}
        <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Key className="w-3.5 h-3.5 text-purple-400" /> Digital Token:
          </div>
          <div className="text-sm font-bold font-mono text-purple-300 truncate">
            {token?.tokenId ?? "NO_TOKEN"}
          </div>
          <div className="text-[11px] text-gray-400">
            Status:{" "}
            <span
              className={`font-bold ${
                token?.status === "VALID" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {token?.status ?? "INVALID"}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Separation Row */}
      <div className="bg-black/30 p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">Ahead Vehicle Dist:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {separationM !== null ? `${separationM} m` : "--"}
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              separationSafe === true
                ? "bg-emerald-900/60 text-emerald-300"
                : separationSafe === false
                ? "bg-red-900/60 text-red-300"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {separationSafe === true ? "SAFE SEPARATION" : separationSafe === false ? "UNSAFE" : "UNKNOWN"}
          </span>
        </div>
      </div>
    </div>
  );
};
