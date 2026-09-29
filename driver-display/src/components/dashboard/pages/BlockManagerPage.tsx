import React, { useState } from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { useAuthStore } from "../../../auth/authStore";
import { useTranslation } from "../../../context/LanguageContext";
import {
  BlindCurveIcon,
  NarrowRoadIcon,
  JunctionIcon,
  HighwallEdgeIcon,
} from "../../icons/MiningIcons";
import { Layers, ShieldAlert, Lock, Radio } from "lucide-react";

export const BlockManagerPage: React.FC = () => {
  const { blocks, tokens, forceRestrictBlock, params } = useVehicleStore();
  const { t } = useTranslation();
  const [selectedBlockId, setSelectedBlockId] = useState<string>("B1");

  const selectedBlock =
    blocks.find((b) => b.blockId === selectedBlockId) ?? blocks[0];

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            {t("blocks.title", "Digital Block Manager & Spatial Traffic Coordinator")}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {t("blocks.topologySubtitle", "FOG-LOCK Block Partitioning & Dynamic Protected Separation Control")}
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg">
          {t("dashboard.pocNotice", "PROTOTYPE BLOCK PARAMETERS — NOT CERTIFIED PRODUCTION LIMITS")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Block Roster (Left 1 Col) */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-3">
          <div className="text-xs font-mono text-slate-400 border-b border-slate-700 pb-2 flex justify-between">
            <span>{t("blocks.title", "Blocks")} ({blocks.length})</span>
            <span>{t("blocks.physical", "Physical")} / {t("blocks.virtual", "Virtual")}</span>
          </div>

          <div className="space-y-2">
            {blocks.map((b) => {
              const isSelected = b.blockId === selectedBlockId;
              return (
                <div
                  key={b.blockId}
                  onClick={() => setSelectedBlockId(b.blockId)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-950/60 border-emerald-500 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getBlockIcon(b.category)}
                      <div>
                        <div className="font-mono font-bold text-sm">
                          {b.blockId}: {t(`blocks.${b.blockId.toLowerCase()}Name`, b.name)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Len: {b.lengthM}m • {t("blocks.occupants", "Occupants:")} {b.currentOccupants.length}/{b.maxOccupancy}
                        </div>
                      </div>
                    </div>

                    {b.restricted && (
                      <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                        {t("blocks.locked", "LOCKED")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Block Details & Operations Drawer (Right 2 Cols) */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black font-mono text-white">
                    {selectedBlock.blockId}: {t(`blocks.${selectedBlock.blockId.toLowerCase()}Name`, selectedBlock.name)}
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    {selectedBlock.type === "PHYSICAL" ? t("blocks.physical", "PHYSICAL") : t("blocks.virtual", "VIRTUAL")}{" "}
                    {t("blocks.block", "BLOCK")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Boundary Sensor Status: <span className="text-emerald-400 font-bold">{selectedBlock.boundarySensors}</span>
                </p>
              </div>
            </div>

            {/* Operator Lock-Down Action */}
            <button
              onClick={() => {
                const currentUser = useAuthStore.getState().user;
                const opStr = currentUser ? `${currentUser.name} (${currentUser.role})` : "Operator Action";
                forceRestrictBlock(selectedBlock.blockId, opStr);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md"
            >
              <Lock className="w-4 h-4" /> {t("blocks.forceRestrict", "FORCE RESTRICT BLOCK")}
            </button>
          </div>

          {/* Protected Separation Distance Formula Readout Card */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-300 font-mono flex items-center justify-between">
              <span>{t("blocks.separationFormula", "Protected Separation Formula")}</span>
              <span className="text-emerald-400">D_protected = L_veh + D_brake + D_rxn + D_margin</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mt-2">
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("blocks.lengthFloor", "Length Floor:")}</span>
                <div className="text-white font-bold">{params.vehicleLengthM} m</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("blocks.safetyMargin", "Safety Margin:")}</span>
                <div className="text-amber-400 font-bold">{params.safetyMarginM} m</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("blocks.minSeparation", "Min Separation:")}</span>
                <div className="text-cyan-400 font-bold">{selectedBlock.protectedSeparationM} m</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                <span className="text-slate-400">{t("blocks.maxOccupancy", "Max Occupancy:")}</span>
                <div className="text-emerald-400 font-bold">{selectedBlock.maxOccupancy} {t("blocks.vehiclesUnit", "Vehicles")}</div>
              </div>
            </div>
          </div>

          {/* Block Active Tokens Ledger Table */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="text-xs font-bold uppercase text-slate-300 font-mono flex items-center justify-between">
              <span>
                {t("blocks.activeTokensLedger", "Active Tokens Ledger")} ({tokens.filter((t) => t.blockId === selectedBlock.blockId).length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Token ID</th>
                    <th className="p-2">Vehicle</th>
                    <th className="p-2">Direction</th>
                    <th className="p-2">Sequence</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {tokens
                    .filter((t) => t.blockId === selectedBlock.blockId)
                    .map((t) => (
                      <tr key={t.tokenId} className="hover:bg-slate-800/40">
                        <td className="p-2 text-purple-300 font-bold">{t.tokenId}</td>
                        <td className="p-2 font-bold text-white">{t.vehicleId}</td>
                        <td className="p-2">{t.direction}</td>
                        <td className="p-2">#{t.sequence}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === "VALID"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                                : "bg-red-950 text-red-300 border border-red-500/40"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
