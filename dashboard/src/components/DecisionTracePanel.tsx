import React, { useState } from "react";
import { DecisionTrace, SafetyEvent } from "../data/types";
import { Terminal, History, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface DecisionTracePanelProps {
  trace: DecisionTrace;
  eventLog: SafetyEvent[];
  brakeVerificationFault: boolean;
  onToggleBrakeFault: () => void;
}

export const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({
  trace,
  eventLog,
  brakeVerificationFault,
  onToggleBrakeFault,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"TRACE" | "EVENTS">("TRACE");

  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Terminal className="w-4 h-4" /> Diagnostic Engine Trace & Event Stream
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Hardware Brake Fault Injector Button */}
          <button
            onClick={onToggleBrakeFault}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              brakeVerificationFault
                ? "bg-red-600 text-white animate-pulse"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {brakeVerificationFault ? "DISABLE BRAKE FAULT" : "INJECT BRAKE FAULT"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-hud-border">
          {/* Tab Selection */}
          <div className="flex items-center gap-4 mb-3 text-xs font-mono border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("TRACE")}
              className={`flex items-center gap-1.5 font-bold ${
                activeTab === "TRACE" ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-gray-400"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> CURRENT DECISION TRACE
            </button>
            <button
              onClick={() => setActiveTab("EVENTS")}
              className={`flex items-center gap-1.5 font-bold ${
                activeTab === "EVENTS" ? "text-blue-400 border-b-2 border-blue-400 pb-1" : "text-gray-400"
              }`}
            >
              <History className="w-3.5 h-3.5" /> EVENT LOG ({eventLog.length})
            </button>
          </div>

          {activeTab === "TRACE" ? (
            <div className="bg-black/60 p-4 rounded-lg border border-white/10 font-mono text-xs text-gray-300 space-y-2">
              <div className="text-blue-300 font-bold border-b border-white/10 pb-1">
                // DETERMINISTIC ENGINE DIAGNOSTIC TRACE
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>Vehicle Speed: <span className="text-white font-bold">{trace.vehicleSpeedMps !== null ? `${trace.vehicleSpeedMps.toFixed(2)} m/s` : "NULL"}</span></div>
                <div>Object Distance: <span className="text-white font-bold">{trace.objectDistanceM !== null ? `${trace.objectDistanceM} m` : "NULL"}</span></div>
                <div>Closing Velocity: <span className="text-white font-bold">{trace.closingVelocityMps !== null ? `${trace.closingVelocityMps.toFixed(2)} m/s` : "NULL"}</span></div>
                <div>Calculated TTC: <span className="text-amber-300 font-bold">{trace.ttcSeconds !== null ? `${trace.ttcSeconds.toFixed(2)} s` : "NULL/NO_CLOSING"}</span></div>
                <div>Reaction Distance: <span className="text-white font-bold">{trace.reactionDistanceM !== null ? `${trace.reactionDistanceM} m` : "NULL"}</span></div>
                <div>Braking Distance: <span className="text-white font-bold">{trace.brakingDistanceM !== null ? `${trace.brakingDistanceM} m` : "NULL"}</span></div>
                <div>Required Stopping (D_req): <span className="text-amber-300 font-bold">{trace.requiredStoppingDistanceM !== null ? `${trace.requiredStoppingDistanceM} m` : "NULL"}</span></div>
                <div>Available Distance (D_avail): <span className="text-blue-300 font-bold">{trace.availableDistanceM !== null ? `${trace.availableDistanceM} m` : "NULL"}</span></div>
                <div>Stopping Margin: <span className={trace.stoppingDistanceMarginM !== null && trace.stoppingDistanceMarginM < 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{trace.stoppingDistanceMarginM !== null ? `${trace.stoppingDistanceMarginM} m` : "NULL"}</span></div>
                <div>Corridor Status: <span className="text-cyan-300 font-bold">{trace.corridorStatus}</span></div>
                <div>FOG-LOCK Auth: <span className="text-purple-300 font-bold">{trace.fogLockAuthorization}</span></div>
                <div>Rule Fired: <span className="text-emerald-300 font-bold">{trace.ruleName}</span></div>
              </div>
              <div className="pt-2 text-[11px] text-gray-500 italic">
                Evaluated Priority: {trace.evaluatedPriority} — Machine-readable audit trace verified.
              </div>
            </div>
          ) : (
            <div className="bg-black/60 p-3 rounded-lg border border-white/10 max-h-48 overflow-y-auto space-y-2 font-mono text-xs">
              {eventLog.length === 0 ? (
                <div className="text-gray-500 italic p-2 text-center">No safety state transitions logged yet.</div>
              ) : (
                eventLog.map((evt) => (
                  <div key={evt.id} className="p-2 bg-white/5 rounded border border-white/5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-300 font-bold">
                        <span className="text-gray-500">{evt.timestampStr}</span>
                        <span className="text-amber-400">{evt.previousState}</span>
                        <span>→</span>
                        <span className="text-red-400 font-extrabold">{evt.newState}</span>
                        <span className="text-gray-400 text-[11px]">({evt.reasonCode})</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{evt.reason}</p>
                    </div>
                    <div className="text-right text-[11px] text-gray-400">
                      <div>TTC: {evt.ttcSeconds ?? "--"}s</div>
                      <div>Action: <span className="text-white font-bold">{evt.finalAction}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
