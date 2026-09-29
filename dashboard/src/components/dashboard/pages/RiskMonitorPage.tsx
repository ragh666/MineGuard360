import React from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { Cpu, ShieldCheck, AlertCircle } from "lucide-react";

export const RiskMonitorPage: React.FC = () => {
  const { getFleetVehicles } = useVehicleStore();
  const fleet = getFleetVehicles();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            AI Advisory vs Deterministic Risk Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Fleet-Wide Risk Verification: Deterministic Engine Rules Always Override AI Risk Scores
          </p>
        </div>

        <div className="bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono p-2 rounded-lg">
          <strong className="font-bold">AI ADVISORY PRINCIPLE:</strong> AI risk model is advisory only. Deterministic physics & safety logic holds 100% decision authority.
        </div>
      </div>

      {/* Fleet Risk Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fleet.map((v) => {
          const isOverride =
            (v.aiRiskLevel === "LOW" || v.aiRiskLevel === "MEDIUM") &&
            (v.status === "CRITICAL" || v.status === "EMERGENCY");

          return (
            <div
              key={v.vehicleId}
              className={`bg-[#1e293b] border rounded-xl p-5 shadow-lg space-y-4 transition-all ${
                isOverride
                  ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : "border-slate-700/80"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="font-mono font-bold text-base text-white">{v.name}</div>
                <span className="text-xs font-mono text-slate-400">Block {v.blockId}</span>
              </div>

              {/* Dual Evaluation Comparison Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* AI Advisory Side */}
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> AI Risk Score
                  </div>
                  <div className="text-3xl font-black font-mono text-purple-200 mt-1">
                    {v.aiRiskScore}
                  </div>
                  <div className="text-[11px] font-bold text-purple-400 uppercase mt-1">
                    Level: {v.aiRiskLevel}
                  </div>
                </div>

                {/* Deterministic Authority Side */}
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Deterministic
                  </div>
                  <div
                    className={`text-2xl font-black font-mono uppercase mt-1 ${
                      v.status === "EMERGENCY" || v.status === "CRITICAL"
                        ? "text-red-400"
                        : v.status === "WARNING"
                        ? "text-orange-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {v.status}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase mt-1">
                    Speed: {v.speedKmh} km/h
                  </div>
                </div>
              </div>

              {/* Callout if Disagreement Override Exists */}
              {isOverride ? (
                <div className="p-2.5 bg-red-950/80 border border-red-500/80 rounded-lg flex items-center gap-2 text-red-200 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
                  <span>
                    <strong>DETERMINISTIC OVERRIDE:</strong> AI predicted {v.aiRiskLevel} risk, but deterministic logic detected TTC = {v.ttcSeconds}s. Action forced to BRAKE.
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono italic">
                  Deterministic engine independently validated safe parameters.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
