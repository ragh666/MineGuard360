import React from "react";
import { useVehicleStore } from "../store/vehicleStore";
import { SafetyBanner } from "./SafetyBanner";
import { SpeedMetricsCard } from "./SpeedMetricsCard";
import { SafetyCalculationsCard } from "./SafetyCalculationsCard";
import { AiVsDeterministicWidget } from "./AiVsDeterministicWidget";
import { FogLockCard } from "./FogLockCard";
import { CorridorOccupancyWidget } from "./CorridorOccupancyWidget";
import { SensorHealthBar } from "./SensorHealthBar";
import { DecisionTracePanel } from "./DecisionTracePanel";
import { ScenarioControlPanel } from "./ScenarioControlPanel";
import { Shield, Cpu } from "lucide-react";

export const DriverDisplay: React.FC = () => {
  const {
    raw,
    calculated,
    decision,
    currentScenario,
    isDemoRunning,
    eventLog,
    brakeVerificationFault,
    setScenario,
    toggleDemoMode,
    tickDemo,
    toggleBrakeVerificationFault,
  } = useVehicleStore();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      {/* Top Application Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-hud-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                FOG-HEMM Driver Display
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/30">
                PHASE 1 HUD
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Deterministic Safety & Calculation Engine | Vehicle: <span className="text-white font-bold">V01</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-hud-card border border-hud-border px-3 py-1.5 rounded-lg text-gray-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Target Controller: <strong className="text-emerald-400">ESP32</strong></span>
          </div>
          <div className="hidden md:block text-gray-500 text-[11px] max-w-xs truncate">
            // MOCK — replace with real ESP32/LoRa/CAN feed
          </div>
        </div>
      </header>

      {/* Safety Status Banner */}
      <SafetyBanner
        safetyState={decision.safetyState}
        finalAction={decision.finalAction}
        reason={decision.reason}
        deterministicPriority={decision.deterministicPriority}
      />

      {/* Core Display Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Speed Metrics */}
        <SpeedMetricsCard
          speedMps={raw.vehicle.speedMps}
          recommendedSpeedKmh={decision.recommendedSpeedKmh}
          brakeApplied={raw.vehicle.brakeApplied}
          brakeCommand={decision.brakeCommand}
          throttlePercent={raw.vehicle.throttlePercent}
        />

        {/* Safety Calculations */}
        <SafetyCalculationsCard calculated={calculated} />

        {/* AI Advisory vs Deterministic Decision */}
        <AiVsDeterministicWidget
          aiRiskScore={decision.aiRiskScore}
          aiRiskLevel={decision.aiRiskLevel}
          aiIsAdvisory={decision.aiIsAdvisory}
          deterministicState={decision.safetyState}
          finalAction={decision.finalAction}
          ttcSeconds={calculated.ttcSeconds}
        />

        {/* FOG-LOCK Digital Authorization */}
        <FogLockCard fogLock={raw.fogLock} separationSafe={calculated.separationSafe} />

        {/* Corridor Occupancy */}
        <CorridorOccupancyWidget
          corridor={calculated.corridor}
          corridorStatus={calculated.corridorStatus}
          objectInCorridor={calculated.objectInCorridor}
          distanceM={raw.radar.distanceM}
          edgeClearanceM={calculated.edgeClearanceM}
        />

        {/* Diagnostic Trace & Event Stream Panel */}
        <DecisionTracePanel
          trace={decision.trace}
          eventLog={eventLog}
          brakeVerificationFault={brakeVerificationFault}
          onToggleBrakeFault={toggleBrakeVerificationFault}
        />
      </div>

      {/* Sensor Health Bar */}
      <SensorHealthBar health={raw.sensorHealth} environment={raw.environment} />

      {/* Interactive Scenario Control Panel */}
      <ScenarioControlPanel
        currentScenario={currentScenario}
        isDemoRunning={isDemoRunning}
        onSelectScenario={setScenario}
        onToggleDemo={toggleDemoMode}
        onStepDemo={tickDemo}
      />

      {/* Footer Disclaimer */}
      <footer className="text-center text-[11px] text-gray-400 py-3 border-t border-hud-border font-mono">
        PROTOTYPE DEMONSTRATION PARAMETERS — NOT CERTIFIED PRODUCTION MINING SAFETY LIMITS
      </footer>
    </div>
  );
};
