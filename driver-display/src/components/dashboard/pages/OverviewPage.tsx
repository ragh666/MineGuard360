import React from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { useTranslation } from "../../../context/LanguageContext";
import {
  BlindCurveIcon,
  NarrowRoadIcon,
  JunctionIcon,
  HighwallEdgeIcon,
  HemmDumperIcon,
  FogVisibilityIcon,
} from "../../icons/MiningIcons";
import { Truck, ShieldAlert, AlertTriangle, Radio, CloudRain } from "lucide-react";

export const OverviewPage: React.FC = () => {
  const {
    getFleetVehicles,
    blocks,
    globalEnvironment,
    setActiveDashboardPage,
    raw,
    decision,
  } = useVehicleStore();

  const { t, getReasonText, getSafetyDecisionText } = useTranslation();

  const fleet = getFleetVehicles();
  const cautionCount = fleet.filter((v) => v.status === "CAUTION").length;
  const criticalCount = fleet.filter(
    (v) => v.status === "CRITICAL" || v.status === "EMERGENCY"
  ).length;
  const commLostCount = raw.fogLock.authorization === "COMM_LOST" ? 1 : 0;

  const getBlockIcon = (cat: string) => {
    switch (cat) {
      case "BLIND_CURVE":
        return <BlindCurveIcon className="w-5 h-5 text-amber-400" />;
      case "NARROW_ROAD":
        return <NarrowRoadIcon className="w-5 h-5 text-cyan-400" />;
      case "JUNCTION":
        return <JunctionIcon className="w-5 h-5 text-purple-400" />;
      case "HIGHWALL_EDGE":
      default:
        return <HighwallEdgeIcon className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Active Vehicles */}
        <div className="bg-[#1e293b] border border-slate-700/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">
              {t("dashboard.kpi.activeFleet", "Active Fleet")}
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">{fleet.length}</div>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Caution Count */}
        <div className="bg-[#1e293b] border border-slate-700/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">
              {t("dashboard.kpi.cautionState", "Caution State")}
            </span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">{cautionCount}</div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Critical/Stopped Count */}
        <div className="bg-[#1e293b] border border-slate-700/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">
              {t("dashboard.kpi.criticalStopped", "Critical / Stopped")}
            </span>
            <div className="text-2xl font-black font-mono text-red-400 mt-1">{criticalCount}</div>
          </div>
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Comm Lost Count */}
        <div className="bg-[#1e293b] border border-slate-700/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">
              {t("dashboard.kpi.commLost", "Comm Lost")}
            </span>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">{commLostCount}</div>
          </div>
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-[#1e293b] border border-slate-700/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400">
              {t("dashboard.kpi.fleetUtilization", "Fleet Utilization")}
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">94%</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Block Topology Diagram (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                {t("blocks.topologyDiagram", "Sector 4 Digital Block Topology Diagram")}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {t("blocks.topologySubtitle", "Conceptual Haul Road Topology (Not a GPS map)")}
              </p>
            </div>
            <button
              onClick={() => setActiveDashboardPage("BLOCK_MANAGER")}
              className="text-xs font-mono font-bold text-emerald-400 hover:underline"
            >
              {t("blocks.manageBlocks", "Manage Blocks →")}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {blocks.map((blk) => (
              <div
                key={blk.blockId}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  blk.restricted
                    ? "bg-red-950/40 border-red-500/80"
                    : "bg-slate-900/60 border-slate-700/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBlockIcon(blk.category)}
                    <div>
                      <span className="text-sm font-bold text-white font-mono">
                        {blk.blockId}: {t(`blocks.${blk.blockId.toLowerCase()}Name`, blk.name)}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                            blk.type === "PHYSICAL"
                              ? "bg-amber-950 text-amber-300 border-amber-500/40"
                              : "bg-cyan-950 text-cyan-300 border-cyan-500/40"
                          }`}
                        >
                          {blk.type === "PHYSICAL" ? t("blocks.physical", "PHYSICAL") : t("blocks.virtual", "VIRTUAL")}{" "}
                          {t("blocks.block", "BLOCK")}
                        </span>
                        {blk.restricted && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
                            {t("blocks.restricted", "RESTRICTED")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{t("blocks.occupants", "Occupants:")}</span>
                  <div className="flex items-center gap-1">
                    {blk.currentOccupants.length > 0 ? (
                      blk.currentOccupants.map((v) => (
                        <span key={v} className="px-2 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-500/30 rounded font-bold">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">{t("blocks.free", "CLEAR")}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Environment Input Summary & Prioritized Alerts */}
        <div className="space-y-5">
          {/* AI vs Deterministic Decision Contrast Panel */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3 relative overflow-hidden">
             <div className="flex items-center justify-between border-b border-slate-700 pb-2">
               <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                 {t("dashboard.fogArchitecture", "FOG-HEMM Architecture (HT-01)")}
               </span>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
               {/* Deterministic Side (Primary) */}
               <div className={`p-3 rounded-lg border ${decision.safetyState === "SAFE" ? "bg-emerald-950/40 border-emerald-500/50" : decision.safetyState === "CRITICAL" ? "bg-red-950/40 border-red-500/50" : "bg-amber-950/40 border-amber-500/50"}`}>
                 <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                   {t("dashboard.deterministicEngine", "DETERMINISTIC ENGINE")}
                 </div>
                 <div className="text-sm font-black text-white">{getSafetyDecisionText(decision.safetyState, "dashboard").subtitle}</div>
                 <div className="text-[10px] text-slate-400 mt-1">{getReasonText(decision.reasonCode || decision.reason)}</div>
                 <div className="mt-3 text-xs font-bold text-cyan-400 uppercase tracking-wider flex justify-between">
                   <span>{t("events.action", "Action:")}</span>
                   <span>{getSafetyDecisionText(decision.safetyState, "dashboard").action}</span>
                 </div>
               </div>

               {/* AI Advisory Side (Secondary) */}
               <div className="p-3 rounded-lg border bg-slate-900/60 border-slate-700/50 opacity-80 border-dashed">
                 <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                   {t("dashboard.aiAdvisory", "AI ADVISORY")}
                 </div>
                 <div className="text-sm font-black text-purple-300">{decision.aiRiskLevel ?? "LOW"} {t("dashboard.risk", "RISK")}</div>
                 <div className="text-[10px] text-slate-400 mt-1">{t("dashboard.score", "Score:")} {decision.aiRiskScore ?? "N/A"}</div>
                 <div className="mt-3 text-[9px] text-slate-500 italic">
                   {t("dashboard.aiAdvisoryNotice", "Advisory only. Does not control safety action.")}
                 </div>
               </div>
             </div>
          </div>
          {/* Environment Simulation Card */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 tracking-wider">
                <CloudRain className="w-4 h-4 text-cyan-400" /> {t("dashboard.simulatedEnvironment", "Simulated Environment")}
              </span>
              <button
                onClick={() => setActiveDashboardPage("ENVIRONMENT_SIMULATION")}
                className="text-xs font-mono font-bold text-emerald-400 hover:underline"
              >
                {t("dashboard.changeInput", "Change Input →")}
              </button>
            </div>

            <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 p-2 rounded">
              {t("dashboard.simulatedNotice", "SIMULATED ENVIRONMENT INPUT — NOT MEASURED SENSOR DATA")}
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("environment.weatherMode", "Weather Mode:")}</span>
                <span className="text-cyan-300 font-bold">{t(`environment.${globalEnvironment.weather.toLowerCase()}`, globalEnvironment.weather)}</span>
              </div>
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("environment.roadCondition", "Road Condition:")}</span>
                <span className="text-amber-300 font-bold">{t(`environment.${globalEnvironment.roadCondition.toLowerCase()}`, globalEnvironment.roadCondition)}</span>
              </div>
              <div className="flex justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("environment.visibility", "Visibility Level:")}</span>
                <span className="text-emerald-300 font-bold">{t(`environment.${globalEnvironment.visibility.toLowerCase()}`, globalEnvironment.visibility)}</span>
              </div>
            </div>
          </div>

          {/* Fleet Active Alert Feed */}
          <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> {t("dashboard.prioritizedAlertStream", "Prioritized Alert Stream")}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {fleet
                .filter((v) => v.status !== "SAFE")
                .map((v) => (
                  <div
                    key={v.vehicleId}
                    onClick={() => setActiveDashboardPage("FLEET_MONITOR")}
                    className="p-2.5 bg-slate-900/80 border border-slate-700 rounded-lg flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span>{v.name}</span>
                        <span className="text-red-400">({getSafetyDecisionText(v.status as any, "dashboard").subtitle})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t("blocks.block", "Block")} {v.blockId} • {t("safety.ttc", "TTC")} {v.ttcSeconds ?? "--"}s</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">{t("dashboard.inspect", "Inspect →")}</span>
                  </div>
                ))}
              {fleet.filter((v) => v.status !== "SAFE").length === 0 && (
                <div className="text-slate-500 text-xs italic p-2 text-center">{t("events.noEvents", "No active safety alerts across fleet.")}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
