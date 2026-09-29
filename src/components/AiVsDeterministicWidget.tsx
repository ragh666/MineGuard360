import React from "react";
import { FinalAction, SafetyState } from "../data/types";
import { Cpu, ShieldCheck, AlertCircle } from "lucide-react";

interface AiVsDeterministicWidgetProps {
  aiRiskScore: number | null;
  aiRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  aiIsAdvisory: boolean;
  deterministicState: SafetyState;
  finalAction: FinalAction;
  ttcSeconds: number | null;
}

export const AiVsDeterministicWidget: React.FC<AiVsDeterministicWidgetProps> = ({
  aiRiskScore,
  aiRiskLevel,
  aiIsAdvisory,
  deterministicState,
  finalAction,
  ttcSeconds,
}) => {
  // Detect explicit disagreement where AI says LOW/MEDIUM but Deterministic says CRITICAL/EMERGENCY
  const isDisagreement =
    (aiRiskLevel === "LOW" || aiRiskLevel === "MEDIUM") &&
    (deterministicState === "CRITICAL" || deterministicState === "EMERGENCY");

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between text-gray-400 mb-2">
        <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
          <Cpu className="w-4 h-4 text-purple-400" /> AI Advisory vs Deterministic Safety
        </span>
        <span className="text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded">
          RULE: DETERMINISTIC OVERRIDES AI
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {/* AI Advisory Panel */}
        <div className="bg-black/40 p-3.5 rounded-lg border border-purple-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase">
              <span>AI / ML Advisory</span>
              <span className="text-[9px] bg-purple-900/60 px-1.5 py-0.5 rounded">ADVISORY ONLY</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black font-mono text-purple-200">
                {aiRiskScore !== null ? aiRiskScore : "--"}
              </span>
              <span className="text-xs font-bold text-gray-400">/ 100 Risk</span>
            </div>
          </div>
          <div className="mt-2 text-xs font-bold uppercase text-purple-400">
            Level: {aiRiskLevel ?? "N/A"}
          </div>
        </div>

        {/* Deterministic Authority Panel */}
        <div className="bg-black/40 p-3.5 rounded-lg border border-blue-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-300 uppercase">
              <span>Deterministic Engine</span>
              <span className="text-[9px] bg-blue-900/60 px-1.5 py-0.5 rounded font-extrabold text-blue-200">
                FINAL AUTHORITY
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className={`text-2xl font-black uppercase font-mono ${
                  deterministicState === "EMERGENCY" || deterministicState === "CRITICAL"
                    ? "text-red-400"
                    : deterministicState === "WARNING"
                    ? "text-orange-400"
                    : "text-emerald-400"
                }`}
              >
                {deterministicState}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs font-bold uppercase text-blue-300">
            Action: {finalAction.replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Disagreement Callout Banner */}
      {isDisagreement ? (
        <div className="mt-2 p-2.5 bg-red-950/80 border border-red-500/80 rounded-lg flex items-center gap-2 text-red-200 text-xs font-semibold animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <span className="font-extrabold">SAFETY OVERRIDE DETECTED: </span>
            AI predicted <span className="underline">{aiRiskLevel} RISK</span>, but deterministic safety detected{" "}
            <span className="underline">TTC = {ttcSeconds}s</span>. Final Decision forced to{" "}
            <span className="font-extrabold uppercase text-white">{finalAction}</span>.
          </div>
        </div>
      ) : (
        <div className="mt-2 p-2 bg-black/30 border border-white/5 rounded text-[11px] text-gray-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Deterministic safety logic independently calculated final vehicle movement action.</span>
        </div>
      )}
    </div>
  );
};
