import React, { useState } from "react";
import { PassiveDriverDisplay } from "./components/PassiveDriverDisplay";
import { ControlRoomDashboard } from "./components/dashboard/ControlRoomDashboard";
import { useVehicleStore } from "./store/vehicleStore";
import { ScenarioType } from "./data/types";
import { LanguageProvider } from "./context/LanguageContext";
import { LanguageSelector } from "./components/common/LanguageSelector";
import { MineGuard360Brand } from "./components/common/MineGuard360Logo";
import { MineGuardSplashScreen } from "./components/common/MineGuardSplashScreen";
import { SoundAlarmIndicator } from "./components/common/SoundAlarmIndicator";
import { Shield, LayoutDashboard, Truck, Play, Pause, FastForward, Sliders, ChevronDown, ChevronUp } from "lucide-react";

const SCENARIOS: { id: ScenarioType; label: string }[] = [
  { id: "NORMAL_ROAD", label: "1. Normal Road" },
  { id: "OBJECT_AHEAD", label: "2. Object Ahead" },
  { id: "APPROACHING_OBJECT", label: "3. Approaching Target" },
  { id: "BLIND_CURVE", label: "4. Blind Curve & Fog" },
  { id: "JUNCTION_CONFLICT", label: "5. Junction Conflict" },
  { id: "FOLLOWING_TOO_CLOSE", label: "6. Close Separation" },
  { id: "CRITICAL_TTC", label: "7. Critical TTC (<2s)" },
  { id: "EMERGENCY_COLLISION", label: "8. Emergency (<1s)" },
  { id: "RADAR_FAILURE", label: "9. Radar Fault" },
  { id: "ENCODER_FAILURE", label: "10. Encoder Fault" },
  { id: "CAN_FAILURE", label: "11. CAN Bus Fault" },
  { id: "LORA_FAILURE", label: "12. LoRa Link Fault" },
  { id: "BRAKE_FAILURE", label: "13. Brake Sys Fault" },
  { id: "SENSOR_DISAGREEMENT", label: "14. Sensor Mismatch" },
];

export const AppContent: React.FC = () => {
  const {
    activeAppView,
    setActiveAppView,
    currentScenario,
    isDemoRunning,
    setScenario,
    toggleDemoMode,
    tickDemo,
    decision,
  } = useVehicleStore();

  const [showDevPanel, setShowDevPanel] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes("dashboard") || hash.includes("dashboard")) {
        setActiveAppView("CONTROL_ROOM_DASHBOARD");
      } else if (path.includes("driver") || hash.includes("driver")) {
        setActiveAppView("DRIVER_DISPLAY");
      }
    }
  }, [setActiveAppView]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 font-sans flex flex-col">
      {/* ------------------------------------------------------------------- */}
      {/* TOP SYSTEM MODE SWITCHER HEADER */}
      {/* ------------------------------------------------------------------- */}
      <nav className="bg-[#1e293b] border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between text-xs font-mono shadow-md select-none">
        <div className="flex items-center gap-3">
          <MineGuard360Brand size="sm" />

          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveAppView("DRIVER_DISPLAY")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeAppView === "DRIVER_DISPLAY"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Truck className="w-4 h-4" /> Driver Display (Passive HUD)
            </button>
            <button
              onClick={() => setActiveAppView("CONTROL_ROOM_DASHBOARD")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                activeAppView === "CONTROL_ROOM_DASHBOARD"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Control Room Dashboard
            </button>
          </div>
        </div>

        {/* Right side controls: Language Selector & Quick Scenario Controls */}
        <div className="flex items-center gap-3">
          <SoundAlarmIndicator safetyState={decision.safetyState} aiRiskLevel={decision.aiRiskLevel} />
          <LanguageSelector variant={activeAppView === "DRIVER_DISPLAY" ? "driver" : "dashboard"} />

          {activeAppView === "DRIVER_DISPLAY" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Sim Scenarios</span>
                {showDevPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleDemoMode}
                className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 text-[11px] ${
                  isDemoRunning ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isDemoRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isDemoRunning ? "Pause" : "Play"}
              </button>
              <button
                onClick={tickDemo}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[11px] border border-slate-700"
              >
                <FastForward className="w-3 h-3 text-blue-400" /> +1 Step
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Driver Display Dev Scenario Dropdown (Only when in Driver Display mode and toggled) */}
      {activeAppView === "DRIVER_DISPLAY" && showDevPanel && (
        <div className="bg-[#1e293b] border-b border-slate-700 px-4 py-2 font-mono text-xs">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => setScenario(scen.id)}
                className={`px-2 py-1.5 rounded text-[11px] truncate border transition-all ${
                  currentScenario === scen.id
                    ? "bg-blue-600 text-white border-blue-400 font-bold"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {scen.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* RENDER ACTIVE MODE */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1">
        {activeAppView === "DRIVER_DISPLAY" ? (
          <div className="py-4">
            <PassiveDriverDisplay />
          </div>
        ) : (
          <ControlRoomDashboard />
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <MineGuardSplashScreen
        durationMs={3000}
        onComplete={() => setShowSplash(false)}
      />
    );
  }

  return (
    <LanguageProvider storageKey="fog_driver_lang">
      <AppContent />
    </LanguageProvider>
  );
};

export default App;

