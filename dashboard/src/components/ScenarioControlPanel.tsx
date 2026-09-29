import React from "react";
import { ScenarioType } from "../data/types";
import { Play, Pause, FastForward, Sliders } from "lucide-react";

interface ScenarioControlPanelProps {
  currentScenario: ScenarioType;
  isDemoRunning: boolean;
  onSelectScenario: (scen: ScenarioType) => void;
  onToggleDemo: () => void;
  onStepDemo: () => void;
}

const SCENARIOS: { id: ScenarioType; label: string; desc: string }[] = [
  { id: "NORMAL_ROAD", label: "1. Normal Road", desc: "Clean road, distance 60m, safe TTC" },
  { id: "OBJECT_AHEAD", label: "2. Object Ahead", desc: "Object at 35m, low relative velocity" },
  { id: "APPROACHING_OBJECT", label: "3. Approaching Object", desc: "Closing target, TTC decreases naturally" },
  { id: "BLIND_CURVE", label: "4. Blind Curve & Fog", desc: "Dense fog, curve offset angle" },
  { id: "JUNCTION_CONFLICT", label: "5. Junction Conflict", desc: "Crossing path hazard" },
  { id: "FOLLOWING_TOO_CLOSE", label: "6. Close Following", desc: "Unsafe vehicle separation" },
  { id: "CRITICAL_TTC", label: "7. Critical TTC", desc: "TTC < 2.0s threshold (BRAKE)" },
  { id: "EMERGENCY_COLLISION", label: "8. Emergency Collision", desc: "TTC < 1.0s imminent collision" },
  { id: "RADAR_FAILURE", label: "9. Radar Fault", desc: "Radar hardware failure (FAULT)" },
  { id: "ENCODER_FAILURE", label: "10. Encoder Fault", desc: "Encoder speed sensor fault (FAULT)" },
  { id: "CAN_FAILURE", label: "11. CAN Bus Fault", desc: "CAN communication failure" },
  { id: "LORA_FAILURE", label: "12. LoRa Link Fault", desc: "FOG-LOCK COMM_LOST state" },
  { id: "BRAKE_FAILURE", label: "13. Brake Sys Fault", desc: "Brake feedback error" },
  { id: "SENSOR_DISAGREEMENT", label: "14. Sensor Disagree", desc: "Radar vs Encoder data mismatch" },
];

export const ScenarioControlPanel: React.FC<ScenarioControlPanelProps> = ({
  currentScenario,
  isDemoRunning,
  onSelectScenario,
  onToggleDemo,
  onStepDemo,
}) => {
  return (
    <div className="bg-hud-card border border-hud-border rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-400">
            <Sliders className="w-4 h-4" /> Scenario Simulator & Demo Controls
          </span>
          <p className="text-xs text-gray-400 mt-0.5">
            Drives RAW sensor telemetry into the Safety Engine. Safety states are calculated deterministically.
          </p>
        </div>

        {/* Demo Ticker Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDemo}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
              isDemoRunning
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isDemoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isDemoRunning ? "PAUSE MOCK TICKER" : "START MOCK DEMO TICKER"}
          </button>

          <button
            onClick={onStepDemo}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10"
            title="Advance 1 Step in Scenario"
          >
            <FastForward className="w-4 h-4 text-blue-400" /> STEP +1
          </button>
        </div>
      </div>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {SCENARIOS.map((scen) => {
          const isSelected = currentScenario === scen.id;
          return (
            <button
              key={scen.id}
              onClick={() => onSelectScenario(scen.id)}
              className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-600/30 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  : "bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <span className="text-xs font-bold truncate">{scen.label}</span>
              <span className="text-[10px] opacity-70 mt-1 line-clamp-1">{scen.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
