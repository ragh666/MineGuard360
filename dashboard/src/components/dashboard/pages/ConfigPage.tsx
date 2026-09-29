import React, { useState } from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { Sliders, Save, Lock } from "lucide-react";

export const ConfigPage: React.FC = () => {
  const { params, updateSafetyParams } = useVehicleStore();

  const [formParams, setFormParams] = useState(params);
  const [savedNote, setSavedNote] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSafetyParams(formParams);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Safety Engine Configuration & Prototype Cutoffs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Adjustable Demo Safety Parameters & Deterministic Engine Cutoff Thresholds
          </p>
        </div>

        <div className="bg-amber-950/80 border border-amber-500/80 text-amber-300 font-mono text-xs p-2.5 rounded-lg font-bold">
          PROTOTYPE DEMONSTRATION PARAMETERS — NOT CERTIFIED PRODUCTION SAFETY LIMITS
        </div>
      </div>

      {/* Parameter Editing Form */}
      <form onSubmit={handleSave} className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 font-mono">
            <Sliders className="w-4 h-4 text-emerald-400" /> Threshold Parameters
          </span>

          {savedNote && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded border border-emerald-500/40">
              Parameters Updated Successfully ✓
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Reaction Time */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Reaction Time T_rxn (seconds):</label>
            <input
              type="number"
              step="0.1"
              value={formParams.reactionTimeS}
              onChange={(e) => setFormParams({ ...formParams, reactionTimeS: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-bold"
            />
          </div>

          {/* Nominal Deceleration */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Nominal Deceleration (m/s²):</label>
            <input
              type="number"
              step="0.5"
              value={formParams.nominalDecelerationMps2}
              onChange={(e) => setFormParams({ ...formParams, nominalDecelerationMps2: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-bold"
            />
          </div>

          {/* Safety Margin */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Safety Margin D_margin (meters):</label>
            <input
              type="number"
              step="0.5"
              value={formParams.safetyMarginM}
              onChange={(e) => setFormParams({ ...formParams, safetyMarginM: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded font-bold"
            />
          </div>

          {/* Emergency TTC Cutoff */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Emergency TTC Cutoff (seconds):</label>
            <input
              type="number"
              step="0.1"
              value={formParams.emergencyTtcS}
              onChange={(e) => setFormParams({ ...formParams, emergencyTtcS: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-red-400 p-2 rounded font-bold"
            />
          </div>

          {/* Critical TTC Cutoff */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Critical TTC Cutoff (seconds):</label>
            <input
              type="number"
              step="0.1"
              value={formParams.criticalTtcS}
              onChange={(e) => setFormParams({ ...formParams, criticalTtcS: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-orange-400 p-2 rounded font-bold"
            />
          </div>

          {/* Warning TTC Cutoff */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <label className="text-slate-400 font-bold block">Warning TTC Cutoff (seconds):</label>
            <input
              type="number"
              step="0.1"
              value={formParams.warningTtcS}
              onChange={(e) => setFormParams({ ...formParams, warningTtcS: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 text-amber-400 p-2 rounded font-bold"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-700">
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-md"
          >
            <Save className="w-4 h-4" /> SAVE CONFIG PARAMETERS
          </button>
        </div>
      </form>
    </div>
  );
};
