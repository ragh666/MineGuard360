import React from "react";
import { useVehicleStore } from "../../../store/vehicleStore";
import { ScenarioType } from "../../../data/types";
import { CloudRain, AlertTriangle, Play, Pause, FastForward, CheckCircle2 } from "lucide-react";

const SCENARIOS: { id: ScenarioType; label: string; desc: string }[] = [
  { id: "NORMAL_ROAD", label: "1. Normal Road", desc: "Clear road, safe 60m clearance" },
  { id: "OBJECT_AHEAD", label: "2. Object Ahead", desc: "Target at 35m, low relative velocity" },
  { id: "APPROACHING_OBJECT", label: "3. Approaching Target", desc: "Closing target, TTC decreases" },
  { id: "BLIND_CURVE", label: "4. Blind Curve & Fog", desc: "Dense fog, lateral offset" },
  { id: "JUNCTION_CONFLICT", label: "5. Junction Conflict", desc: "Crossing path hazard" },
  { id: "FOLLOWING_TOO_CLOSE", label: "6. Close Separation", desc: "Unsafe vehicle separation" },
  { id: "CRITICAL_TTC", label: "7. Critical TTC (<2s)", desc: "TTC < 2.0s threshold (BRAKE)" },
  { id: "EMERGENCY_COLLISION", label: "8. Emergency (<1s)", desc: "TTC < 1.0s imminent collision" },
  { id: "RADAR_FAILURE", label: "9. Radar Fault", desc: "Radar sensor hardware fault" },
  { id: "ENCODER_FAILURE", label: "10. Encoder Fault", desc: "Speed encoder hardware fault" },
  { id: "CAN_FAILURE", label: "11. CAN Bus Fault", desc: "CAN communication link down" },
  { id: "LORA_FAILURE", label: "12. LoRa Link Fault", desc: "FOG-LOCK COMM_LOST state" },
  { id: "BRAKE_FAILURE", label: "13. Brake Sys Fault", desc: "Brake actuator feedback error" },
  { id: "SENSOR_DISAGREEMENT", label: "14. Sensor Mismatch", desc: "Radar vs Encoder telemetry conflict" },
];

export const EnvironmentSimulationPage: React.FC = () => {
  const {
    globalEnvironment,
    setGlobalEnvironment,
    setFogDensity,
    setVehicleDynamics,
    activeFaults,
    toggleFault,
    clearAllFaults,
    currentScenario,
    setScenario,
    isDemoRunning,
    toggleDemoMode,
    tickDemo,
  } = useVehicleStore();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Environment Simulation & Fault Injection Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Control Room Authority: Global Environment Simulation & Hardware Fault Injection
          </p>
        </div>

        <div className="bg-amber-950/80 border border-amber-500/80 text-amber-300 font-mono text-xs p-2.5 rounded-lg font-bold">
          SIMULATED ENVIRONMENT INPUT — NOT MEASURED SENSOR DATA
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Environment Control Inputs Panel */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300 border-b border-slate-700 pb-2">
            <CloudRain className="w-4 h-4 text-cyan-400" /> Weather & Atmospheric Controls
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Fog Density Slider & Readout */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Fog Density:</span>
                <span className="text-cyan-300">{globalEnvironment.fogDensityPercent ?? 87}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={globalEnvironment.fogDensityPercent ?? 87}
                onChange={(e) => setFogDensity(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Vehicle Speed & Lead Obstacle Distance Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Vehicle Speed:</span>
                  <span className="text-emerald-300">{globalEnvironment.vehicleSpeedKmh ?? 42} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={globalEnvironment.vehicleSpeedKmh ?? 42}
                  onChange={(e) => setVehicleDynamics(Number(e.target.value), globalEnvironment.leadObstacleDistanceM ?? 24.5)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Lead Obstacle Dist:</span>
                  <span className="text-amber-300">{globalEnvironment.leadObstacleDistanceM ?? 24.5} m</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={globalEnvironment.leadObstacleDistanceM ?? 24.5}
                  onChange={(e) => setVehicleDynamics(globalEnvironment.vehicleSpeedKmh ?? 42, Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            {/* Weather Mode */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Weather Preset:</label>
              <select
                value={globalEnvironment.weather}
                onChange={(e) => setGlobalEnvironment({ weather: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 text-cyan-300 p-2.5 rounded-lg font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">NORMAL (Clear Sky)</option>
                <option value="FOG">FOG (Moderate Fog)</option>
                <option value="DENSE_FOG">DENSE_FOG (Dense Pit Fog)</option>
                <option value="RAIN">RAIN (Light Rain)</option>
                <option value="HEAVY_RAIN">HEAVY_RAIN (Heavy Monsoon)</option>
                <option value="DUST">DUST (Mining Dust Cloud)</option>
                <option value="MONSOON">MONSOON (Monsoon Storm)</option>
                <option value="HIGH_HUMIDITY">HIGH_HUMIDITY (High Humidity / Mist)</option>
              </select>
            </div>

            {/* Road Condition */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Road Surface Condition:</label>
              <select
                value={globalEnvironment.roadCondition}
                onChange={(e) => setGlobalEnvironment({ roadCondition: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 text-amber-300 p-2.5 rounded-lg font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="DRY">DRY (Dry Compact Dirt)</option>
                <option value="WET">WET (Wet Mud)</option>
                <option value="SLIPPERY">SLIPPERY (Slippery Clay / Slurry)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hardware Fault Injector Panel */}
        <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-300">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Hardware Fault Injection Panel
            </span>
            <button
              onClick={clearAllFaults}
              className="text-xs font-mono font-bold text-emerald-400 hover:underline"
            >
              Clear All Faults ✓
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { id: "radarFault", label: "Radar Sensor Fault" },
              { id: "encoderFault", label: "Speed Encoder Fault" },
              { id: "canFault", label: "CAN Bus Link Failure" },
              { id: "loraFault", label: "LoRa Link Down" },
              { id: "brakeFault", label: "Brake Actuator Fault" },
            ].map((f) => {
              const isActive = (activeFaults as any)[f.id];
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFault(f.id as any)}
                  className={`p-3 rounded-lg border text-left font-bold transition-all ${
                    isActive
                      ? "bg-red-950 border-red-500 text-red-200 animate-pulse shadow-md"
                      : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-500">Inject Fault</div>
                  <div className="mt-0.5">{f.label}</div>
                  <div className="text-[10px] uppercase mt-1">
                    {isActive ? "ACTIVE FAULT" : "NORMAL"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scenario Runner Controls Panel */}
      <div className="bg-[#1e293b] border border-slate-700/80 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Automated Scenario Simulator Runner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Steps Through Pre-Built Sensor Telemetry Scenarios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDemoMode}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                isDemoRunning
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isDemoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isDemoRunning ? "PAUSE TICKER" : "START MOCK TICKER"}
            </button>

            <button
              onClick={tickDemo}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <FastForward className="w-4 h-4 text-cyan-400" /> STEP +1
            </button>
          </div>
        </div>

        {/* 14 Scenarios Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SCENARIOS.map((scen) => {
            const isSelected = currentScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setScenario(scen.id)}
                className={`p-3 rounded-lg border text-left font-mono transition-all ${
                  isSelected
                    ? "bg-emerald-950/80 border-emerald-500 text-white shadow-md"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="text-xs font-bold truncate text-white">{scen.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{scen.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
